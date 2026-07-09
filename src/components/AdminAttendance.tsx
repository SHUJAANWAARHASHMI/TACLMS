import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Attendance as AttendanceRecord } from '../types';
import { Calendar, Save, CheckCircle, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminAttendance() {
  const [students, setStudents] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late' | 'excused'>>({});
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadStudents = async () => {
    try {
      const allS = await api.getStudents();
      setStudents(allS.filter(s => s.role === 'student'));
    } catch (e) {
      console.error(e);
    }
  };

  const loadAttendance = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const records = await api.getAttendance(selectedDate);
      // Map records to local state
      const map: Record<string, 'present' | 'absent' | 'late' | 'excused'> = {};
      
      // Default everyone to present if no record exists
      students.forEach(s => {
        map[s.id] = 'present';
      });

      records.forEach(r => {
        map[r.studentId] = r.status;
      });

      setAttendanceMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late' | 'excused') => {
    setAttendanceMap({
      ...attendanceMap,
      [studentId]: status
    });
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const list = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status: status as 'present' | 'absent' | 'late' | 'excused'
      }));

      await api.saveAttendance(selectedDate, list);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance sheet');
    } finally {
      setLoading(false);
    }
  };

  const markAllPresent = () => {
    const updated = { ...attendanceMap };
    students.forEach(s => {
      updated[s.id] = 'present';
    });
    setAttendanceMap(updated);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5 animate-fade-in" id="attendance-panel-root">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
            <Calendar size={16} className="text-sky-500" />
            <span>Institutional Student Attendance Register</span>
          </h3>
          <p className="text-[11px] text-gray-400">Record daily entrance presence logs. Attendance feeds gamification streaks.</p>
        </div>

        {/* Date Selector & Bulk buttons */}
        <div className="flex gap-2 items-center w-full sm:w-auto" id="date-picker-bar">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs font-semibold text-slate-700"
            id="attendance-date"
          />
          <button
            type="button"
            onClick={markAllPresent}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Mark All Present
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <RefreshCw size={24} className="animate-spin text-sky-500" />
        </div>
      ) : (
        <form onSubmit={handleSaveAttendance} className="space-y-5" id="attendance-register-form">
          <div className="overflow-x-auto border rounded-xl" id="attendance-table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 pl-4">Student Profile</th>
                  <th className="py-3.5">GR Number</th>
                  <th className="py-3.5 text-center">Present (P)</th>
                  <th className="py-3.5 text-center">Absent (A)</th>
                  <th className="py-3.5 text-center">Late (L)</th>
                  <th className="py-3.5 text-center">Excused (E)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((student) => {
                  const currentStatus = attendanceMap[student.id] || 'present';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/30" id={`attendance-row-${student.id}`}>
                      {/* Student details */}
                      <td className="py-3 pl-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-gray-400">{student.email}</div>
                      </td>

                      {/* GR number */}
                      <td className="py-3 font-mono text-slate-500 font-semibold">
                        {student.grNumber}
                      </td>

                      {/* Present Radio */}
                      <td className="py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={currentStatus === 'present'}
                            onChange={() => handleStatusChange(student.id, 'present')}
                            className="text-teal-600 focus:ring-teal-400 h-4.5 w-4.5 border-gray-300"
                          />
                        </label>
                      </td>

                      {/* Absent Radio */}
                      <td className="py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={currentStatus === 'absent'}
                            onChange={() => handleStatusChange(student.id, 'absent')}
                            className="text-red-600 focus:ring-red-400 h-4.5 w-4.5 border-gray-300"
                          />
                        </label>
                      </td>

                      {/* Late Radio */}
                      <td className="py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={currentStatus === 'late'}
                            onChange={() => handleStatusChange(student.id, 'late')}
                            className="text-amber-500 focus:ring-amber-400 h-4.5 w-4.5 border-gray-300"
                          />
                        </label>
                      </td>

                      {/* Excused Radio */}
                      <td className="py-3 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="radio"
                            name={`status-${student.id}`}
                            checked={currentStatus === 'excused'}
                            onChange={() => handleStatusChange(student.id, 'excused')}
                            className="text-sky-600 focus:ring-sky-400 h-4.5 w-4.5 border-gray-300"
                          />
                        </label>
                      </td>

                    </tr>
                  );
                })}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      No registered students found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{error}</span>
            </p>
          )}

          {success && (
            <p className="text-xs text-teal-600 font-bold flex items-center gap-1 bg-teal-50 border border-teal-100 p-2.5 rounded-xl">
              <CheckCircle size={14} className="text-teal-600" />
              <span>Daily entrance sheet compiled and saved successfully! Attendance metrics updated.</span>
            </p>
          )}

          {students.length > 0 && (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              id="attendance-submit-btn"
            >
              <Save size={14} />
              <span>{loading ? 'Submitting Register...' : 'Save Attendance Sheet'}</span>
            </button>
          )}

        </form>
      )}

    </div>
  );
}
