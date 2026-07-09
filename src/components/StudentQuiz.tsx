import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Quiz, QuizAttempt } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { HelpCircle, Clock, AlertTriangle, CheckCircle, Award, RefreshCw, ChevronLeft, Volume2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentQuizProps {
  user: User;
  lang: 'en' | 'ur';
  quizId: string;
  onClose: () => void;
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentQuiz({ user, lang, quizId, onClose, onXPUpdated }: StudentQuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  
  // Submit state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ attempt: QuizAttempt; levelUp: boolean; newLevel: number; xpEarned: number } | null>(null);

  useEffect(() => {
    // Fetch quiz detail
    api.getQuizzes().then(quizzes => {
      const q = quizzes.find(item => item.id === quizId);
      if (q) {
        setQuiz(q);
        setTimeLeft(q.timeLimit * 60);
      }
    }).catch(err => console.error(err));
  }, [quizId]);

  // Countdown timer effect
  useEffect(() => {
    if (result || timeLeft <= 0 || !quiz) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeUp(true);
          handleSubmitQuiz(true); // force auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, quiz, result]);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (result) return; // cannot change after submission
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: optionIdx
    });
  };

  const handleSubmitQuiz = async (forced = false) => {
    if (!quiz || loading || result) return;
    
    setLoading(true);
    try {
      const res = await api.submitQuiz(quiz.id, selectedAnswers);
      setResult(res);
      onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
    } catch (e) {
      console.error('Quiz submit failed', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (!quiz) {
    return (
      <div className="flex justify-center items-center h-96">
        <RefreshCw size={24} className="animate-spin text-sky-500" />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" id="quiz-solver-root">
      
      {/* Header bar */}
      <div className="flex justify-between items-center bg-white rounded-2xl border border-gray-100 p-4 shadow-xs" id="quiz-header">
        <button 
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 cursor-pointer"
        >
          <ChevronLeft size={14} />
          <span>Exit Quiz</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
            <Clock size={14} className="text-sky-500" />
            <span className={timeLeft < 60 ? 'text-red-500 animate-pulse font-bold' : ''}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-xl">
            {quiz.xpReward} XP Reward
          </span>
        </div>
      </div>

      {!result ? (
        // Active Attempt Mode
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-6" id="quiz-attempt-card">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Question {currentQuestionIdx + 1} of {quiz.questions.length}
            </span>
            <h3 className="text-md font-bold text-slate-800 font-display">
              {quiz.title}
            </h3>
          </div>

          {/* Question Text */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100" id="question-text">
            <p className="text-sm font-semibold text-slate-800 leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options List */}
          <div className="space-y-2.5" id="options-list">
            {currentQuestion.options.map((opt, oIdx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === oIdx;
              return (
                <button
                  key={oIdx}
                  onClick={() => handleSelectOption(currentQuestion.id, oIdx)}
                  className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all flex justify-between items-center cursor-pointer ${
                    isSelected 
                      ? 'bg-sky-50 border-sky-300 text-sky-700 shadow-xs' 
                      : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-sky-100 hover:bg-slate-50'
                  }`}
                  id={`opt-${currentQuestion.id}-${oIdx}`}
                >
                  <span>{opt.text}</span>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-4" id="quiz-navigation">
            <button
              disabled={currentQuestionIdx === 0}
              onClick={() => setCurrentQuestionIdx(currentQuestionIdx - 1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {isLastQuestion ? (
              <button
                onClick={() => handleSubmitQuiz()}
                disabled={loading}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-100 cursor-pointer"
                id="submit-quiz-btn"
              >
                {loading ? 'Submitting...' : 'Submit Answers'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIdx(currentQuestionIdx + 1)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Next
              </button>
            )}
          </div>
        </div>
      ) : (
        // Results Review Mode
        <div className="space-y-6" id="quiz-results-card">
          
          {/* Trophy Banner */}
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white text-center space-y-3 shadow-xl">
            <div className="inline-flex p-3 bg-white/20 rounded-full border border-white/20 mb-2">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-bold font-display">
              Quiz Completed!
            </h3>
            <p className="text-2xl font-black font-display tracking-tight">
              {result.attempt.score} / {result.attempt.maxScore}
            </p>
            <p className="text-teal-100 text-xs font-semibold">
              Earned +{result.xpEarned} XP • {Math.round((result.attempt.score / result.attempt.maxScore) * 100)}% Accurate
            </p>

            {result.levelUp && (
              <div className="bg-white/20 border border-white/30 rounded-xl p-2.5 max-w-sm mx-auto animate-bounce text-xs font-bold tracking-wide mt-3">
                🎉 LEVEL UP! You are now Level {result.newLevel}!
              </div>
            )}
          </div>

          {/* Question Breakdown and Explanations */}
          <div className="space-y-4" id="results-breakdown">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Review and Explanations
            </h4>

            {quiz.questions.map((q, idx) => {
              const studentAnswer = result.attempt.answers[q.id];
              const isCorrect = studentAnswer === q.correctOptionIndex;
              
              return (
                <div key={q.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-xs space-y-3.5" id={`review-q-${q.id}`}>
                  <div className="flex justify-between items-start gap-3">
                    <h5 className="text-sm font-bold text-slate-800 leading-snug">
                      {idx + 1}. {q.question}
                    </h5>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isCorrect ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const wasSelected = studentAnswer === oIdx;
                      const isCorrectOption = q.correctOptionIndex === oIdx;

                      return (
                        <div 
                          key={oIdx} 
                          className={`p-3 rounded-xl text-xs font-semibold flex justify-between items-center ${
                            isCorrectOption 
                              ? 'bg-teal-50/70 border border-teal-200 text-teal-800' 
                              : wasSelected 
                                ? 'bg-red-50 border border-red-100 text-red-800' 
                                : 'bg-slate-50 text-slate-500'
                          }`}
                        >
                          <span>{opt.text}</span>
                          <span className="text-[10px] font-bold">
                            {isCorrectOption ? '(Correct Choice)' : wasSelected ? '(Your Choice)' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-semibold transition-all shadow-md cursor-pointer text-center text-sm"
          >
            Return to Study Library
          </button>
        </div>
      )}

    </div>
  );
}
