import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom, Subject, Chapter, Video, Note, Progress } from '../types';
import { 
  Lock, BookOpen, Play, FileText, ArrowLeft, Trophy, LogOut, 
  Facebook, Instagram, Youtube, MessageSquare, Flame, Check, HelpCircle
} from 'lucide-react';

interface StudentPortalProps {
  user: User;
  onLogout: () => void;
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentPortal({ user, onLogout, onXPUpdated }: StudentPortalProps) {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<'classes' | 'subjects' | 'content' | 'progress'>('classes');
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  
  // Tab within Screen 3 (Videos & Notes)
  const [activeContentTab, setActiveContentTab] = useState<'videos' | 'notes'>('videos');

  // LMS Data States
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active video play overlay & active note view overlay
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Load all necessary student data
  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(),
      api.getSubjects(),
      api.getChapters(),
      api.getVideos(),
      api.getNotes(),
      api.getProgress()
    ]).then(([cls, subs, chaps, vids, nts, prog]) => {
      // Sort classes cleanly
      setClasses(cls || []);
      setSubjects(subs || []);
      setChapters(chaps || []);
      setVideos(vids || []);
      setNotes(nts || []);
      setProgress(prog || []);
      setLoading(false);
    }).catch(err => {
      console.error('Error loading Portal details:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  // Lock logic helper functions
  const isClassUnlocked = (classId: string) => {
    return user.assignedClasses?.includes(classId) || false;
  };

  const isSubjectUnlocked = (sub: any) => {
    // Subject is unlocked if either marked isUnlocked, or its class is preassigned/unlocked
    return sub.isUnlocked || isClassUnlocked(sub.classId);
  };

  const isItemCompleted = (itemId: string) => {
    return progress.some(p => p.itemId === itemId);
  };

  // Materials filters
  const classSubjects = subjects.filter(sub => sub.classId === selectedClass?.id);
  
  const currentSubjectChapters = chapters.filter(chap => chap.subjectId === selectedSubject?.id);
  const chapIds = currentSubjectChapters.map(c => c.id);
  
  const subjectVideos = videos.filter(v => chapIds.includes(v.chapterId));
  const subjectNotes = notes.filter(n => chapIds.includes(n.chapterId));

  // Marking items complete and earning real XP
  const handleMarkComplete = async (itemId: string, itemType: 'note' | 'video') => {
    if (actionLoading) return;
    setActionLoading(itemId);
    try {
      const res = await api.markAsCompleted(itemId, itemType);
      if (res.success) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
        // Refresh progress only
        const updatedProgress = await api.getProgress();
        setProgress(updatedProgress);
      }
    } catch (e) {
      console.error('Error marking as complete:', e);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper: YouTube URL parser
  const getYoutubeEmbedUrl = (youtubeId: string | null) => {
    if (!youtubeId) return '';
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  // Progress Computations
  const getSubjectCompletionPercent = (subId: string) => {
    const subChaps = chapters.filter(c => c.subjectId === subId);
    const subChapIds = subChaps.map(c => c.id);
    const subNotes = notes.filter(n => subChapIds.includes(n.chapterId));
    const subVideos = videos.filter(v => subChapIds.includes(v.chapterId));
    
    const totalItems = subNotes.length + subVideos.length;
    if (totalItems === 0) return 0;
    
    const subNoteIds = subNotes.map(n => n.id);
    const subVideoIds = subVideos.map(v => v.id);
    
    const completedNotesCount = progress.filter(p => p.itemType === 'note' && subNoteIds.includes(p.itemId)).length;
    const completedVideosCount = progress.filter(p => p.itemType === 'video' && subVideoIds.includes(p.itemId)).length;
    const totalCompleted = completedNotesCount + completedVideosCount;
    
    return Math.min(Math.round((totalCompleted / totalItems) * 100), 100);
  };

  // Overall calculations across all enrolled subjects
  const enrolledSubjects = subjects.filter(isSubjectUnlocked);
  const totalEnrolled = enrolledSubjects.length;
  const overallProgressPercent = totalEnrolled > 0
    ? Math.round(enrolledSubjects.reduce((acc, sub) => acc + getSubjectCompletionPercent(sub.id), 0) / totalEnrolled)
    : 0;

  // Render Loading state strictly conforming to design palette (White & Blue)
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center" id="portal-loading-container">
        <div className="w-16 h-16 border-4 border-[#004aad] border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-[#004aad] font-black tracking-widest text-sm uppercase">Loading Your Classes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-[#004aad] font-sans selection:bg-[#004aad] selection:text-white relative" id="student-portal-root">
      
      {/* HEADER SECTION (Uniform, Elegant, 3-color matching) */}
      <header className="bg-white border-b-2 border-[#004aad]/10 py-5 px-6 flex justify-between items-center sticky top-0 z-30" id="portal-header">
        <div className="flex items-center gap-3">
          <div className="bg-[#004aad] text-white p-2 rounded-xl flex items-center justify-center">
            <BookOpen size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm md:text-md font-black tracking-wider uppercase font-display leading-tight">
              THE ALI'S <span className="text-[#004aad] border-b-2 border-[#facc15]">COLLEGIATE</span>
            </h1>
            <p className="text-[10px] text-[#004aad]/60 font-bold uppercase tracking-widest leading-none mt-0.5">LMS Student Portal</p>
          </div>
        </div>

        {/* Header Right Action - Logout */}
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 border-2 border-[#004aad] hover:bg-[#004aad] hover:text-white rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          id="portal-header-logout"
        >
          <LogOut size={13} className="stroke-[2.5]" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      {/* VIEWPORT AREA */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 pb-28" id="portal-viewport">
        
        {/* SCREEN 1: CLASSES GRID */}
        {currentScreen === 'classes' && (
          <div className="space-y-8 animate-fade-in" id="screen-classes-container">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#004aad] text-center sm:text-left">Your Study Classes</h2>
              <p className="text-xs text-[#004aad]/70 text-center sm:text-left font-semibold">Select your active class grade below to access subject lectures and notes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="classes-banners-grid">
              {classes.map((cls) => {
                const unlocked = isClassUnlocked(cls.id);
                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedClass(cls);
                        setCurrentScreen('subjects');
                      }
                    }}
                    className={`relative p-8 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between min-h-[160px] cursor-pointer ${
                      unlocked
                        ? 'bg-[#004aad] text-white border-[#004aad] hover:scale-[1.02] shadow-lg shadow-[#004aad]/10'
                        : 'bg-white text-[#004aad]/30 border-[#004aad]/20 opacity-40 cursor-not-allowed'
                    }`}
                    id={`class-banner-${cls.id}`}
                  >
                    <div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${unlocked ? 'bg-[#facc15] text-[#004aad]' : 'bg-[#004aad]/10 text-[#004aad]/30'}`}>
                        {unlocked ? 'Enrolled' : 'Locked'}
                      </span>
                      <h3 className="text-xl font-black uppercase tracking-wide mt-4 leading-tight">{cls.name}</h3>
                      <p className={`text-xs mt-1 font-semibold leading-relaxed ${unlocked ? 'text-white/80' : 'text-[#004aad]/40'}`}>
                        {cls.description}
                      </p>
                    </div>

                    <div className="flex justify-end items-center mt-4">
                      {unlocked ? (
                        <div className="bg-[#facc15] text-[#004aad] w-9 h-9 rounded-full flex items-center justify-center font-black shadow-md shadow-[#facc15]/30">
                          &rarr;
                        </div>
                      ) : (
                        <div className="bg-[#004aad]/10 p-2 rounded-full">
                          <Lock size={16} className="text-[#004aad]/40" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 2: SUBJECTS LIST */}
        {currentScreen === 'subjects' && (
          <div className="space-y-8 animate-fade-in" id="screen-subjects-container">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentScreen('classes')}
                className="p-2 border-2 border-[#004aad] hover:bg-[#004aad] hover:text-white text-[#004aad] rounded-full transition-all cursor-pointer"
                id="back-to-classes-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#004aad]/60">Class: {selectedClass?.name}</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#004aad]">Study Subjects</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="subjects-banners-grid">
              {classSubjects.map((sub) => {
                const unlocked = isSubjectUnlocked(sub);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedSubject(sub);
                        setCurrentScreen('content');
                      }
                    }}
                    className={`p-6 rounded-3xl border-2 transition-all duration-300 flex justify-between items-center cursor-pointer ${
                      unlocked
                        ? 'bg-white text-[#004aad] border-[#004aad] hover:scale-[1.02] hover:bg-[#004aad]/5'
                        : 'bg-white text-[#004aad]/30 border-[#004aad]/15 opacity-40 cursor-not-allowed'
                    }`}
                    id={`subject-banner-${sub.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-2xl ${unlocked ? 'bg-[#004aad] text-white' : 'bg-[#004aad]/10 text-[#004aad]/30'}`}>
                        <BookOpen size={22} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-md font-black uppercase tracking-wide leading-tight">{sub.name}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 ${unlocked ? 'text-[#004aad]/70' : 'text-[#004aad]/40'}`}>
                          {unlocked ? `${getSubjectCompletionPercent(sub.id)}% Completed` : 'Access Restricted'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {unlocked ? (
                        <div className="w-8 h-8 rounded-full border-2 border-[#004aad] flex items-center justify-center font-black">
                          &rarr;
                        </div>
                      ) : (
                        <Lock size={16} className="text-[#004aad]/40" />
                      )}
                    </div>
                  </div>
                );
              })}

              {classSubjects.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-[#004aad]/20 rounded-3xl">
                  <p className="text-[#004aad]/50 font-bold uppercase tracking-wider text-xs">No subjects created for this class yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SCREEN 3: SUBJECT CONTENT PAGE */}
        {currentScreen === 'content' && (
          <div className="space-y-8 animate-fade-in" id="screen-content-container">
            {/* Header with back navigation */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentScreen('subjects')}
                className="p-2 border-2 border-[#004aad] hover:bg-[#004aad] hover:text-white text-[#004aad] rounded-full transition-all cursor-pointer"
                id="back-to-subjects-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#004aad]/60">Subject: {selectedSubject?.name}</span>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#004aad]">Lectures & Study Notes</h2>
              </div>
            </div>

            {/* Custom Tab Switcher (Videos vs Notes) */}
            <div className="flex border-2 border-[#004aad] rounded-2xl overflow-hidden p-1 bg-white" id="content-tab-switcher">
              <button
                onClick={() => setActiveContentTab('videos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  activeContentTab === 'videos'
                    ? 'bg-[#004aad] text-white rounded-xl'
                    : 'bg-white text-[#004aad] hover:bg-[#004aad]/5'
                }`}
              >
                <Play size={14} className="stroke-[2.5]" />
                <span>Video Lectures</span>
              </button>
              <button
                onClick={() => setActiveContentTab('notes')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  activeContentTab === 'notes'
                    ? 'bg-[#004aad] text-white rounded-xl'
                    : 'bg-white text-[#004aad] hover:bg-[#004aad]/5'
                }`}
              >
                <FileText size={14} className="stroke-[2.5]" />
                <span>Study Notes</span>
              </button>
            </div>

            {/* TAB CONTENT: VIDEOS */}
            {activeContentTab === 'videos' && (
              <div className="space-y-6" id="videos-section">
                {subjectVideos.map((vid) => {
                  const completed = isItemCompleted(vid.id);
                  return (
                    <div 
                      key={vid.id}
                      className="bg-white border-2 border-[#004aad]/20 rounded-3xl p-5 hover:border-[#004aad] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="bg-[#004aad] text-white w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                          <Play size={20} fill="currentColor" className="text-white ml-0.5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wide leading-tight">{vid.title}</h4>
                          <p className="text-xs text-[#004aad]/70 mt-1 font-semibold leading-relaxed">{vid.description || 'No description provided.'}</p>
                          {completed && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded">
                              <Check size={10} className="stroke-[3]" /> Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setActiveVideo(vid)}
                          className="px-4 py-2 bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Play Video
                        </button>
                        
                        {!completed && (
                          <button
                            onClick={() => handleMarkComplete(vid.id, 'video')}
                            className="px-4 py-2 border-2 border-[#004aad] text-[#004aad] hover:bg-[#004aad]/5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                            disabled={actionLoading === vid.id}
                          >
                            {actionLoading === vid.id ? 'Saving...' : 'Mark Done'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {subjectVideos.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-[#004aad]/10 rounded-3xl">
                    <p className="text-[#004aad]/50 font-bold uppercase tracking-wider text-xs">No video lectures uploaded yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: NOTES */}
            {activeContentTab === 'notes' && (
              <div className="space-y-6" id="notes-section">
                {subjectNotes.map((note) => {
                  const completed = isItemCompleted(note.id);
                  return (
                    <div 
                      key={note.id}
                      className="bg-white border-2 border-[#004aad]/20 rounded-3xl p-5 hover:border-[#004aad] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="bg-[#004aad]/10 text-[#004aad] w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 border-[#004aad]">
                          <FileText size={20} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wide leading-tight">{note.title}</h4>
                          <p className="text-xs text-[#004aad]/70 mt-1 font-semibold">
                            Format: <span className="uppercase">{note.fileType || 'PDF'}</span> • Size: {note.size ? `${(note.size / (1024 * 1024)).toFixed(2)} MB` : 'Secure Online View'}
                          </p>
                          {completed && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded">
                              <Check size={10} className="stroke-[3]" /> Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => window.open(api.getFileUrl(note.id), '_blank')}
                          className="px-4 py-2 bg-[#004aad] hover:bg-[#004aad]/90 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          View Note
                        </button>

                        {!completed && (
                          <button
                            onClick={() => handleMarkComplete(note.id, 'note')}
                            className="px-4 py-2 border-2 border-[#004aad] text-[#004aad] hover:bg-[#004aad]/5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center"
                            disabled={actionLoading === note.id}
                          >
                            {actionLoading === note.id ? 'Saving...' : 'Mark Done'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {subjectNotes.length === 0 && (
                  <div className="py-12 text-center border-2 border-dashed border-[#004aad]/10 rounded-3xl">
                    <p className="text-[#004aad]/50 font-bold uppercase tracking-wider text-xs">No syllabus notes uploaded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCREEN 4: PROGRESS REPORT PAGE */}
        {currentScreen === 'progress' && (
          <div className="space-y-8 animate-fade-in" id="screen-progress-container">
            <div className="space-y-2 text-center sm:text-left">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#004aad]">My Learning Progress</h2>
              <p className="text-xs text-[#004aad]/70 font-semibold">Track your curriculum completion score and course achievements.</p>
            </div>

            {/* Overall Ring Indicator Section */}
            <div className="bg-white border-2 border-[#004aad] p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8" id="overall-completion-card">
              <div className="text-center md:text-left space-y-3">
                <span className="bg-[#facc15] text-[#004aad] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  Level {user.level || 1} Student Status
                </span>
                <h3 className="text-2xl font-black uppercase tracking-wide leading-tight">Syllabus Master</h3>
                <p className="text-xs text-[#004aad]/70 font-semibold max-w-sm">
                  You are making great progress! Continue viewing your lectures and notes to gain additional learning points.
                </p>
                <div className="flex items-center gap-2 text-xs font-black text-[#eab308]">
                  <Flame size={16} fill="currentColor" />
                  <span>Streak: {user.streakCount || 0} Days Running</span>
                </div>
              </div>

              {/* Graphical Circular Progress Indicator strictly using white, blue, and yellow */}
              <div className="relative w-36 h-36 flex items-center justify-center shrink-0" id="progress-circle">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#004aad"
                    strokeWidth="10"
                    fill="transparent"
                    className="opacity-10"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    stroke="#004aad"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - overallProgressPercent / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black leading-none font-mono">{overallProgressPercent}%</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#004aad]/60 mt-1">Covered</span>
                </div>
              </div>
            </div>

            {/* Subject-Wise Simple Bar Breakdown */}
            <div className="bg-white border-2 border-[#004aad]/20 p-6 rounded-3xl space-y-5" id="subject-breakdown-card">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#004aad]">Subject Wise Breakdown</h3>
              
              <div className="space-y-4">
                {enrolledSubjects.map((sub) => {
                  const percent = getSubjectCompletionPercent(sub.id);
                  return (
                    <div key={sub.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-black uppercase tracking-wide">{sub.name}</span>
                        <span className="font-mono font-black">{percent}%</span>
                      </div>
                      <div className="w-full bg-[#004aad]/10 h-3.5 rounded-full overflow-hidden border border-[#004aad]/5">
                        <div 
                          className="bg-[#004aad] h-full rounded-full transition-all duration-500 relative"
                          style={{ width: `${percent}%` }}
                        >
                          {/* Highlight milestones/badges on the bar in yellow */}
                          {percent === 100 && (
                            <div className="absolute right-1.5 top-0.5 w-2.5 h-2.5 rounded-full bg-[#facc15]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {enrolledSubjects.length === 0 && (
                  <p className="text-xs text-[#004aad]/40 font-bold uppercase tracking-wider py-4 text-center">No subjects are unlocked yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* SINGLE EMBEDDED MODAL PLAYER OVERLAYS (STRICTLY CONFORMING TO 3-COLOR RULE) */}
      {activeVideo && (
        <div className="fixed inset-0 bg-[#004aad]/95 z-50 flex items-center justify-center p-4 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl border-4 border-[#004aad] shadow-2xl flex flex-col space-y-4">
            <div className="flex justify-between items-center border-b-2 border-[#004aad]/10 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-[#004aad]">{activeVideo.title}</h3>
              <button 
                onClick={() => setActiveVideo(null)}
                className="px-3.5 py-1.5 bg-[#004aad] text-white hover:bg-[#004aad]/80 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Close Playback
              </button>
            </div>
            
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border-2 border-[#004aad]/20">
              {activeVideo.youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={getYoutubeEmbedUrl(activeVideo.youtubeId)}
                  title={activeVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-6 text-center space-y-2">
                  <Play size={32} />
                  <p className="text-xs font-black tracking-wider uppercase">Direct stream url not compatible inside frames.</p>
                </div>
              )}
            </div>

            <p className="text-xs text-[#004aad] font-semibold leading-relaxed">
              {activeVideo.description || 'Watch the lecture completely, take notes, and mark it complete to increase your percentage score.'}
            </p>
          </div>
        </div>
      )}

      {/* FOOTER BAR (Classes/Home & Progress Switcher) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#004aad]/10 z-40" id="portal-bottom-tabs">
        {/* Classes Screen bottom-only slim social accounts footer */}
        {currentScreen === 'classes' && (
          <div className="bg-[#004aad] text-white py-2.5 px-6 flex justify-center items-center gap-6 border-b border-[#004aad]/20" id="classes-social-footer">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#facc15] transition-colors"><Facebook size={16} /></a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#facc15] transition-colors"><Instagram size={16} /></a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#facc15] transition-colors"><Youtube size={16} /></a>
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="hover:text-[#facc15] transition-colors"><MessageSquare size={16} /></a>
          </div>
        )}

        {/* Home & Progress Bottom Navigation Bar with 3-color theme */}
        <div className="max-w-md mx-auto h-16 flex items-center justify-around px-4">
          <button
            onClick={() => {
              if (currentScreen !== 'classes' && currentScreen !== 'subjects' && currentScreen !== 'content') {
                setCurrentScreen('classes');
              } else {
                setCurrentScreen('classes');
              }
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-all cursor-pointer ${
              currentScreen === 'classes' || currentScreen === 'subjects' || currentScreen === 'content'
                ? 'text-[#004aad] scale-105 font-black'
                : 'text-[#004aad]/40 hover:text-[#004aad]'
            }`}
          >
            <BookOpen size={18} className="stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Home (Classes)</span>
          </button>

          <button
            onClick={() => setCurrentScreen('progress')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-all cursor-pointer ${
              currentScreen === 'progress'
                ? 'text-[#004aad] scale-105 font-black'
                : 'text-[#004aad]/40 hover:text-[#004aad]'
            }`}
          >
            <Trophy size={18} className="stroke-[2.5]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Progress</span>
          </button>
        </div>
      </footer>

    </div>
  );
}
