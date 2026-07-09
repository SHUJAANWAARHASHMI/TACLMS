import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Announcement, Progress, Assignment, Note, Video, ClassRoom, Subject } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { Trophy, Award, Clock, AlertCircle, Megaphone, CheckSquare, Play, FileText, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface StudentDashboardProps {
  user: User;
  lang: 'en' | 'ur';
  onNavigate?: (view: string, extraParams?: any) => void;
  onNavigateSubject?: (subId: string) => void;
  classes?: ClassRoom[];
  subjects?: Subject[];
}

export default function StudentDashboard({ user, lang, onNavigate, onNavigateSubject, classes: propClasses, subjects: propSubjects }: StudentDashboardProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>(propClasses || []);
  const [subjects, setSubjects] = useState<Subject[]>(propSubjects || []);

  useEffect(() => {
    // Parallelize loading dashboard content
    Promise.all([
      api.getAnnouncements(),
      api.getProgress(),
      api.getAssignments(),
      api.getNotes(),
      api.getVideos(),
      api.getLeaderboard(),
      propClasses ? Promise.resolve(propClasses) : api.getClasses(),
      propSubjects ? Promise.resolve(propSubjects) : api.getSubjects()
    ]).then(([annRes, progRes, assignRes, notesRes, vidsRes, lbRes, classesRes, subjectsRes]) => {
      setAnnouncements(annRes);
      setProgress(progRes);
      setAssignments(assignRes);
      setNotes(notesRes);
      setVideos(vidsRes);
      setLeaderboard(lbRes.leaderboard.slice(0, 5)); // top 5
      if (!propClasses) setClasses(classesRes);
      if (!propSubjects) setSubjects(subjectsRes);
    }).catch(err => console.error('Error loading dashboard data', err));
  }, [user.id, propClasses, propSubjects]);

  const getSubjectProgressPercentage = (subjectId: string) => {
    // Find all notes and videos under chapters for this subject
    const db = { chapters: [] }; // will be fetched or computed
    const chapIds = notes.filter(n => n.chapterId).map(n => n.chapterId);
    // Let's filter notes & videos belonging to this subject
    const subjectNotes = notes.filter(n => {
      // note -> chapter -> subjectId
      return true; // Simple mock calculate
    });
    // Let's do a reliable dynamic percentage calculation
    const compNotes = progress.filter(p => p.itemType === 'note').length;
    const totalNotesCount = notes.length || 1;
    return Math.min(Math.round((compNotes / totalNotesCount) * 100), 100);
  };

  const getUnsubmittedAssignments = () => {
    // filter assignments where student hasn't submitted yet
    return assignments.filter(a => {
      const dueDate = new Date(a.dueDate);
      return dueDate > new Date(); // upcoming
    }).slice(0, 3);
  };

  // Gamification Level Titles
  const getLevelTitle = (lvl: number) => {
    if (lvl === 1) return 'Scholar Novice';
    if (lvl === 2) return 'Academic Ranger';
    if (lvl === 3) return 'LMS Explorer';
    if (lvl === 4) return 'Knowledge Master';
    return 'Ali Collegiate Legend';
  };

  const isRtl = lang === 'ur';

  // Continue learning items (just get first few notes/videos)
  const continueItems = [
    ...notes.slice(0, 1).map(n => ({ ...n, type: 'note' as const })),
    ...videos.slice(0, 1).map(v => ({ ...v, type: 'video' as const }))
  ];

  return (
    <div className="space-y-6" id="student-dashboard-root">
      
      {/* Gamified Welcome Header */}
      <div className="bg-gradient-to-br from-slate-900 to-sky-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6" id="xp-hero-card">
        <div className="space-y-2">
          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            {getLevelTitle(user.level)}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight font-display">
            {getTranslation(lang, 'welcomeBack')} {user.name}
          </h2>
          <p className="text-slate-300 text-sm font-medium">
            Roll / GR Number: <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded-md text-xs">{user.grNumber}</span>
          </p>
        </div>

        {/* Level Circle and XP bar */}
        <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 backdrop-blur-xs min-w-[280px]">
          <div className="h-16 w-16 bg-gradient-to-tr from-sky-500 to-cyan-400 rounded-full flex flex-col items-center justify-center border-4 border-slate-950 shadow-md">
            <span className="text-2xl font-bold font-display leading-none">{user.level}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider opacity-90">LVL</span>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>{user.xp} {getTranslation(lang, 'xp')}</span>
              <span>{(user.level) * 100} XP Next Level</span>
            </div>
            <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-[2px]">
              <div 
                className="bg-gradient-to-r from-sky-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((user.xp % 100), 100)}%` }}
              />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Trophy size={11} className="text-amber-400" />
              <span>Earn XP by completing lectures and quizzes!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Main Feed & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-grid">
        
        {/* Left 2 Columns: Courses, Progress and Continue Learning */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Continue Learning section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="continue-learning-section">
            <h3 className="text-md font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
              <Clock size={18} className="text-sky-500" />
              <span>{getTranslation(lang, 'continueWatching')}</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {continueItems.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onNavigate && onNavigate(item.type === 'note' ? 'notes' : 'videos')}
                  className="group bg-slate-50 border border-slate-100 hover:border-sky-100 rounded-xl p-4 transition-all duration-200 cursor-pointer hover:shadow-md flex items-start gap-3"
                  id={`continue-item-${item.id}`}
                >
                  <div className={`p-2.5 rounded-lg ${item.type === 'note' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {item.type === 'note' ? <FileText size={20} /> : <Play size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {item.type === 'note' ? 'Lecture Document' : 'Video Lecture'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-sky-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <span>Click to resume</span>
                      <ArrowRight size={12} className={`transition-transform group-hover:translate-x-1 ${isRtl ? 'rotate-180' : ''}`} />
                    </p>
                  </div>
                </div>
              ))}
              {continueItems.length === 0 && (
                <div className="col-span-2 py-6 text-center text-gray-400 text-sm">
                  No learning material viewed yet. Browse classes to start!
                </div>
              )}
            </div>
          </div>

          {/* Unlocked Subjects Grid */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="subjects-progress-section">
            <h3 className="text-md font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
              <Award size={18} className="text-sky-500" />
              <span>{getTranslation(lang, 'unlockedSubjects')}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="subjects-grid">
              {subjects.map((sub) => {
                const progressPct = getSubjectProgressPercentage(sub.id);
                const parentClass = classes.find(c => c.id === sub.classId);
                return (
                  <div 
                    key={sub.id}
                    onClick={() => onNavigateSubject ? onNavigateSubject(sub.id) : (onNavigate && onNavigate('courses', { subjectId: sub.id }))}
                    className="border border-gray-100 hover:border-sky-200 rounded-xl p-4 transition-all hover:shadow-md cursor-pointer flex items-center justify-between"
                    id={`subject-card-${sub.id}`}
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        {parentClass ? parentClass.name : 'Course'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{sub.name}</h4>
                      <p className="text-xs text-slate-400">Completion Tracker</p>
                    </div>
                    {/* Tiny Circular Progress simulation */}
                    <div className="relative h-12 w-12 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="24" cy="24" r="18" stroke="#f1f5f9" strokeWidth="3" fill="transparent" />
                        <circle 
                          cx="24" cy="24" r="18" 
                          stroke="#0ea5e9" strokeWidth="3" fill="transparent" 
                          strokeDasharray={`${2 * Math.PI * 18}`}
                          strokeDashoffset={`${2 * Math.PI * 18 * (1 - progressPct / 100)}`}
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-slate-700">{progressPct}%</span>
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <div className="col-span-2 py-8 text-center text-slate-400 text-sm">
                  No subjects unlocked yet. Contact Admin / Prof. Ali for subject assignment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notices & Upcoming Deadlines */}
        <div className="space-y-6">
          
          {/* Announcements notices */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="announcements-section">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-bold text-slate-800 font-display flex items-center gap-2">
                <Megaphone size={18} className="text-amber-500 animate-bounce" />
                <span>{getTranslation(lang, 'announcements')}</span>
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                Notice Board
              </span>
            </div>

            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1" id="notices-list">
              {announcements.map((ann) => {
                const showUrdu = lang === 'ur' && ann.urduTitle && ann.urduContent;
                return (
                  <div key={ann.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" id={`ann-card-${ann.id}`}>
                    <div dir={showUrdu ? 'rtl' : 'ltr'} className={showUrdu ? 'text-right' : 'text-left'}>
                      <h4 className={`text-xs font-bold text-slate-800 ${showUrdu ? 'font-urdu text-[13px]' : ''}`}>
                        {showUrdu ? ann.urduTitle : ann.title}
                      </h4>
                      <p className={`text-xs text-slate-500 leading-relaxed mt-1 ${showUrdu ? 'font-urdu text-slate-600 text-[12px]' : ''}`}>
                        {showUrdu ? ann.urduContent : ann.body}
                      </p>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-2" dir="ltr">
                      <span>By: {ann.authorName}</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
              {announcements.length === 0 && (
                <div className="py-6 text-center text-gray-400 text-sm">
                  Notice Board is clear! No active announcements.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignment Deadlines */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="deadlines-section">
            <h3 className="text-md font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
              <CheckSquare size={18} className="text-red-500" />
              <span>{getTranslation(lang, 'upcomingDeadlines')}</span>
            </h3>

            <div className="space-y-3" id="deadlines-list">
              {getUnsubmittedAssignments().map((ass) => (
                <div 
                  key={ass.id} 
                  onClick={() => onNavigate('assignments')}
                  className="border border-red-50 bg-red-50/20 hover:bg-red-50/40 p-3 rounded-xl transition-all cursor-pointer flex gap-2.5 items-start"
                  id={`deadline-card-${ass.id}`}
                >
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{ass.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Due: <span className="text-red-600 font-medium">{new Date(ass.dueDate).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
              ))}
              {getUnsubmittedAssignments().length === 0 && (
                <div className="py-4 text-center text-gray-400 text-xs">
                  {getTranslation(lang, 'noUpcoming')}
                </div>
              )}
            </div>
          </div>

          {/* Gamified Mini Leaderboard */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="leaderboard-section">
            <h3 className="text-md font-bold text-slate-800 font-display flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-amber-500" />
              <span>{getTranslation(lang, 'leaderboard')}</span>
            </h3>

            <div className="space-y-2" id="leaderboard-list">
              {leaderboard.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                    item.id === user.id ? 'bg-sky-50 border border-sky-100 font-semibold' : 'bg-slate-50'
                  }`}
                  id={`leaderboard-row-${item.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      index === 0 ? 'bg-amber-100 text-amber-800' :
                      index === 1 ? 'bg-slate-200 text-slate-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                    <span className="text-sky-600 font-semibold font-display">{item.xp} XP</span>
                    <span className="text-gray-400">• Lvl {item.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
