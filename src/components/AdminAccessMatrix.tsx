import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom, Subject, StudentAccess } from '../types';
import { ShieldCheck, ToggleLeft, CheckSquare, Square, RefreshCw, Info } from 'lucide-react';

export default function AdminAccessMatrix() {
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [accessRecords, setAccessRecords] = useState<StudentAccess[]>([]);
  
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMatrix();
  }, []);

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const [allStudents, allClasses, allSubjects, allAccess] = await Promise.all([
        api.getStudents(),
        api.getClasses(),
        api.getSubjects(),
        api.getAccessRecords()
      ]);
      setStudents(allStudents.filter(s => s.role === 'student'));
      setClasses(allClasses);
      setSubjects(allSubjects);
      setAccessRecords(allAccess);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isClassUnlocked = (studentId: string, classId: string) => {
    return accessRecords.some(r => r.studentId === studentId && r.classId === classId && r.subjectId === null && r.isUnlocked);
  };

  const isSubjectUnlocked = (studentId: string, subjectId: string, parentClassId: string) => {
    // Inherits if parent class is unlocked, OR explicitly unlocked
    if (isClassUnlocked(studentId, parentClassId)) return true;
    return accessRecords.some(r => r.studentId === studentId && r.subjectId === subjectId && r.isUnlocked);
  };

  const handleToggleClass = async (studentId: string, classId: string, currentStatus: boolean) => {
    const key = `${studentId}-${classId}`;
    setUpdatingId(key);
    try {
      await api.updateAccess(studentId, classId, null, !currentStatus);
      const updated = await api.getAccessRecords();
      setAccessRecords(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSubject = async (studentId: string, parentClassId: string, subjectId: string, currentStatus: boolean) => {
    // If class is already unlocked, subject is implicitly unlocked and cannot be toggled off individually unless class is restricted.
    if (isClassUnlocked(studentId, parentClassId)) return;

    const key = `${studentId}-${subjectId}`;
    setUpdatingId(key);
    try {
      await api.updateAccess(studentId, parentClassId, subjectId, !currentStatus);
      const updated = await api.getAccessRecords();
      setAccessRecords(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSelectAllForStudent = async (studentId: string) => {
    setUpdatingId(`bulk-${studentId}`);
    try {
      // Bulk unlock all classes for this student
      for (const cls of classes) {
        if (!isClassUnlocked(studentId, cls.id)) {
          await api.updateAccess(studentId, cls.id, null, true);
        }
      }
      const updated = await api.getAccessRecords();
      setAccessRecords(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRestrictAllForStudent = async (studentId: string) => {
    setUpdatingId(`bulk-${studentId}`);
    try {
      // Bulk restrict everything for this student
      for (const rec of accessRecords.filter(r => r.studentId === studentId)) {
        if (rec.isUnlocked) {
          await api.updateAccess(studentId, rec.classId, rec.subjectId, false);
        }
      }
      const updated = await api.getAccessRecords();
      setAccessRecords(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw size={24} className="animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5 animate-fade-in" id="access-matrix-root">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-sky-500" />
            <span>Institutional Access Authorization Matrix</span>
          </h3>
          <p className="text-[11px] text-gray-400">Checkbox-driven permissions. Changes apply instantly to student logins.</p>
        </div>
        <button 
          onClick={loadMatrix}
          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Refresh Grid
        </button>
      </div>

      {/* Info Warning Bar */}
      <div className="bg-sky-50 border border-sky-100 p-3.5 rounded-xl flex gap-2 text-xs text-sky-800 leading-relaxed" id="matrix-info">
        <Info size={18} className="text-sky-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Inheritance Rule:</span> Unlocking an entire Class slot (e.g. 9th Grade) automatically grants permission to <span className="font-bold">all subjects</span> inside that class folder. In this case, subject checkboxes are pre-checked and disabled (showing "via class access") to maintain structural integrity.
        </div>
      </div>

      {/* Access Grid Table */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl" id="matrix-scrollable-table">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 pl-4 min-w-[160px]">Student / GR Profile</th>
              
              {/* Render Class Headers */}
              {classes.map(cls => (
                <th key={cls.id} className="py-3 px-4 border-r border-slate-100/60 text-center min-w-[120px]">
                  <div className="font-bold text-slate-700">{cls.name}</div>
                  <div className="text-[9px] text-slate-400 normal-case font-medium">Whole Grade Slot</div>
                </th>
              ))}

              {/* Render Subjects Headers */}
              {subjects.map(sub => {
                const parentClass = classes.find(c => c.id === sub.classId);
                return (
                  <th key={sub.id} className="py-3 px-4 text-center min-w-[120px]">
                    <div className="font-bold text-slate-700">{sub.name}</div>
                    <div className="text-[9px] text-slate-400 normal-case font-medium">
                      {parentClass ? `via ${parentClass.name}` : 'Course Subject'}
                    </div>
                  </th>
                );
              })}

              <th className="py-3 px-4 pr-4 text-right">Quick Helpers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {students.map((student) => {
              const isBulkUpdating = updatingId === `bulk-${student.id}`;
              return (
                <tr key={student.id} className="hover:bg-slate-50/30" id={`matrix-row-${student.id}`}>
                  {/* Student GR details column */}
                  <td className="py-3.5 pl-4 border-r border-slate-100">
                    <div className="font-bold text-slate-800">{student.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono font-semibold">GR: {student.grNumber}</div>
                  </td>

                  {/* Class Column Checkboxes */}
                  {classes.map((cls) => {
                    const isUnlocked = isClassUnlocked(student.id, cls.id);
                    const cellKey = `${student.id}-${cls.id}`;
                    const isUpdating = updatingId === cellKey || isBulkUpdating;

                    return (
                      <td key={cls.id} className="py-3.5 px-4 text-center border-r border-slate-100/60" id={`matrix-cell-${student.id}-${cls.id}`}>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleClass(student.id, cls.id, isUnlocked)}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isUnlocked 
                              ? 'bg-sky-50 border-sky-300 text-sky-600' 
                              : 'border-slate-200 hover:border-sky-300 text-slate-300 hover:text-slate-400'
                          }`}
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin text-sky-500" />
                          ) : isUnlocked ? (
                            <CheckSquare size={14} fill="currentColor" className="text-white" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Subjects Column Checkboxes */}
                  {subjects.map((sub) => {
                    const isClassOwned = isClassUnlocked(student.id, sub.classId);
                    const isUnlocked = isSubjectUnlocked(student.id, sub.id, sub.classId);
                    const cellKey = `${student.id}-${sub.id}`;
                    const isUpdating = updatingId === cellKey || isBulkUpdating;

                    return (
                      <td key={sub.id} className="py-3.5 px-4 text-center" id={`matrix-cell-${student.id}-${sub.id}`}>
                        <button
                          disabled={isClassOwned || isUpdating}
                          onClick={() => handleToggleSubject(student.id, sub.classId, sub.id, isUnlocked)}
                          className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${
                            isClassOwned 
                              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
                              : isUnlocked 
                                ? 'bg-amber-50 border-amber-300 text-amber-600 cursor-pointer' 
                                : 'border-slate-200 hover:border-amber-300 text-slate-300 hover:text-slate-400 cursor-pointer'
                          }`}
                          title={isClassOwned ? 'Unlocked implicitly via the whole Class Grade Slot permission' : 'Grant or revoke subject access'}
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin text-amber-500" />
                          ) : isClassOwned ? (
                            <CheckSquare size={14} fill="currentColor" className="text-slate-200" />
                          ) : isUnlocked ? (
                            <CheckSquare size={14} fill="currentColor" className="text-white" />
                          ) : (
                            <Square size={14} />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Bulk Select actions */}
                  <td className="py-3.5 px-4 pr-4 text-right space-x-1.5 whitespace-nowrap border-l border-slate-100">
                    <button
                      disabled={isBulkUpdating}
                      onClick={() => handleSelectAllForStudent(student.id)}
                      className="text-[9px] font-bold px-2 py-1 border border-sky-100 text-sky-600 hover:bg-sky-50 rounded-lg cursor-pointer"
                    >
                      Unlock All
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={() => handleRestrictAllForStudent(student.id)}
                      className="text-[9px] font-bold px-2 py-1 border border-red-100 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      Restrict All
                    </button>
                  </td>

                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={classes.length + subjects.length + 2} className="py-8 text-center text-slate-400 text-xs">
                  No registered student accounts in the institution database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
