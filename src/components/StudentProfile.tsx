import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Testimonial } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  User as UserIcon, Settings, HelpCircle, Phone, MessageSquare, 
  MapPin, Star, Volume2, Moon, Sun, Bell, Globe, Sparkles, 
  CheckCircle, ChevronDown, ChevronUp, Send, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentProfileProps {
  user: User;
  lang: 'en' | 'ur';
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentProfile({ user, lang, onXPUpdated }: StudentProfileProps) {
  // Settings States
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('taclms_notifs') !== 'false'
  );
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('taclms_dark_mode') === 'true'
  );

  // Walkthrough slide states
  const [tutorialStep, setTutorialStep] = useState(0);

  // Testimonial submit state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingTestimony, setSubmittingTestimony] = useState(false);
  const [testimonySubmitted, setTestimonySubmitted] = useState(false);

  // FAQ states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const isRtl = lang === 'ur';

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError(lang === 'en' ? 'New password must be at least 8 characters long.' : 'نیا پاس ورڈ کم از کم 8 حروف کا ہونا ضروری ہے۔');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setPasswordError(lang === 'en' ? 'New password must contain both letters and numbers.' : 'نئے پاس ورڈ میں حروف اور نمبر دونوں ہونے چاہئیں۔');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'en' ? 'Passwords do not match.' : 'پاس ورڈ مماثل نہیں ہیں۔');
      return;
    }

    setChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Reward student with 10 XP for securing their account with a strong password!
      const res = await api.markAsCompleted('secured_student_password', 'note');
      if (res.success && res.xpEarned > 0) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    localStorage.setItem('taclms_dark_mode', String(nextDark));
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle Notifications
  const handleToggleNotifications = () => {
    const nextNotifs = !notificationsEnabled;
    setNotificationsEnabled(nextNotifs);
    localStorage.setItem('taclms_notifs', String(nextNotifs));
  };

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || submittingTestimony) return;
    setSubmittingTestimony(true);
    try {
      await api.submitTestimonial(rating, feedback);
      setTestimonySubmitted(true);
      setFeedback('');
      // Reward student with 15 XP for providing constructive app feedback!
      const res = await api.markAsCompleted('submitted_app_feedback', 'note');
      if (res.success && res.xpEarned > 0) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTestimony(false);
    }
  };

  const tutorialSlides = [
    {
      title: lang === 'en' ? 'Step 1: Finding Your Subjects' : 'مرحلہ 1: اپنے مضامین تلاش کرنا',
      desc: lang === 'en' 
        ? "Tap 'Home' or 'Videos/Notes' library tabs. All subjects matching your 9th, 10th or semester selection are pre-unlocked and accessible with single-tap navigation."
        : 'ہوم یا ویڈیوز/نوٹس لائبریری ٹیبز پر ٹیپ کریں۔ آپ کے منتخب کردہ کلاس کے تمام مضامین پہلے سے ان لاک اور قابل رسائی ہیں۔',
      img: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: lang === 'en' ? 'Step 2: Watch Videos & Track Progress' : 'مرحلہ 2: ویڈیوز دیکھیں اور کارکردگی ٹریک کریں',
      desc: lang === 'en'
        ? "Watch high-definition lectures in our YouTube-style player. When finished, tap 'Mark Done' to claim +25 XP rewards and increment your level bar!"
        : 'ہمارے جدید یوٹیوب طرز کے پلیئر میں لیکچرز دیکھیں۔ مکمل ہونے پر، 25 XP انعامات حاصل کرنے کے لیے "Mark Done" پر ٹیپ کریں!',
      img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: lang === 'en' ? 'Step 3: Access Secure Study Notes' : 'مرحلہ 3: محفوظ نوٹس ڈاؤن لوڈ یا مطالعہ کریں',
      desc: lang === 'en'
        ? "Browse reference materials by chapter. Open notes inline in our secure watermark viewer to prevent leaks, or download allowed PDFs instantly."
        : 'باب کے لحاظ سے حوالہ جاتی نوٹس دیکھیں۔ لیک ہونے سے بچنے کے لیے ہمارے واٹر مارکڈ ویوور میں نوٹس کا مطالعہ کریں یا PDFs ڈاؤن لوڈ کریں۔',
      img: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80'
    },
    {
      title: lang === 'en' ? 'Step 4: Earn Streaks & Level Badges' : 'مرحلہ 4: تعلیمی بیجز اور اسٹریکس حاصل کریں',
      desc: lang === 'en'
        ? "Study daily to keep your active streak flame alive! Rise through tiers from 'Scholar Novice' up to class 'Topper' on the classmate scoreboard."
        : 'اپنا روزانہ مطالعہ جاری رکھ کر اسٹریک برقرار رکھیں! اسکور بورڈ پر بلند ترین درجے حاصل کریں۔',
      img: 'https://images.unsplash.com/photo-1552581230-c01bc0d4842d?auto=format&fit=crop&w=400&q=80'
    }
  ];

  const faqs = [
    {
      q: lang === 'en' ? "Who do I contact if my courses are locked?" : 'کورس لاک ہونے کی صورت میں کس سے رابطہ کریں؟',
      a: lang === 'en'
        ? "Please contact Head Administrator Sir Ali Aslam directly over our official WhatsApp support helpline 0318 3749686 with your roll number."
        : 'براہ کرم ہمارے واٹس ایپ نمبر 0318 3749686 پر سر علی اسلم سے رابطہ کریں اور اپنا رول نمبر بتائیں۔'
    },
    {
      q: lang === 'en' ? "Why are some notes marked as 'View Only'?" : 'کچھ نوٹس صرف "View Only" کیوں ہیں؟',
      a: lang === 'en'
        ? "To preserve original proprietary materials, certain premium notes can only be read securely inline inside our app under dynamic student-ID watermarks."
        : 'اصل تعلیمی مواد کی حفاظت کے لیے، کچھ پریمیم نوٹس صرف ایپ کے اندر واٹر مارک کے تحت پڑھے جا سکتے ہیں۔'
    },
    {
      q: lang === 'en' ? "How do I earn XP rewards?" : 'میں XP کیسے کما سکتا ہوں؟',
      a: lang === 'en'
        ? "You earn +25 XP for marking video lectures as finished, +15 XP for completing study documents, and additional XP rewards for passing chapter quizzes."
        : 'ویڈیو لیکچرز مکمل کرنے پر 25 XP، مطالعہ نوٹس مکمل کرنے پر 15 XP اور کوئزز پاس کرنے پر پلس انعامات حاصل کریں۔'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800" id="student-profile-root" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Left Column: Student summary + settings (1 Column) */}
      <div className="space-y-6 lg:col-span-1">
        
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto bg-slate-900 text-yellow-400 font-black rounded-full flex items-center justify-center border-4 border-slate-50 font-display text-2xl shadow-md">
            {user.name.charAt(0)}
            <div className="absolute bottom-0 right-0 h-5 w-5 bg-emerald-500 border-2 border-white rounded-full" title="Student is active" />
          </div>

          <div>
            <span className="bg-blue-50 text-[#004aad] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {user.role === 'student' ? 'Collegiate Student' : 'Teacher Authority'}
            </span>
            <h3 className="text-md font-bold mt-2 text-slate-900 font-display">{user.name}</h3>
            <p className="text-[11px] text-slate-400 font-semibold font-mono mt-0.5">Roll GR: {user.grNumber}</p>
          </div>

          <div className="flex justify-around items-center border-t border-slate-50 pt-3.5 text-center">
            <div>
              <span className="text-xs text-slate-400 block font-bold">Level</span>
              <span className="text-sm font-black text-slate-800 font-mono">{user.level}</span>
            </div>
            <div className="border-r h-6 border-slate-100" />
            <div>
              <span className="text-xs text-slate-400 block font-bold">Total XP</span>
              <span className="text-sm font-black text-[#004aad] font-mono">{user.xp}</span>
            </div>
            <div className="border-r h-6 border-slate-100" />
            <div>
              <span className="text-xs text-slate-400 block font-bold">Streak</span>
              <span className="text-sm font-black text-amber-600 font-mono">🔥 {user.streakCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Quick Settings Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
            <Settings size={14} className="text-slate-500" />
            <span>Portal Preferences</span>
          </h4>

          <div className="space-y-3 text-xs">
            {/* Notification preference */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-blue-500" />
                <span className="font-bold text-slate-700">Push Notifications</span>
              </div>
              <button
                onClick={handleToggleNotifications}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <div className={`h-4.5 w-4.5 bg-white rounded-full shadow-md transform transition-transform ${
                  notificationsEnabled ? (isRtl ? '-translate-x-4.5' : 'translate-x-4.5') : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Dark Mode Preference */}
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                {darkMode ? <Moon size={14} className="text-yellow-400" /> : <Sun size={14} className="text-orange-500" />}
                <span className="font-bold text-slate-700">Contrast Dark Mode</span>
              </div>
              <button
                onClick={handleToggleDarkMode}
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors cursor-pointer ${
                  darkMode ? 'bg-[#004aad]' : 'bg-slate-300'
                }`}
              >
                <div className={`h-4.5 w-4.5 bg-white rounded-full shadow-md transform transition-transform ${
                  darkMode ? (isRtl ? '-translate-x-4.5' : 'translate-x-4.5') : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
            <Settings size={14} className="text-[#004aad]" />
            <span>{lang === 'en' ? 'Change Password' : 'پاس ورڈ تبدیل کریں'}</span>
          </h4>

          {passwordSuccess ? (
            <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 font-bold text-xs flex gap-2 items-center">
              <CheckCircle size={16} className="text-teal-600 shrink-0" />
              <span>
                {lang === 'en' 
                  ? 'Password updated successfully! +10 XP earned.' 
                  : 'پاس ورڈ کامیابی سے تبدیل ہو گیا! +10 XP حاصل ہوئے۔'}
              </span>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold text-[11px] leading-relaxed flex gap-1.5 items-start">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}
              
              <div className="space-y-1">
                <label className="font-black text-slate-500 uppercase tracking-wider block text-[9px]">
                  {lang === 'en' ? 'Current Password' : 'موجودہ پاس ورڈ'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={lang === 'en' ? 'Enter current password' : 'موجودہ پاس ورڈ درج کریں'}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-500 uppercase tracking-wider block text-[9px]">
                  {lang === 'en' ? 'New Password' : 'نیا پاس ورڈ'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={lang === 'en' ? 'At least 8 chars with letters & numbers' : 'کم از کم 8 حروف، نمبر اور حروف کے ساتھ'}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-slate-500 uppercase tracking-wider block text-[9px]">
                  {lang === 'en' ? 'Confirm New Password' : 'نئے پاس ورڈ کی تصدیق کریں'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={lang === 'en' ? 'Re-enter new password' : 'نیا پاس ورڈ دوبارہ درج کریں'}
                  required
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad]"
                />
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-2.5 bg-[#004aad] hover:bg-[#003e91] text-white rounded-xl font-black uppercase tracking-wider text-[10px] cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {changingPassword 
                  ? (lang === 'en' ? 'Updating...' : 'تبدیل ہو رہا ہے...') 
                  : (lang === 'en' ? 'Update Password' : 'پاس ورڈ تبدیل کریں')}
              </button>
            </form>
          )}
        </div>

        {/* WhatsApp Helpline Contacts */}
        <div className="bg-gradient-to-br from-[#00173d] to-[#00245b] text-white rounded-2xl p-5 border border-yellow-400/20 shadow-lg space-y-4">
          <div>
            <h4 className="text-xs font-black uppercase text-yellow-400 tracking-wider">
              {lang === 'en' ? "The Ali's Support Helpline" : "دی علی'ز سپورٹ ہیلپ لائن"}
            </h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              Need immediate help with enrollment, fees verification, or course unlock triggers? Contact our desk.
            </p>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <a 
              href="https://wa.me/923183749686" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 hover:border-yellow-400/20 transition-all cursor-pointer"
            >
              <div className="bg-emerald-500 text-white p-2 rounded-lg shrink-0">
                <MessageSquare size={14} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Main Support (Sir Ali)</span>
                <span className="font-bold font-mono">0318 3749686</span>
              </div>
            </a>

            <a 
              href="https://wa.me/923192014240" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5 hover:border-yellow-400/20 transition-all cursor-pointer"
            >
              <div className="bg-blue-500 text-white p-2 rounded-lg shrink-0">
                <Phone size={14} />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">Backup Assistant</span>
                <span className="font-bold font-mono">0319 2014240</span>
              </div>
            </a>
          </div>
        </div>

      </div>

      {/* Right Column: Walkthrough guide + FAQ + Submit Testimony (2 Columns) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Dedicated "How to Use" Step Walkthrough */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="how-to-use-guide">
          <div className="flex justify-between items-center border-b border-slate-50 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#004aad]" />
                <span>{lang === 'en' ? 'How to Use This Portal' : 'پورٹل استعمال کرنے کا طریقہ'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Quick illustrated walkthrough of your student dashboard privileges</p>
            </div>
            <span className="text-[10px] bg-[#004aad]/10 text-[#004aad] px-2 py-0.5 rounded-full font-black uppercase tracking-wider font-mono">
              Step {tutorialStep + 1} / 4
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Slide Image */}
            <div className="md:col-span-4 aspect-video md:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
              <img 
                src={tutorialSlides[tutorialStep].img} 
                alt="Walkthrough representation" 
                className="w-full h-full object-cover opacity-95"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Slide text */}
            <div className="md:col-span-8 space-y-3">
              <h4 className="text-sm font-black text-slate-900 leading-snug">{tutorialSlides[tutorialStep].title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">{tutorialSlides[tutorialStep].desc}</p>
              
              <div className="flex gap-2 pt-2">
                {tutorialSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTutorialStep(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      tutorialStep === idx ? 'w-6 bg-[#004aad]' : 'w-2 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
            {lang === 'en' ? 'Frequently Asked Questions' : 'اکثر پوچھے گئے سوالات'}
          </h3>

          <div className="space-y-2">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center p-3 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-800 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-white"
                      >
                        <p className="p-3 text-xs text-slate-600 leading-relaxed border-t border-slate-100 font-medium">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Review / Testimonial Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} className="text-yellow-500 fill-yellow-400/10" />
              <span>Share Portal Feedback</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Submit constructive feedback to help Sir Ali Aslam improve classroom delivery</p>
          </div>

          {testimonySubmitted ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1 animate-fade-in text-emerald-800 font-bold text-xs">
              <CheckCircle size={20} className="text-emerald-500 mx-auto mb-1.5" fill="currentColor" />
              <p>Feedback submitted successfully!</p>
              <p className="text-[10px] text-emerald-600 font-normal mt-0.5">Thank you for rating our application. +25 XP credited!</p>
            </div>
          ) : (
            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              {/* Star Rating select */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wide">Rating:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star 
                      size={20} 
                      className={star <= rating ? 'text-yellow-400' : 'text-slate-200'} 
                      fill={star <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>

              {/* Text Area comments */}
              <div className="space-y-1">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How can we make your digital learning experience even better? Suggest improvements..."
                  rows={3}
                  required
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad]"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTestimony || !feedback.trim()}
                className="bg-[#004aad] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#003e91] transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Send size={12} />
                <span>Submit Testimony (+15 XP)</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
}
