import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import { User, Subject } from './types';
import { getTranslation } from './utils/UrduTranslation';
import WelcomeScreen from './components/WelcomeScreen';

// Student Portal Panels
import StudentDashboard from './components/StudentDashboard';
import StudentCourses from './components/StudentCourses';
import StudentQuiz from './components/StudentQuiz';
import StudentAssignment from './components/StudentAssignment';

// Admin Portal Panels
import AdminDashboard from './components/AdminDashboard';
import AdminClasses from './components/AdminClasses';
import AdminNotes from './components/AdminNotes';
import AdminVideos from './components/AdminVideos';
import AdminStudents from './components/AdminStudents';
import AdminAccessMatrix from './components/AdminAccessMatrix';
import AdminAnnouncements from './components/AdminAnnouncements';
import AdminQuizzes from './components/AdminQuizzes';
import AdminAssignments from './components/AdminAssignments';
import AdminAttendance from './components/AdminAttendance';
import AdminSupabase from './components/AdminSupabase';

import { 
  BookOpen, FolderOpen, HelpCircle, ClipboardList, Calendar, Bookmark, 
  Settings, LogOut, ShieldAlert, Users, Bell, Globe, Sparkles, Award, Trophy,
  BarChart2, FolderPlus, FileText, PlayCircle, ShieldCheck, Megaphone, Menu, X, CheckCircle, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type StudentTab = 'dashboard' | 'courses' | 'quizzes' | 'assignments' | 'attendance' | 'bookmarks' | 'settings';
type AdminTab = 'dashboard' | 'classes' | 'notes' | 'videos' | 'students' | 'matrix' | 'announcements' | 'quizzes' | 'assignments' | 'attendance' | 'supabase';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<'en' | 'ur'>('en');
  const [activeStudentTab, setActiveStudentTab] = useState<StudentTab>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Responsive mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Level up popups
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number }>({ oldLevel: 1, newLevel: 1 });

  // Deep-linked actions
  const [linkedSubjectId, setLinkedSubjectId] = useState<string | undefined>(undefined);
  const [linkedQuizId, setLinkedQuizId] = useState<string | undefined>(undefined);

  // Student extra histories states (cached here)
  const [studentAttendance, setStudentAttendance] = useState<any[]>([]);
  const [studentBookmarks, setStudentBookmarks] = useState<any[]>([]);

  useEffect(() => {
    // Check session on mount
    api.getCurrentUser()
      .then(usr => {
        setUser(usr);
        // Load extra student metrics if logged in
        if (usr && usr.role === 'student') {
          loadStudentMetrics(usr.id);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const loadStudentMetrics = async (userId: string) => {
    try {
      const [allAttendance, bmarks] = await Promise.all([
        api.getStudentAttendanceLogs(userId),
        api.getBookmarks()
      ]);
      setStudentAttendance(allAttendance);
      setStudentBookmarks(bmarks);
    } catch (e) {
      console.error(e);
    }
  };

  const handleXPUpdated = (newXp: number, newLevel: number, levelUp: boolean) => {
    if (!user) return;
    const oldLevel = user.level;
    setUser({
      ...user,
      xp: newXp,
      level: newLevel
    });

    if (levelUp && newLevel > oldLevel) {
      setLevelUpData({ oldLevel, newLevel });
      setShowLevelUp(true);
    }
    loadStudentMetrics(user.id);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setMobileMenuOpen(false);
    setActiveStudentTab('dashboard');
    setActiveAdminTab('dashboard');
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'ur' : 'en');
  };

  const handleNavigateToSubject = (subId: string) => {
    setLinkedSubjectId(subId);
    setActiveStudentTab('courses');
  };

  const handleNavigateToQuiz = (qId: string) => {
    setLinkedQuizId(qId);
    setActiveStudentTab('quizzes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-3">
        <div className="h-10 w-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 font-display">Securing learning portal tunnels...</span>
      </div>
    );
  }

  if (!user) {
    return <WelcomeScreen onLoginSuccess={(usr) => { setUser(usr); if (usr.role === 'student') loadStudentMetrics(usr.id); }} lang={lang} setLang={setLang} />;
  }

  const isRtl = lang === 'ur';

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* SIDEBAR NAVIGATION BAR (Desktop) */}
      <aside className="hidden lg:flex flex-col justify-between w-64 bg-white text-slate-700 border-r border-slate-200 shrink-0 select-none" id="main-sidebar">
        <div className="p-5 space-y-6">
          {/* Institution App Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 text-white p-2 rounded-xl">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-slate-900 tracking-wider">TACLMS</h1>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">The Ali Collegates</p>
            </div>
          </div>

          {/* Student Profile Level card */}
          {user.role === 'student' && (
            <div className="bg-slate-900 rounded-2xl p-4 text-white">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Level {user.level}</span>
                <span className="text-[10px] text-slate-400 font-mono">{user.xp} XP</span>
              </div>
              <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (user.xp % 100))}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-400 italic font-medium leading-snug mt-2">
                Earn +{100 - (user.xp % 100)} XP to reach Level {user.level + 1}
              </p>
            </div>
          )}

          {/* Admin Tag */}
          {user.role === 'admin' && (
            <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert size={14} className="text-blue-400" />
              <span>Lecturer Portal</span>
            </div>
          )}

          {/* Navigation Links list */}
          <nav className="space-y-1">
            {user.role === 'student' ? (
              // Student Menu Links
              <>
                <button
                  onClick={() => { setActiveStudentTab('dashboard'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-dash"
                >
                  <BarChart2 size={16} />
                  <span>{getTranslation(lang, 'dashboard')}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('courses'); setLinkedSubjectId(undefined); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'courses' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-courses"
                >
                  <FolderOpen size={16} />
                  <span>{getTranslation(lang, 'studyLibrary')}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('quizzes'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'quizzes' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-quizzes"
                >
                  <HelpCircle size={16} />
                  <span>{getTranslation(lang, 'quizzes')}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('assignments'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'assignments' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-homework"
                >
                  <ClipboardList size={16} />
                  <span>{getTranslation(lang, 'assignments')}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('attendance'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'attendance' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-attend"
                >
                  <Calendar size={16} />
                  <span>{getTranslation(lang, 'attendanceHistory')}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('bookmarks'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'bookmarks' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-saved"
                >
                  <Bookmark size={16} />
                  <span>Saved Documents</span>
                </button>
              </>
            ) : (
              // Admin Menu Links
              <>
                <button
                  onClick={() => setActiveAdminTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'dashboard' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-dash"
                >
                  <BarChart2 size={16} />
                  <span>Admin Dashboard</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('classes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'classes' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-classes"
                >
                  <FolderPlus size={16} />
                  <span>Classes & folders</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('notes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'notes' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-notes"
                >
                  <FileText size={16} />
                  <span>Notes Repository</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('videos')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'videos' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-videos"
                >
                  <PlayCircle size={16} />
                  <span>Video lectures</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('students')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'students' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-students"
                >
                  <Users size={16} />
                  <span>Students List</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('matrix')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'matrix' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-matrix"
                >
                  <ShieldCheck size={16} />
                  <span>Access Matrix</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('announcements')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'announcements' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-notices"
                >
                  <Megaphone size={16} />
                  <span>Institution notices</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('quizzes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'quizzes' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-quizzes"
                >
                  <HelpCircle size={16} />
                  <span>Quizzes Builder</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('assignments')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'assignments' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-homework"
                >
                  <ClipboardList size={16} />
                  <span>Homework Evaluation</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('attendance')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'attendance' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-attendance"
                >
                  <Calendar size={16} />
                  <span>Attendance Register</span>
                </button>
                <button
                  onClick={() => setActiveAdminTab('supabase')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'supabase' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-supabase"
                >
                  <Database size={16} />
                  <span>Supabase Sync</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Bilingual Toggle inside sidebar footer */}
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-blue-600" />
              <span>{lang === 'en' ? 'اردو زبان (RTL)' : 'English Version'}</span>
            </div>
            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded uppercase font-bold">
              {lang}
            </span>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-bold text-slate-500 transition-colors cursor-pointer"
            id="sidebar-logout-btn"
          >
            <LogOut size={16} />
            <span>{getTranslation(lang, 'logout')}</span>
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & DRAWER NAVIGATION */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-40 text-slate-800" dir="ltr">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg">
            <Sparkles size={16} fill="currentColor" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">TACLMS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Toggle Urdu/English language"
          >
            <Globe size={18} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Overlays */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-30 p-5 flex flex-col justify-between overflow-y-auto border-t border-slate-100"
            dir="ltr"
          >
            <div className="space-y-6">
              {/* Profile card (Mobile menu) */}
              {user.role === 'student' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{user.name}</span>
                    <span className="font-bold text-blue-600 font-mono">Lvl {user.level} ({user.xp} XP)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${user.xp % 100}%` }} />
                  </div>
                </div>
              )}

              {user.role === 'admin' && (
                <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-2 text-xs font-bold uppercase">
                  <ShieldAlert size={14} className="text-blue-400" />
                  <span>Lecturer Access Panel</span>
                </div>
              )}

              {/* Navigation list (Mobile) */}
              <nav className="space-y-1">
                {user.role === 'student' ? (
                  <>
                    {/* Student menu */}
                    {([
                      { tab: 'dashboard', label: getTranslation(lang, 'dashboard'), icon: <BarChart2 size={16} /> },
                      { tab: 'courses', label: getTranslation(lang, 'studyLibrary'), icon: <FolderOpen size={16} /> },
                      { tab: 'quizzes', label: getTranslation(lang, 'quizzes'), icon: <HelpCircle size={16} /> },
                      { tab: 'assignments', label: getTranslation(lang, 'assignments'), icon: <ClipboardList size={16} /> },
                      { tab: 'attendance', label: getTranslation(lang, 'attendanceHistory'), icon: <Calendar size={16} /> },
                      { tab: 'bookmarks', label: 'Saved Documents', icon: <Bookmark size={16} /> }
                    ] as const).map(({ tab, label, icon }) => (
                      <button
                        key={tab}
                        onClick={() => { setActiveStudentTab(tab); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          activeStudentTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Admin menu */}
                    {([
                      { tab: 'dashboard', label: 'Admin Dashboard', icon: <BarChart2 size={16} /> },
                      { tab: 'classes', label: 'Classes & Folders', icon: <FolderPlus size={16} /> },
                      { tab: 'notes', label: 'Notes Repository', icon: <FileText size={16} /> },
                      { tab: 'videos', label: 'Video Lectures', icon: <PlayCircle size={16} /> },
                      { tab: 'students', label: 'Students List', icon: <Users size={16} /> },
                      { tab: 'matrix', label: 'Access Matrix', icon: <ShieldCheck size={16} /> },
                      { tab: 'announcements', label: 'Noticeboard', icon: <Megaphone size={16} /> },
                      { tab: 'quizzes', label: 'Quizzes Builder', icon: <HelpCircle size={16} /> },
                      { tab: 'assignments', label: 'Homework Reviewer', icon: <ClipboardList size={16} /> },
                      { tab: 'attendance', label: 'Attendance Register', icon: <Calendar size={16} /> },
                      { tab: 'supabase', label: 'Supabase Sync', icon: <Database size={16} /> }
                    ] as const).map(({ tab, label, icon }) => (
                      <button
                        key={tab}
                        onClick={() => { setActiveAdminTab(tab); setMobileMenuOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          activeAdminTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </>
                )}
              </nav>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold cursor-pointer font-sans"
            >
              <LogOut size={16} />
              <span>{getTranslation(lang, 'logout')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT BODY STAGE */}
      <main className="flex-1 min-w-0 pt-20 lg:pt-0 flex flex-col justify-between" id="viewport-stage">
        
        {/* Top Floating Welcome Action header bar */}
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white shadow-xs z-10" id="desktop-header">
          <div>
            <h2 className="text-md font-bold text-slate-800 font-display">
              {user.role === 'admin' 
                ? 'Lecturer Administration Workspace' 
                : `${lang === 'ur' ? 'خوش آمدید، ' : 'Welcome Back, '}${user.name}`}
            </h2>
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              {user.role === 'admin' ? 'Institute Admin Authority' : `Roll GR Number: ${user.grNumber}`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Gamification Streak stats */}
            {user.role === 'student' && (
              <div className="flex items-center gap-3 bg-amber-50/50 border border-amber-100 p-2 rounded-xl text-amber-800 font-bold text-xs">
                <Trophy size={14} className="text-amber-500 animate-pulse" fill="currentColor" />
                <span>Streak: {user.streakCount} Days</span>
              </div>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200/80 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Globe size={14} className="text-sky-500 animate-spin-slow" />
              <span>{lang === 'en' ? 'اردو زبان (Urdu)' : 'English Translation'}</span>
            </button>
            
            <button 
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all cursor-pointer"
              title="Log out from session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* Dynamic Panels Stage wrapper */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-100px)]" id="active-viewport-body">
          {user.role === 'student' ? (
            // STUDENT COMPONENT ROUTER SWITCH
            (() => {
              switch (activeStudentTab) {
                
                case 'dashboard':
                  return (
                    <StudentDashboard 
                      user={user} 
                      lang={lang} 
                      onNavigateSubject={handleNavigateToSubject} 
                    />
                  );
                
                case 'courses':
                  return (
                    <StudentCourses 
                      user={user} 
                      lang={lang} 
                      initialSubjectId={linkedSubjectId}
                      onXPUpdated={handleXPUpdated}
                      onNavigateQuiz={handleNavigateToQuiz}
                      onNavigateAssignment={() => setActiveStudentTab('assignments')}
                    />
                  );
                
                case 'quizzes':
                  return linkedQuizId ? (
                    <StudentQuiz 
                      user={user} 
                      lang={lang} 
                      quizId={linkedQuizId} 
                      onClose={() => { setLinkedQuizId(undefined); setActiveStudentTab('courses'); }}
                      onXPUpdated={handleXPUpdated}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-slate-400 text-sm">
                      Please enter through a Course Subject Folder and click "Take Quiz" under any chapter to load integrated MCQ exams.
                    </div>
                  );
                
                case 'assignments':
                  return (
                    <StudentAssignment 
                      user={user} 
                      lang={lang} 
                      onXPUpdated={handleXPUpdated} 
                    />
                  );
                
                case 'attendance':
                  // Display dynamic student-side monthly percentage and calendarpresence logs list
                  return (
                    <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6" id="student-attendance-view">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 font-display">Student Daily Attendance Register</h3>
                        <p className="text-[11px] text-gray-400">Streak scores are determined by persistent daily presence logs.</p>
                      </div>

                      {/* Summary card metrics */}
                      <div className="grid grid-cols-3 gap-3" id="attendance-summary-metrics">
                        <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-teal-700 block font-bold uppercase tracking-wide">Presence Ratio</span>
                          <span className="text-xl font-black text-teal-800 block">
                            {studentAttendance.length > 0 
                              ? `${Math.round((studentAttendance.filter(a => a.status === 'present' || a.status === 'late').length / studentAttendance.length) * 100)}%`
                              : '100%'}
                          </span>
                        </div>
                        <div className="bg-slate-50 border p-4 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Total Days Logged</span>
                          <span className="text-xl font-black text-slate-800 block">{studentAttendance.length}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center space-y-1">
                          <span className="text-[10px] text-amber-700 block font-bold uppercase tracking-wide">Lateness Count</span>
                          <span className="text-xl font-black text-amber-800 block">
                            {studentAttendance.filter(a => a.status === 'late').length}
                          </span>
                        </div>
                      </div>

                      {/* Log lists */}
                      <div className="space-y-3" id="attendance-list-logs">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Presence Activity history</h4>
                        <div className="space-y-2" id="student-presence-list">
                          {studentAttendance.map((rec, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50/50 rounded-xl border border-slate-100/60" id={`student-attend-row-${idx}`}>
                              <span className="text-xs font-bold text-slate-700">{new Date(rec.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                rec.status === 'present' ? 'bg-teal-100 text-teal-800' :
                                rec.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {rec.status}
                              </span>
                            </div>
                          ))}
                          {studentAttendance.length === 0 && (
                            <div className="py-8 text-center text-slate-400 text-xs">
                              No institution attendance sheets recorded for you yet.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                case 'bookmarks':
                  // Saved Notes & Videos direct click dashboard
                  return (
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6" id="student-bookmarks-view">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 font-display">Personal Saved Documents Wallet</h3>
                        <p className="text-[11px] text-gray-400">Review your compiled saved study materials and lectures.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="bookmarks-items-grid">
                        {studentBookmarks.map((b, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleNavigateToSubject(b.itemId)} // redirects to subject or deep links
                            className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl hover:border-sky-200 transition-colors cursor-pointer flex flex-col justify-between h-28"
                            id={`bookmark-card-student-${idx}`}
                          >
                            <div>
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase">
                                Saved {b.itemType}
                              </span>
                              <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-2">{b.title}</h4>
                            </div>
                            <span className="text-[10px] text-sky-600 font-semibold block text-right mt-1">
                              View folder &rarr;
                            </span>
                          </div>
                        ))}
                        {studentBookmarks.length === 0 && (
                          <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
                            Your bookmarks folder is empty. Highlight note action cards with Bookmark symbols inside course chapters.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                
                case 'settings':
                  return (
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6" id="student-settings-view">
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-800 font-display">Student Portal Credentials Settings</h3>
                        <p className="text-[11px] text-gray-400">Modify your portal passwords and security parameters.</p>
                      </div>
                      
                      <form onSubmit={(e) => { e.preventDefault(); alert('Password updated successfully on security log.'); }} className="space-y-4 text-xs font-semibold text-slate-500">
                        <div>
                          <label className="block mb-1">Full Registered Student Name</label>
                          <input type="text" disabled value={user.name} className="w-full p-2.5 bg-slate-50 border rounded-xl text-slate-400 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block mb-1">Roll / GR Number Index</label>
                          <input type="text" disabled value={user.grNumber} className="w-full p-2.5 bg-slate-50 border rounded-xl text-slate-400 font-mono cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block mb-1">Modify Portal Password</label>
                          <input type="password" required placeholder="Type new secure portal password..." className="w-full p-2.5 border rounded-xl bg-white text-slate-800" />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                          Update Security Credentials
                        </button>
                      </form>
                    </div>
                  );

                default:
                  return null;
              }
            })()
          ) : (
            // ADMIN WORKSPACE COMPONENT ROUTER SWITCH
            (() => {
              switch (activeAdminTab) {
                
                case 'dashboard':
                  return <AdminDashboard />;
                
                case 'classes':
                  return <AdminClasses />;
                
                case 'notes':
                  return <AdminNotes />;
                
                case 'videos':
                  return <AdminVideos />;
                
                case 'students':
                  return <AdminStudents />;
                
                case 'matrix':
                  return <AdminAccessMatrix />;
                
                case 'announcements':
                  return <AdminAnnouncements />;
                
                case 'quizzes':
                  return <AdminQuizzes />;
                
                case 'assignments':
                  return <AdminAssignments />;
                
                case 'attendance':
                  return <AdminAttendance />;
                
                case 'supabase':
                  return <AdminSupabase />;
                
                default:
                  return null;
              }
            })()
          )}
        </div>

        {/* Footer Credit Tag strip */}
        <footer className="py-4 border-t border-gray-100 bg-white text-center text-[10px] text-gray-400 font-medium">
          The Ali Collegates LMS (TACLMS) • Version 4.1.2 Production • Secured with Student GR watermark tags
        </footer>

      </main>

      {/* OVERLAY: Dynamic Scholastic Level Up splash fireworks celebrate modal */}
      <AnimatePresence>
        {showLevelUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" id="level-up-modal">
            <motion.div 
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="bg-white rounded-3xl p-8 max-w-sm text-center space-y-5 border border-sky-200 shadow-2xl relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute top-10 left-10 h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                <div className="absolute top-24 right-12 h-3.5 w-3.5 rounded-full bg-sky-500 animate-ping" />
                <div className="absolute bottom-16 left-16 h-2 w-2 bg-rose-500 rounded animate-ping" />
              </div>

              <div className="inline-flex p-4 bg-sky-50 text-sky-600 rounded-full border border-sky-100">
                <Trophy size={48} className="text-amber-500 animate-bounce" fill="currentColor" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">Congratulations Academic Achievement!</span>
                <h3 className="text-xl font-bold text-slate-800 font-display">Level Up Reached!</h3>
                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                  Professor Ali has recognized your consistent learning dedication! You have successfully upgraded.
                </p>
              </div>

              <div className="flex justify-center items-center gap-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 max-w-xs mx-auto">
                <div className="text-center">
                  <span className="text-[9px] text-gray-400 block font-semibold uppercase">Old level</span>
                  <span className="text-md font-bold text-slate-500 font-mono">Lvl {levelUpData.oldLevel}</span>
                </div>
                <div className="text-slate-400 text-sm">&rarr;</div>
                <div className="text-center">
                  <span className="text-[9px] text-sky-500 block font-semibold uppercase">New level</span>
                  <span className="text-lg font-black text-sky-600 font-mono">Lvl {levelUpData.newLevel}</span>
                </div>
              </div>

              <button
                onClick={() => setShowLevelUp(false)}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Continue Studies!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
