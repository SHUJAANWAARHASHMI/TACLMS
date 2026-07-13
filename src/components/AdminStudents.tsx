import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, AuditLog, ClassRoom, UserCredential } from '../types';
import { Users, Search, CheckCircle, ShieldAlert, XCircle, Award, BookOpen, Clock, Activity, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentLogs, setStudentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  // New Student Registration states
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newGrNumber, setNewGrNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [editingPassword, setEditingPassword] = useState('');
  const [passwordUpdateFeedback, setPasswordUpdateFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
    api.getClasses().then(setClasses).catch(err => console.error('Error loading classes', err));
  }, []);

  useEffect(() => {
    if (!selectedStudent) {
      setStudentLogs([]);
      return;
    }

    // Load audit trail specific to selected student
    api.getAuditLogs().then(logs => {
      const filtered = logs.filter(l => l.actorId === selectedStudent.id);
      setStudentLogs(filtered);
    }).catch(err => console.error(err));

    // Update password field for selected student
    const cred = credentials.find(c => c.userId === selectedStudent.id);
    setEditingPassword(cred ? cred.passwordText : 'student123');
    setPasswordUpdateFeedback(null);

  }, [selectedStudent, credentials]);

  const loadStudents = async () => {
    try {
      const list = await api.getStudents();
      setStudents(list);
      try {
        const creds = await api.getCredentials();
        setCredentials(creds);
      } catch (err) {
        console.error('Failed to load student credentials', err);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePassword = async () => {
    if (!selectedStudent || !editingPassword) return;
    try {
      await api.updateCredential(selectedStudent.id, editingPassword);
      setPasswordUpdateFeedback('Password updated successfully!');
      // Reload credentials
      const creds = await api.getCredentials();
      setCredentials(creds);
      setTimeout(() => setPasswordUpdateFeedback(null), 3000);
    } catch (err: any) {
      console.error(err);
      setPasswordUpdateFeedback('Failed to update password');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'active' | 'suspended') => {
    try {
      await api.updateStudentStatus(id, status);
      await loadStudents();
      // If currently active selected student status changes, update it
      if (selectedStudent?.id === id) {
        setSelectedStudent(prev => prev ? { ...prev, status } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approveStudent(id);
      await loadStudents();
      if (selectedStudent?.id === id) {
        setSelectedStudent(prev => prev ? { ...prev, status: 'active' } : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleClassToggle = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setSubmitting(true);

    if (selectedClasses.length === 0) {
      setAddError('Please select at least one class.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.register({
        name: newName,
        email: newEmail,
        grNumber: newGrNumber,
        password: newPassword,
        classIds: selectedClasses
      });
      
      setAddSuccess(res.message);
      setNewName('');
      setNewEmail('');
      setNewGrNumber('');
      setNewPassword('');
      setSelectedClasses([]);
      await loadStudents();
      
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'Failed to register student.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.grNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="students-manager-root">
      
      {/* Searchable Students Grid list (Left 2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="students-table-card">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-50 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
              <Users size={16} className="text-blue-600" />
              <span>Active Institution Student Profiles</span>
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              id="admin-add-student-btn"
            >
              + Register Student
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64" id="search-container">
            <span className="absolute left-3.5 top-2.5 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search Name, GR, or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/60 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400"
              id="student-search-input"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto" id="students-data-table">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-2.5 pl-2">Name & Email</th>
                <th className="pb-2.5">GR Number</th>
                <th className="pb-2.5">Academic Progress</th>
                <th className="pb-2.5">Status</th>
                <th className="pb-2.5 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudent?.id === student.id;
                return (
                  <tr 
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-sky-50/40 font-semibold' : ''
                    }`}
                    id={`student-row-${student.id}`}
                  >
                    {/* Name/Email */}
                    <td className="py-3 pl-2">
                      <div className="font-bold text-slate-800">{student.name}</div>
                      <div className="text-[10px] text-gray-400 font-medium">{student.email}</div>
                    </td>
                    
                    {/* GR number */}
                    <td className="py-3 font-mono text-slate-500 font-semibold">
                      {student.grNumber}
                    </td>

                    {/* Progress */}
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sky-600 font-bold">{student.xp} XP</span>
                        <span className="text-gray-400 text-[10px] font-medium">• Lvl {student.level}</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        student.status === 'active' 
                          ? 'bg-teal-50 text-teal-700' 
                          : student.status === 'suspended' 
                            ? 'bg-red-50 text-red-700' 
                            : 'bg-amber-50 text-amber-700'
                      }`}>
                        {student.status.toUpperCase()}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 pr-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {student.status === 'pending' ? (
                        <button
                          onClick={() => handleApprove(student.id)}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          id={`approve-btn-${student.id}`}
                        >
                          Approve Entrance
                        </button>
                      ) : student.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateStatus(student.id, 'suspended')}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          id={`suspend-btn-${student.id}`}
                        >
                          Suspend Portal
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(student.id, 'active')}
                          className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-[10px] font-bold cursor-pointer"
                          id={`activate-btn-${student.id}`}
                        >
                          Un-suspend
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                    No matching student profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student profile drawer panel (Right 1 col) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit" id="student-detail-drawer">
        {selectedStudent ? (
          <div className="space-y-5 animate-fade-in" id="student-profile-info">
            <div className="border-b border-gray-100 pb-4 text-center space-y-2">
              <div className="inline-flex p-3 bg-sky-50 text-sky-600 rounded-full">
                <Users size={28} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 font-display text-md">{selectedStudent.name}</h4>
                <p className="text-xs text-gray-400">GR Number: <span className="font-mono font-semibold text-slate-600">{selectedStudent.grNumber}</span></p>
                <p className="text-[10px] text-slate-400 italic font-medium">{selectedStudent.email}</p>
              </div>
            </div>

            {/* Custom Registration Profile Fields */}
            {(selectedStudent.firstName || selectedStudent.phone || selectedStudent.country || selectedStudent.city || selectedStudent.accaId) && (
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2 text-xs" id="profile-custom-fields">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Extended Profile Information</span>
                <div className="space-y-1.5 font-medium text-slate-700">
                  {selectedStudent.phone && (
                    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="text-slate-400">Phone Number:</span>
                      <span className="font-semibold">{selectedStudent.phone}</span>
                    </div>
                  )}
                  {selectedStudent.country && (
                    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="text-slate-400">Country:</span>
                      <span className="font-semibold">{selectedStudent.country}</span>
                    </div>
                  )}
                  {selectedStudent.city && (
                    <div className="flex justify-between border-b border-slate-200/50 pb-1 last:border-0 last:pb-0">
                      <span className="text-slate-400">City:</span>
                      <span className="font-semibold uppercase">{selectedStudent.city}</span>
                    </div>
                  )}
                  {selectedStudent.accaId && (
                    <div className="flex justify-between pb-1 last:border-0 last:pb-0">
                      <span className="text-slate-400">ACCA ID:</span>
                      <span className="font-semibold font-mono">{selectedStudent.accaId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Micro Stats */}
            <div className="grid grid-cols-2 gap-3" id="profile-micro-stats">
              <div className="bg-slate-50 border p-3 rounded-xl text-center space-y-1">
                <Award size={16} className="text-amber-500 mx-auto" />
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total XP Score</span>
                <span className="text-sm font-black text-slate-800 block">{selectedStudent.xp} XP</span>
              </div>
              <div className="bg-slate-50 border p-3 rounded-xl text-center space-y-1">
                <BookOpen size={16} className="text-sky-500 mx-auto" />
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Level</span>
                <span className="text-sm font-black text-slate-800 block">Lvl {selectedStudent.level}</span>
              </div>
            </div>

            {/* Credentials / Password Portal Manager */}
            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2" id="profile-credentials-manager">
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Issued Access Credentials</span>
              <div className="text-xs space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-400">Portal User ID:</span>
                  <span className="font-mono text-slate-700 font-semibold">{selectedStudent.email}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-400">Issued Password:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editingPassword}
                      onChange={(e) => setEditingPassword(e.target.value)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 w-24 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUpdatePassword}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Issue
                    </button>
                  </div>
                </div>
                {passwordUpdateFeedback && (
                  <p className="text-[10px] text-teal-600 font-bold text-center pt-1">{passwordUpdateFeedback}</p>
                )}
              </div>
            </div>

            {/* Action audit logs trailing specific to the student */}
            <div className="space-y-3" id="student-audit-logs">
              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Activity size={12} />
                <span>Recent Learning Trail Events</span>
              </h5>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1" id="profile-activities-list">
                {studentLogs.map((log) => (
                  <div key={log.id} className="text-[10px] border-b border-gray-50 pb-2 last:border-b-0 last:pb-0 space-y-1">
                    <div className="flex justify-between items-center text-slate-400 font-medium">
                      <span>{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 font-semibold">{log.target}</p>
                  </div>
                ))}
                {studentLogs.length === 0 && (
                  <p className="text-slate-400 italic text-center py-4">No recent learning activity logs.</p>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-slate-400 text-xs text-center py-12 flex flex-col items-center gap-2">
            <Users size={32} className="text-slate-300" />
            <p>Select a student profile row from the table to view institution logs, level states, and access activities.</p>
          </div>
        )}
      </div>

      {/* Registration Modal Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden"
              id="student-reg-modal"
            >
              {/* Modal Header */}
              <div className="bg-slate-50 border-b border-gray-100 px-5 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Users size={16} />
                  </div>
                  <span className="font-bold text-sm text-slate-800 font-display">Register Student Account</span>
                </div>
                <button 
                  onClick={() => { setShowAddModal(false); setAddError(null); setAddSuccess(null); }}
                  className="p-1 hover:bg-gray-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Form Content */}
              <form onSubmit={handleAddStudent} className="p-5 space-y-4">
                {addError && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-r-lg text-xs flex gap-2 items-start" id="reg-error-banner">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <span>{addError}</span>
                  </div>
                )}
                
                {addSuccess && (
                  <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-800 p-2.5 rounded-r-lg text-xs flex gap-2 items-start" id="reg-success-banner">
                    <CheckCircle size={14} className="shrink-0 mt-0.5 text-teal-600" />
                    <span>{addSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Hamza"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    id="reg-new-name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Student Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. hamza@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    id="reg-new-email"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    GR Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GR-9823"
                    value={newGrNumber}
                    onChange={(e) => setNewGrNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    id="reg-new-gr"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Issue Student Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom login password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800"
                    id="reg-new-password"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Classes <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto border border-gray-100 rounded-xl p-2.5 bg-slate-50" id="reg-classes-select">
                    {classes.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span className="text-[10px] text-gray-400">Loading available classes...</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setAddError(null); setAddSuccess(null); }}
                    className="px-4 py-2 hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                  >
                    {submitting ? 'Registering...' : 'Register Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
