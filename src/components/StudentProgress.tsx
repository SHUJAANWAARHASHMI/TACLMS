import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Subject, Chapter, Note, Video, Progress } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  Trophy, Award, Target, Calendar, CheckSquare, Sparkles, 
  ChevronRight, BarChart2, Star, ShieldAlert, Heart, User as UserIcon
} from 'lucide-react';
import { motion } from 'motion/react';

interface StudentProgressProps {
  user: User;
  lang: 'en' | 'ur';
}

export default function StudentProgress({ user, lang }: StudentProgressProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [showClassmateLeaderboard, setShowClassmateLeaderboard] = useState(true);

  useEffect(() => {
    // Parallelize loading of educational metrics
    Promise.all([
      api.getSubjects(),
      api.getChapters(),
      api.getNotes(),
      api.getVideos(),
      api.getProgress(),
      api.getLeaderboard(),
      api.getStudentAttendanceLogs(user.id)
    ]).then(([subs, chaps, allNotes, allVids, prog, lbRes, attendLogs]) => {
      setSubjects(subs);
      setChapters(chaps);
      setNotes(allNotes);
      setVideos(allVids);
      setProgress(prog);
      setLeaderboard(lbRes.leaderboard);
      setAttendance(attendLogs);
    }).catch(err => console.error('Error loading progress details', err));
  }, [user.id]);

  // Gamified badge titles
  const getBadgeTier = (lvl: number) => {
    if (lvl === 1) return { title: 'Beginner', desc: 'Starting your collegiate journey', bg: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700' };
    if (lvl === 2) return { title: 'Scholar', desc: 'Consistently reviewing lecture material', bg: 'from-purple-50 to-violet-50 border-purple-200 text-purple-700' };
    if (lvl === 3) return { title: 'Achiever', desc: 'Outstanding lecture completion records', bg: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700' };
    return { title: 'Topper', desc: 'Highest educational excellence standard', bg: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700' };
  };

  // Subject-wise percentage calculator
  const getSubjectMetrics = (subjectId: string) => {
    const subChaps = chapters.filter(c => c.subjectId === subjectId);
    const subChapIds = subChaps.map(c => c.id);
    const subNotes = notes.filter(n => subChapIds.includes(n.chapterId));
    const subVideos = videos.filter(v => subChapIds.includes(v.chapterId));
    
    const totalItems = subNotes.length + subVideos.length;
    if (totalItems === 0) return { total: 0, completed: 0, percent: 0 };
    
    const subNoteIds = subNotes.map(n => n.id);
    const subVideoIds = subVideos.map(v => v.id);
    
    const completedNotes = progress.filter(p => p.itemType === 'note' && subNoteIds.includes(p.itemId)).length;
    const completedVideos = progress.filter(p => p.itemType === 'video' && subVideoIds.includes(p.itemId)).length;
    const totalCompleted = completedNotes + completedVideos;
    
    return {
      total: totalItems,
      completed: totalCompleted,
      percent: Math.min(Math.round((totalCompleted / totalItems) * 100), 100)
    };
  };

  const isRtl = lang === 'ur';

  // Computed visual achievements
  const totalCompletedCount = progress.length;
  const attendancePercentage = attendance.length > 0
    ? Math.round((attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendance.length) * 100)
    : 100;

  const currentBadge = getBadgeTier(user.level);

  // Hardcoded achievements to reward gamified progress
  const badgesList = [
    { id: 'first_lecture', title: 'First Steps', desc: 'Watched your first video lecture', active: totalCompletedCount >= 1, color: 'text-blue-500 bg-blue-50' },
    { id: 'night_owl', title: 'Night Owl', desc: 'Studied past 10:00 PM', active: true, color: 'text-indigo-500 bg-indigo-50' },
    { id: 'attendance_star', title: 'Disciplined', desc: '90%+ presence records', active: attendancePercentage >= 90, color: 'text-teal-500 bg-teal-50' },
    { id: 'perfect_week', title: 'Flame Keeper', desc: 'Kept a learning streak over 3 days', active: (user.streakCount || 0) >= 3, color: 'text-amber-500 bg-amber-50' },
    { id: 'completionist', title: 'Topper Scholar', desc: 'Reached Level 3 in the portal', active: user.level >= 3, color: 'text-purple-500 bg-purple-50' },
  ];

  return (
    <div className="space-y-6" id="student-progress-container" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Overview Gamified Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Student Badge & Level Details */}
        <div className="bg-gradient-to-br from-[#00173d] to-[#00245b] text-white rounded-2xl p-5 border border-yellow-400/20 shadow-lg space-y-4 md:col-span-1">
          <div>
            <span className="bg-yellow-400 text-slate-900 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
              {currentBadge.title} TIER
            </span>
            <h3 className="text-lg font-bold font-display mt-2">{user.name}</h3>
            <p className="text-[11px] text-slate-300 mt-0.5 font-semibold">GR Code: {user.grNumber}</p>
          </div>

          <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="h-12 w-12 bg-yellow-400 text-slate-950 font-black rounded-full flex flex-col items-center justify-center font-display shadow-inner">
              <span className="text-xl leading-none">{user.level}</span>
              <span className="text-[8px] uppercase tracking-wider">LVL</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[10px] text-slate-300 font-bold mb-1">
                <span>{user.xp} XP</span>
                <span>{user.level * 100} XP</span>
              </div>
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div className="bg-yellow-400 h-full" style={{ width: `${Math.min((user.xp % 100), 100)}%` }} />
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-300 italic leading-relaxed">
            "{currentBadge.desc}. Review more lesson documents and answer chapter quizzes to increase your classmate ranking!"
          </p>
        </div>

        {/* Dynamic Subject Syllabus Progress Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs md:col-span-2 space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{lang === 'en' ? 'Syllabus Coverage' : 'نصاب کی کوریج'}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Subject-wise syllabus completion percentages based on completed lectures</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map(sub => {
              const metrics = getSubjectMetrics(sub.id);
              return (
                <div key={sub.id} className="p-3.5 border border-slate-100 rounded-xl space-y-2 hover:border-blue-100 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 truncate">{sub.name}</span>
                    <span className="text-xs font-black text-[#004aad] font-mono">{metrics.percent}%</span>
                  </div>
                  
                  {/* Progress Line Bar */}
                  <div className="w-full bg-slate-50 border border-slate-100/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-500 to-[#004aad] h-full rounded-full transition-all duration-500" style={{ width: `${metrics.percent}%` }} />
                  </div>

                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                    Finished {metrics.completed} / {metrics.total} Materials
                  </p>
                </div>
              );
            })}
            {subjects.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center col-span-2">No subjects unlocked yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Academic Badges Full-Width Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Award size={14} className="text-yellow-500" />
            <span>Collegiate Badges</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Earn digital pins by studying regularly on the portal</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badgesList.map((badge) => (
            <div 
              key={badge.id}
              className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
                badge.active 
                  ? 'border-yellow-200/50 bg-amber-50/10 shadow-3xs' 
                  : 'border-slate-100 opacity-40 bg-slate-50/30'
              }`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${badge.active ? badge.color : 'bg-slate-100 text-slate-400'}`}>
                <Award size={18} />
              </div>
              <div className="min-w-0 py-0.5">
                <h4 className="text-xs font-bold text-slate-800">{badge.title}</h4>
                <p className="text-[10px] text-gray-400 font-semibold leading-normal truncate mt-0.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History stats */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
            <Calendar size={14} className="text-sky-500" />
            <span>Attendance History Register</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Streak counters are preserved by persistent classroom attendance verification</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="attendance-stats-cards">
          <div className="p-4 bg-teal-50/40 border border-teal-100 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-teal-600 block font-black uppercase tracking-widest">Monthly Ratio</span>
            <span className="text-xl font-black text-teal-800 block font-display">{attendancePercentage}%</span>
          </div>

          <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-slate-400 block font-black uppercase tracking-widest">Days Present</span>
            <span className="text-xl font-black text-slate-800 block font-mono">
              {attendance.filter(a => a.status === 'present' || a.status === 'late').length} Days
            </span>
          </div>

          <div className="p-4 bg-amber-50/40 border border-amber-100 rounded-2xl text-center space-y-1">
            <span className="text-[10px] text-amber-600 block font-black uppercase tracking-widest">Active Streak</span>
            <span className="text-xl font-black text-amber-800 block font-mono">🔥 {user.streakCount || 0} Days</span>
          </div>
        </div>
      </div>

    </div>
  );
}
