import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { BookOpen, GraduationCap, ArrowRight, ShieldAlert, CheckCircle, Languages, Key, UserCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WelcomeScreenProps {
  onLoginSuccess: (user: User) => void;
  lang: 'en' | 'ur';
  setLang: (lang: 'en' | 'ur') => void;
}

export default function WelcomeScreen({ onLoginSuccess, lang, setLang }: WelcomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'admin' | 'register'>('student');
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [showAdminTab, setShowAdminTab] = useState(false);
  const [footerClicks, setFooterClicks] = useState(0);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [grNumber, setGrNumber] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load classes for registration dropdown
    api.getClasses()
      .then(setClasses)
      .catch(err => console.error('Error loading classes', err));
  }, []);

  const handleFooterClick = () => {
    setFooterClicks(prev => {
      const next = prev + 1;
      if (next >= 7) {
        setShowAdminTab(true);
        setActiveTab('admin');
      }
      return next;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await api.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    if (selectedClasses.length === 0) {
      setError('Please select at least one class to register.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.register({
        email,
        name: fullName,
        grNumber,
        classIds: selectedClasses
      });
      setSuccessMsg(res.message);
      // Reset form
      setEmail('');
      setFullName('');
      setGrNumber('');
      setSelectedClasses([]);
      setActiveTab('student');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const isRtl = lang === 'ur';

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-between ${isRtl ? 'urdu-text-direction font-urdu' : 'font-sans'}`} id="welcome-container">
      {/* Top Bar / Language Selector */}
      <header className="bg-white border-b border-gray-100 py-3 px-6 shadow-xs flex justify-between items-center z-10">
        <div className="flex items-center gap-2" id="brand-logo">
          <div className="bg-sky-500 text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-sky-100">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 font-display">TACLMS</h1>
            <p className="text-xs text-gray-500 font-medium tracking-wide">The Ali Collegates LMS</p>
          </div>
        </div>
        <button
          onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          id="lang-toggle-btn"
        >
          <Languages size={16} />
          <span>{lang === 'en' ? 'اردو (Urdu)' : 'English'}</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden animate-fade-in" id="auth-card">
          
          {/* Header Visual */}
          <div className="bg-gradient-to-br from-sky-600 to-sky-700 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen size={160} />
            </div>
            <span className="bg-sky-500/30 text-sky-100 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              {getTranslation(lang, 'appBrand')}
            </span>
            <h2 className="text-2xl font-bold font-display mt-3 leading-tight">
              {getTranslation(lang, 'appName')}
            </h2>
            <p className="text-sky-100/90 text-sm mt-1">
              {getTranslation(lang, 'tagline')}
            </p>
          </div>

          <div className="p-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-gray-100 mb-6" id="auth-tabs">
              <button
                onClick={() => { setActiveTab('student'); setError(null); }}
                className={`flex-1 text-center pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'student' 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                id="tab-student"
              >
                {getTranslation(lang, 'studentLogin')}
              </button>
              <button
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 text-center pb-3 text-sm font-semibold transition-colors border-b-2 ${
                  activeTab === 'register' 
                    ? 'border-sky-500 text-sky-600' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
                id="tab-register"
              >
                {getTranslation(lang, 'registerAccount')}
              </button>
              {showAdminTab && (
                <button
                  onClick={() => { setActiveTab('admin'); setError(null); }}
                  className={`flex-1 text-center pb-3 text-sm font-semibold transition-colors border-b-2 ${
                    activeTab === 'admin' 
                      ? 'border-sky-500 text-sky-600' 
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                  id="tab-admin"
                >
                  {getTranslation(lang, 'adminLogin')}
                </button>
              )}
            </div>

            {/* Success & Error Banners */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-lg text-sm mb-4 flex items-start gap-2.5"
                  id="error-banner"
                >
                  <ShieldAlert className="shrink-0 mt-0.5" size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-teal-50 border-l-4 border-teal-500 text-teal-800 p-4 rounded-lg text-sm mb-4"
                  id="success-banner"
                >
                  <div className="flex gap-2 items-center font-bold text-teal-900 mb-1">
                    <CheckCircle size={18} />
                    <span>{getTranslation(lang, 'pendingApprovalTitle')}</span>
                  </div>
                  <p className="text-teal-700 leading-relaxed text-xs">
                    {successMsg}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login & Register Forms */}
            {activeTab !== 'register' ? (
              <form onSubmit={handleLogin} className="space-y-4" id="login-form">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {getTranslation(lang, 'email')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={activeTab === 'admin' ? 'admin@taclms.edu' : 'student@taclms.edu'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-slate-50 text-slate-800 text-sm"
                    id="login-email-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    {getTranslation(lang, 'password')}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-slate-50 text-slate-800 text-sm"
                    id="login-password-input"
                  />
                  <div className="flex justify-between items-center mt-2.5">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Key size={12} />
                      <span>{activeTab === 'admin' ? 'Default: admin123' : 'Default: student123'}</span>
                    </span>
                    <button type="button" className="text-xs text-sky-600 hover:underline font-medium" id="forgot-password-btn">
                      {getTranslation(lang, 'forgotPassword')}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md shadow-sky-100 flex justify-center items-center gap-2 mt-6 cursor-pointer hover:shadow-lg disabled:bg-sky-300 disabled:cursor-not-allowed"
                  id="login-submit-btn"
                >
                  {loading ? '...' : (activeTab === 'admin' ? getTranslation(lang, 'adminLogin') : getTranslation(lang, 'studentLogin'))}
                  <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4" id="register-form">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {getTranslation(lang, 'fullName')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Muhammad Hamza"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-slate-50 text-slate-800 text-sm"
                    id="register-name-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {getTranslation(lang, 'email')}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. hamza@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-slate-50 text-slate-800 text-sm"
                    id="register-email-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {getTranslation(lang, 'grNumber')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GR-9823"
                    value={grNumber}
                    onChange={(e) => setGrNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-all bg-slate-50 text-slate-800 text-sm"
                    id="register-gr-input"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {getTranslation(lang, 'selectClass')} <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-slate-50" id="register-classes-list">
                    {classes.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer" id={`cls-opt-${cls.id}`}>
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(cls.id)}
                          onChange={() => handleClassToggle(cls.id)}
                          className="rounded border-gray-300 text-sky-600 focus:ring-sky-400 h-4 w-4 cursor-pointer"
                        />
                        <span>{cls.name}</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span className="text-xs text-gray-400">Loading available classes...</span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md shadow-sky-100 flex justify-center items-center gap-2 mt-6 cursor-pointer hover:shadow-lg disabled:bg-sky-300"
                  id="register-submit-btn"
                >
                  {loading ? '...' : getTranslation(lang, 'registerBtn')}
                  <UserCheck size={18} />
                </button>
              </form>
            )}

            {/* Interactive Roles Selector Guide */}
            <div className="mt-8 pt-6 border-t border-gray-100 text-center" id="role-guide">
              <span className="text-xs font-medium text-slate-400 flex items-center justify-center gap-1">
                <HelpCircle size={14} />
                <span>Default test credentials are seeded!</span>
              </span>
            </div>

          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer 
        onClick={handleFooterClick}
        className="text-center py-6 text-xs text-gray-400 font-medium tracking-wide cursor-pointer select-none active:scale-[0.99] transition-transform"
      >
        &copy; 2026 The Ali Collegates private LMS (TACLMS) • All rights reserved
      </footer>
    </div>
  );
}
