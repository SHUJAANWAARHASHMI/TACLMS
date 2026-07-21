import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Subject, Chapter, Note, Bookmark, Progress } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  FileText, Search, Bookmark as BookmarkIcon, Eye, Download, CheckCircle, 
  Sparkles, Filter, ChevronRight, File, BookOpen, Star, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DocumentViewer from './DocumentViewer';

interface StudentNotesProps {
  user: User;
  lang: 'en' | 'ur';
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentNotes({ user, lang, onXPUpdated }: StudentNotesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer states
  const [secureViewNote, setSecureViewNote] = useState<Note | null>(null);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    // parallelize data retrieval
    Promise.all([
      api.getSubjects(),
      api.getChapters(),
      api.getNotes(),
      api.getBookmarks(),
      api.getProgress()
    ]).then(([subs, chaps, allNotes, bmarks, prog]) => {
      setSubjects(subs);
      setChapters(chaps);
      setNotes(allNotes);
      setBookmarks(bmarks);
      setProgress(prog);
    }).catch(err => console.error('Error loading notes library', err));
  }, [user.id]);

  const handleBookmarkToggle = async (itemId: string) => {
    setBookmarkingId(itemId);
    try {
      await api.toggleBookmark(itemId, 'note');
      const bmarks = await api.getBookmarks();
      setBookmarks(bmarks);
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleMarkComplete = async (noteId: string) => {
    setCompletingId(noteId);
    try {
      const res = await api.markAsCompleted(noteId, 'note');
      if (res.success && res.xpEarned > 0) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
        const updatedProgress = await api.getProgress();
        setProgress(updatedProgress);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingId(null);
    }
  };

  const isBookmarked = (noteId: string) => bookmarks.some(b => b.itemId === noteId);
  const isCompleted = (noteId: string) => progress.some(p => p.itemId === noteId);

  // Filter notes
  const filteredNotes = notes.filter(note => {
    // Subject filter
    if (selectedSubjectId !== 'all') {
      const chap = chapters.find(c => c.id === note.chapterId);
      if (!chap || chap.subjectId !== selectedSubjectId) return false;
    }
    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const titleMatch = note.title.toLowerCase().includes(q);
      const nameMatch = note.originalName.toLowerCase().includes(q);
      const tagMatch = note.tags && note.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || nameMatch || tagMatch;
    }
    return true;
  });

  // Helper to determine subject name
  const getSubjectName = (chapterId: string) => {
    const chap = chapters.find(c => c.id === chapterId);
    if (!chap) return 'General';
    const sub = subjects.find(s => s.id === chap.subjectId);
    return sub ? sub.name : 'General';
  };

  // Simulated page count based on note ID length to make it consistent and beautiful
  const getSimulatedPageCount = (noteId: string) => {
    const num = (noteId.charCodeAt(0) || 12) % 15;
    return num + 4; // 4 to 18 pages
  };

  const isRtl = lang === 'ur';

  // Bookmark shortcuts section
  const bookmarkedNotes = notes.filter(n => isBookmarked(n.id));

  return (
    <div className="space-y-6" id="student-notes-container" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Search Header panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">{lang === 'en' ? 'Study Notes Library' : 'مطالعہ نوٹس لائبریری'}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Secure, class-wise reference manuals with integrated watermark protection</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={lang === 'en' ? 'Search note titles, tags...' : 'نوٹ کے عنوان یا ٹیگز تلاش کریں...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad] text-xs font-semibold bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Subject Selector Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="subject-notes-carousel">
        <button
          onClick={() => setSelectedSubjectId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
            selectedSubjectId === 'all'
              ? 'bg-[#004aad] text-white border-[#004aad] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
          }`}
        >
          All Subjects
        </button>
        {subjects.map(sub => (
          <button
            key={sub.id}
            onClick={() => setSelectedSubjectId(sub.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
              selectedSubjectId === sub.id
                ? 'bg-[#004aad] text-white border-[#004aad] shadow-xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
            }`}
          >
            {sub.name}
          </button>
        ))}
      </div>

      {/* Bookmarked / Stared Quick Section */}
      {bookmarkedNotes.length > 0 && selectedSubjectId === 'all' && !searchQuery && (
        <div className="space-y-3" id="saved-documents-rack">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
            <Star size={14} className="text-yellow-500 fill-yellow-400" />
            <span>{lang === 'en' ? 'Starred Notes' : 'ستارہ دار نوٹس'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bookmarkedNotes.map(note => (
              <div
                key={note.id}
                className="bg-amber-50/30 border border-amber-200/50 rounded-2xl p-4 flex justify-between items-start gap-4 shadow-3xs hover:shadow-xs transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600">{getSubjectName(note.chapterId)}</span>
                    <h4 className="text-xs font-bold text-slate-800 truncate mt-0.5">{note.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">{getSimulatedPageCount(note.id)} Pages</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setSecureViewNote(note)}
                    className="p-1.5 bg-white text-[#004aad] rounded-lg border border-slate-200/60 hover:bg-slate-50 transition-colors"
                    title="View note"
                  >
                    <Eye size={12} />
                  </button>
                  <button
                    onClick={() => handleBookmarkToggle(note.id)}
                    className="p-1.5 bg-yellow-400 text-yellow-900 rounded-lg shadow-2xs"
                    title="Remove star"
                  >
                    <Star size={12} fill="currentColor" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Notes Catalog cards */}
      <div className="space-y-3" id="notes-main-grid-area">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
          {lang === 'en' ? 'Study Documents' : 'مطالعہ کے دستاویزات'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-blue-100 transition-all flex flex-col justify-between group"
              id={`note-card-catalog-${note.id}`}
            >
              <div>
                {/* Header row inside note card */}
                <div className="flex justify-between items-start gap-3">
                  <span className="bg-[#004aad]/10 text-[#004aad] px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                    {getSubjectName(note.chapterId)}
                  </span>
                  
                  {/* Bookmark button */}
                  <button
                    onClick={() => handleBookmarkToggle(note.id)}
                    disabled={bookmarkingId === note.id}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      isBookmarked(note.id)
                        ? 'text-yellow-500 bg-yellow-50 border-yellow-100'
                        : 'text-slate-400 hover:text-slate-600 border-transparent bg-slate-50/50 hover:bg-slate-50'
                    }`}
                    title="Star important notes"
                  >
                    <Star size={12} fill={isBookmarked(note.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="flex items-start gap-3.5 mt-3">
                  <div className="p-3 bg-blue-50 text-[#004aad] rounded-2xl group-hover:bg-[#004aad] group-hover:text-white transition-all shadow-3xs shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#004aad] transition-colors">{note.title}</h4>
                    <p className="text-[10px] text-slate-500 font-semibold">{getSimulatedPageCount(note.id)} Pages • PDF Study Manual</p>
                  </div>
                </div>

                {/* Tags row */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((tag, i) => (
                      <span key={i} className="bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded text-[8px] font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons row */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-3.5 mt-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSecureViewNote(note)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#004aad]/10 text-[#004aad] hover:bg-[#004aad] hover:text-white text-[11px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                    id={`note-view-btn-${note.id}`}
                  >
                    <Eye size={12} />
                    <span>Read</span>
                  </button>
                  <span className="text-[9px] text-[#004aad] font-black uppercase bg-blue-50 px-2 py-1 rounded tracking-wider border border-blue-100">
                    {lang === 'en' ? 'Secure View' : 'صرف پڑھیں'}
                  </span>
                </div>

                <button
                  disabled={isCompleted(note.id) || completingId === note.id}
                  onClick={() => handleMarkComplete(note.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-3xs ${
                    isCompleted(note.id)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer'
                  }`}
                  id={`note-complete-btn-${note.id}`}
                >
                  <CheckCircle size={11} fill={isCompleted(note.id) ? 'currentColor' : 'none'} />
                  <span>{isCompleted(note.id) ? 'Read ✓' : 'Mark Read'}</span>
                </button>
              </div>

            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="col-span-3 bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <AlertCircle size={28} className="text-slate-300" />
              <span>{lang === 'en' ? 'No study documents are currently uploaded for this subject.' : 'اس مضمون کے لیے کوئی نوٹس نہیں پائے گئے۔'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drawer / Modal Secure Inline Note Viewer */}
      <AnimatePresence>
        {secureViewNote && (
          <DocumentViewer
            note={secureViewNote}
            onClose={() => setSecureViewNote(null)}
            user={user}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
