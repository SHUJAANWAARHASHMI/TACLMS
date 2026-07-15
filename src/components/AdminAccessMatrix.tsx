import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom, Subject, StudentAccess } from '../types';
import { ShieldCheck, ToggleLeft, CheckSquare, Square, RefreshCw, Info, Lock, Unlock } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw size={24} className="animate-spin text-blue-600" />
        <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Refreshing authorization grid...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs space-y-5 animate-fade-in text-slate-800" id="access-matrix-root">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>Institutional Access Authorization Matrix</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">Instantly toggle class and subject access permissions for individual students.</p>
        </div>
        <button 
          onClick={loadMatrix}
          className="px-4 py-2 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors"
        >
          Refresh Grid
        </button>
      </div>

      {/* Info Warning Bar (strictly yellow theme) */}
      <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl flex gap-2 text-xs text-yellow-900 leading-relaxed font-semibold" id="matrix-info">
        <Info size={18} className="text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold uppercase text-yellow-950 block mb-1">💡 Access Inheritance Rule</span>
          Unlocking an entire Class slot (e.g. 9th Grade) automatically grants permission to <span className="underline decoration-2">all subjects</span> inside that class. In this case, subject checkboxes are pre-checked and locked (showing "via class access") to prevent mistakes.
        </div>
      </div>

      {/* Access Grid Table */}
      <div className="overflow-x-auto border-2 border-slate-100 rounded-2xl" id="matrix-scrollable-table">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <th className="py-4.5 pl-4 min-w-[180px] border-r border-slate-100">Student Profile / GR</th>
              
              {/* Render Class Headers */}
              {classes.map(cls => (
                <th key={cls.id} className="py-4.5 px-4 border-r border-slate-100 text-center min-w-[140px]">
                  <div className="font-black text-blue-900 uppercase tracking-wide leading-tight">{cls.name}</div>
                  <div className="text-[8px] text-slate-400 normal-case font-bold uppercase mt-0.5">Whole Class Folder</div>
                </th>
              ))}

              {/* Render Subjects Headers */}
              {subjects.map(sub => {
                const parentClass = classes.find(c => c.id === sub.classId);
                return (
                  <th key={sub.id} className="py-4.5 px-4 text-center border-r border-slate-100 last:border-r-0 min-w-[140px]">
                    <div className="font-black text-blue-900 uppercase tracking-wide leading-tight">{sub.name}</div>
                    <div className="text-[8px] text-slate-400 normal-case font-bold uppercase mt-0.5">
                      {parentClass ? `via ${parentClass.name}` : 'Course Subject'}
                    </div>
                  </th>
                );
              })}

              <th className="py-4.5 px-4 pr-4 text-right min-w-[150px]">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold">
            {students.map((student) => {
              const isBulkUpdating = updatingId === `bulk-${student.id}`;
              return (
                <tr key={student.id} className="hover:bg-slate-50/30" id={`matrix-row-${student.id}`}>
                  {/* Student GR details column */}
                  <td className="py-4 pl-4 border-r border-slate-100">
                    <div className="font-extrabold text-blue-950">{student.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold">GR Number: {student.grNumber}</div>
                  </td>

                  {/* Class Column Checkboxes */}
                  {classes.map((cls) => {
                    const isUnlocked = isClassUnlocked(student.id, cls.id);
                    const cellKey = `${student.id}-${cls.id}`;
                    const isUpdating = updatingId === cellKey || isBulkUpdating;

                    return (
                      <td key={cls.id} className="py-4 px-4 text-center border-r border-slate-100" id={`matrix-cell-${student.id}-${cls.id}`}>
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleClass(student.id, cls.id, isUnlocked)}
                          className={`inline-flex items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer ${
                            isUnlocked 
                              ? 'bg-blue-50 border-blue-600 text-blue-600' 
                              : 'border-slate-200 hover:border-blue-600 text-slate-300 hover:text-slate-500 bg-white'
                          }`}
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin text-blue-600" />
                          ) : isUnlocked ? (
                            <Unlock size={14} strokeWidth={2.5} />
                          ) : (
                            <Lock size={14} strokeWidth={2.5} />
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
                      <td key={sub.id} className="py-4 px-4 text-center border-r border-slate-100 last:border-r-0" id={`matrix-cell-${student.id}-${sub.id}`}>
                        <button
                          disabled={isClassOwned || isUpdating}
                          onClick={() => handleToggleSubject(student.id, sub.classId, sub.id, isUnlocked)}
                          className={`inline-flex items-center justify-center p-2 rounded-xl border-2 transition-all ${
                            isClassOwned 
                              ? 'bg-blue-50 border-blue-200 text-blue-400 cursor-not-allowed opacity-60' 
                              : isUnlocked 
                                ? 'bg-yellow-50 border-yellow-400 text-yellow-700 cursor-pointer' 
                                : 'border-slate-200 hover:border-blue-600 text-slate-300 hover:text-slate-500 bg-white cursor-pointer'
                          }`}
                          title={isClassOwned ? 'Unlocked implicitly via Whole Class permission' : 'Grant or revoke subject access'}
                        >
                          {isUpdating ? (
                            <RefreshCw size={14} className="animate-spin text-blue-600" />
                          ) : isClassOwned ? (
                            <Unlock size={14} strokeWidth={2.5} className="text-blue-500" />
                          ) : isUnlocked ? (
                            <Unlock size={14} strokeWidth={2.5} />
                          ) : (
                            <Lock size={14} strokeWidth={2.5} />
                          )}
                        </button>
                      </td>
                    );
                  })}

                  {/* Bulk Select actions */}
                  <td className="py-4 px-4 pr-4 text-right space-x-1.5 whitespace-nowrap border-l border-slate-100">
                    <button
                      disabled={isBulkUpdating}
                      onClick={() => handleSelectAllForStudent(student.id)}
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-1.5 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer transition-all"
                    >
                      Unlock All
                    </button>
                    <button
                      disabled={isBulkUpdating}
                      onClick={() => handleRestrictAllForStudent(student.id)}
                      className="text-[9px] font-black uppercase tracking-widest px-2 py-1.5 border-2 border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl cursor-pointer transition-all"
                    >
                      Lock All
                    </button>
                  </td>

                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={classes.length + subjects.length + 2} className="py-12 text-center text-slate-400 font-semibold text-xs">
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
