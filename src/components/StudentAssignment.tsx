import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { User, Assignment, AssignmentSubmission } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { ClipboardList, Calendar, UploadCloud, CheckCircle, FileText, RefreshCw, AlertCircle, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StudentAssignmentProps {
  user: User;
  lang: 'en' | 'ur';
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentAssignment({ user, lang, onXPUpdated }: StudentAssignmentProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [allAssigns, allSubs] = await Promise.all([
        api.getAssignments(),
        api.getSubmissions()
      ]);
      setAssignments(allAssigns);
      setSubmissions(allSubs);
    } catch (e) {
      console.error(e);
    }
  };

  const getSubmission = (assignId: string) => submissions.find(s => s.assignmentId === assignId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !uploadFile || uploading) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.submitAssignment(selectedAssignment.id, uploadFile);
      setSuccess(true);
      setUploadFile(null);
      await loadData(); // refresh submissions list
    } catch (err: any) {
      setError(err.message || 'Submission upload failed. Ensure file size under 10MB.');
    } finally {
      setUploading(false);
    }
  };

  const isRtl = lang === 'ur';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="assignments-root">
      
      {/* Assignments Left Column Lists */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-4 shadow-xs h-fit space-y-3" id="assignments-sidebar">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
          {getTranslation(lang, 'assignments')}
        </h3>
        
        <div className="space-y-2.5" id="assignment-tabs-list">
          {assignments.map((ass) => {
            const sub = getSubmission(ass.id);
            const isOverdue = new Date(ass.dueDate) < new Date() && !sub;

            return (
              <button
                key={ass.id}
                onClick={() => { setSelectedAssignment(ass); setError(null); setSuccess(false); }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                  selectedAssignment?.id === ass.id
                    ? 'bg-sky-50 border-sky-200 shadow-xs'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
                id={`assign-tab-${ass.id}`}
              >
                <div className="flex justify-between items-start w-full">
                  <h4 className={`text-xs font-bold leading-snug ${
                    selectedAssignment?.id === ass.id ? 'text-sky-700' : 'text-slate-800'
                  }`}>
                    {ass.title}
                  </h4>
                  {sub ? (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      sub.grade ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {sub.grade ? `Grade: ${sub.grade}` : 'Submitted'}
                    </span>
                  ) : isOverdue ? (
                    <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Overdue
                    </span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Pending
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center w-full text-[10px] text-slate-400 border-t border-slate-100/60 pt-2">
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    <span>Due: {new Date(ass.dueDate).toLocaleDateString()}</span>
                  </span>
                  <span className="font-semibold text-sky-600">{ass.xpReward} XP</span>
                </div>
              </button>
            );
          })}
          {assignments.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              No active homework assignments posted yet.
            </div>
          )}
        </div>
      </div>

      {/* Assignment Detail Panel & Submit Stage */}
      <div className="lg:col-span-2 space-y-4" id="assignment-detail-panel">
        {selectedAssignment ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-5 animate-fade-in" id="assign-details">
            <div className="border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Assignment Details</span>
              <h2 className="text-md font-bold text-slate-800 font-display mt-0.5">{selectedAssignment.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Reward: <span className="text-sky-600 font-bold">{selectedAssignment.xpReward} XP</span> • Due Date: <span className="font-medium text-slate-600">{new Date(selectedAssignment.dueDate).toLocaleString()}</span>
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ClipboardList size={13} />
                <span>Task Instructions</span>
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {selectedAssignment.description || 'No supplementary guidelines uploaded. Solve the chapters problem sheet.'}
              </p>
            </div>

            {/* Submission Status & Form */}
            {(() => {
              const sub = getSubmission(selectedAssignment.id);
              return (
                <div className="space-y-4" id="submission-stage">
                  {sub && (
                    <div className="p-4 rounded-xl border border-teal-100 bg-teal-50/30 space-y-3" id="submission-receipt">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600">Submission Receipt</span>
                          <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <FileText size={14} className="text-teal-600" />
                            <span>{sub.originalName}</span>
                          </h5>
                          <p className="text-[10px] text-gray-400">
                            Submitted on {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-2.5 py-1 rounded-xl">
                          {sub.grade ? `Grade ${sub.grade}` : 'Received ✓'}
                        </span>
                      </div>

                      {/* Grade feedback logs */}
                      {sub.grade && (
                        <div className="bg-white rounded-xl p-3 border border-teal-100 space-y-1.5" id="grade-report">
                          <div className="flex items-center gap-1 text-xs font-bold text-teal-800">
                            <Award size={14} className="text-amber-500" />
                            <span>Professor Evaluation Feedback</span>
                          </div>
                          <p className="text-xs text-slate-600 italic">
                            "{sub.feedback || 'Excellent homework submission! Keep scoring high.'}"
                          </p>
                          <span className="text-[10px] font-bold text-sky-600 block mt-1">
                            Earned +{sub.xpEarned || selectedAssignment.xpReward} XP!
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Form */}
                  {(!sub || !sub.grade) && (
                    <form onSubmit={handleSubmit} className="space-y-4" id="upload-homework-form">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Submit Answer Sheet
                      </h4>

                      <div 
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-sky-400 hover:bg-sky-50/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-2"
                        id="drag-drop-area"
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                        <UploadCloud size={32} className="text-slate-400" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700">
                            {uploadFile ? uploadFile.name : 'Drag & Drop your solution sheet here'}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {uploadFile ? `Size: ${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supports PDF, Word, or images up to 10MB'}
                          </p>
                        </div>
                      </div>

                      {error && (
                        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{error}</span>
                        </p>
                      )}

                      {success && (
                        <p className="text-xs text-teal-600 font-bold flex items-center gap-1">
                          <CheckCircle size={12} />
                          <span>Submission updated successfully! Wait for evaluation.</span>
                        </p>
                      )}

                      {uploadFile && (
                        <button
                          type="submit"
                          disabled={uploading}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-sky-100 flex justify-center items-center gap-1.5 cursor-pointer"
                          id="submit-homework-btn"
                        >
                          {uploading ? 'Uploading...' : 'Submit to Professor'}
                        </button>
                      )}
                    </form>
                  )}
                </div>
              );
            })()}

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
            Select an assignment from the left column to view description guidelines and submit solution sheets.
          </div>
        )}
      </div>

    </div>
  );
}
