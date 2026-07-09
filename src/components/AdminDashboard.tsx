import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, AuditLog } from '../types';
import { Users, FileText, Play, History, Trophy, Award, Activity, CalendarCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'motion/react';

export default function AdminDashboard() {
  const [students, setStudents] = useState<User[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    // Gather all admin statistics
    Promise.all([
      api.getStudents(),
      api.getNotes(),
      api.getVideos(),
      api.getAuditLogs(),
      api.getLeaderboard()
    ]).then(([studentsRes, notesRes, vidsRes, logsRes, lbRes]) => {
      setStudents(studentsRes);
      setNotesCount(notesRes.length);
      setVideosCount(vidsRes.length);
      setAuditLogs(logsRes.slice(0, 10)); // recent 10 logs
      setLeaderboard(lbRes.leaderboard.slice(0, 5)); // top 5
    }).catch(err => console.error('Error fetching admin dashboard statistics', err));
  }, []);

  const totalStudents = students.length;
  const pendingStudents = students.filter(s => s.status === 'pending').length;

  // Mock analytics dataset representing rolling 7 days active clicks
  const analyticsData = [
    { name: 'Mon', logins: 12, noteViews: 24, videoViews: 15 },
    { name: 'Tue', logins: 19, noteViews: 32, videoViews: 21 },
    { name: 'Wed', logins: 15, noteViews: 28, videoViews: 18 },
    { name: 'Thu', logins: 22, noteViews: 45, videoViews: 28 },
    { name: 'Fri', logins: 26, noteViews: 54, videoViews: 36 },
    { name: 'Sat', logins: 30, noteViews: 68, videoViews: 42 },
    { name: 'Sun', logins: 25, noteViews: 48, videoViews: 29 }
  ];

  return (
    <div className="space-y-6" id="admin-dashboard-root">
      
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-students">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</span>
            <h3 className="text-2xl font-bold text-slate-800 font-display">{totalStudents}</h3>
            {pendingStudents > 0 && (
              <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full block w-fit">
                {pendingStudents} Pending Approvals
              </span>
            )}
          </div>
          <div className="bg-sky-50 text-sky-600 p-3.5 rounded-2xl">
            <Users size={22} />
          </div>
        </div>

        {/* Card 2: Notes Count */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-notes">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lectures & Notes</span>
            <h3 className="text-2xl font-bold text-slate-800 font-display">{notesCount}</h3>
            <span className="text-slate-400 text-[10px] font-medium block">PDF, DOCX and PPT Files</span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3.5 rounded-2xl">
            <FileText size={22} />
          </div>
        </div>

        {/* Card 3: Videos Count */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-videos">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Embedded Lectures</span>
            <h3 className="text-2xl font-bold text-slate-800 font-display">{videosCount}</h3>
            <span className="text-slate-400 text-[10px] font-medium block">Ad-free YouTube frames</span>
          </div>
          <div className="bg-red-50 text-red-600 p-3.5 rounded-2xl">
            <Play size={22} />
          </div>
        </div>

        {/* Card 4: Audit Count */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center justify-between" id="stat-audits">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secured Activities</span>
            <h3 className="text-2xl font-bold text-slate-800 font-display">{auditLogs.length}</h3>
            <span className="text-slate-400 text-[10px] font-medium block">Audit track logs tracked</span>
          </div>
          <div className="bg-slate-50 text-slate-600 p-3.5 rounded-2xl">
            <Activity size={22} />
          </div>
        </div>

      </div>

      {/* Analytics Visual Graphs & XP leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        
        {/* Rolling 7-day Analytics graph */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="chart-panel">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
                <Activity size={16} className="text-sky-500" />
                <span>Student Engagement Index</span>
              </h3>
              <p className="text-[11px] text-gray-400">Logins, note reads, and video playback trends</p>
            </div>
            <span className="bg-sky-50 text-sky-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
              Live (Simulated)
            </span>
          </div>

          <div className="h-72" id="recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="logins" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorLogins)" name="Student Logins" />
                <Area type="monotone" dataKey="noteViews" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#colorNotes)" name="Notes Accessed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tiny leaderboard sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit" id="xp-leaderboard-panel">
          <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 mb-4">
            <Trophy size={16} className="text-amber-500" />
            <span>Top Scholastic Students</span>
          </h3>

          <div className="space-y-3" id="top-xp-list">
            {leaderboard.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl hover:bg-slate-50 transition-colors" id={`lb-item-${item.id}`}>
                <div className="flex items-center gap-2.5">
                  <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-100 text-amber-800' :
                    index === 1 ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{item.name}</h4>
                    <p className="text-[10px] text-gray-400">GR: {item.grNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-sky-600 block">{item.xp} XP</span>
                  <span className="text-[9px] text-slate-400">Level {item.level}</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-xs">
                No student actions recorded yet.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Audit Trails chronological logs stream */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs" id="audit-logs-panel">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 mb-4">
          <History size={16} className="text-slate-500" />
          <span>Real-time Audit & Activity Trails</span>
        </h3>

        <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1" id="logs-stream-list">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start justify-between pb-3 border-b border-gray-50 last:border-b-0 last:pb-0" id={`log-item-${log.id}`}>
              <div className="flex gap-3">
                <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  log.actorRole === 'admin' ? 'bg-sky-50 text-sky-600' : 'bg-teal-50 text-teal-600'
                }`}>
                  <Users size={14} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">
                    {log.actorName} <span className="text-[10px] font-semibold text-slate-400">({log.actorRole})</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Action: <span className="font-semibold text-slate-700">{log.action}</span> &rarr; {log.target}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              Platform is waiting for students/admin events to log.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
