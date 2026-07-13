import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Testimonial } from '../types';
import { Check, Trash2, Star, MessageSquare, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete/reject this testimonial?')) return;
    setActionLoading(id);
    try {
      await api.deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete testimonial.');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = testimonials.filter(t => !t.isApproved).length;
  const approvedCount = testimonials.filter(t => t.isApproved).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="admin-testimonials-panel">
      
      {/* Header and Summary Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-4" id="admin-testimonials-header">
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest font-display">Student Testimonials Moderation</h2>
          <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Approve, reject, and manage feedback shown on student dashboard panels.</p>
        </div>

        <div className="flex gap-3" id="admin-testimonials-stats">
          <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex items-center gap-2">
            <Clock size={16} className="text-amber-500 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-amber-700 block font-bold uppercase tracking-wider">Pending</span>
              <span className="text-sm font-black text-amber-800">{pendingCount}</span>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[9px] text-emerald-700 block font-bold uppercase tracking-wider">Approved</span>
              <span className="text-sm font-black text-emerald-800">{approvedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs" id="admin-testimonials-list-card">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            Loading testimonials for moderation...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold space-y-2">
            <MessageSquare size={32} className="mx-auto text-slate-300" />
            <p>No student testimonials submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100" id="admin-testimonials-rows">
            {testimonials.map((t) => (
              <div 
                key={t.id} 
                className={`p-5 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                  !t.isApproved ? 'bg-amber-50/20 hover:bg-amber-50/45' : 'hover:bg-slate-50/30'
                }`}
                id={`admin-testimonial-row-${t.id}`}
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{t.studentName}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                      {t.studentClass}
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400" id={`admin-stars-display-${t.id}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={11} 
                          fill={i < t.rating ? 'currentColor' : 'none'} 
                          className="stroke-amber-400" 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium italic pl-1">
                    "{t.feedback}"
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold pl-1">
                    <span>Submitted {new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span className={`inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[9px] ${
                      t.isApproved ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {t.isApproved ? 'Approved & Public' : 'Pending Approval'}
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0 md:self-center" id={`moderation-actions-${t.id}`}>
                  {!t.isApproved && (
                    <button
                      onClick={() => handleApprove(t.id)}
                      disabled={actionLoading !== null}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      id={`approve-btn-${t.id}`}
                    >
                      <Check size={12} strokeWidth={3} />
                      <span>Approve</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={actionLoading !== null}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-all cursor-pointer"
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
    </div>
  );
}
