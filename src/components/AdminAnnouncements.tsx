import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Announcement } from '../types';
import { Megaphone, Trash2, Plus, BellRing } from 'lucide-react';

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urduTitle, setUrduTitle] = useState('');
  const [urduContent, setUrduContent] = useState('');
  const [category, setCategory] = useState<'general' | 'exam' | 'holiday' | 'schedule'>('general');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const list = await api.getAnnouncements();
      setAnnouncements(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error(e);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title.trim() || !content.trim()) {
      setError('Title and core message details are required.');
      return;
    }

    setLoading(true);
    try {
      await api.createAnnouncement({
        title,
        content,
        urduTitle: urduTitle.trim() || undefined,
        urduContent: urduContent.trim() || undefined,
        category
      });
      setSuccess(true);
      setTitle('');
      setContent('');
      setUrduTitle('');
      setUrduContent('');
      await loadAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Announcement creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement? It will be deleted from student noticeboards.')) return;
    try {
      await api.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="announcements-manager-root">
      
      {/* Form Card (1 col) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="post-announcement-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <Megaphone size={16} className="text-sky-500" />
          <span>Publish Institution Notice</span>
        </h3>

        <form onSubmit={handlePost} className="space-y-4 text-xs font-semibold text-slate-500" id="announcement-composer-form">
          
          <div>
            <label className="block mb-1">Notice Category</label>
            <select
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
              id="announcement-category"
            >
              <option value="general">📢 General Notice</option>
              <option value="exam">📝 Exam Schedule</option>
              <option value="holiday">🏖 Holiday announcement</option>
              <option value="schedule">📅 Class Timetable</option>
            </select>
          </div>

          <div className="space-y-3 pt-1 border-t border-slate-50">
            <span className="text-[9px] font-bold text-sky-500 uppercase tracking-wide">English Version (Primary)</span>
            <div>
              <label className="block mb-1">Notice Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Midterm Physics Exam Schedule"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="announcement-title-en"
              />
            </div>
            <div>
              <label className="block mb-1">Message Content</label>
              <textarea
                required
                placeholder="Write full notices details here..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="announcement-content-en"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Urdu Version (Optional)</span>
            <div>
              <label className="block mb-1">Urdu Title / عنوان</label>
              <input
                type="text"
                placeholder="مثال: فزکس کا امتحانی شیڈول"
                value={urduTitle}
                onChange={(e) => setUrduTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white font-urdu text-right"
                dir="rtl"
                id="announcement-title-ur"
              />
            </div>
            <div>
              <label className="block mb-1">Urdu Content / تفصیل</label>
              <textarea
                placeholder="مکمل تفصیل یہاں اردو زبان میں تحریر کریں..."
                rows={3}
                value={urduContent}
                onChange={(e) => setUrduContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white font-urdu text-right"
                dir="rtl"
                id="announcement-content-ur"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          {success && <p className="text-xs text-teal-600 font-bold">Notice broadcasted to all dashboards ✓</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:bg-sky-300"
            id="announcement-submit-btn"
          >
            <Plus size={14} />
            <span>Broadcast Notice</span>
          </button>

        </form>
      </div>

      {/* Directory board list (2 cols) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="notices-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <BellRing size={16} className="text-amber-500" />
          <span>Active Institution Noticeboard History</span>
        </h3>

        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1" id="announcements-directory-list">
          {announcements.map((ann) => (
            <div key={ann.id} className="border border-gray-100 p-4 rounded-xl relative hover:border-sky-100 transition-colors" id={`ann-card-admin-${ann.id}`}>
              
              <button
                onClick={() => handleDelete(ann.id)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                title="Wipe notice"
              >
                <Trash2 size={13} />
              </button>

              <div className="space-y-3">
                
                {/* Meta details */}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    ann.category === 'exam' ? 'bg-red-50 text-red-700' :
                    ann.category === 'holiday' ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
                  }`}>
                    {(ann.category || 'general').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Posted on {new Date(ann.createdAt).toLocaleString()}
                  </span>
                </div>

                {/* English Content */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">{ann.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{ann.body || (ann as any).content}</p>
                </div>

                {/* Urdu Content */}
                {ann.urduTitle && ann.urduContent && (
                  <div className="border-t border-dashed border-slate-100 pt-3 text-right space-y-1 bg-amber-50/20 p-2 rounded-lg" dir="rtl">
                    <h4 className="text-xs font-bold text-slate-800 font-urdu">{ann.urduTitle}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-urdu">{ann.urduContent}</p>
                  </div>
                )}

              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No institutional notices are on display.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
