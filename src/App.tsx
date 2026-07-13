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
import StudentVideos from './components/StudentVideos';
import StudentNotes from './components/StudentNotes';
import StudentProgress from './components/StudentProgress';
import StudentProfile from './components/StudentProfile';

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
import StudentTestimonials from './components/StudentTestimonials';
import AdminTestimonials from './components/AdminTestimonials';

import { 
  BookOpen, FolderOpen, HelpCircle, ClipboardList, Calendar, Bookmark, 
  Settings, LogOut, ShieldAlert, Users, Bell, Globe, Sparkles, Award, Trophy,
  BarChart2, FolderPlus, FileText, PlayCircle, ShieldCheck, Megaphone, Menu, X, CheckCircle, Database, MessageSquare, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type StudentTab = 'dashboard' | 'videos' | 'notes' | 'progress' | 'profile' | 'quizzes' | 'assignments';
type AdminTab = 'dashboard' | 'classes' | 'notes' | 'videos' | 'students' | 'matrix' | 'announcements' | 'quizzes' | 'assignments' | 'attendance' | 'supabase' | 'testimonials';

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
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">The Ali's Collegiate</p>
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
                  <Home size={16} />
                  <span>{lang === 'en' ? 'Home Dashboard' : 'ڈیش بورڈ ہوم'}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('videos'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'videos' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-videos"
                >
                  <PlayCircle size={16} />
                  <span>{lang === 'en' ? 'Video Lectures' : 'ویڈیو لیکچرز'}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('notes'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'notes' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-notes"
                >
                  <FileText size={16} />
                  <span>{lang === 'en' ? 'Study Notes' : 'مطالعہ نوٹس'}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('progress'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'progress' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-progress"
                >
                  <Trophy size={16} />
                  <span>{lang === 'en' ? 'My Progress' : 'میری کارکردگی'}</span>
                </button>
                <button
                  onClick={() => { setActiveStudentTab('profile'); setLinkedQuizId(undefined); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeStudentTab === 'profile' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="student-tab-profile"
                >
                  <Settings size={16} />
                  <span>{lang === 'en' ? 'My Profile' : 'میری پروفائل'}</span>
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
                <button
                  onClick={() => setActiveAdminTab('testimonials')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeAdminTab === 'testimonials' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                  id="admin-tab-testimonials"
                >
                  <MessageSquare size={16} />
                  <span>Testimonials Moderation</span>
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#00173d] border-b border-slate-200/20 px-4 flex items-center justify-between z-40 text-white" dir="ltr">
        <div className="flex items-center gap-2">
          <div className="bg-yellow-400 text-slate-950 p-1.5 rounded-lg shadow-sm">
            <Sparkles size={16} fill="currentColor" />
          </div>
          <span className="text-sm font-black tracking-tight text-white font-display uppercase">THE ALI'S LMS</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
            title="Toggle Urdu/English language"
          >
            <Globe size={18} />
          </button>
          {user.role === 'admin' ? (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
              title={getTranslation(lang, 'logout')}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu Overlays */}
      <AnimatePresence>
        {mobileMenuOpen && user.role === 'admin' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-30 p-5 flex flex-col justify-between overflow-y-auto border-t border-slate-100"
            dir="ltr"
          >
            <div className="space-y-6">
              <div className="bg-slate-900 text-white rounded-xl p-3 flex items-center gap-2 text-xs font-bold uppercase">
                <ShieldAlert size={14} className="text-blue-400" />
                <span>Lecturer Access Panel</span>
              </div>

              {/* Navigation list (Mobile) */}
              <nav className="space-y-1">
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
                    { tab: 'supabase', label: 'Supabase Sync', icon: <Database size={16} /> },
                    { tab: 'testimonials', label: 'Testimonials Moderation', icon: <MessageSquare size={16} /> }
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
        <div className={`flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-100px)] ${user?.role === 'student' ? 'pb-24 lg:pb-8' : ''}`} id="active-viewport-body">
          {user.role === 'student' ? (
            // STUDENT COMPONENT ROUTER SWITCH
            (() => {
              switch (activeStudentTab) {
                
                case 'dashboard':
                  return (
                    <StudentDashboard 
                      user={user} 
                      lang={lang} 
                      onNavigateSubject={(subId) => {
                        setActiveStudentTab('videos');
                        setLinkedSubjectId(subId);
                      }} 
                    />
                  );
                
                case 'videos':
                  return (
                    <StudentVideos 
                      user={user} 
                      lang={lang} 
                      onXPUpdated={handleXPUpdated}
                    />
                  );
                
                case 'notes':
                  return (
                    <StudentNotes 
                      user={user} 
                      lang={lang} 
                      onXPUpdated={handleXPUpdated}
                    />
                  );
                
                case 'progress':
                  return (
                    <StudentProgress 
                      user={user} 
                      lang={lang} 
                    />
                  );
                
                case 'profile':
                  return (
                    <StudentProfile 
                      user={user} 
                      lang={lang} 
                      onXPUpdated={handleXPUpdated}
                    />
                  );
                
                case 'quizzes':
                  return linkedQuizId ? (
                    <StudentQuiz 
                      user={user} 
                      lang={lang} 
                      quizId={linkedQuizId} 
                      onClose={() => { setLinkedQuizId(undefined); setActiveStudentTab('videos'); }}
                      onXPUpdated={handleXPUpdated}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-slate-400 text-sm">
                      Please enter through a Course Subject Folder in the Video tab and click "Take Quiz" under any chapter to load integrated MCQ exams.
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

                case 'testimonials':
                  return <AdminTestimonials />;
                
                default:
                  return null;
              }
            })()
          )}
        </div>

        {/* Footer Credit Tag strip */}
        <footer className="py-4 border-t border-gray-100 bg-white text-center text-[10px] text-gray-400 font-medium">
          The Ali's Collegiate LMS (TACLMS) • Version 4.1.2 Production • Secured with Student GR watermark tags
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
                  Sir Ali Aslam has recognized your consistent learning dedication! You have successfully upgraded.
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

      {/* MOBILE BOTTOM NAVIGATION BAR FOR STUDENTS */}
      {user && user.role === 'student' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200/80 flex justify-around items-center z-40 px-2" id="mobile-bottom-nav">
          <button
            onClick={() => setActiveStudentTab('dashboard')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-all ${
              activeStudentTab === 'dashboard' ? 'text-[#004aad]' : 'text-slate-400'
            }`}
          >
            <Home size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'en' ? 'Home' : 'ہوم'}</span>
          </button>

          <button
            onClick={() => setActiveStudentTab('videos')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-all ${
              activeStudentTab === 'videos' ? 'text-[#004aad]' : 'text-slate-400'
            }`}
          >
            <PlayCircle size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'en' ? 'Videos' : 'ویڈیوز'}</span>
          </button>

          <button
            onClick={() => setActiveStudentTab('notes')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-all ${
              activeStudentTab === 'notes' ? 'text-[#004aad]' : 'text-slate-400'
            }`}
          >
            <FileText size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'en' ? 'Notes' : 'نوٹس'}</span>
          </button>

          <button
            onClick={() => setActiveStudentTab('progress')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-all ${
              activeStudentTab === 'progress' ? 'text-[#004aad]' : 'text-slate-400'
            }`}
          >
            <Trophy size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'en' ? 'Progress' : 'میری کارکردگی'}</span>
          </button>

          <button
            onClick={() => setActiveStudentTab('profile')}
            className={`flex flex-col items-center gap-1 flex-1 py-1 cursor-pointer transition-all ${
              activeStudentTab === 'profile' ? 'text-[#004aad]' : 'text-slate-400'
            }`}
          >
            <Settings size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'en' ? 'Profile' : 'پروفائل'}</span>
          </button>
        </div>
      )}

    </div>
  );
}
