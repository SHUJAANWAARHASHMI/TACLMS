import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Subject, Chapter, Note, Video, Bookmark, Progress, Quiz, Assignment } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { BookOpen, FolderOpen, FileText, Play, CheckCircle, Bookmark as BookmarkIcon, Eye, Download, MessageCircle, HelpCircle, ChevronRight, HelpCircle as HelpIcon, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudentDoubtSection from './StudentDoubtSection';
import DocumentViewer from './DocumentViewer';

interface StudentCoursesProps {
  user: User;
  lang: 'en' | 'ur';
  initialSubjectId?: string;
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
  onNavigateQuiz: (quizId: string) => void;
  onNavigateAssignment: () => void;
}

export default function StudentCourses({ user, lang, initialSubjectId, onXPUpdated, onNavigateQuiz, onNavigateAssignment }: StudentCoursesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  // Student interactive states
  const [progress, setProgress] = useState<Progress[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  
  // Side drawers / view Modals
  const [activeDoubtItem, setActiveDoubtItem] = useState<{ id: string; title: string; type: 'note' | 'video' } | null>(null);
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<Video | null>(null);
  const [secureViewNote, setSecureViewNote] = useState<Note | null>(null);
  const [bookmarkingId, setBookmarkingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch unlocked subjects
    api.getSubjects().then(subs => {
      setSubjects(subs);
      if (subs.length > 0) {
        // Handle deep-linked subject from dashboard
        const matched = subs.find(s => s.id === initialSubjectId) || subs[0];
        setSelectedSubject(matched);
      }
    }).catch(err => console.error(err));

    // 2. Fetch bookmarks and progress
    api.getBookmarks().then(setBookmarks).catch(err => console.error(err));
    api.getProgress().then(setProgress).catch(err => console.error(err));
  }, [user.id, initialSubjectId]);

  useEffect(() => {
    if (!selectedSubject) return;

    // Fetch chapters, notes, videos, quizzes, and assignments for the subject
    Promise.all([
      api.getChapters(),
      api.getNotes(),
      api.getVideos(),
      api.getQuizzes(),
      api.getAssignments()
    ]).then(([chaps, allNotes, allVids, allQuizzes, allAssigns]) => {
      // Filter chapters for this subject
      const filteredChaps = chaps.filter(c => c.subjectId === selectedSubject.id).sort((a, b) => a.order - b.order);
      setChapters(filteredChaps);

      // Filter other materials (backend pre-filters student notes/videos, we filter by chapter mapping)
      const chapIds = filteredChaps.map(c => c.id);
      setNotes(allNotes.filter(n => chapIds.includes(n.chapterId)));
      setVideos(allVids.filter(v => chapIds.includes(v.chapterId)));
      setQuizzes(allQuizzes.filter(q => chapIds.includes(q.chapterId)));
      setAssignments(allAssigns.filter(a => chapIds.includes(a.chapterId)));
    }).catch(err => console.error('Error fetching course materials', err));

  }, [selectedSubject]);

  const handleBookmarkToggle = async (itemId: string, itemType: 'note' | 'video') => {
    setBookmarkingId(itemId);
    try {
      const res = await api.toggleBookmark(itemId, itemType);
      // Refresh bookmarks
      const bmarks = await api.getBookmarks();
      setBookmarks(bmarks);
    } catch (e) {
      console.error(e);
    } finally {
      setBookmarkingId(null);
    }
  };

  const handleMarkComplete = async (itemId: string, itemType: 'note' | 'video') => {
    setCompletingId(itemId);
    try {
      const res = await api.markAsCompleted(itemId, itemType);
      if (res.success && res.xpEarned > 0) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
        // Refresh local progress state
        const updatedProgress = await api.getProgress();
        setProgress(updatedProgress);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingId(null);
    }
  };

  const isBookmarked = (itemId: string) => bookmarks.some(b => b.itemId === itemId);
  const isCompleted = (itemId: string) => progress.some(p => p.itemId === itemId);

  const getYoutubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  const isRtl = lang === 'ur';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="courses-root-grid">
      
      {/* Subjects Selection Sidebar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs lg:col-span-1 h-fit space-y-3" id="subjects-sidebar">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
          {getTranslation(lang, 'unlockedSubjects')}
        </h3>
        <div className="space-y-1.5" id="subjects-tabs-list">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedSubject?.id === sub.id
                  ? 'bg-sky-50 text-sky-600 border border-sky-100'
                  : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}
              id={`subject-tab-${sub.id}`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} />
                <span>{sub.name}</span>
              </div>
              <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
            </button>
          ))}
          {subjects.length === 0 && (
            <div className="text-xs text-slate-400 px-2 py-4 text-center">
              No subjects unlocked yet. Contact Admin.
            </div>
          )}
        </div>
      </div>

      {/* Chapters Folder Structure View */}
      <div className="lg:col-span-3 space-y-5" id="chapters-accordion-panel">
        {selectedSubject ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="subject-header">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Currently Browsing</span>
                <h2 className="text-lg font-bold text-slate-800 font-display">{selectedSubject.name}</h2>
              </div>
              <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl">
                <FolderOpen size={20} />
              </div>
            </div>

            {/* Accordion / Folders of Chapters */}
            <div className="space-y-4" id="chapters-list">
              {chapters.map((chap) => {
                const chapNotes = notes.filter(n => n.chapterId === chap.id);
                const chapVideos = videos.filter(v => v.chapterId === chap.id);
                const chapQuizzes = quizzes.filter(q => q.chapterId === chap.id);
                const chapAssigns = assignments.filter(a => a.chapterId === chap.id);

                return (
                  <div key={chap.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4 animate-fade-in" id={`chap-accordion-${chap.id}`}>
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="font-bold text-slate-800 text-md font-display">{chap.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Contains {chapNotes.length} notes, {chapVideos.length} videos
                      </p>
                    </div>

                    {/* Folder Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left: Notes & Documents Folder */}
                      <div className="space-y-3" id={`chap-${chap.id}-notes-folder`}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <FileText size={14} className="text-amber-500" />
                          <span>{getTranslation(lang, 'notes')}</span>
                        </h4>

                        <div className="space-y-2.5">
                          {chapNotes.map((note) => (
                            <div 
                              key={note.id} 
                              className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between gap-3.5 hover:border-sky-100 transition-colors"
                              id={`note-card-${note.id}`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <h5 className="text-sm font-bold text-slate-800 leading-snug">{note.title}</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {note.tags.map((t, idx) => (
                                      <span key={idx} className="bg-sky-50 text-sky-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                                        {t}
                                      </span>
                                    ))}
                                    {note.viewOnly && (
                                      <span className="bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                                        View Only
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleBookmarkToggle(note.id, 'note')}
                                  disabled={bookmarkingId === note.id}
                                  className={`p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer ${
                                    isBookmarked(note.id) ? 'text-amber-500 bg-white shadow-xs' : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  <BookmarkIcon size={14} fill={isBookmarked(note.id) ? 'currentColor' : 'none'} />
                                </button>
                              </div>

                              <div className="flex justify-between items-center border-t border-slate-100/60 pt-2.5 mt-1">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setSecureViewNote(note)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                    id={`note-view-btn-${note.id}`}
                                  >
                                    <Eye size={12} />
                                    <span>View</span>
                                  </button>
                                  {note.downloadAllowed ? (
                                    <a
                                      href={api.getFileUrl(note.id, true)}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                      id={`note-download-btn-${note.id}`}
                                    >
                                      <Download size={12} />
                                      <span>Download</span>
                                    </a>
                                  ) : (
                                    <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5 px-2">
                                      View Only
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveDoubtItem({ id: note.id, title: note.title, type: 'note' })}
                                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-white transition-colors"
                                    title="Discuss doubts"
                                  >
                                    <MessageCircle size={14} />
                                  </button>
                                  <button
                                    disabled={isCompleted(note.id) || completingId === note.id}
                                    onClick={() => handleMarkComplete(note.id, 'note')}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                      isCompleted(note.id)
                                        ? 'text-teal-600 bg-teal-50'
                                        : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                    id={`note-complete-btn-${note.id}`}
                                  >
                                    <CheckCircle size={11} fill={isCompleted(note.id) ? 'currentColor' : 'none'} />
                                    <span>{isCompleted(note.id) ? 'Completed ✓' : 'Mark Done'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {chapNotes.length === 0 && (
                            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                              {getTranslation(lang, 'noNotes')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Video Lectures Folder */}
                      <div className="space-y-3" id={`chap-${chap.id}-videos-folder`}>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
                          <Play size={14} className="text-red-500" />
                          <span>{getTranslation(lang, 'videos')}</span>
                        </h4>

                        <div className="space-y-2.5">
                          {chapVideos.map((video) => (
                            <div 
                              key={video.id} 
                              className="border border-slate-100 rounded-xl p-3 bg-slate-50/50 flex flex-col justify-between gap-3 hover:border-sky-100 transition-colors"
                              id={`video-card-${video.id}`}
                            >
                              <div className="flex gap-3">
                                {video.thumbnailUrl && (
                                  <div className="relative w-20 h-12 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                                    <img 
                                      src={video.thumbnailUrl} 
                                      alt={video.title} 
                                      className="w-full h-full object-cover opacity-80"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
                                      <Play size={14} className="text-white drop-shadow-md" fill="currentColor" />
                                    </div>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-1">
                                    <h5 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">{video.title}</h5>
                                    <button 
                                      onClick={() => handleBookmarkToggle(video.id, 'video')}
                                      disabled={bookmarkingId === video.id}
                                      className={`p-1 rounded-md hover:bg-white transition-colors cursor-pointer shrink-0 ${
                                        isBookmarked(video.id) ? 'text-amber-500 bg-white' : 'text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <BookmarkIcon size={12} fill={isBookmarked(video.id) ? 'currentColor' : 'none'} />
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-gray-400 truncate mt-1">{video.description}</p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center border-t border-slate-100/60 pt-2.5 mt-1">
                                <button
                                  onClick={() => setActiveVideoEmbed(video)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  id={`video-play-btn-${video.id}`}
                                >
                                  <Play size={12} fill="currentColor" />
                                  <span>Watch Video</span>
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setActiveDoubtItem({ id: video.id, title: video.title, type: 'video' })}
                                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-white transition-colors"
                                    title="Discuss doubts"
                                  >
                                    <MessageCircle size={14} />
                                  </button>
                                  <button
                                    disabled={isCompleted(video.id) || completingId === video.id}
                                    onClick={() => handleMarkComplete(video.id, 'video')}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                      isCompleted(video.id)
                                        ? 'text-teal-600 bg-teal-50'
                                        : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer'
                                    }`}
                                    id={`video-complete-btn-${video.id}`}
                                  >
                                    <CheckCircle size={11} fill={isCompleted(video.id) ? 'currentColor' : 'none'} />
                                    <span>{isCompleted(video.id) ? 'Completed ✓' : 'Mark Done'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {chapVideos.length === 0 && (
                            <p className="text-xs text-slate-400 py-3 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                              {getTranslation(lang, 'noVideos')}
                            </p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Chapter quizzes and assignments row */}
                    {(chapQuizzes.length > 0 || chapAssigns.length > 0) && (
                      <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100" id={`chap-${chap.id}-extras`}>
                        {chapQuizzes.map((quiz) => (
                          <button
                            key={quiz.id}
                            onClick={() => onNavigateQuiz(quiz.id)}
                            className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            id={`start-quiz-btn-${quiz.id}`}
                          >
                            <HelpIcon size={13} className="text-teal-600" />
                            <span>Take Quiz: {quiz.title} ({quiz.xpReward} XP)</span>
                          </button>
                        ))}
                        {chapAssigns.map((ass) => (
                          <button
                            key={ass.id}
                            onClick={onNavigateAssignment}
                            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                            id={`view-assign-btn-${ass.id}`}
                          >
                            <ClipboardList size={13} className="text-indigo-600" />
                            <span>Assignment: {ass.title} ({ass.xpReward} XP)</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {chapters.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  No chapters uploaded yet for this subject.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Select an unlocked subject from the left column to view learning documents and videos.
          </div>
        )}
      </div>

      {/* MODAL 1: Secure In-App Video Player */}
      <AnimatePresence>
        {activeVideoEmbed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs" id="video-modal">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl overflow-hidden w-full max-w-3xl shadow-2xl relative"
            >
              <div className="bg-slate-900 px-4 py-3 text-white flex justify-between items-center">
                <h4 className="text-sm font-bold truncate pr-4">{activeVideoEmbed.title}</h4>
                <button 
                  onClick={() => setActiveVideoEmbed(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              {/* Responsive Iframe Embed Container */}
              <div className="aspect-video bg-black relative">
                {activeVideoEmbed.youtubeId ? (
                  <iframe
                    className="w-full h-full border-0"
                    src={getYoutubeEmbedUrl(activeVideoEmbed.youtubeId)}
                    title={activeVideoEmbed.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs p-6 text-center">
                    <p>Embedding restricted by source. Please click link below to watch externally.</p>
                    <a 
                      href={activeVideoEmbed.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg font-bold"
                    >
                      Open Video Link
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {activeVideoEmbed.description || 'No supplementary lecture descriptions provided.'}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Secure In-App Document Viewer */}
      <AnimatePresence>
        {secureViewNote && (
          <DocumentViewer 
            note={secureViewNote} 
            user={user}
            onClose={() => setSecureViewNote(null)} 
          />
        )}
      </AnimatePresence>

      {/* MODAL 3: Bottom Threaded Doubts & Comment Section */}
      <AnimatePresence>
        {activeDoubtItem && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" id="doubt-drawer">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between"
            >
              <div className="border-b border-gray-100 p-4 bg-slate-50 flex justify-between items-center">
                <div className="pr-4">
                  <span className="text-[10px] font-bold text-sky-500 uppercase">Q&A Discussion Board</span>
                  <h4 className="text-sm font-bold text-slate-800 truncate">{activeDoubtItem.title}</h4>
                </div>
                <button 
                  onClick={() => setActiveDoubtItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <StudentDoubtSection itemId={activeDoubtItem.id} user={user} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
