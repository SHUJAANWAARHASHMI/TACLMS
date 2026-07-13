import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, ClassRoom } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle, 
  Languages, 
  Key, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Search, 
  Lock, 
  ShoppingBag,
  Atom,
  FlaskConical,
  Binary,
  BookOpen,
  FileText,
  Zap,
  Sparkles,
  Percent,
  MapPin,
  Phone,
  MessageSquare
} from 'lucide-react';

const coursesData = {
  '9th': [
    {
      id: '9-phy',
      name: 'Physics',
      urduName: 'طبیعیات',
      icon: 'Atom',
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50/50',
      borderCol: 'hover:border-blue-200',
      intro: 'Covers physical quantities, kinematics, dynamics, gravitation, work & energy, and properties of matter with conceptual simulations.',
      urduIntro: 'طبیعی مقداریں، کائینی میٹکس، ڈائنامکس، کشش ثقل، کام اور توانائی، اور مادے کی خصوصیات کے تصوراتی اسباق۔',
      topics: ['Kinematics & Motion', 'Forces & Dynamics', 'Work, Power & Energy', 'Properties of Matter']
    },
    {
      id: '9-chem',
      name: 'Chemistry',
      urduName: 'کیمسٹری',
      icon: 'FlaskConical',
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50/50',
      borderCol: 'hover:border-emerald-200',
      intro: 'Explore the fundamental periodic table, chemical bonding, chemical reactivity, and physical states of matter through simplified lectures.',
      urduIntro: 'بنیادی پیریڈک ٹیبل، کیمیائی بانڈنگ، کیمیائی رد عمل، اور مادے کی طبعی حالتوں کے تفصیلی اور آسان موضوعات۔',
      topics: ['Structure of Atoms', 'Periodic Table', 'Chemical Bonding', 'Physical States of Matter']
    },
    {
      id: '9-math',
      name: 'Mathematics',
      urduName: 'ریاضی',
      icon: 'Binary',
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50/50',
      borderCol: 'hover:border-amber-200',
      intro: 'Master matrices, logarithms, algebraic expressions, practical geometry, and theorem derivations with solved board papers.',
      urduIntro: 'میٹرکس، لاگرتھم، الجبری جملے، عملی جیومیٹری، اور بورڈ کے حل شدہ پرچوں کے ساتھ تھیورمز۔',
      topics: ['Matrices & Determinants', 'Logarithms & Algebra', 'Linear Equations', 'Practical Geometry']
    },
    {
      id: '9-eng',
      name: 'English',
      urduName: 'انگریزی',
      icon: 'BookOpen',
      color: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50/50',
      borderCol: 'hover:border-purple-200',
      intro: 'Grammar essentials, active/passive voice, tenses, prose analysis, and poetry comprehension to secure maximum marks in board exams.',
      urduIntro: 'گرامر کی بنیادی باتیں، ایکٹو/پیسیو وائس، ٹینسز، نثر اور شاعری کا تفصیلی بورڈ کی تیاری کا احاطہ۔',
      topics: ['Grammar Essentials', 'Tenses & Voices', 'Comprehension & Vocabulary', 'Board Essay Writing']
    }
  ],
  '10th': [
    {
      id: '10-phy',
      name: 'Physics',
      urduName: 'طبیعیات',
      icon: 'Zap',
      color: 'from-blue-500 to-cyan-600',
      bgLight: 'bg-cyan-50/50',
      borderCol: 'hover:border-cyan-200',
      intro: 'In-depth lectures on simple harmonic motion, wave mechanics, electromagnetism, basic electronics, and modern technology.',
      urduIntro: 'سادہ ہارمونک موشن، لہروں کی میکانکس، الیکٹرو میگنیٹزم، بنیادی الیکٹرانکس، اور انفارمیشن ٹیکنالوجی۔',
      topics: ['Harmonic Motion & Waves', 'Electromagnetism', 'Basic Electronics', 'Atomic & Nuclear Physics']
    },
    {
      id: '10-chem',
      name: 'Chemistry',
      urduName: 'کیمسٹری',
      icon: 'Sparkles',
      color: 'from-teal-500 to-emerald-600',
      bgLight: 'bg-teal-50/50',
      borderCol: 'hover:border-teal-200',
      intro: 'Comprehensive guide on organic chemistry, biochemistry, atmospheric gases, environmental challenges, and chemical industries.',
      urduIntro: 'نامیاتی کیمسٹری (آرگینک)، بائیو کیمسٹری، کرہ ہوائی، ماحولیاتی چیلنجز، اور کیمیائی صنعتوں پر جامع گائیڈ۔',
      topics: ['Organic Chemistry', 'Biochemistry', 'Environmental Chemistry', 'Chemical Industries']
    },
    {
      id: '10-math',
      name: 'Mathematics',
      urduName: 'ریاضی',
      icon: 'Percent',
      color: 'from-orange-500 to-red-600',
      bgLight: 'bg-orange-50/50',
      borderCol: 'hover:border-orange-200',
      intro: 'Advanced study of sets, functions, basic statistics, trigonometry, circle theorems, and coordinate geometry.',
      urduIntro: 'سیٹ اور فنکشنز، بنیادی شماریات (اسٹیٹسٹکس)، ٹرگنومیٹری، دائرے کے تھیورمز، اور کوآرڈینیٹ جیومیٹری کا تفصیلی مطالعہ۔',
      topics: ['Sets and Functions', 'Basic Statistics', 'Trigonometry Introduction', 'Theorems of Circles']
    },
    {
      id: '10-eng',
      name: 'English',
      urduName: 'انگریزی',
      icon: 'FileText',
      color: 'from-pink-500 to-rose-600',
      bgLight: 'bg-rose-50/50',
      borderCol: 'hover:border-rose-200',
      intro: 'Advanced essay writing, translation skills, complex sentence structures, and Karachi Board exam prompt strategies.',
      urduIntro: 'اعلیٰ مضمون نویسی، ترجمہ کی مہارت، پیچیدہ جملوں کی ساخت، اور بورڈ امتحان کی تیاری کے لیے حکمت عملی۔',
      topics: ['Karachi Board Prompts', 'Advanced Essay Construction', 'Translation Mechanics', 'Literature Comprehension']
    }
  ]
};

const renderCourseIcon = (iconName: string) => {
  switch (iconName) {
    case 'Atom':
      return <Atom className="text-white" size={20} />;
    case 'FlaskConical':
      return <FlaskConical className="text-white" size={20} />;
    case 'Binary':
      return <Binary className="text-white" size={20} />;
    case 'BookOpen':
      return <BookOpen className="text-white" size={20} />;
    case 'Zap':
      return <Zap className="text-white" size={20} />;
    case 'Sparkles':
      return <Sparkles className="text-white" size={20} />;
    case 'Percent':
      return <Percent className="text-white" size={20} />;
    case 'FileText':
      return <FileText className="text-white" size={20} />;
    default:
      return <BookOpen className="text-white" size={20} />;
  }
};
import { motion, AnimatePresence } from 'motion/react';
import loginIllustration from '../assets/images/login_illustration_1783675519524.jpg';

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
  
  // Custom courses showcase states
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [selectedShowcaseClass, setSelectedShowcaseClass] = useState<'9th' | '10th'>('9th');

  const scrollToCourses = () => {
    setShowCoursesDropdown(false);
    setTimeout(() => {
      const element = document.getElementById('courses-showcase-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Pakistan');
  const [city, setCity] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accaId, setAccaId] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // UI States for custom fields
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  
  // UI States
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load classes for registration dropdown
    api.getClasses()
      .then(cms => {
        setClasses(cms);
        if (cms.length > 0) {
          setSelectedClasses([cms[0].id]);
        }
      })
      .catch(err => console.error('Error loading classes', err));
  }, []);

  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (selectedClasses.length === 0) {
      setError('Please select at least one class to register.');
      setLoading(false);
      return;
    }

    try {
      const finalName = `${firstName} ${lastName}`.trim();
      const finalGrNumber = accaId || ('ACCA-' + Math.floor(100000 + Math.random() * 900000));
      
      const res = await api.register({
        email,
        name: finalName,
        grNumber: finalGrNumber,
        firstName,
        lastName,
        phone,
        country,
        city,
        accaId,
        password,
        classIds: selectedClasses
      });
      
      setSuccessMsg(res.message);
      
      // Reset form fields
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setCountry('Pakistan');
      setCity('');
      setAccaId('');
      
      // Switch back to student login after a short delay or immediately
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
    <div className={`min-h-screen bg-white flex flex-col justify-between ${isRtl ? 'urdu-text-direction font-urdu' : 'font-sans'}`} id="welcome-container">
      
      {/* Premium Deep Purple Top Navbar matching screenshot */}
      <header className="bg-[#00245b] text-white py-4 px-6 md:px-8 shadow-lg flex justify-between items-center z-10 transition-colors" id="premium-header">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" id="brand-logo" onClick={() => setActiveTab('student')}>
          <div className="bg-yellow-400 text-[#00245b] p-2 rounded-xl flex items-center justify-center shadow-md shadow-yellow-400/20">
            <GraduationCap size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-black tracking-wider font-display flex items-center gap-1">
              THE ALI'S <span className="text-yellow-400">COLLEGIATE</span>
            </h1>
            <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest leading-none">Learning Management System</p>
          </div>
        </div>

        {/* Center Pill Menu Links (as styled in screenshot) */}
        <div className="hidden lg:flex border border-white/15 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xs items-center gap-6 text-xs font-semibold text-white/90 relative" id="pill-nav-menu">
          <a href="#about" onClick={(e) => { e.preventDefault(); alert('We are Karachi’s leading board preparation institute with over 20 years of academic excellence.'); }} className="hover:text-yellow-300 transition-colors">About Us</a>
          
          {/* Interactive Dropdown for Courses */}
          <div className="relative" id="courses-menu-dropdown-trigger">
            <button 
              onClick={() => setShowCoursesDropdown(!showCoursesDropdown)}
              className="flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition-colors focus:outline-none font-semibold text-xs text-white/90"
            >
              <span>{lang === 'en' ? 'Courses' : 'کورسز'}</span>
              <ChevronDown size={11} className={`transition-transform duration-300 ${showCoursesDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCoursesDropdown && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 mt-5 w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-slate-800 animate-fade-in"
                  style={{ top: '100%' }}
                  id="courses-dropdown-floating"
                >
                  <div className="p-4 bg-[#00245b] text-white flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-yellow-400">Our Board Batches</h4>
                      <p className="text-[10px] text-white/70">Karachi Board Matric Prep 2026</p>
                    </div>
                    <span className="text-[9px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">New Syllabus</span>
                  </div>
                  
                  <div className="grid grid-cols-2 divide-x divide-slate-100 p-2">
                    {/* 9th Grade Col */}
                    <div className="p-3 space-y-3">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                        <span className="font-black text-xs text-[#00245b]">9th Grade</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold">Matric I</span>
                      </div>
                      <div className="space-y-2">
                        {coursesData['9th'].map(c => (
                          <div key={c.id} className="text-left cursor-pointer group" onClick={() => { setSelectedShowcaseClass('9th'); scrollToCourses(); }}>
                            <h5 className="text-[10px] font-bold text-slate-700 group-hover:text-[#00245b] transition-colors flex items-center gap-1">
                              <span className="text-indigo-500">•</span> {c.name}
                            </h5>
                            <p className="text-[8px] text-slate-400 line-clamp-1 group-hover:text-slate-500">
                              {lang === 'en' ? c.intro : c.urduIntro}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 10th Grade Col */}
                    <div className="p-3 space-y-3">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-50">
                        <span className="font-black text-xs text-[#00245b]">10th Grade</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md font-bold">Matric II</span>
                      </div>
                      <div className="space-y-2">
                        {coursesData['10th'].map(c => (
                          <div key={c.id} className="text-left cursor-pointer group" onClick={() => { setSelectedShowcaseClass('10th'); scrollToCourses(); }}>
                            <h5 className="text-[10px] font-bold text-slate-700 group-hover:text-[#00245b] transition-colors flex items-center gap-1">
                              <span className="text-indigo-500">•</span> {c.name}
                            </h5>
                            <p className="text-[8px] text-slate-400 line-clamp-1 group-hover:text-slate-500">
                              {lang === 'en' ? c.intro : c.urduIntro}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 p-2 text-center border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={scrollToCourses}
                      className="text-[#00245b] text-[10px] font-bold hover:underline"
                    >
                      View Full Details below &rarr;
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <a href="#results" onClick={(e) => { e.preventDefault(); alert('Our results speak for themselves! Every year, our students secure top positions in Karachi Board Board Exams.'); }} className="hover:text-yellow-300 transition-colors">Results</a>
          <div className="flex items-center gap-1 cursor-pointer hover:text-yellow-300 transition-colors" onClick={() => alert('Additional modules: Doubts, Testimonials, Live Lectures, Secure PDF Downloads.')}>
            <span>More</span>
            <ChevronDown size={11} />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3" id="navbar-right-controls">
          {/* Language translation switch */}
          <button
            onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all cursor-pointer mr-1"
            id="lang-toggle-btn"
          >
            <Languages size={14} />
            <span>{lang === 'en' ? 'اردو' : 'English'}</span>
          </button>

          {/* Login Action */}
          <button
            onClick={() => { setActiveTab('student'); setError(null); }}
            className={`px-4 py-2 text-xs font-bold border border-white/20 rounded-full flex items-center gap-2 text-white hover:bg-white/10 transition-all cursor-pointer ${
              activeTab === 'student' ? 'bg-white/10 border-white/40 shadow-xs' : ''
            }`}
            id="nav-login-btn"
          >
            <span>Login</span>
            <span className="w-4 h-4 rounded-full bg-white text-[#00245b] flex items-center justify-center text-[9px] font-black shrink-0">↗</span>
          </button>

          {/* Register Action */}
          <button
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`px-4 py-2 text-xs font-bold border border-white/20 rounded-full flex items-center gap-2 text-white hover:bg-white/10 transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white/10 border-white/40 shadow-xs' : ''
            }`}
            id="nav-register-btn"
          >
            <span>Register</span>
            <span className="w-4 h-4 rounded-full bg-white text-[#00245b] flex items-center justify-center text-[9px] font-black shrink-0">↗</span>
          </button>

          {/* Secret/Mock Admin Tab switch hidden inside header */}
          {showAdminTab && (
            <button
              onClick={() => { setActiveTab('admin'); setError(null); }}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-all cursor-pointer`}
              id="nav-admin-btn"
            >
              Admin Portal
            </button>
          )}

          {/* Shopping Bag Icon Button */}
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#00245b] shadow-md hover:scale-105 transition-transform cursor-pointer shrink-0" id="cart-bag-btn">
            <ShoppingBag size={15} className="stroke-[2.5]" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-10 md:py-14 px-6 md:px-12 w-full max-w-7xl mx-auto" id="auth-main-layout">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full" id="auth-split-grid">
          
          {/* Left Form Panel */}
          <div className={`lg:col-span-5 space-y-6 ${activeTab === 'register' ? 'lg:col-span-7' : 'lg:col-span-5'}`} id="form-container-panel">
            
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black text-[#00245b] font-display tracking-tight leading-tight" id="main-auth-title">
                {activeTab === 'register' 
                  ? 'Sign up' 
                  : (activeTab === 'admin' ? 'Admin Login' : 'Login')
                }
              </h2>
              <p className="text-slate-500 font-medium text-xs md:text-sm" id="main-auth-subtitle">
                {activeTab === 'register' 
                  ? 'to create your secure TACLMS learning account.' 
                  : 'to access your secure TACLMS account.'
                }
              </p>
            </div>

            {/* Error and Success Banners */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-2xs"
                  id="error-banner"
                >
                  <ShieldAlert className="shrink-0 text-rose-500 mt-0.5" size={15} />
                  <span>{error}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl text-xs font-semibold shadow-2xs"
                  id="success-banner"
                >
                  <div className="flex gap-2 items-center font-bold text-emerald-900 mb-1.5">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span>{getTranslation(lang, 'pendingApprovalTitle')}</span>
                  </div>
                  <p className="text-emerald-700 leading-relaxed font-medium">
                    {successMsg}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login & Register Forms */}
            {activeTab !== 'register' ? (
              <form onSubmit={handleLogin} className="space-y-4" id="login-form">
                
                {/* Email Address Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                    id="login-email-input"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter Your Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-5 pr-12 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="login-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  
                  {/* Seeded password guide info */}
                  <div className="pt-1.5 px-1 flex justify-between items-center text-[10px] text-slate-400 font-bold tracking-wider">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                      <Key size={10} className="text-slate-500" />
                      <span>{activeTab === 'admin' ? 'Default: admin123' : 'Default: student123'}</span>
                    </span>
                  </div>
                </div>

                {/* Remember Me and Forgot Password bar */}
                <div className="flex justify-between items-center px-1 text-xs font-bold pt-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-500 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-[#00245b] border-slate-300 rounded-md focus:ring-[#00245b]/20"
                    />
                    <span>Remember me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => alert('Please contact administrator on WhatsApp to reset password.')}
                    className="text-[#00245b] hover:underline transition-all cursor-pointer" 
                    id="forgot-password-btn"
                  >
                    Forgot Password
                  </button>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00245b] hover:bg-[#00133a] text-white py-3.5 rounded-full font-bold transition-all shadow-md hover:shadow-lg flex justify-center items-center gap-2 mt-6 cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                  id="login-submit-btn"
                >
                  <span>{loading ? 'Logging in...' : 'Login'}</span>
                  <ArrowRight size={15} />
                </button>

                {/* Switch to Register promo */}
                <div className="text-center pt-3 text-xs font-bold text-slate-500">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setError(null);
                    }}
                    className="text-[#00245b] hover:underline font-black cursor-pointer ml-1"
                    id="signup-link-btn"
                  >
                    Sign up
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in" id="register-form">
                
                {/* Name fields row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-firstname-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-lastname-input"
                    />
                  </div>
                </div>

                {/* Email and Phone row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Enter Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-email-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Enter Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-phone-input"
                    />
                  </div>
                </div>

                {/* Country and City row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  {/* Country Field */}
                  <div className="space-y-1 relative">
                    <label className="block text-xs font-bold text-slate-700">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="w-full flex justify-between items-center px-5 py-3 border border-slate-200 rounded-full text-slate-800 focus:outline-none transition-all text-xs font-medium bg-white"
                      id="register-country-btn"
                    >
                      <span>{country}</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Country Popup Modal */}
                    <AnimatePresence>
                      {showCountryDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden max-h-52 flex flex-col"
                          id="country-dropdown-popup"
                        >
                          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                            <Search size={13} className="text-slate-400 shrink-0 ml-1" />
                            <input
                              type="text"
                              placeholder="Search country..."
                              value={countrySearchQuery}
                              onChange={(e) => setCountrySearchQuery(e.target.value)}
                              className="w-full bg-transparent border-0 p-1 text-xs focus:outline-none text-slate-800 placeholder-slate-400"
                            />
                          </div>
                          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
                            {['Pakistan', 'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'Australia', 'Oman', 'Qatar', 'Bahrain', 'Kuwait', 'India', 'Bangladesh']
                              .filter(c => c.toLowerCase().includes(countrySearchQuery.toLowerCase()))
                              .map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    setCountry(c);
                                    setShowCountryDropdown(false);
                                    setCountrySearchQuery('');
                                  }}
                                  className={`w-full px-4 py-2.5 text-left text-xs font-semibold hover:bg-slate-50 transition-all text-slate-700 flex justify-between items-center ${
                                    country === c ? 'bg-indigo-50 text-[#00245b]' : ''
                                  }`}
                                >
                                  <span>{c}</span>
                                  {country === c && <div className="w-1.5 h-1.5 bg-[#00245b] rounded-full" />}
                                </button>
                              ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* City Field */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Enter City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-city-input"
                    />
                  </div>
                </div>

                {/* Password and Confirm Password Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-password-input"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                      id="register-confirm-password-input"
                    />
                  </div>
                </div>

                {/* ACCA ID (Optional) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    ACCA ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter ACCA ID (if applicable)"
                    value={accaId}
                    onChange={(e) => setAccaId(e.target.value)}
                    className="w-full px-5 py-3 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00245b]/10 focus:border-[#00245b] transition-all bg-white text-slate-800 text-xs font-medium"
                    id="register-acca-input"
                  />
                </div>

                {/* Select Class/Batch Picker */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Class / Batch <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border border-slate-100 rounded-2xl bg-slate-50/50" id="register-classes-list">
                    {classes.map((cls) => {
                      const isSelected = selectedClasses.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleClassToggle(cls.id)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                            isSelected 
                              ? 'bg-[#00245b] border-[#00245b] text-white shadow-xs' 
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {cls.name}
                        </button>
                      );
                    })}
                    {classes.length === 0 && (
                      <span className="text-[10px] text-slate-400 p-1">Loading classes...</span>
                    )}
                  </div>
                </div>

                {/* Create Account Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#00245b] hover:bg-[#00133a] text-white py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg text-xs uppercase tracking-wider cursor-pointer flex justify-center items-center gap-2 mt-6 disabled:bg-slate-300 disabled:cursor-not-allowed"
                  id="register-submit-btn"
                >
                  <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                </button>

                {/* Back to login */}
                <div className="text-center pt-2 text-xs font-bold text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('student');
                      setError(null);
                    }}
                    className="text-[#00245b] hover:underline font-black cursor-pointer"
                    id="login-link-btn"
                  >
                    Login
                  </button>
                </div>
              </form>
            )}

          </div>

          {/* Right Visual Panel matching the image mockup exactly */}
          <div className="hidden lg:flex lg:col-span-7 justify-center" id="illustration-container">
            <div className="bg-[#edf2ff] rounded-[2.5rem] p-10 xl:p-14 w-full max-w-[540px] flex items-center justify-center relative overflow-hidden aspect-square shadow-2xs" id="mockup-frame">
              
              {/* Outer decorative soft color spots to make it feel super premium */}
              <div className="absolute top-[-10%] right-[-1%] w-44 h-44 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-[-10%] left-[-5%] w-48 h-48 bg-purple-200/35 rounded-full blur-3xl pointer-events-none" />

              {/* The premium generated secure illustration */}
              <motion.img 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                src={loginIllustration} 
                alt="Secure Login Mobile System Illustration" 
                className="max-h-[380px] w-auto object-contain rounded-2xl relative z-10 transition-transform duration-500 hover:scale-[1.03]"
                id="main-login-image"
              />

              {/* Verified secure badge overlay */}
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md border border-slate-100 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-sm z-20" id="verified-security-badge">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase text-[#00245b] tracking-wider">End-to-End Encrypted</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Beautiful Interactive 9th & 10th Grade Courses Showcase Section */}
      <section className="bg-slate-50/50 py-16 px-6 md:px-12 border-t border-b border-slate-100 scroll-mt-6" id="courses-showcase-section">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#00245b] bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
              {lang === 'en' ? 'Our Premium Syllabus' : 'ہمارا بہترین سلیبس'}
            </span>
            <h3 className="text-3xl md:text-4xl font-black text-[#00245b] font-display tracking-tight">
              {lang === 'en' ? 'Explore 9th & 10th Class Batches' : 'نویں اور دسویں جماعت کے کورسز'}
            </h3>
            <p className="text-slate-500 font-medium max-w-xl mx-auto text-xs md:text-sm leading-relaxed">
              {lang === 'en' 
                ? 'Prepare with Karachi’s absolute best subject experts. Each course includes solved board-standard past papers, detailed videos, & bilingual PDF books.' 
                : 'کراچی کے بہترین اساتذہ کے ساتھ نویں اور دسویں بورڈ امتحانات کی بھرپور تیاری کریں۔ ہر کورس میں ویڈیو لیکچرز اور بورڈ کے حل شدہ پرچے شامل ہیں۔'}
            </p>
          </div>

          {/* Tab selectors */}
          <div className="flex justify-center items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedShowcaseClass('9th')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                selectedShowcaseClass === '9th' 
                  ? 'bg-[#00245b] text-white border-[#00245b] shadow-md shadow-[#00245b]/10' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang === 'en' ? '9th Class (Matric I)' : 'نویں جماعت (میٹرک حصہ اول)'}
            </button>
            <button
              type="button"
              onClick={() => setSelectedShowcaseClass('10th')}
              className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                selectedShowcaseClass === '10th' 
                  ? 'bg-[#00245b] text-white border-[#00245b] shadow-md shadow-[#00245b]/10' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lang === 'en' ? '10th Class (Matric II)' : 'دسویں جماعت (میٹرک حصہ دوم)'}
            </button>
          </div>

          {/* Courses grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coursesData[selectedShowcaseClass].map((course) => (
              <div 
                key={course.id}
                className={`bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between ${course.borderCol}`}
              >
                <div className="space-y-4">
                  {/* Icon & Grade badge */}
                  <div className="flex justify-between items-start">
                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${course.color} flex items-center justify-center shadow-sm`}>
                      {renderCourseIcon(course.icon)}
                    </div>
                    <span className="text-[9px] bg-indigo-50 text-[#00245b] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {selectedShowcaseClass} Prep
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                      <span>{course.name}</span>
                      <span className="text-xs text-slate-400 font-bold font-urdu">({course.urduName})</span>
                    </h4>
                  </div>

                  {/* Short Introduction */}
                  <p className="text-slate-500 font-semibold text-[11px] leading-relaxed line-clamp-4">
                    {lang === 'en' ? course.intro : course.urduIntro}
                  </p>

                  {/* Syllabus Key topics list */}
                  <div className="pt-2 border-t border-slate-50 space-y-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block">Core Chapters:</span>
                    <ul className="space-y-1">
                      {course.topics.map((topic, idx) => (
                        <li key={idx} className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setError(null);
                    // Smooth scroll up to signup form
                    document.getElementById('welcome-container')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-6 bg-[#00245b]/5 hover:bg-[#00245b] text-[#00245b] hover:text-white py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === 'en' ? 'Register Now' : 'داخلہ لیں'}</span>
                  <span>↗</span>
                </button>
              </div>
            ))}
          </div>

          {/* Quick trust metrics */}
          <div className="bg-[#00245b] text-white rounded-3xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10 shadow-lg">
            <div className="space-y-1 py-2 md:py-0">
              <p className="text-2xl font-black text-yellow-400">100%</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{lang === 'en' ? 'Board Syllabus Coverage' : 'بورڈ نصاب کا مکمل احاطہ'}</p>
            </div>
            <div className="space-y-1 py-2 md:py-0">
              <p className="text-2xl font-black text-yellow-400">20+ Years</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{lang === 'en' ? 'Academic Teaching Legacy' : 'تدریسی مہارت کا تجربہ'}</p>
            </div>
            <div className="space-y-1 py-2 md:py-0">
              <p className="text-2xl font-black text-yellow-400">URDU / ENGLISH</p>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{lang === 'en' ? 'Dual Medium Study Notes' : 'اردو اور انگلش میڈیم سپورٹ'}</p>
            </div>
          </div>

          {/* Flyer-Style Admissions & Contact Banner */}
          <div className="mt-8 bg-gradient-to-r from-[#00173d] to-[#00245b] text-white rounded-3xl p-6 md:p-8 border border-yellow-400/30 shadow-xl relative overflow-hidden" id="flyer-contact-banner">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#004aad]/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center relative z-10">
              
              {/* WhatsApp Contact Box */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-yellow-400/40 transition-all group">
                <div className="bg-emerald-500 text-white p-3 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <MessageSquare size={22} className="fill-white/10" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">{lang === 'en' ? 'WhatsApp Helpline' : 'واٹس ایپ ہیلپ لائن'}</h4>
                  <div className="space-y-0.5 mt-1">
                    <p className="text-sm font-bold font-mono tracking-wider hover:text-emerald-400 transition-colors">
                      <a href="https://wa.me/923183749686" target="_blank" rel="noreferrer">0318 3749686</a>
                    </p>
                    <p className="text-sm font-bold font-mono tracking-wider hover:text-emerald-400 transition-colors">
                      <a href="https://wa.me/923192014240" target="_blank" rel="noreferrer">0319 2014240</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Campus Location Box */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 hover:border-yellow-400/40 transition-all group">
                <div className="bg-[#004aad] text-white p-3 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <MapPin size={22} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-widest">{lang === 'en' ? 'Campus Address' : 'کیمپس کا پتہ'}</h4>
                  <p className="text-xs font-bold leading-relaxed mt-1 text-slate-200">
                    House # 72/17, Near New Oxford Grammar School, Sector 11-F New Karachi.
                  </p>
                </div>
              </div>

              {/* Session / Academic Head Badge */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4 bg-yellow-400 text-[#00245b] p-5 rounded-2xl font-display shadow-lg border border-yellow-300">
                <div className="text-center">
                  <span className="text-[9px] uppercase font-black tracking-widest opacity-80 block">{lang === 'en' ? 'Now Enrolling' : 'داخلے جاری ہیں'}</span>
                  <span className="text-xl font-black tracking-tighter uppercase block leading-none mt-1">SESSION 2026-27</span>
                </div>
                <div className="w-full h-px bg-[#00245b]/10 sm:w-px sm:h-8 lg:w-full lg:h-px my-1"></div>
                <div className="text-center">
                  <span className="text-[9px] uppercase font-black tracking-widest opacity-80 block">{lang === 'en' ? 'Academic Head' : 'اکیڈمک ہیڈ'}</span>
                  <span className="text-sm font-black tracking-tight block leading-none mt-1">SIR ALI ASLAM</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Footer Branding */}
      <footer 
        onClick={handleFooterClick}
        className="text-center py-6 text-xs text-slate-400 font-semibold tracking-wide cursor-pointer select-none active:scale-[0.99] transition-transform border-t border-slate-100"
        id="app-footer"
      >
        &copy; 2026 The Ali's Collegiate private LMS (TACLMS) • All rights reserved
      </footer>
    </div>
  );
}
