import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Testimonial } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { Star, MessageSquare, Send, CheckCircle2, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentTestimonialsProps {
  user: User;
  lang: 'en' | 'ur';
}

export default function StudentTestimonials({ user, lang }: StudentTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isRtl = lang === 'ur';

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const data = await api.getTestimonials();
      // Sort: newest first
      setTestimonials(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      console.error('Failed to load testimonials', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await api.submitTestimonial(rating, feedback);
      setSuccess(true);
      setFeedback('');
      setRating(5);
      // Wait 4 seconds then hide success alert
      setTimeout(() => setSuccess(false), 4000);
      // Refresh list (though new student feedback is pending, if they submitted as admin or to check updates)
      fetchTestimonials();
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="student-testimonials-panel">
      
      {/* Hero Banner Area */}
      <div className="bg-gradient-to-br from-indigo-900 via-[#2d1a6d] to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl" id="testimonials-hero">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <MessageSquare size={160} />
        </div>
        <div className="relative z-10 space-y-2 max-w-lg">
          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
            {isRtl ? 'حوصلہ افزائی اور آراء' : 'Inspiration & Community'}
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">
            {getTranslation(lang, 'testimonials')}
          </h2>
          <p className="text-xs text-indigo-150 leading-relaxed font-medium">
            {isRtl 
              ? 'دی علی\'ز کالجیٹ کے دوسرے طلباء کے تجربات پڑھیں اور اپنی قیمتی آراء کا اظہار کریں۔' 
              : 'Read what other fellow students at The Ali\'s Collegiate say about their learning journey, and share your own experience!'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="testimonials-grid-layout">
        
        {/* Left column: Submit form */}
        <div className="md:col-span-5 space-y-6" id="testimonial-form-column">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {getTranslation(lang, 'submitFeedback')}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                {isRtl 
                  ? 'آپ کی رائے ایڈمن کی منظوری کے بعد شائع ہوگی۔' 
                  : 'Your feedback will be published after teacher or administrator approval.'}
              </p>
            </div>

            <AnimatePresence>
              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl text-emerald-800 flex items-start gap-2.5 text-xs font-medium"
                  id="testimonial-success-alert"
                >
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>{getTranslation(lang, 'feedbackPending')}</span>
                </motion.div>
              )}

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-rose-50 border border-rose-100 p-3.5 rounded-xl text-rose-800 text-xs font-semibold"
                  id="testimonial-error-alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4" id="feedback-submission-form">
              {/* Star Rating Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {getTranslation(lang, 'rating')}
                </label>
                <div className="flex items-center gap-1.5" id="rating-star-selector">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = hoverRating !== null ? star <= hoverRating : star <= rating;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="text-amber-400 hover:scale-115 transition-all focus:outline-none"
                      >
                        <Star 
                          size={24} 
                          fill={isFilled ? 'currentColor' : 'none'} 
                          className="stroke-amber-400" 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {isRtl ? 'آپ کی آراء' : 'Your Comments'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={getTranslation(lang, 'writeFeedback')}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed"
                  id="feedback-text-area"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !feedback.trim()}
                className="w-full bg-[#2d1a6d] hover:bg-[#1f114e] text-white py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg text-xs tracking-wider uppercase cursor-pointer flex justify-center items-center gap-2 disabled:bg-[#2d1a6d]/50 disabled:cursor-not-allowed"
                id="submit-feedback-btn"
              >
                <span>{submitting ? 'Sending...' : 'Submit Feedback'}</span>
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Testimonials list */}
        <div className="md:col-span-7 space-y-4" id="testimonials-list-column">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isRtl ? 'منظور شدہ تاثرات' : 'Approved Testimonials'}
            </h4>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              {testimonials.length} {testimonials.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1" id="student-testimonials-scroll-box">
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-xs font-medium">
                Loading testimonials...
              </div>
            ) : testimonials.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 text-xs font-medium space-y-2">
                <MessageSquare size={32} className="mx-auto text-slate-300" />
                <p>
                  {isRtl 
                    ? 'ابھی تک کوئی منظور شدہ آراء دستیاب نہیں ہیں۔ سب سے پہلے اپنی رائے دیں!' 
                    : 'No approved student testimonials posted yet. Be the first to write yours!'}
                </p>
              </div>
            ) : (
              testimonials.map((t) => (
                <div 
                  key={t.id} 
                  className="bg-white border border-slate-100/80 rounded-2xl p-5 hover:border-indigo-100 transition-all shadow-2xs space-y-3.5"
                  id={`testimonial-card-${t.id}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                        {t.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">{t.studentName}</h5>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {t.studentClass}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stars Display */}
                    <div className="flex items-center gap-0.5 text-amber-400" id={`stars-display-${t.id}`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={13} 
                          fill={i < t.rating ? 'currentColor' : 'none'} 
                          className="stroke-amber-400" 
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1 italic">
                    "{t.feedback}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-100/50 pt-2.5 pl-1">
                    <div className="flex items-center gap-1 text-emerald-600 font-bold uppercase tracking-wider text-[9px]">
                      <UserCheck size={11} />
                      <span>Verified Student</span>
                    </div>
                    <span>{new Date(t.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
