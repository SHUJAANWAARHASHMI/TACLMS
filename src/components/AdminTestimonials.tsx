import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Testimonial } from '../types';
import { Check, Trash2, Star, MessageSquare, ShieldAlert, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Custom confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const data = await api.getTestimonials();
      setTestimonials(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      console.error('Failed to load testimonials', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveTestimonial(id);
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isApproved: true } : t));
    } catch (err: any) {
      alert(err.message || 'Failed to approve testimonial.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setActionLoading(deleteConfirmId);
    try {
      await api.deleteTestimonial(deleteConfirmId);
      setTestimonials(prev => prev.filter(t => t.id !== deleteConfirmId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete testimonial.');
    } finally {
      setActionLoading(null);
      setDeleteConfirmId(null);
    }
  };

  const pendingCount = testimonials.filter(t => !t.isApproved).length;
  const approvedCount = testimonials.filter(t => t.isApproved).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in text-slate-800" id="admin-testimonials-panel">
      
      {/* Header and Summary Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4" id="admin-testimonials-header">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Student Inquiries & Discussion Board</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Approve, reject, and address general feedback and queries submitted by students.</p>
        </div>

        <div className="flex gap-3" id="admin-testimonials-stats">
          <div className="bg-yellow-50 border-2 border-yellow-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <Clock size={16} className="text-yellow-600 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-yellow-700 block font-bold uppercase tracking-wider">Pending</span>
              <span className="text-sm font-black text-yellow-800">{pendingCount}</span>
            </div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle size={16} className="text-blue-600 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-blue-700 block font-bold uppercase tracking-wider">Approved</span>
              <span className="text-sm font-black text-blue-800">{approvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border-2 border-slate-100 rounded-2xl overflow-hidden shadow-xs" id="admin-testimonials-list-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <RefreshCw size={24} className="animate-spin text-blue-600" />
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Loading inquiries queue...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-bold space-y-2">
            <MessageSquare size={32} className="mx-auto text-blue-600 mb-2" />
            <p className="uppercase tracking-wider">No student inquiries submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="admin-testimonials-rows">
            {testimonials.map((t) => (
              <div 
                key={t.id} 
                className={`p-5 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  !t.isApproved ? 'bg-yellow-50/15 hover:bg-yellow-50/30 border-l-4 border-yellow-400' : 'hover:bg-slate-50/20'
                }`}
                id={`admin-testimonial-row-${t.id}`}
              >
                <div className="space-y-2 max-w-3xl text-left">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-extrabold text-blue-950">{t.studentName}</span>
                    <span className="text-[10px] text-blue-600 font-extrabold uppercase bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {t.studentClass}
                    </span>
                    <div className="flex items-center gap-0.5 text-yellow-500 animate-pulse" id={`admin-stars-display-${t.id}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          fill={i < t.rating ? 'currentColor' : 'none'} 
                          className="stroke-yellow-500" 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-semibold italic pl-1">
                    "{t.feedback}"
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider pl-1">
                    <span>Submitted {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center gap-1 font-extrabold tracking-wider text-[9px] ${
                      t.isApproved ? 'text-blue-600' : 'text-yellow-600'
                    }`}>
                      {t.isApproved ? 'Approved & Displayed' : 'Under Review'}
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0 md:self-center" id={`moderation-actions-${t.id}`}>
                  {!t.isApproved && (
                    <button
                      onClick={() => handleApprove(t.id)}
                      disabled={actionLoading !== null}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      id={`approve-btn-${t.id}`}
                    >
                      <Check size={12} strokeWidth={3} />
                      <span>Approve</span>
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmId(t.id)}
                    disabled={actionLoading !== null}
                    className="p-2 border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 rounded-xl transition-all cursor-pointer bg-white"
                    title="Reject and delete"
                    id={`delete-btn-${t.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM MISTAKE-PROOF DELETION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in" id="delete-testimonial-modal">
          <div className="bg-white rounded-2xl border-4 border-yellow-400 p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delete Student Inquiry</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  Are you sure you want to permanently delete and reject this student feedback message?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                disabled={actionLoading !== null}
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                No, Keep It
              </button>
              <button
                disabled={actionLoading !== null}
                onClick={handleDelete}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
