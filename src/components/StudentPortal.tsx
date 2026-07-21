import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom, Subject, Chapter, Video, Note, Progress } from '../types';
import { topicStorage } from '../utils/topicStorage';
import { 
  Lock, BookOpen, Play, FileText, ArrowLeft, Trophy, LogOut, 
  Facebook, Instagram, Youtube, MessageSquare, Flame, Check, HelpCircle, ChevronDown, ChevronRight,
  Sparkles
} from 'lucide-react';
import AiChatbot from './AiChatbot';
import EasyAssistant from './EasyAssistant';

interface StudentPortalProps {
  user: User;
  onLogout: () => void;
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
  logoUrl?: string;
}

interface Topic {
  id: string;
  chapterId: string;
  title: string;
  order: number;
}

export default function StudentPortal({ user, onLogout, onXPUpdated, logoUrl }: StudentPortalProps) {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  // Navigation Screens
  // classes -> subjects -> chapters -> topics -> topicDetail -> progress
  const [currentScreen, setCurrentScreen] = useState<'classes' | 'subjects' | 'chapters' | 'topics' | 'topicDetail' | 'progress'>('classes');
  
  // Selection States
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  
  // Topic Detail Screen active sub-view/tile
  const [activeTile, setActiveTile] = useState<'video' | 'mcq' | 'pastPapers' | 'notes' | 'important' | 'feedback' | null>(null);

  // Database states
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [rankings, setRankings] = useState<any[]>([]);
  const [showFullLeaderboardModal, setShowFullLeaderboardModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [, forceUpdate] = useState(0);

  // Interactive Content States
  const [completedKeys, setCompletedKeys] = useState<string[]>([]);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [showMcqResult, setShowMcqResult] = useState<boolean>(false);
  const [mcqCompleted, setMcqCompleted] = useState<boolean>(false);
  
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  
  const [importantChecked, setImportantChecked] = useState<Record<number, boolean>>({});

  // Locked modal popup state
  const [lockedModalMessage, setLockedModalMessage] = useState<string | null>(null);

  // History synchronization for Android Back Button and gesture behavior
  const isHistoryNavigatingRef = React.useRef(false);

  useEffect(() => {
    // Setup initial state on mount
    if (!window.history.state || window.history.state.screen !== 'classes') {
      window.history.replaceState({ screen: 'classes' }, '');
    }
  }, []);

  useEffect(() => {
    if (isHistoryNavigatingRef.current) {
      isHistoryNavigatingRef.current = false;
      return;
    }
    // Push a new history entry whenever currentScreen changes, unless it matches the top of the history stack
    if (window.history.state?.screen !== currentScreen) {
      window.history.pushState({ screen: currentScreen }, '');
    }
  }, [currentScreen]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetScreen = event.state?.screen || 'classes';
      isHistoryNavigatingRef.current = true;
      
      setFeedbackSuccess(false);
      setFeedbackText('');
      setShowMcqResult(false);
      setMcqAnswers({});
      setImportantChecked({});

      if (targetScreen === 'classes') {
        setSelectedSubject(null);
        setSelectedChapter(null);
        setSelectedTopic(null);
        setActiveTile(null);
        setCurrentScreen('classes');
      } else if (targetScreen === 'subjects') {
        setSelectedChapter(null);
        setSelectedTopic(null);
        setActiveTile(null);
        setCurrentScreen('subjects');
      } else if (targetScreen === 'chapters') {
        setSelectedTopic(null);
        setActiveTile(null);
        setCurrentScreen('chapters');
      } else if (targetScreen === 'topics') {
        setActiveTile(null);
        setCurrentScreen('topics');
      } else if (targetScreen === 'topicDetail') {
        setCurrentScreen('topicDetail');
      } else if (targetScreen === 'progress') {
        setCurrentScreen('progress');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigation History list to easily handle Back Arrow consistently
  const handleBack = () => {
    setFeedbackSuccess(false);
    setFeedbackText('');
    setShowMcqResult(false);
    setMcqAnswers({});
    setImportantChecked({});

    if (currentScreen !== 'classes') {
      window.history.back();
    }
  };

  // Load completed items from localstorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`taclms_completed_${user.id}`);
      if (saved) {
        setCompletedKeys(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [user.id]);

  // Save to localstorage and trigger completion update
  const markTileComplete = (tileType: string, score?: number, maxScore?: number) => {
    if (!selectedTopic) return;
    const key = `${selectedTopic.id}-${tileType}`;
    if (completedKeys.includes(key)) return;

    const updated = [...completedKeys, key];
    setCompletedKeys(updated);
    try {
      localStorage.setItem(`taclms_completed_${user.id}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Award XP
    api.markAsCompleted(selectedTopic.id, tileType, score, maxScore).then((res) => {
      onXPUpdated(user.xp + 15, user.level, false);
      // Reload rankings in real-time
      api.getRankings().then(rankRes => {
        if (rankRes && rankRes.rankings) {
          setRankings(rankRes.rankings);
        }
      }).catch(err => console.error('Failed to update rankings in real-time:', err));
    }).catch(() => {
      // Fallback local update if API route isn't fully configured
      onXPUpdated(user.xp + 15, user.level, false);
    });
  };

  // Load all LMS Data
  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      api.getClasses(),
      api.getSubjects(),
      api.getChapters(),
      api.getVideos(),
      api.getNotes(),
      api.getProgress(),
      api.getRankings()
    ]).then(([cls, subs, chaps, vids, nts, prog, rankRes]) => {
      setClasses(cls || []);
      setSubjects(subs || []);
      setChapters(chaps || []);
      setVideos(vids || []);
      setNotes(nts || []);
      setProgress(prog || []);
      setRankings(rankRes?.rankings || []);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching LMS student data:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAllData();
    const unsubscribe = topicStorage.subscribe(() => {
      forceUpdate(f => f + 1);
    });
    return unsubscribe;
  }, [user.id]);

  // Universal Lock Logic helper functions
  const isClassUnlocked = (classId: string) => {
    return user.assignedClasses?.includes(classId) || false;
  };

  const isSubjectUnlocked = (sub: Subject) => {
    return isClassUnlocked(sub.classId);
  };

  const isChapterUnlocked = (ch: Chapter) => {
    const parentSub = subjects.find(s => s.id === ch.subjectId);
    if (!parentSub || !isSubjectUnlocked(parentSub)) return false;
    
    // Sort chapters for the subject and unlock first two, lock others for Demo/Future-preview
    const subjectChaps = chapters.filter(c => c.subjectId === ch.subjectId).sort((a, b) => a.order - b.order);
    const index = subjectChaps.findIndex(c => c.id === ch.id);
    return index <= 1; // Unlocked for index 0 and 1
  };

  const isTopicUnlocked = (topic: Topic) => {
    if (!selectedChapter || !isChapterUnlocked(selectedChapter)) return false;
    return topic.order <= 2; // Unlocked for Topic 1 and 2, Topic 3 is locked
  };

  // Parse custom YouTube URLs to safe embed links
  const getEmbedUrl = (url?: string): string => {
    if (!url) return "https://www.youtube.com/embed/yH_P8QvS_OI";
    if (url.includes("/embed/")) return url;
    
    try {
      let videoId = "";
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0].split("&")[0];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1].split("?")[0];
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      console.error("Error parsing YouTube URL", e);
    }
    return url;
  };

  // Load custom or default topics for chapter from our topicStorage manager
  const getTopicsForChapter = (chapterId: string): Topic[] => {
    return topicStorage.getTopicsForChapter(chapterId);
  };

  // Progress calculator values
  const getTopicProgressPercent = (topicId: string): number => {
    const tiles = ['video', 'mcq', 'pastPapers', 'notes', 'important', 'feedback'];
    const done = tiles.filter(tile => completedKeys.includes(`${topicId}-${tile}`)).length;
    return Math.round((done / tiles.length) * 100);
  };

  const getChapterProgressPercent = (chapId: string): number => {
    const tList = getTopicsForChapter(chapId);
    const totalPercent = tList.reduce((acc, t) => acc + getTopicProgressPercent(t.id), 0);
    return Math.round(totalPercent / tList.length);
  };

  const getSubjectProgressPercent = (subId: string): number => {
    const subChaps = chapters.filter(c => c.subjectId === subId);
    if (subChaps.length === 0) return 0;
    const totalPercent = subChaps.reduce((acc, c) => acc + getChapterProgressPercent(c.id), 0);
    return Math.round(totalPercent / subChaps.length);
  };

  const getOverallProgressPercent = (): number => {
    const activeClasses = classes.filter(c => isClassUnlocked(c.id));
    if (activeClasses.length === 0) return 0;
    
    let totalPercent = 0;
    let count = 0;
    activeClasses.forEach(cls => {
      const clsSubs = subjects.filter(s => s.classId === cls.id);
      clsSubs.forEach(sub => {
        totalPercent += getSubjectProgressPercent(sub.id);
        count++;
      });
    });
    return count > 0 ? Math.round(totalPercent / count) : 0;
  };

  // Dynamic content loaded straight from our topicStorage manager (seeding is fallback automatic)
  const getMCQsForActiveTopic = () => {
    if (!selectedTopic) return [];
    const content = topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name);
    return content.mcqs || [];
  };

  const getNotesForActiveTopic = () => {
    if (!selectedTopic) return '';
    const content = topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name);
    return content.notesText || '';
  };

  const getPastPapersForActiveTopic = () => {
    if (!selectedTopic) return [];
    const content = topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name);
    return content.pastPapers || [];
  };

  const getImportantPointsForActiveTopic = () => {
    if (!selectedTopic) return [];
    const content = topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name);
    return content.importantPoints || [];
  };

  // Screen-specific render elements
  const currentClassSubjects = subjects.filter(s => s.classId === selectedClass?.id);
  const currentSubjectChapters = chapters.filter(c => c.subjectId === selectedSubject?.id).sort((a, b) => a.order - b.order);
  const currentChapterTopics = selectedChapter ? getTopicsForChapter(selectedChapter.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center" id="portal-loading-container">
        <div className="w-16 h-16 border-4 border-[#00175c] border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-[#00175c] font-black tracking-widest text-sm uppercase">Loading Your Classes...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between text-[#00175c] font-sans selection:bg-[#00175c] selection:text-white relative" id="student-portal-root">
      
      {/* HEADER SECTION (Minimal, Elegant, 3-color matching) */}
      <header className="bg-white border-b-2 border-[#00175c] py-4 px-6 flex justify-between items-center sticky top-0 z-30" id="portal-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentScreen('classes')} 
            className="w-10 h-10 bg-white border-2 border-[#00175c] p-0.5 rounded-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-all overflow-hidden shadow-sm"
            id="portal-logo-home"
          >
            <img src={logoUrl || "/logo.svg"} className="w-full h-full object-contain" alt="The Ali's Collegiate Logo" />
          </button>
          <div>
            <h1 className="font-black text-sm tracking-tight leading-none uppercase">
              THE ALI'S <span className="border-b-2 border-[#facc15]">COLLEGIATE</span>
            </h1>
            <p className="text-[10px] text-[#00175c]/60 font-bold uppercase tracking-widest leading-none mt-1">LMS Student Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-[#00175c]/5 border border-[#00175c]/20 px-3 py-1.5 rounded-full" id="user-info-pill">
            <Flame size={14} className="text-[#facc15]" fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-wider">{user.name}</span>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            id="portal-header-logout"
          >
            <LogOut size={12} className="stroke-[2.5]" />
            <span className="hidden xs:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* VIEWPORT AREA (Strict 3-Color Constraint) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-6 pb-28" id="portal-viewport">
        
        {/* SCREEN 1: CLASSES PAGE */}
        {currentScreen === 'classes' && (
          <div className="space-y-6 animate-fade-in" id="screen-classes-container">
            {/* Minimal top introduction banner - chota size as requested */}
            <div className="bg-[#00175c] text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-2 border-[#00175c] shadow-md shadow-[#00175c]/10" id="portal-introduction-banner">
              <div className="flex items-center gap-3">
                <div className="bg-[#facc15] text-[#00175c] p-2 rounded-xl shrink-0">
                  <Flame size={16} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest leading-none">The Ali's Collegiate</h3>
                  <p className="text-[11px] text-white/90 font-medium mt-1">Step-by-step simplified LMS curriculum dashboard. Follow unlocked blue paths below to study.</p>
                </div>
              </div>
              <span className="bg-[#facc15] text-[#00175c] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0">
                Active Session
              </span>
            </div>



            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-[#00175c]">Select Your Class</h2>
              <p className="text-xs text-[#00175c]/60 font-semibold uppercase tracking-wider">Access books, past papers and detailed lecture videos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="classes-grid">
              {classes.map((cls) => {
                const unlocked = isClassUnlocked(cls.id);
                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedClass(cls);
                        setCurrentScreen('subjects');
                      } else {
                        setLockedModalMessage("This class is locked for you. Please contact the admin to unlock it.");
                      }
                    }}
                    className="relative p-6 rounded-2xl border-4 bg-[#00175c] text-white border-[#00175c] hover:scale-[1.01] shadow-lg shadow-[#00175c]/10 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                    id={`class-banner-${cls.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#facc15] text-[#00175c]">
                        Class Level
                      </span>
                      {!unlocked && (
                        <div className="bg-[#facc15] text-[#00175c] p-1.5 rounded-full shadow-md">
                          <Lock size={12} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-black uppercase tracking-wide leading-tight">{cls.name}</h3>
                      <p className="text-xs mt-1 font-semibold text-white/80">
                        {cls.description}
                      </p>
                    </div>

                    <div className="flex justify-end items-center mt-2">
                      {unlocked && (
                        <div className="bg-[#facc15] text-[#00175c] w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md shadow-[#facc15]/30">
                          &rarr;
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 2: SUBJECTS PAGE */}
        {currentScreen === 'subjects' && (
          <div className="space-y-6 animate-fade-in" id="screen-subjects-container">
            <div className="flex items-center gap-3 border-b-2 border-[#00175c]/10 pb-4">
              <button 
                onClick={handleBack}
                className="p-1.5 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white text-[#00175c] rounded-full transition-all cursor-pointer"
                id="back-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00175c]/60">Class: {selectedClass?.name}</span>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#00175c]">Study Subjects</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="subjects-grid">
              {currentClassSubjects.map((sub) => {
                const unlocked = isSubjectUnlocked(sub);
                const progressVal = getSubjectProgressPercent(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedSubject(sub);
                        setCurrentScreen('chapters');
                      } else {
                        setLockedModalMessage("This subject is locked for you. Please contact the admin to unlock it.");
                      }
                    }}
                    className="relative p-5 rounded-2xl border-4 bg-white text-[#00175c] border-[#00175c] hover:bg-[#00175c]/5 hover:scale-[1.01] shadow-md cursor-pointer transition-all duration-300 flex justify-between items-center"
                    id={`subject-banner-${sub.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-[#00175c] text-white">
                        <BookOpen size={20} className="stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-md font-black uppercase tracking-wide leading-tight">{sub.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 bg-[#00175c]/10 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#facc15] h-full" style={{ width: `${progressVal}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-[#00175c]/60">{progressVal}% Done</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {unlocked ? (
                        <div className="w-7 h-7 rounded-full border-2 border-[#00175c] flex items-center justify-center font-black text-xs">
                          &rarr;
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 text-white bg-[#00175c] p-1.5 rounded-full shadow-md">
                          <Lock size={12} className="stroke-[2.5]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 3: CHAPTERS PAGE */}
        {currentScreen === 'chapters' && (
          <div className="space-y-6 animate-fade-in" id="screen-chapters-container">
            <div className="flex items-center gap-3 border-b-2 border-[#00175c]/10 pb-4">
              <button 
                onClick={handleBack}
                className="p-1.5 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white text-[#00175c] rounded-full transition-all cursor-pointer"
                id="back-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00175c]/60">Subject: {selectedSubject?.name}</span>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#00175c]">Select Chapter</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="chapters-grid">
              {currentSubjectChapters.map((chap, idx) => {
                const unlocked = isChapterUnlocked(chap);
                const progressVal = getChapterProgressPercent(chap.id);
                return (
                  <div
                    key={chap.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedChapter(chap);
                        setCurrentScreen('topics');
                      } else {
                        setLockedModalMessage("This chapter is locked for you. Please contact the admin to unlock it.");
                      }
                    }}
                    className="relative p-5 rounded-2xl border-4 bg-white text-[#00175c] border-[#00175c] hover:bg-[#00175c]/5 hover:scale-[1.01] shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between"
                    id={`chapter-banner-${chap.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#00175c]/10 text-[#00175c]">
                        Chapter {idx + 1}
                      </span>
                    </div>

                    <h3 className="text-md font-black uppercase tracking-wide mt-3 leading-snug">{chap.title}</h3>

                    {/* Yellow progress fill on the chapter banner */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                        <span>Chapter Progress</span>
                        <span>{progressVal}%</span>
                      </div>
                      <div className="w-full bg-[#00175c]/10 h-3 rounded-full overflow-hidden border border-[#00175c]/5">
                        <div 
                          className="bg-[#facc15] h-full rounded-full transition-all duration-300" 
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </div>

                    {!unlocked && (
                      <div className="absolute top-3 right-3 text-white bg-[#00175c] p-1.5 rounded-full shadow-md">
                        <Lock size={12} className="stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 4: TOPICS PAGE */}
        {currentScreen === 'topics' && (
          <div className="space-y-6 animate-fade-in" id="screen-topics-container">
            <div className="flex items-center gap-3 border-b-2 border-[#00175c]/10 pb-4">
              <button 
                onClick={handleBack}
                className="p-1.5 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white text-[#00175c] rounded-full transition-all cursor-pointer"
                id="back-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00175c]/60">Chapter: {selectedChapter?.title}</span>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#00175c]">Select Lecture Topic</h2>
              </div>
            </div>

            <div className="space-y-3" id="topics-list">
              {currentChapterTopics.map((topic) => {
                const unlocked = isTopicUnlocked(topic);
                const progressVal = getTopicProgressPercent(topic.id);
                return (
                  <div
                    key={topic.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedTopic(topic);
                        setCurrentScreen('topicDetail');
                      } else {
                        setLockedModalMessage("This topic is locked for you. Please contact the admin to unlock it.");
                      }
                    }}
                    className="relative p-5 rounded-2xl border-4 bg-white text-[#00175c] border-[#00175c] hover:bg-[#00175c]/5 hover:scale-[1.01] shadow-md cursor-pointer transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    id={`topic-banner-${topic.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#00175c] text-white">
                        <Play size={18} fill="currentColor" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide leading-tight">{topic.title}</h3>
                        <span className="text-[9px] font-black uppercase text-[#eab308] mt-1 block">
                          {progressVal === 100 ? '⭐ Completed Topic' : `${progressVal}% Completed`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="w-16 bg-[#00175c]/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#facc15] h-full" style={{ width: `${progressVal}%` }} />
                      </div>
                      <div className="w-7 h-7 rounded-full border-2 border-[#00175c] flex items-center justify-center font-black text-xs">
                        &rarr;
                      </div>
                    </div>

                    {!unlocked && (
                      <div className="absolute top-3 right-3 text-white bg-[#00175c] p-1.5 rounded-full shadow-md">
                        <Lock size={12} className="stroke-[2.5]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SCREEN 5: TOPIC DETAIL PAGE WITH 6 TILES */}
        {currentScreen === 'topicDetail' && selectedTopic && (
          <div className="space-y-6 animate-fade-in" id="screen-topic-detail-container">
            <div className="flex items-center gap-3 border-b-2 border-[#00175c]/10 pb-4">
              <button 
                onClick={handleBack}
                className="p-1.5 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white text-[#00175c] rounded-full transition-all cursor-pointer"
                id="back-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
              </button>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#00175c]/60">Topic: {selectedTopic.title}</span>
                <h2 className="text-lg font-black uppercase tracking-tight text-[#00175c]">Study Resource Panel</h2>
              </div>
            </div>

            {/* Exactly 6 Tile Grid at the top of Topic Detail Page */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3" id="topic-detail-tiles">
              {[
                { type: 'video' as const, label: 'Video Lecture', icon: Play },
                { type: 'mcq' as const, label: 'MCQs Quiz', icon: HelpCircle },
                { type: 'pastPapers' as const, label: 'Past Papers', icon: FileText },
                { type: 'notes' as const, label: 'Written Notes', icon: FileText },
                { type: 'important' as const, label: 'Important Qs', icon: BookOpen },
                { type: 'feedback' as const, label: 'Ask Feedback', icon: MessageSquare },
              ].map((tile) => {
                const isCompleted = completedKeys.includes(`${selectedTopic.id}-${tile.type}`);
                const isActive = activeTile === tile.type;
                const TileIcon = tile.icon;

                return (
                  <button
                    key={tile.type}
                    onClick={() => {
                      setActiveTile(tile.type);
                    }}
                    className={`p-4 rounded-xl border-4 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 cursor-pointer ${
                      isActive 
                        ? 'bg-[#00175c] text-white border-[#00175c] shadow-lg scale-95' 
                        : isCompleted
                          ? 'bg-white text-[#00175c] border-[#facc15] hover:bg-[#00175c]/5'
                          : 'bg-white text-[#00175c] border-[#00175c] hover:bg-[#00175c]/5'
                    }`}
                  >
                    <TileIcon size={20} className={isActive ? "text-[#facc15]" : "text-[#00175c]"} fill={isCompleted ? "#facc15" : "none"} />
                    <span className="text-[11px] font-black uppercase tracking-wider">{tile.label}</span>
                    {isCompleted && (
                      <span className="bg-[#facc15] text-[#00175c] text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full mt-1">
                        Completed
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Focused sub-view panel after tapping any tile */}
            <div className="bg-white border-4 border-[#00175c] rounded-2xl p-6 min-h-[250px]" id="tile-content-viewer">
              
              {!activeTile && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
                  <BookOpen size={40} className="text-[#00175c] animate-bounce" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#00175c]">Select Study Tile</h3>
                  <p className="text-xs text-[#00175c]/60 max-w-sm font-semibold">Click any of the 6 large study resource panels above to load video lectures, notes, MCQs and exam guidelines.</p>
                </div>
              )}

              {/* 1. VIDEO VIEW */}
              {activeTile === 'video' && (
                <div className="space-y-4 animate-fade-in" id="focused-video-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">Video Lecture Player</h3>
                    <button 
                      onClick={() => markTileComplete('video')}
                      className="px-3 py-1 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Mark Video Complete
                    </button>
                  </div>
                  
                  {/* YouTube Embed Player */}
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border-2 border-[#00175c]">
                    <iframe
                      className="w-full h-full"
                      src={getEmbedUrl(topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name).videoUrl)}
                      title={topicStorage.getTopicContent(selectedTopic.id, selectedSubject?.name).videoTitle || "Lecture Video"}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-[11px] text-[#00175c]/80 font-semibold italic">Watch this complete Board curriculum module, summarize key calculations in your worksheet, and mark completed.</p>
                </div>
              )}

              {/* 2. MCQ VIEW */}
              {activeTile === 'mcq' && (
                <div className="space-y-4 animate-fade-in" id="focused-mcq-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">MCQ Practice Quiz</h3>
                    <span className="bg-[#facc15] text-[#00175c] text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      +15 XP Reward
                    </span>
                  </div>

                  <div className="space-y-4">
                    {getMCQsForActiveTopic().map((q, idx) => {
                      const isCorrect = q.correct;
                      const selected = mcqAnswers[q.id];
                      return (
                        <div key={q.id} className="space-y-2 border-b border-[#00175c]/5 pb-3">
                          <h4 className="text-xs font-black uppercase text-[#00175c] leading-snug">Q{idx+1}: {q.q}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, oIdx) => {
                              const isThisSelected = selected === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => {
                                    if (showMcqResult) return;
                                    setMcqAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                                  }}
                                  className={`p-2.5 rounded-lg border-2 text-left text-xs font-semibold cursor-pointer transition-all ${
                                    isThisSelected 
                                      ? 'bg-[#00175c] text-white border-[#00175c]' 
                                      : 'bg-white text-[#00175c] border-[#00175c]/20 hover:bg-[#00175c]/5'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {showMcqResult && (
                            <div className="bg-[#facc15]/10 border border-[#facc15] p-2 rounded-lg text-[10px] font-semibold">
                              <span className="text-[#00175c] font-black">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {!showMcqResult ? (
                      <button
                        onClick={() => {
                          const activeMcqs = getMCQsForActiveTopic();
                          if (Object.keys(mcqAnswers).length < activeMcqs.length) {
                            alert(`Please answer all ${activeMcqs.length} questions first.`);
                            return;
                          }
                          
                          // Calculate correct answers score
                          let score = 0;
                          activeMcqs.forEach(q => {
                            if (mcqAnswers[q.id] === q.correct) {
                              score++;
                            }
                          });
                          
                          setShowMcqResult(true);
                          markTileComplete('mcq', score, activeMcqs.length);
                        }}
                        className="w-full bg-[#00175c] text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#00175c]/90 transition-all cursor-pointer"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <div className="text-center py-2 space-y-2">
                        <p className="text-xs font-black uppercase text-[#eab308]">⭐ MCQs Completed! Points Awarded Successfully.</p>
                        <button
                          onClick={() => {
                            setShowMcqResult(false);
                            setMcqAnswers({});
                          }}
                          className="px-4 py-1.5 border-2 border-[#00175c] text-xs font-black uppercase tracking-wider rounded-full"
                        >
                          Retry Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. PAST PAPERS VIEW */}
              {activeTile === 'pastPapers' && (
                <div className="space-y-4 animate-fade-in" id="focused-pastpapers-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">Past Exam Papers</h3>
                    <button 
                      onClick={() => markTileComplete('pastPapers')}
                      className="px-3 py-1 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Mark Reviewed
                    </button>
                  </div>

                  <div className="space-y-3">
                    {getPastPapersForActiveTopic().map((paper, idx) => (
                      <div key={idx} className="border-2 border-[#00175c] rounded-xl p-3 bg-white space-y-1">
                        <span className="bg-[#facc15] text-[#00175c] text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                          {paper.year}
                        </span>
                        <p className="text-xs text-[#00175c] font-bold leading-relaxed pt-1">{paper.q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. WRITTEN NOTES VIEW */}
              {activeTile === 'notes' && (
                <div className="space-y-4 animate-fade-in" id="focused-notes-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">Written Syllabus Notes</h3>
                    <button 
                      onClick={() => markTileComplete('notes')}
                      className="px-3 py-1 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Mark Notes Read
                    </button>
                  </div>

                  <div className="border-2 border-[#00175c]/20 p-4 rounded-xl bg-[#00175c]/5 text-xs font-semibold leading-relaxed whitespace-pre-wrap font-mono text-[#00175c]">
                    {getNotesForActiveTopic()}
                  </div>
                </div>
              )}

              {/* 5. IMPORTANT QUESTIONS VIEW */}
              {activeTile === 'important' && (
                <div className="space-y-4 animate-fade-in" id="focused-important-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">Teacher's High-Yield Bulletpoints</h3>
                    <button 
                      onClick={() => markTileComplete('important')}
                      className="px-3 py-1 border-2 border-[#00175c] hover:bg-[#00175c] hover:text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Mark All Checklist Done
                    </button>
                  </div>

                  <div className="space-y-2">
                    {getImportantPointsForActiveTopic().map((pt, idx) => (
                      <label 
                        key={idx} 
                        className="flex items-start gap-3 border border-[#00175c]/10 p-3 rounded-lg hover:bg-[#00175c]/5 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={!!importantChecked[idx]}
                          onChange={(e) => {
                            setImportantChecked(prev => ({ ...prev, [idx]: e.target.checked }));
                            if (Object.keys(importantChecked).length >= 3) {
                              markTileComplete('important');
                            }
                          }}
                          className="mt-0.5 text-[#00175c] border-[#00175c] rounded focus:ring-0 w-4 h-4"
                        />
                        <span className="text-xs font-semibold leading-normal">{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. ASK FEEDBACK / ASK QUESTION */}
              {activeTile === 'feedback' && (
                <div className="space-y-4 animate-fade-in" id="focused-feedback-view">
                  <div className="flex justify-between items-center border-b border-[#00175c]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider">Instant Doubt Feedback Box</h3>
                    <span className="bg-[#facc15] text-[#00175c] text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      Teacher Assisted
                    </span>
                  </div>

                  {!feedbackSuccess ? (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#00175c]/70 leading-normal">Submit your specific questions, doubts or formatting suggestions about this lecture. Our headmasters will review your feedback and update your grade log.</p>
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Write your study question or lecture feedback here..."
                        rows={4}
                        className="w-full p-3 border-2 border-[#00175c] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#facc15] text-xs font-semibold placeholder:text-[#00175c]/30"
                      />
                      <button
                        onClick={async () => {
                          if (!feedbackText.trim()) return;
                          try {
                            // Automatically log query to database testimonial store so it populates Admin Inbox!
                            await api.submitTestimonial(5, `[Topic Question: ${selectedTopic.title}] ${feedbackText}`);
                          } catch (e) {
                            console.error("Failed to submit inquiry to server", e);
                          }
                          setFeedbackSuccess(true);
                          markTileComplete('feedback');
                        }}
                        className="w-full bg-[#00175c] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#00175c]/95 transition-all cursor-pointer"
                      >
                        Submit Question
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <Check size={36} className="mx-auto text-[#eab308]" />
                      <h4 className="text-xs font-black uppercase text-[#00175c]">Question Submitted Successfully!</h4>
                      <p className="text-xs font-semibold text-[#00175c]/70 max-w-sm mx-auto">Your feedback has been logged under this session. Your class teacher will review your query and coordinate with you soon.</p>
                      <button
                        onClick={() => {
                          setFeedbackSuccess(false);
                          setFeedbackText('');
                        }}
                        className="px-4 py-1.5 border-2 border-[#00175c] rounded-full text-xs font-black uppercase"
                      >
                        Send Another Query
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* SCREEN 6: PROGRESS REPORT PAGE */}
        {currentScreen === 'progress' && (
          <div className="space-y-6 animate-fade-in" id="screen-progress-container">
            <div className="text-center sm:text-left space-y-1 pb-4 border-b-2 border-[#00175c]/10">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#00175c]">Learning Analytics</h2>
              <p className="text-xs text-[#00175c]/60 font-semibold uppercase tracking-wider">Track your comprehensive board preparation metrics.</p>
            </div>

            {/* Overall ring / progress bar container strictly using white, blue and yellow */}
            <div className="bg-white border-4 border-[#00175c] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6" id="overall-analytics-card">
              <div className="text-center md:text-left space-y-2">
                <span className="bg-[#facc15] text-[#00175c] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  Level {user.level || 1} Active Scholar
                </span>
                <h3 className="text-lg font-black uppercase tracking-wide leading-none text-[#00175c]">Curriculum Master</h3>
                <p className="text-xs text-[#00175c]/70 font-semibold max-w-sm">
                  Complete your weekly syllabus tiles to unlock higher rank tiers and earn badges.
                </p>
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-black text-[#eab308]">
                  <Flame size={14} fill="currentColor" />
                  <span>Daily Learning Streak: {user.streakCount || 1} Days Active</span>
                </div>
              </div>

              {/* Graphical Circular Progress Indicator strictly using white, blue, and yellow */}
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0" id="progress-ring-graphics">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#00175c"
                    strokeWidth="8"
                    fill="transparent"
                    className="opacity-10"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    stroke="#00175c"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - getOverallProgressPercent() / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black leading-none font-mono text-[#00175c]">{getOverallProgressPercent()}%</span>
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#00175c]/60 mt-0.5">Syllabus</span>
                </div>
              </div>
            </div>

            {/* Hierarchical breakdown: Per-class -> per-subject -> per-chapter breakdown nested */}
            <div className="bg-white border-4 border-[#00175c] p-6 rounded-2xl space-y-6" id="nested-progress-breakdown">
              <h3 className="text-xs font-black uppercase tracking-widest border-b border-[#00175c]/10 pb-2">Hierarchical Progress</h3>
              
              {classes.filter(c => isClassUnlocked(c.id)).map((cls) => (
                <div key={cls.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-[#00175c]/5 pb-1">
                    <span className="bg-[#facc15] text-[#00175c] text-[8px] font-black uppercase px-2 py-0.5 rounded">
                      Class Group
                    </span>
                    <h4 className="text-sm font-black uppercase tracking-wider text-[#00175c]">{cls.name}</h4>
                  </div>

                  <div className="pl-4 space-y-4">
                    {subjects.filter(s => s.classId === cls.id).map((sub) => {
                      const subPercent = getSubjectProgressPercent(sub.id);
                      return (
                        <div key={sub.id} className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold text-[#00175c]">
                            <span className="uppercase">{sub.name} Syllabus</span>
                            <span className="font-mono">{subPercent}%</span>
                          </div>

                          {/* Subject nested progress bar */}
                          <div className="w-full bg-[#00175c]/10 h-3 rounded-full overflow-hidden border border-[#00175c]/5 relative">
                            <div 
                              className="bg-[#00175c] h-full rounded-full transition-all duration-300"
                              style={{ width: `${subPercent}%` }}
                            />
                            {/* Milestone highlights in yellow */}
                            {subPercent >= 50 && (
                              <div className="absolute left-1/2 -translate-x-1/2 top-0.5 w-2 h-2 rounded-full bg-[#facc15]" title="50% Milestone" />
                            )}
                            {subPercent === 100 && (
                              <div className="absolute right-1 top-0.5 w-2 h-2 rounded-full bg-[#facc15]" title="Complete" />
                            )}
                          </div>

                          {/* Nested chapters breakdown */}
                          <div className="pl-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {chapters.filter(c => c.subjectId === sub.id).map((chap, cIdx) => {
                              const chapPercent = getChapterProgressPercent(chap.id);
                              return (
                                <div key={chap.id} className="bg-[#00175c]/5 p-2 rounded-lg border border-[#00175c]/10 flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-[#00175c]/80 truncate">Ch {cIdx+1}: {chap.title}</span>
                                  <span className="bg-[#facc15] text-[#00175c] text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                                    {chapPercent}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Back button at the bottom of the progress screen */}
            <div className="flex justify-center pt-2 pb-6" id="progress-bottom-back-container">
              <button
                onClick={() => {
                  setCurrentScreen('classes');
                  setSelectedClass(null);
                  setSelectedSubject(null);
                  setSelectedChapter(null);
                  setSelectedTopic(null);
                  setActiveTile(null);
                }}
                className="flex items-center gap-2 px-8 py-3 border-4 border-[#00175c] bg-[#00175c] text-white hover:bg-white hover:text-[#00175c] rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95"
                id="progress-bottom-back-btn"
              >
                <ArrowLeft size={16} className="stroke-[2.5]" />
                <span>Back To Home</span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR (Social Media Icons for classes screen, bottom nav otherwise) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-[#00175c] z-40" id="portal-bottom-tabs">
        {/* Classes Screen bottom-only slim social accounts footer as specified */}
        {currentScreen === 'classes' && (
          <div className="bg-[#00175c] text-white py-3 px-6 flex justify-center items-center gap-6 border-b border-[#00175c]/20" id="classes-social-footer">
            {/* Hidden SVG Definitions for Gradients */}
            <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0 }}>
              <defs>
                <linearGradient id="instagram-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fdf497" />
                  <stop offset="28%" stopColor="#fd5949" />
                  <stop offset="75%" stopColor="#d6249f" />
                  <stop offset="100%" stopColor="#285AEB" />
                </linearGradient>
              </defs>
            </svg>

            {/* Facebook (Official Blue) */}
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="Facebook">
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>

            {/* Instagram (Official Gradient) */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="Instagram">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="url(#instagram-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>

            {/* YouTube (Official Red) */}
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="YouTube">
              <svg className="w-5 h-5 fill-[#FF0000]" viewBox="0 0 24 24">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.482 20.455 12 20.455 12 20.455s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            {/* WhatsApp (Official Green) */}
            <a href="https://wa.me/923183749686" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="WhatsApp">
              <svg className="w-5 h-5 fill-[#25D366]" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.457L0 24zm6.59-4.846c1.6.95 3.178 1.448 4.853 1.45 5.4 0 9.794-4.393 9.797-9.793.002-2.618-1.017-5.08-2.871-6.937C16.516 1.957 14.053.943 11.44.943c-5.399 0-9.794 4.395-9.797 9.797-.002 1.76.47 3.473 1.365 4.978L1.99 21.652l6.002-1.574c1.474.804 3.06 1.218 4.654 1.218zM17.16 14.19c-.284-.141-1.677-.828-1.937-.922-.26-.093-.448-.141-.637.141-.188.282-.73.922-.895 1.108-.165.186-.33.21-.613.07-.283-.141-1.196-.441-2.278-1.407-.842-.751-1.411-1.679-1.576-1.961-.165-.282-.018-.434.124-.575.127-.127.283-.33.424-.495.141-.165.188-.282.283-.47.094-.188.047-.353-.024-.494-.07-.142-.637-1.532-.872-2.1-.23-.553-.46-.477-.637-.486-.164-.008-.353-.01-.542-.01s-.495.07-.754.353c-.259.282-.99 1.012-.99 2.47 0 1.457 1.06 2.87 1.202 3.059.141.188 2.086 3.185 5.053 4.47.705.305 1.256.488 1.684.624.708.226 1.353.194 1.863.118.568-.085 1.677-.686 1.913-1.349.236-.662.236-1.23.165-1.348-.07-.118-.26-.188-.544-.33z"/>
              </svg>
            </a>

            {/* TikTok (Official black/teal/pink customized with drop-shadow effects) */}
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="TikTok">
              <svg className="w-5 h-5 filter drop-shadow-[1px_0_0_#25F4EE] drop-shadow-[-1px_0_0_#FE0979]" viewBox="0 0 24 24" fill="#010101">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.11V9.12a7.21 7.21 0 1 0 5.5 7.15V8.12A10.22 10.22 0 0 0 22 12V8.45a7.35 7.35 0 0 1-2.41-1.76z" />
              </svg>
            </a>

            {/* LinkedIn (Official Blue) */}
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-115" title="LinkedIn">
              <svg className="w-5 h-5 fill-[#0077B5]" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        )}

        {/* Home & Progress Bottom Navigation Bar (Minimal, 2-item switcher as requested) */}
        <div className="max-w-md mx-auto h-14 flex items-center justify-around px-4">
          <button
            onClick={() => {
              setCurrentScreen('classes');
              setSelectedClass(null);
              setSelectedSubject(null);
              setSelectedChapter(null);
              setSelectedTopic(null);
              setActiveTile(null);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              currentScreen !== 'progress'
                ? 'text-[#00175c] scale-105 font-black'
                : 'text-[#00175c]/40 hover:text-[#00175c]'
            }`}
          >
            <BookOpen size={18} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-widest">Home (Classes)</span>
          </button>

          <button
            onClick={() => {
              setCurrentScreen('progress');
              setSelectedClass(null);
              setSelectedSubject(null);
              setSelectedChapter(null);
              setSelectedTopic(null);
              setActiveTile(null);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all cursor-pointer ${
              currentScreen === 'progress'
                ? 'text-[#00175c] scale-105 font-black'
                : 'text-[#00175c]/40 hover:text-[#00175c]'
            }`}
          >
            <Trophy size={18} className="stroke-[2.5]" />
            <span className="text-[9px] font-black uppercase tracking-widest">Progress</span>
          </button>
        </div>
      </footer>

      {/* LOCKED MODAL POPUP */}
      {lockedModalMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#00175c]/60 backdrop-blur-xs animate-fade-in text-slate-800" id="locked-item-modal">
          <div className="bg-white rounded-2xl border-4 border-[#00175c] p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-[#00175c]/5 flex items-center justify-center text-[#00175c]">
              <Lock size={22} className="stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-md font-black text-[#00175c] uppercase tracking-wider">Access Restricted</h4>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                {lockedModalMessage}
              </p>
            </div>
            <button
              onClick={() => setLockedModalMessage(null)}
              className="w-full py-2.5 bg-[#00175c] hover:bg-[#00175c]/90 text-white font-black uppercase tracking-widest text-xs rounded-xl cursor-pointer transition-all shadow-md"
            >
              Understand
            </button>
          </div>
        </div>
      )}



      {/* FLOATING AI ASSISTANT TOGGLE BUTTON */}
      <button
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-20 right-6 z-40 bg-[#00175c] text-[#facc15] hover:text-white border-2 border-[#facc15] hover:border-white p-3.5 rounded-full shadow-2xl hover:scale-110 transition-all cursor-pointer flex items-center gap-2 font-black text-xs uppercase tracking-wider animate-bounce"
        style={{ animationDuration: '3s' }}
        id="floating-ai-chat-trigger"
      >
        <Sparkles size={18} fill="currentColor" className="animate-pulse" />
        <span className="hidden sm:inline">Ask AI Tutor</span>
      </button>

      {/* AI CHATBOT DRAWER OVERLAY */}
      {isAiChatOpen && (
        <div className="fixed inset-0 bg-[#00175c]/50 backdrop-blur-xs z-50 flex justify-end animate-fade-in text-slate-800" id="ai-chat-drawer">
          <div className="bg-white w-full max-w-lg h-full flex flex-col shadow-2xl relative border-l-4 border-[#00175c] animate-slide-in">
            {/* Inner Chat Container */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col h-full">
              <AiChatbot user={user} onBack={() => setIsAiChatOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* EASY STUDY ASSISTANT FAB & DRAWER */}
      <EasyAssistant 
        currentSubject={selectedSubject?.name} 
        notesText={selectedTopic ? getNotesForActiveTopic() : undefined} 
      />

    </div>
  );
}
