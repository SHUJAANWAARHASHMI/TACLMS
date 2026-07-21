import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom, Subject, Testimonial, AuditLog } from '../types';
import { Folder, BookOpen, Users, MessageSquare, Plus, CheckCircle, HelpCircle, AlertCircle, History, RefreshCw, UploadCloud, Sparkles } from 'lucide-react';

interface AdminDashboardProps {
  onLogoUpdated?: (newUrl: string) => void;
  logoUrl?: string;
}

export default function AdminDashboard({ onLogoUpdated, logoUrl }: AdminDashboardProps) {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form State for Quick Action
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('logo', file);

    try {
      const result = await api.uploadLogo(formData);
      if (result.success && onLogoUpdated) {
        onLogoUpdated(result.logoUrl);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Failed to upload logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [cls, subs, stds, tests, logs] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getStudents(),
        api.getTestimonials(),
        api.getAuditLogs()
      ]);
      setClasses(cls || []);
      setSubjects(subs || []);
      setStudents(stds.filter(s => s.role === 'student') || []);
      setTestimonials(tests || []);
      setAuditLogs(logs.slice(0, 8) || []);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || actionLoading) return;

    setActionLoading(true);
    try {
      await api.createClass(newClassName, newClassDesc);
      setNewClassName('');
      setNewClassDesc('');
      setSuccessMessage('✅ Class added successfully! Go to "Classes & Folders" from the sidebar menu to link subjects.');
      await fetchDashboardStats();
      
      // Auto close success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setShowAddModal(false);
      }, 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to create class slot');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingFeedbackCount = testimonials.filter(t => !t.isApproved).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Gathering system statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-slate-800" id="admin-dashboard-container">
      
      {/* Top Banner Message */}
      <div className="bg-blue-50 border-2 border-blue-600 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4" id="welcome-action-banner">
        <div className="space-y-1">
          <h3 className="text-md font-extrabold text-blue-900 font-display">Institution Overview</h3>
          <p className="text-xs font-semibold text-blue-700 leading-relaxed max-w-2xl">
            Welcome back to the Administration Panel. This workspace helps you coordinate student course folders, authorize curriculum permissions, and address queries submitted under topics.
          </p>
        </div>

        {/* Quick Action Trigger Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm hover:scale-[1.02]"
          id="dashboard-quick-add-btn"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Add New Class Slot</span>
        </button>
      </div>

      {/* Primary Counters Grid (strictly White, Blue, and Yellow Highlights) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-stats-grid">
        
        {/* Classes Counter */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs flex items-center justify-between" id="stat-card-classes">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Class Grade Slots</span>
            <h3 className="text-3xl font-black text-blue-600 font-mono leading-none">{classes.length}</h3>
            <span className="text-[10px] text-slate-400 block font-semibold">Active grade levels</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
            <Folder size={20} fill="currentColor" className="text-white" />
          </div>
        </div>

        {/* Subjects Counter */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs flex items-center justify-between" id="stat-card-subjects">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Course Subjects</span>
            <h3 className="text-3xl font-black text-blue-600 font-mono leading-none">{subjects.length}</h3>
            <span className="text-[10px] text-slate-400 block font-semibold">Linked topics files</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
            <BookOpen size={20} />
          </div>
        </div>

        {/* Students Counter */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs flex items-center justify-between" id="stat-card-students">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enrolled Scholars</span>
            <h3 className="text-3xl font-black text-blue-600 font-mono leading-none">{students.length}</h3>
            <span className="text-[10px] text-slate-400 block font-semibold">Registered GR accounts</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
            <Users size={20} />
          </div>
        </div>

        {/* Feedback / Inquiries Counter */}
        <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 shadow-xs flex items-center justify-between" id="stat-card-queries">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Student Queries</span>
            <h3 className="text-3xl font-black text-blue-600 font-mono leading-none">{pendingFeedbackCount}</h3>
            {pendingFeedbackCount > 0 ? (
              <span className="bg-yellow-100 text-yellow-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full block w-fit">
                Action Required
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 block font-semibold">All queries resolved</span>
            )}
          </div>
          <div className={`p-3 rounded-xl border ${pendingFeedbackCount > 0 ? 'bg-yellow-50 text-yellow-600 border-yellow-200 animate-pulse' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            <MessageSquare size={20} />
          </div>
        </div>

      </div>

      {/* Main Grid: Activity Logs and Information Help */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-details-container">
        
        {/* COLUMN 1 & 2: Recent Activity Audit log */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-100 p-5" id="recent-logs-column">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-1.5">
            <History size={15} className="text-blue-600" />
            <span>Recent Administrative Actions</span>
          </h4>

          <div className="divide-y divide-slate-100 mt-3 max-h-96 overflow-y-auto pr-2" id="audit-logs-list">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs" id={`audit-log-row-${log.id}`}>
                <div className="space-y-1">
                  <div className="font-extrabold text-blue-900">{log.actorName} <span className="text-[10px] text-slate-400">({log.actorRole})</span></div>
                  <p className="text-slate-600">
                    Performed <span className="font-bold text-slate-800">{log.action}</span> &rarr; <span className="font-semibold text-blue-600">{log.target}</span>
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                No recent admin actions logged.
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Mistake-Proof Guide Card & Branding settings */}
        <div className="space-y-6" id="dashboard-sidebar-column">
          
          {/* Guided Checklist Card */}
          <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 space-y-4" id="mistake-proof-guide-card">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <AlertCircle size={15} className="text-yellow-600" />
              <span>Guided Checklist</span>
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              To create and deliver learning materials, follow these 4 simple milestones:
            </p>

            <div className="space-y-3" id="guide-milestone-list">
              <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">1</span>
                <div>
                  <h5 className="text-xs font-extrabold text-blue-950">Add Class Slot</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Create the grade level slot (e.g. 9th Grade).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">2</span>
                <div>
                  <h5 className="text-xs font-extrabold text-blue-950">Link Course Subjects</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Add courses inside classes (Physics, Math, etc).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">3</span>
                <div>
                  <h5 className="text-xs font-extrabold text-blue-950">Create Folders</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Build chapter dividers inside your course subjects.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2 bg-slate-50 rounded-xl">
                <span className="h-5 w-5 bg-blue-600 text-white rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">4</span>
                <div>
                  <h5 className="text-xs font-extrabold text-blue-950">Upload Content</h5>
                  <p className="text-[10px] text-slate-400 font-medium">Fill topics with videos, notes, MCQs, and points.</p>
                </div>
              </div>
            </div>
          </div>

          {/* BRANDING LOGO CONFIGURATION CARD */}
          <div className="bg-white rounded-2xl border-2 border-slate-100 p-5 space-y-4 shadow-xs" id="branding-logo-config-card">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-50 pb-3 flex items-center gap-1.5">
              <Sparkles size={15} className="text-blue-600" />
              <span>Control Panel Main Logo</span>
            </h4>

            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Upload a custom logo image from your system to customize the system branding:
            </p>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3" id="logo-uploader-dropzone">
              <div className="relative group w-20 h-20 bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center justify-center overflow-hidden shadow-xs transition-transform hover:scale-105">
                <img src={logoUrl || "/logo.svg"} className="w-full h-full object-contain" alt="System Logo" />
              </div>
              
              <div className="text-center">
                <p className="text-xs font-black text-slate-700">App Branding Logo</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">PNG, JPG, JPEG or SVG file</p>
              </div>

              <label className="w-full">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                  className="hidden" 
                  id="logo-file-picker-input"
                />
                <span className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-300 transition-all text-center shadow-xs select-none" id="btn-pick-logo-file">
                  {logoUploading ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <UploadCloud size={13} strokeWidth={2.5} />
                  )}
                  <span>{logoUploading ? 'Uploading Logo...' : 'Pick From System'}</span>
                </span>
              </label>

              {uploadError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-[10px] font-bold rounded-xl w-full text-center">
                  ⚠️ {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl w-full text-center animate-fade-in">
                  ✓ Logo updated successfully!
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* QUICK ACTION ADD CLASS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in" id="add-class-modal-backdrop">
          <div className="bg-white rounded-2xl border-4 border-blue-600 p-6 max-w-md w-full shadow-2xl space-y-4 text-left" id="add-class-modal-card">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                <Folder size={16} className="text-blue-600" />
                <span>Create New Class Grade Slot</span>
              </h3>
              <button 
                onClick={() => { if (!actionLoading) setShowAddModal(false); }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {successMessage ? (
              <div className="py-4 text-center space-y-3" id="modal-success-state">
                <CheckCircle size={44} className="mx-auto text-blue-600" />
                <h4 className="text-xs font-black uppercase text-blue-900">Success!</h4>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">{successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateClass} className="space-y-4" id="modal-create-form">
                
                {/* Visual Step Banner */}
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl text-[11px] leading-relaxed font-semibold flex gap-2">
                  <HelpCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>This creates a new Grade level group under which you can host linked subjects, books, and chapters.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Grade / Class Title</label>
                  <input
                    type="text"
                    required
                    disabled={actionLoading}
                    placeholder="e.g. 9th Grade (Matric)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-xs font-semibold"
                    id="modal-class-name-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Short Summary description</label>
                  <input
                    type="text"
                    disabled={actionLoading}
                    placeholder="e.g. Karachi Board Intermediate syllabus"
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-xs font-semibold"
                    id="modal-class-desc-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading || !newClassName.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-300 transition-all shadow-sm"
                  id="modal-submit-btn"
                >
                  {actionLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <span>Create Class Slot</span>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
