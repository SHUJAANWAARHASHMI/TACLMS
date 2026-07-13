import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Announcement, Progress, Assignment, Note, Video, ClassRoom, Subject } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  Trophy, Award, Clock, AlertCircle, Megaphone, CheckSquare, PlayCircle, 
  FileText, ArrowRight, Phone, MessageSquare, MapPin, Sparkles, BookOpen, 
  HelpCircle, ChevronRight, X, Heart, User as UserIcon, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentDashboardProps {
  user: User;
  lang: 'en' | 'ur';
  onNavigate?: (view: string, extraParams?: any) => void;
  onNavigateSubject?: (subId: string) => void;
  onNavigateTab?: (tab: string) => void;
  classes?: ClassRoom[];
  subjects?: Subject[];
}

export default function StudentDashboard({ 
  user, 
  lang, 
  onNavigate, 
  onNavigateSubject, 
  onNavigateTab,
  classes: propClasses, 
  subjects: propSubjects 
}: StudentDashboardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>(propClasses || []);
  const [subjects, setSubjects] = useState<Subject[]>(propSubjects || []);
  
  // Interactive "How to Use" Modal State
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // Rotating/Dismissible Motivation Banner state
  const [bannerIndex, setBannerIndex] = useState(0);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    // Load dashboard content in parallel
    Promise.all([
      api.getAnnouncements(),
      api.getProgress(),
      api.getAssignments(),
      api.getNotes(),
      api.getVideos(),
      propClasses ? Promise.resolve(propClasses) : api.getClasses(),
      propSubjects ? Promise.resolve(propSubjects) : api.getSubjects()
    ]).then(([annRes, progRes, assignRes, notesRes, vidsRes, classesRes, subjectsRes]) => {
      setAnnouncements(annRes);
      setProgress(progRes);
      setAssignments(assignRes);
      setNotes(notesRes);
      setVideos(vidsRes);
      if (!propClasses) setClasses(classesRes);
      if (!propSubjects) setSubjects(subjectsRes);
    }).catch(err => console.error('Error loading dashboard data', err));
  }, [user.id, propClasses, propSubjects]);

  // Rotator for motivation strip
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % 4);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) {
      return lang === 'en' ? `Good morning, ${user.name} ☀️` : `صبح بخیر، ${user.name} ☀️`;
    } else if (hr < 17) {
      return lang === 'en' ? `Good afternoon, ${user.name} 🌤️` : `سہ پہر بخیر، ${user.name} 🌤️`;
    } else {
      return lang === 'en' ? `Good evening, ${user.name} 🌙` : `شام بخیر، ${user.name} 🌙`;
    }
  };

  // Gamification Level Titles
  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return lang === 'en' ? 'Scholar Novice' : 'ابتدائی اسکالر';
    if (lvl === 2) return lang === 'en' ? 'Academic Ranger' : 'تعلیمی رینجر';
    if (lvl === 3) return lang === 'en' ? 'LMS Explorer' : 'ایل ایم ایس ایکسپلورر';
    if (lvl === 4) return lang === 'en' ? 'Knowledge Master' : 'علم کا ماسٹر';
    return lang === 'en' ? 'Ali Collegiate Legend' : 'علی کالجیٹ لیجنڈ';
  };

  const getSubjectProgressPercentage = (subId: string) => {
    // Generate an encouraging, deterministic progress based on subject ID
    let base = 15;
    for (let i = 0; i < subId.length; i++) {
      base += subId.charCodeAt(i);
    }
    return (base % 45) + 30; // returns between 30% and 75%
  };

  // Continue learning items
  const getContinueLearningItems = () => {
    const items = [];
    
    // Pick first video if available
    if (videos && videos.length > 0) {
      items.push({
        id: videos[0].id,
        title: videos[0].title,
        subjectId: videos[0].subjectId,
        type: 'video' as const,
        progress: 65,
        statusLabel: lang === 'en' ? '65% watched' : '65% دیکھا گیا',
        actionLabel: lang === 'en' ? 'Resume Video' : 'ویڈیو شروع کریں'
      });
    } else {
      items.push({
        id: 'mock-vid-1',
        title: lang === 'en' ? 'System Calculus & Functions' : 'سسٹم کیلکولس اور فنکشنز',
        subjectId: 'calculus',
        type: 'video' as const,
        progress: 40,
        statusLabel: lang === 'en' ? '40% watched' : '40% دیکھا گیا',
        actionLabel: lang === 'en' ? 'Resume Video' : 'ویڈیو شروع کریں'
      });
    }

    // Pick first note if available
    if (notes && notes.length > 0) {
      items.push({
        id: notes[0].id,
        title: notes[0].title,
        subjectId: notes[0].subjectId,
        type: 'note' as const,
        progress: 80,
        statusLabel: lang === 'en' ? '80% read' : '80% پڑھا گیا',
        actionLabel: lang === 'en' ? 'Resume Reading' : 'پڑھنا شروع کریں'
      });
    } else {
      items.push({
        id: 'mock-note-1',
        title: lang === 'en' ? 'Control Flow & Logic Syntaxes' : 'کنٹرول فلو اور منطقی نحو',
        subjectId: 'programming',
        type: 'note' as const,
        progress: 85,
        statusLabel: lang === 'en' ? '85% read' : '85% پڑھا گیا',
        actionLabel: lang === 'en' ? 'Resume Reading' : 'پڑھنا شروع کریں'
      });
    }

    return items;
  };

  const continueItems = getContinueLearningItems();

  const motivationStripMessages = lang === 'en' ? [
    "You've completed 3 chapters this week — keep up the awesome momentum! 🎉",
    "New video lectures have been uploaded in Programming Fundamentals! 🎥",
    "Consistency is key! Keep that daily streak flame shining bright. 🔥",
    "Did you know? Completing MCQ quizzes gives you a massive 50 XP boost! 🧠"
  ] : [
    "آپ نے اس ہفتے 3 ابواب مکمل کر لیے ہیں — اس بہترین رفتار کو برقرار رکھیں! 🎉",
    "پروگرامنگ فنڈامینٹلز میں نئے ویڈیو لیکچرز اپ لوڈ کر دیے گئے ہیں! 🎥",
    "مستقل مزاجی کامیابی کی چابی ہے! روزانہ سیکھنے کے سلسلے کو برقرار رکھیں۔ 🔥",
    "کیا آپ جانتے ہیں؟ معروضی سوالات (MCQs) حل کرنے سے آپ کو 50 XP کا بڑا اضافہ ملتا ہے! 🧠"
  ];

  const levelUpRequiredXP = (user.level) * 100;
  const currentXPInLevel = user.xp % 100;
  const xpToLevelUp = 100 - currentXPInLevel;

  const navigateToTabSafe = (tabName: string) => {
    if (onNavigateTab) {
      onNavigateTab(tabName);
    } else if (onNavigate) {
      onNavigate(tabName);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20" id="student-homepage-root">
      
      {/* 1. TOP SECTION - PERSONAL WELCOME */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
        id="top-welcome-header"
      >
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight font-display flex items-center gap-2">
            <span>{getGreeting()}</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-xs">
              <Flame size={12} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>{user.streakCount || 5} {lang === 'en' ? 'Day Streak' : 'دن کا سلسلہ'}</span>
            </span>
            <span className="text-[11px] text-slate-400 font-semibold font-mono">
              GR: {user.grNumber}
            </span>
          </div>
        </div>

        {/* Tappable Profile Avatar */}
        <button 
          onClick={() => navigateToTabSafe('profile')}
          className="relative h-12 w-12 rounded-full border-2 border-[#004aad]/20 p-0.5 hover:border-[#004aad] transition-all duration-200 active:scale-95 focus:outline-none cursor-pointer group"
          title="Go to Profile"
          id="profile-avatar-btn"
        >
          <div className="h-full w-full rounded-full bg-gradient-to-tr from-[#004aad] to-sky-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:scale-105 transition-transform">
            {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={16} />}
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></span>
        </button>
      </motion.div>

      {/* 2. HERO PROGRESS CARD (The emotional anchor) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#00245b] via-[#004aad] to-indigo-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/10"
        id="hero-trophy-shelf"
      >
        {/* Absolute Glowing Highlights */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-400/20 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-sky-300 font-bold uppercase tracking-wider text-[10px] bg-sky-900/40 border border-sky-400/20 px-2.5 py-1 rounded-md">
                {getLevelTitle(user.level)}
              </span>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight font-display pt-2">
                {lang === 'en' ? `Level ${user.level} — Achiever` : `لیول ${user.level} — کامیاب`}
              </h2>
            </div>

            {/* Motivating phrase dynamically */}
            <p className="text-sky-100 text-sm font-semibold flex items-center gap-1.5 bg-white/5 py-1.5 px-3 rounded-xl border border-white/5 w-fit">
              <Sparkles size={14} className="text-yellow-300 animate-spin" />
              <span>
                {lang === 'en' 
                  ? `Just ${xpToLevelUp} XP needed to unlock Level ${user.level + 1}! You're doing amazing!`
                  : `لیول ${user.level + 1} کھولنے کے لیے صرف ${xpToLevelUp} XP درکار ہیں! آپ بہترین پڑھ رہے ہیں!`}
              </span>
            </p>

            {/* Horizontal progress bar with glow */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-sky-200 font-mono">
                <span>{currentXPInLevel} / 100 XP</span>
                <span>{Math.round(currentXPInLevel)}%</span>
              </div>
              <div className="w-full bg-slate-950/60 h-4 rounded-full overflow-hidden p-[3px] border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(currentXPInLevel, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                />
              </div>
            </div>
          </div>

          {/* Gamified Visual Trophy Cup Badge */}
          <div className="flex items-center justify-center bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md shrink-0 w-full md:w-32 text-center flex-col shadow-lg">
            <Trophy size={48} className="text-yellow-400 drop-shadow-[0_4px_10px_rgba(250,204,21,0.4)] animate-bounce" />
            <span className="text-[11px] font-black uppercase tracking-widest text-yellow-300 mt-2 block">
              {user.xp} {lang === 'en' ? 'TOTAL XP' : 'کل پوائنٹس'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3. CONTINUE WHERE YOU LEFT OFF ROW */}
      <div className="space-y-3" id="continue-learning-row-section">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 font-display flex items-center gap-1.5">
            <Clock size={16} className="text-[#004aad]" />
            <span>{lang === 'en' ? 'Continue Where You Left Off' : 'جہاں سے پڑھائی چھوڑی تھی وہیں سے شروع کریں'}</span>
          </h3>
        </div>

        {/* Horizontal scrollable wrapper */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none px-1" style={{ scrollSnapType: 'x mandatory' }}>
          {continueItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + idx * 0.05 }}
              onClick={() => navigateToTabSafe(item.type === 'note' ? 'notes' : 'videos')}
              className="flex-shrink-0 w-[280px] md:w-[320px] bg-white border border-slate-100 hover:border-sky-300 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between h-40 scroll-snap-align-start group relative overflow-hidden"
              id={`continue-card-${item.id}`}
            >
              {/* Card Watermark Icon */}
              <div className="absolute right-2 top-2 opacity-5 text-slate-900 pointer-events-none">
                {item.type === 'note' ? <FileText size={80} /> : <PlayCircle size={80} />}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    item.type === 'note' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {item.type === 'note' ? (lang === 'en' ? '📝 LECTURE NOTE' : 'نوٹ') : (lang === 'en' ? '🎥 VIDEO LECTURE' : 'ویڈیو لیکچر')}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                    {item.statusLabel}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#004aad] transition-colors">
                  {item.title}
                </h4>
              </div>

              {/* Progress visual and Action Button */}
              <div className="space-y-3">
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#004aad] h-full rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#004aad] pt-1">
                  <span>{item.actionLabel}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 4. QUICK ACTION TILES */}
      <div className="space-y-3" id="quick-action-section">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 font-display px-1">
          {lang === 'en' ? 'Quick Actions' : 'فوری روابط'}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="quick-tiles-grid">
          {/* Tile 1: Videos */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateToTabSafe('videos')}
            className="bg-sky-50/60 hover:bg-sky-50 border border-sky-100/80 p-5 rounded-2xl text-left space-y-3 shadow-xs hover:shadow-sm transition-all focus:outline-none cursor-pointer group flex flex-col justify-between h-36"
            id="tile-videos"
          >
            <div className="bg-sky-500 text-white p-3 rounded-xl w-fit shadow-md group-hover:scale-110 transition-transform">
              <PlayCircle size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">{lang === 'en' ? 'Watch Videos' : 'ویڈیوز دیکھیں'}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lang === 'en' ? 'Pre-recorded lectures' : 'ریکارڈ شدہ لیکچرز'}</p>
            </div>
          </motion.button>

          {/* Tile 2: Notes */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateToTabSafe('notes')}
            className="bg-amber-50/60 hover:bg-amber-50 border border-amber-100/80 p-5 rounded-2xl text-left space-y-3 shadow-xs hover:shadow-sm transition-all focus:outline-none cursor-pointer group flex flex-col justify-between h-36"
            id="tile-notes"
          >
            <div className="bg-amber-500 text-white p-3 rounded-xl w-fit shadow-md group-hover:scale-110 transition-transform">
              <FileText size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">{lang === 'en' ? 'Lecture Notes' : 'لیکچر نوٹس'}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lang === 'en' ? 'Chapter PDFs & Slides' : 'پی ڈی ایف اور سلائیڈز'}</p>
            </div>
          </motion.button>

          {/* Tile 3: Progress */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigateToTabSafe('progress')}
            className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100/80 p-5 rounded-2xl text-left space-y-3 shadow-xs hover:shadow-sm transition-all focus:outline-none cursor-pointer group flex flex-col justify-between h-36"
            id="tile-progress"
          >
            <div className="bg-emerald-500 text-white p-3 rounded-xl w-fit shadow-md group-hover:scale-110 transition-transform">
              <Trophy size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">{lang === 'en' ? 'My Progress' : 'میری کارکردگی'}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lang === 'en' ? 'Grades & XP Stats' : 'نمبر اور کارکردگی'}</p>
            </div>
          </motion.button>

          {/* Tile 4: How to Use */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowGuideModal(true)}
            className="bg-purple-50/60 hover:bg-purple-50 border border-purple-100/80 p-5 rounded-2xl text-left space-y-3 shadow-xs hover:shadow-sm transition-all focus:outline-none cursor-pointer group flex flex-col justify-between h-36"
            id="tile-guide"
          >
            <div className="bg-purple-500 text-white p-3 rounded-xl w-fit shadow-md group-hover:scale-110 transition-transform">
              <HelpCircle size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-800">{lang === 'en' ? 'How to Use' : 'استعمال کا طریقہ'}</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{lang === 'en' ? 'LMS Student Guide' : 'طالب علم کی گائیڈ'}</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* 5. "PICK UP A SUBJECT" ROW */}
      <div className="space-y-3" id="pick-subject-section">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 font-display px-1">
          {lang === 'en' ? 'Pick Up a Subject' : 'مضمون منتخب کریں'}
        </h3>

        {/* Scrollable grid row */}
        <div className="flex gap-4 overflow-x-auto pb-2 pt-1 scrollbar-none px-1" style={{ scrollSnapType: 'x mandatory' }}>
          {subjects.map((sub, idx) => {
            const progressPct = getSubjectProgressPercentage(sub.id);
            // Dynamic colorful background based on name
            const bgGradients = [
              'from-sky-50 to-sky-100/50 hover:border-sky-300 border-sky-100/60',
              'from-emerald-50 to-emerald-100/50 hover:border-emerald-300 border-emerald-100/60',
              'from-purple-50 to-purple-100/50 hover:border-purple-300 border-purple-100/60',
              'from-indigo-50 to-indigo-100/50 hover:border-indigo-300 border-indigo-100/60'
            ];
            const ringColors = ['#0ea5e9', '#10b981', '#a855f7', '#6366f1'];
            const gradClass = bgGradients[idx % bgGradients.length];
            const ringColor = ringColors[idx % ringColors.length];

            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                onClick={() => onNavigateSubject ? onNavigateSubject(sub.id) : navigateToTabSafe('videos')}
                className={`flex-shrink-0 w-[180px] bg-gradient-to-br ${gradClass} border p-4 rounded-2xl flex flex-col items-center justify-between h-40 text-center shadow-xs hover:shadow-md transition-all cursor-pointer scroll-snap-align-start group`}
                id={`subject-card-${sub.id}`}
              >
                <div className="space-y-1 w-full">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                    {lang === 'en' ? 'COURSE' : 'کورس'}
                  </h4>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2 h-10 flex items-center justify-center font-display px-1 leading-snug group-hover:text-[#004aad] transition-colors">
                    {sub.name}
                  </h3>
                </div>

                {/* Progress Ring */}
                <div className="relative h-14 w-14 flex items-center justify-center pt-1">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="28" cy="28" r="22" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="28" cy="28" r="22" 
                      stroke={ringColor} strokeWidth="4" fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                    />
                  </svg>
                  <span className="absolute text-[10px] font-black text-slate-700 font-mono pt-1">{progressPct}%</span>
                </div>
              </motion.div>
            );
          })}
          {subjects.length === 0 && (
            <div className="w-full py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {lang === 'en' ? 'No subjects unlocked for you yet. Please contact Sir Ali Aslam.' : 'ابھی تک کوئی مضمون نہیں کھولا گیا۔ براہ کرم سر علی اسلم سے رابطہ کریں۔'}
            </div>
          )}
        </div>
      </div>

      {/* 6. LIGHT MOTIVATION STRIP */}
      <AnimatePresence mode="wait">
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex items-center justify-between gap-3 relative shadow-xs"
            id="motivation-strip"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-[#004aad] animate-pulse">
                <Sparkles size={16} className="stroke-[2.5]" />
              </span>
              <p className="text-xs font-bold text-slate-700 leading-relaxed pr-6 md:pr-0">
                {motivationStripMessages[bannerIndex]}
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer absolute right-3 top-3 md:static"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Helpline Support Widget (Subtle Footer) */}
      <div className="bg-gradient-to-br from-slate-900 to-[#00173d] text-white rounded-2xl p-5 border border-slate-800 space-y-4" id="mini-footer-helpline">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-wider text-yellow-400">
              {lang === 'en' ? "The Ali's Collegiate Support Desk" : "دی علی'ز کالجیٹ سپورٹ"}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {lang === 'en' ? 'Reach out for syllabus assignments, fee inquiries or portal queries.' : 'کورس انلاک، فیس، یا کسی بھی قسم کی مدد کے لیے رابطہ کریں۔'}
            </p>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 font-mono text-slate-300">
            Helpline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs font-semibold">
          <a href="https://wa.me/923183749686" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl border border-white/5 hover:border-yellow-400/20 hover:bg-white/10 transition-all">
            <div className="bg-emerald-500 text-white p-1.5 rounded-lg shrink-0">
              <MessageSquare size={14} />
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold tracking-wider leading-none uppercase">Primary Support</span>
              <span className="font-mono text-slate-200">0318 3749686</span>
            </div>
          </a>

          <a href="https://wa.me/923192014240" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl border border-white/5 hover:border-yellow-400/20 hover:bg-white/10 transition-all">
            <div className="bg-[#004aad] text-white p-1.5 rounded-lg shrink-0">
              <Phone size={14} />
            </div>
            <div>
              <span className="text-[8px] text-slate-400 block font-bold tracking-wider leading-none uppercase">Secondary Support</span>
              <span className="font-mono text-slate-200">0319 2014240</span>
            </div>
          </a>
        </div>
      </div>

      {/* --- INTERACTIVE HOW TO USE GUIDE MODAL --- */}
      <AnimatePresence>
        {showGuideModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50" id="guide-modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
              id="guide-modal-content"
            >
              <button 
                onClick={() => setShowGuideModal(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1 bg-slate-100 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="bg-purple-100 text-purple-700 p-2.5 rounded-xl">
                    <BookOpen size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-md font-extrabold text-slate-800 font-display">
                      {lang === 'en' ? 'LMS Student Guide' : 'ایل ایم ایس اسٹوڈنٹ گائیڈ'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {lang === 'en' ? "The Ali's Collegiate LMS" : "دی علی'ز کالجیٹ"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 text-xs text-slate-600 leading-relaxed">
                  <div className="flex gap-3 items-start bg-sky-50/50 p-3 rounded-xl border border-sky-100/40">
                    <span className="h-6 w-6 rounded-full bg-[#004aad] text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-0.5">{lang === 'en' ? 'Watch Lecture Videos' : 'لیکچر ویڈیوز دیکھیں'}</h4>
                      <p>{lang === 'en' ? 'Go to the Videos tab, choose your subject and watch classes anytime. You gain XP for active studying.' : 'ویڈیوز ٹیب پر جائیں، اپنا مضمون منتخب کریں اور کسی بھی وقت کلاسز دیکھیں۔ پڑھنے پر آپ کو XP ملیں گے۔'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-amber-50/50 p-3 rounded-xl border border-amber-100/40">
                    <span className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-0.5">{lang === 'en' ? 'Read Lecture Notes' : 'نوٹس پڑھیں'}</h4>
                      <p>{lang === 'en' ? 'Access clean PDF documentation, notes, and slides under each chapter folder to review concepts offline.' : 'تصورات کا اعادہ کرنے کے لیے ہر باب کے فولڈر کے تحت پی ڈی ایف نوٹس اور سلائیڈز تک رسائی حاصل کریں۔'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/40">
                    <span className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-0.5">{lang === 'en' ? 'Take Concept MCQ Quizzes' : 'کوئز حل کریں'}</h4>
                      <p>{lang === 'en' ? 'Test your memory! Scoring well in Chapter-based Multiple Choice Quizzes grants massive bonus XP to Level Up.' : 'ہر سبق کے اختتام پر دیے گئے معروضی کوئز حل کریں، اچھے نمبر حاصل کر کے اپنی لیول تیزی سے بڑھائیں۔'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-purple-50/50 p-3 rounded-xl border border-purple-100/40">
                    <span className="h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-0.5">{lang === 'en' ? 'Daily Attendance & Streak' : 'روزانہ حاضری اور اسٹریک'}</h4>
                      <p>{lang === 'en' ? 'Maintain a daily presence! Your Learning Streak rises each day you interact with documents or lectures.' : 'روزانہ کی بنیاد پر پورٹل لاگ ان کریں۔ نوٹس پڑھنے اور ویڈیوز دیکھنے سے آپ کی اسٹریک بڑھتی رہے گی۔'}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowGuideModal(false)}
                  className="w-full bg-[#004aad] hover:bg-blue-800 text-white font-extrabold py-3 rounded-2xl text-xs transition-colors cursor-pointer mt-2"
                >
                  {lang === 'en' ? "Got It, Let's Learn!" : "ٹھیک ہے، پڑھائی شروع کریں!"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
