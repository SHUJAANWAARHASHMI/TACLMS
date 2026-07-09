import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClassRoom, Subject, Chapter, Quiz } from '../types';
import { HelpCircle, Plus, Trash2, ArrowRight, Eye, RefreshCw, AlertCircle } from 'lucide-react';

interface QuestionForm {
  question: string;
  options: { text: string }[];
  correctOptionIndex: number;
  explanation: string;
}

export default function AdminQuizzes() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Quiz details form state
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState('10'); // in minutes
  const [xpReward, setXpReward] = useState('50');

  // Dynamic question builder list state
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctOptionIndex: 0, explanation: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSelectors();
    loadQuizzes();
  }, []);

  const loadSelectors = async () => {
    try {
      const [allClasses, allSubjects, allChapters] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getChapters()
      ]);
      setClasses(allClasses);
      setSubjects(allSubjects);
      setChapters(allChapters);
    } catch (e) {
      console.error(e);
    }
  };

  const loadQuizzes = async () => {
    try {
      const allQ = await api.getQuizzes();
      setQuizzes(allQ);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddQuestionRow = () => {
    setQuestions([
      ...questions,
      { question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctOptionIndex: 0, explanation: '' }
    ]);
  };

  const handleRemoveQuestionRow = (qIdx: number) => {
    setQuestions(questions.filter((_, idx) => idx !== qIdx));
  };

  const handleQuestionTextChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].question = val;
    setQuestions(updated);
  };

  const handleOptionTextChange = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx].text = val;
    setQuestions(updated);
  };

  const handleCorrectOptionChange = (qIdx: number, val: number) => {
    const updated = [...questions];
    updated[qIdx].correctOptionIndex = val;
    setQuestions(updated);
  };

  const handleExplanationChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].explanation = val;
    setQuestions(updated);
  };

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedChapterId) {
      setError('Please select a target chapter folder first.');
      return;
    }
    if (!title.trim()) {
      setError('Quiz Title is required.');
      return;
    }

    // Validate questions fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question #${i + 1} prompt is empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          setError(`Question #${i + 1} option #${j + 1} is empty.`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      await api.createQuiz({
        chapterId: selectedChapterId,
        title,
        timeLimit: Number(timeLimit),
        xpReward: Number(xpReward),
        questions: questions.map((q, qIdx) => ({
          id: qIdx + 1,
          question: q.question,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation
        }))
      });

      setSuccess(true);
      setTitle('');
      setTimeLimit('10');
      setXpReward('50');
      setQuestions([
        { question: '', options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], correctOptionIndex: 0, explanation: '' }
      ]);
      await loadQuizzes();
    } catch (err: any) {
      setError(err.message || 'Quiz creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!window.confirm('Delete this chapter quiz? Studet marks/attempts will not be lost but new attempts are restricted.')) return;
    try {
      await api.deleteQuiz(id);
      await loadQuizzes();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="quizzes-manager-root">
      
      {/* COLUMN 1 & 2: Interactive MCQ Creator (Wide panel) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5 h-fit" id="quiz-builder-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <HelpCircle size={16} className="text-sky-500" />
          <span>Interactive Chapter Quiz Creator</span>
        </h3>

        <form onSubmit={handleSubmitQuiz} className="space-y-5 text-xs font-semibold text-slate-500" id="quiz-builder-form">
          
          {/* Target cascades selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1">Target Class Grade Slot</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                id="quizzes-class-select"
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1">Target Subject Category</label>
              <select
                required
                disabled={!selectedClassId}
                value={selectedSubjectId}
                onChange={(e) => { setSelectedSubjectId(e.target.value); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-40"
                id="quizzes-sub-select"
              >
                <option value="">-- Choose Subject --</option>
                {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block mb-1">Target Chapter Folder</label>
              <select
                required
                disabled={!selectedSubjectId}
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-40"
                id="quizzes-chap-select"
              >
                <option value="">-- Choose Chapter Folder --</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          {/* Quiz metadata details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-50 pt-3">
            <div className="md:col-span-2">
              <label className="block mb-1">Quiz Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 1 Kinematics Quick Test"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-slate-700 font-semibold"
                id="quiz-title-input"
              />
            </div>
            <div>
              <label className="block mb-1">Time Limit (Minutes)</label>
              <input
                type="number"
                required
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-slate-700 font-semibold"
                id="quiz-timer-input"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wide">Multiple Choice Questions (MCQ)</span>
              <button
                type="button"
                onClick={handleAddQuestionRow}
                className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + Add Question
              </button>
            </div>

            {/* Questions Array */}
            <div className="space-y-5" id="questions-builder-rows">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3 relative" id={`q-row-${qIdx}`}>
                  
                  {qIdx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionRow(qIdx)}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold"
                    >
                      Remove
                    </button>
                  )}

                  <div className="text-xs font-bold text-slate-700">Question #{qIdx + 1} Prompt</div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. What is the unit of physical force acceleration?"
                    value={q.question}
                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  />

                  {/* Options inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-1.5 bg-white p-2 border border-slate-150 rounded-xl">
                        <label className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Opt {oIdx + 1}</label>
                        <input
                          type="text"
                          required
                          placeholder="Answer Choice..."
                          value={opt.text}
                          onChange={(e) => handleOptionTextChange(qIdx, oIdx, e.target.value)}
                          className="flex-1 border-0 focus:outline-none bg-transparent"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Option selector & explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1">Correct Answer Index</label>
                      <select
                        value={q.correctOptionIndex}
                        onChange={(e) => handleCorrectOptionChange(qIdx, Number(e.target.value))}
                        className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block mb-1">Explanatory Solution (Displayed upon submission)</label>
                      <input
                        type="text"
                        placeholder="e.g. Acceleration is rate of change of speed (m/s^2)"
                        value={q.explanation}
                        onChange={(e) => handleExplanationChange(qIdx, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                      />
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-bold flex items-center gap-1">
              <AlertCircle size={12} />
              <span>{error}</span>
            </p>
          )}
          {success && <p className="text-xs text-teal-600 font-bold">Multiple Choice Quiz compiled and linked ✓</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:bg-sky-300 shadow-md shadow-sky-100"
            id="quiz-submit-button"
          >
            <span>{loading ? 'Compiling Quiz...' : 'Save & Publish MCQ Quiz'}</span>
            <ArrowRight size={14} />
          </button>

        </form>
      </div>

      {/* COLUMN 3: Active quizzes list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="quizzes-directory-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <HelpCircle size={16} className="text-amber-500" />
          <span>Active Chapter Quiz Directory</span>
        </h3>

        <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1" id="quizzes-stream-list">
          {quizzes.map((q) => {
            const chap = chapters.find(c => c.id === q.chapterId);
            const sub = chap ? subjects.find(s => s.id === chap.subjectId) : null;
            const cls = sub ? classes.find(c => c.id === sub.classId) : null;

            return (
              <div key={q.id} className="border border-gray-100 p-3.5 rounded-xl space-y-2" id={`quiz-card-admin-${q.id}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded-full">
                      {cls ? cls.name : 'Class'} &rarr; {sub ? sub.name : 'Subject'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{q.title}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Contains {q.questions.length} MCQs • Timer: {q.timeLimit} Min
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteQuiz(q.id)}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Quiz"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
          {quizzes.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No Chapter quizzes are on display.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
