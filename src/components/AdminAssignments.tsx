import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClassRoom, Subject, Chapter, Assignment, AssignmentSubmission, User } from '../types';
import { ClipboardList, Plus, Trash2, ArrowRight, Download, Award, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminAssignments() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [students, setStudents] = useState<User[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Form states (Create assignment)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [xpReward, setXpReward] = useState('100');

  // Form states (Grade evaluation)
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState('A');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSelectors();
    loadAssignments();
  }, []);

  const loadSelectors = async () => {
    try {
      const [allClasses, allSubjects, allChapters, allStudents] = await Promise.all([
        api.getClasses(),
        api.getSubjects(),
        api.getChapters(),
        api.getStudents()
      ]);
      setClasses(allClasses);
      setSubjects(allSubjects);
      setChapters(allChapters);
      setStudents(allStudents.filter(s => s.role === 'student'));
    } catch (e) {
      console.error(e);
    }
  };

  const loadAssignments = async () => {
    try {
      const [allA, allS] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions()
      ]);
      setAssignments(allA);
      setSubmissions(allS);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedChapterId) {
      setError('Please select a target chapter folder first.');
      return;
    }
    if (!title.trim() || !dueDate.trim()) {
      setError('Assignment Title and Due Date are required.');
      return;
    }

    setLoading(true);
    try {
      await api.createAssignment({
        chapterId: selectedChapterId,
        title,
        description,
        dueDate,
        xpReward: Number(xpReward)
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setDueDate('');
      setXpReward('100');
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || 'Assignment creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm('Wipe this homework assignment and all student submissions?')) return;
    try {
      await api.deleteAssignment(id);
      await loadAssignments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGradeSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission || loading) return;

    setLoading(true);
    try {
      await api.gradeSubmission(gradingSubmission.id, gradeScore, gradeFeedback);
      setGradingSubmission(null);
      setGradeFeedback('');
      await loadAssignments();
      alert('Homework sheet graded successfully ✓');
    } catch (err: any) {
      alert(err.message || 'Grading failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="assignments-manager-root">
      
      {/* COLUMN 1: Homework Creator Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="assign-form-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <ClipboardList size={16} className="text-sky-500" />
          <span>Publish Homework Assignment</span>
        </h3>

        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs font-semibold text-slate-500" id="assign-publisher-form">
          
          {/* Chapter Cascades */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1">Target Class Grade Slot</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                id="assigns-class-select"
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
                id="assigns-sub-select"
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
                id="assigns-chap-select"
              >
                <option value="">-- Choose Chapter Folder --</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          {/* Details details */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block mb-1">Assignment Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 1 Kinematics Problem Set"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="assign-title-input"
              />
            </div>

            <div>
              <label className="block mb-1">Instructions Description</label>
              <textarea
                placeholder="Write homework guidelines, links, or textbook problems..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="assign-desc-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1">Due Date</label>
                <input
                  type="datetime-local"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  id="assign-duedate-input"
                />
              </div>
              <div>
                <label className="block mb-1">XP Reward Score</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                  id="assign-xp-input"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          {success && <p className="text-xs text-teal-600 font-bold">Homework assignment posted to notices board ✓</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:bg-sky-300"
            id="assign-submit-btn"
          >
            <Plus size={14} />
            <span>Publish Homework</span>
          </button>

        </form>
      </div>

      {/* COLUMN 2: Submissions review board */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="review-submissions-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <ClipboardList size={16} className="text-amber-500" />
          <span>Review Submitted Homework ({submissions.length})</span>
        </h3>

        <div className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1" id="submissions-stream-list">
          {submissions.map((sub) => {
            const student = students.find(s => s.id === sub.studentId);
            const assign = assignments.find(a => a.id === sub.assignmentId);

            return (
              <div key={sub.id} className="border border-slate-100 bg-slate-50/50 p-3.5 rounded-xl space-y-3" id={`sub-card-admin-${sub.id}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">
                      {student ? `${student.name} (GR: ${student.grNumber})` : 'Unknown Student'}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 mt-0.5">{assign ? assign.title : 'Homework Task'}</h4>
                    <p className="text-[10px] text-gray-400">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    sub.grade ? 'bg-teal-50 text-teal-700 border border-teal-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                  }`}>
                    {sub.grade ? `Grade: ${sub.grade}` : 'Pending Evaluation'}
                  </span>
                </div>

                {/* Download solutions attachment */}
                <div className="flex justify-between items-center border-t border-dashed border-slate-200/60 pt-2 text-[10px] text-slate-500 font-mono">
                  <div className="truncate max-w-[150px] font-medium text-slate-700 flex items-center gap-1">
                    <ClipboardList size={12} className="text-slate-400 shrink-0" />
                    <span>{sub.originalName}</span>
                  </div>
                  <a
                    href={api.getFileUrl(sub.id, false)}
                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold"
                    id={`download-sub-btn-${sub.id}`}
                  >
                    <Download size={11} />
                    <span>Download solution</span>
                  </a>
                </div>

                {/* Grade Action button */}
                {!sub.grade && (
                  <button
                    onClick={() => { setGradingSubmission(sub); setGradeScore('A'); }}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition-colors cursor-pointer text-center block"
                    id={`grade-action-btn-${sub.id}`}
                  >
                    Grade Answer Sheet
                  </button>
                )}

                {sub.grade && (
                  <div className="bg-white p-2.5 rounded-xl border text-[10px] text-slate-500 leading-snug">
                    <span className="font-bold text-slate-700 block mb-0.5">Evaluation Feedback:</span>
                    <p className="italic">"{sub.feedback || 'Excellent work'}"</p>
                  </div>
                )}
              </div>
            );
          })}
          {submissions.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              No solutions sheets have been uploaded by students.
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 3: Active homework tasks directory & Grade Modal Drawer */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="assignments-directory-col">
        {gradingSubmission ? (
          // Grade Form Panel
          <form onSubmit={handleGradeSubmissionSubmit} className="space-y-4 text-xs font-semibold text-slate-500 animate-fade-in" id="evaluation-form">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-sky-500 uppercase">Answer Sheet Evaluator</span>
                <h4 className="text-sm font-bold text-slate-800">Assign Grade</h4>
              </div>
              <button 
                type="button" 
                onClick={() => setGradingSubmission(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block mb-1">Evaluation Grade Card</label>
              <select
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-sky-400 text-xs"
                id="grade-select"
              >
                <option value="A">⭐ Grade A (Excellent)</option>
                <option value="B">✔️ Grade B (Good)</option>
                <option value="C">📈 Grade C (Satisfactory)</option>
                <option value="F">❌ Grade F (Unsatisfactory / Redo)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1">Written Feedback Comments</label>
              <textarea
                required
                placeholder="Give Professor feedback comments here..."
                rows={4}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-xs"
                id="grade-feedback-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
              id="submit-evaluation-btn"
            >
              <Award size={14} />
              <span>Publish Grade & Reward XP</span>
            </button>
          </form>
        ) : (
          // Active Assignments list
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
              <ClipboardList size={16} className="text-amber-500" />
              <span>Published Tasks Directory</span>
            </h3>

            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-1" id="assigns-stream-list">
              {assignments.map((q) => {
                const chap = chapters.find(c => c.id === q.chapterId);
                const sub = chap ? subjects.find(s => s.id === chap.subjectId) : null;
                const cls = sub ? classes.find(c => c.id === sub.classId) : null;

                return (
                  <div key={q.id} className="border border-gray-100 p-3.5 rounded-xl space-y-2" id={`assign-card-admin-${q.id}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-1.5 py-0.2 rounded-full">
                          {cls ? cls.name : 'Class'} &rarr; {sub ? sub.name : 'Subject'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 leading-snug">{q.title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium">
                          XP Reward: {q.xpReward} XP • Due: {new Date(q.dueDate).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAssignment(q.id)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Assignment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No homework assignments are on display.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
