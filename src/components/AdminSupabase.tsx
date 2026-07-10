import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Database, Cloud, RefreshCw, CheckCircle, ShieldAlert, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSupabase() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getSupabaseStatus();
      setStatus(res);
    } catch (err) {
      console.error('Failed to get Supabase status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSync = async (direction: 'push' | 'pull') => {
    try {
      setSyncing(true);
      setFeedback(null);
      const res = await api.triggerSupabaseSync(direction);
      setStatus(res.status);
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Synchronization request failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const sqlCode = `-- 1. Create Auxiliary Tables if not existing
CREATE TABLE IF NOT EXISTS lms_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS user_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_text TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Disable Row Level Security (RLS) on ALL tables so the LMS can sync data smoothly
ALTER TABLE IF EXISTS lms_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS access_grants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_credentials DISABLE ROW LEVEL SECURITY;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto" id="admin-supabase-root">
      
      {/* Title Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1.5 z-10">
          <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Cloud Integration Portal</span>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Cloud className="text-blue-400 animate-pulse" size={22} />
            <span>Supabase Database Connection</span>
          </h2>
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            TACLMS uses a high-performance, resilient architecture with local caching and synchronous fallback. 
            All changes push instantly to Supabase's global cloud network when connected.
          </p>
        </div>
        <div className="z-10 shrink-0 flex items-center">
          {loading ? (
            <div className="h-6 w-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          ) : status?.connected ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl px-4 py-2 flex items-center gap-2 font-bold text-xs">
              <CheckCircle size={15} />
              <span>CONNECTED & ACTIVE</span>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl px-4 py-2 flex items-center gap-2 font-bold text-xs">
              <ShieldAlert size={15} />
              <span>SYNC STANDBY / SETUP NEEDED</span>
            </div>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-medium animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle size={16} className="text-emerald-600 mt-0.5" />
          ) : (
            <ShieldAlert size={16} className="text-rose-600 mt-0.5" />
          )}
          <span className="whitespace-pre-line">{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection Credentials Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main info card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 pb-3 border-b border-gray-50">
              <Database size={16} className="text-blue-600" />
              <span>Target Connection Credentials</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800">
                  TACLMS
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Project Reference ID</label>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono">
                  {status?.projectId || 'hxqmadzterpmdbveameg'}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Supabase Endpoint URL</label>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 font-mono flex justify-between items-center">
                  <span>{status?.url || 'https://hxqmadzterpmdbveameg.supabase.co'}</span>
                  <a 
                    href={status?.url || 'https://hxqmadzterpmdbveameg.supabase.co'} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Service Publishable Key</label>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 font-mono">
                  sb_publishable_i2lv3uegeMxQn4Sk5AKj4...yFMcUpc_
                </div>
              </div>
            </div>
          </div>

          {/* Sync Trigger actions card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-2 pb-3 border-b border-gray-50">
              <RefreshCw size={16} className="text-blue-600" />
              <span>Manual Cloud Sync Center</span>
            </h3>

            <p className="text-slate-500 text-xs leading-relaxed">
              Use manual controls to force full database backups or retrieve latest snapshot state from Supabase.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleSync('push')}
                disabled={syncing || loading}
                className="p-4 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-slate-700 rounded-xl text-xs font-bold transition-all flex flex-col items-center text-center gap-2 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <Cloud size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Push to Supabase</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Overwrite cloud state with local data</p>
                </div>
              </button>

              <button
                onClick={() => handleSync('pull')}
                disabled={syncing || loading}
                className="p-4 bg-white border border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 text-slate-700 rounded-xl text-xs font-bold transition-all flex flex-col items-center text-center gap-2 cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl group-hover:bg-sky-100 transition-colors">
                  <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Pull from Supabase</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">Update local dataset with cloud state</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Setup and Instructions Panel */}
        <div className="space-y-6">
          
          {/* Connection Status stats */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sync Telemetry Status</h4>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-slate-500 font-semibold">Active Status</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                  status?.connected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {status?.connected ? 'Online' : 'Pending Setup'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <span className="text-slate-500 font-semibold">Last Cloud Sync</span>
                <span className="text-slate-700 font-mono text-[11px] font-bold">
                  {status?.lastSync ? new Date(status.lastSync).toLocaleTimeString() : 'Never'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Resilient Fallback</span>
                <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">Enabled</span>
              </div>
            </div>
          </div>

          {/* SQL Editor Instructions panel */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
              <CheckCircle size={14} className="text-blue-600" />
              <span>Step-by-step Connection Setup</span>
            </h4>
            
            <p className="text-slate-500 text-[11px] leading-relaxed">
              If your database status shows "Pending Setup", the unified <code>lms_state</code> table needs to be created in your Supabase SQL editor.
            </p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>SQL Schema Script</span>
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  <Copy size={12} />
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-300 font-mono text-[9px] p-3 rounded-xl overflow-x-auto border border-slate-800 max-h-36 select-all">
                {sqlCode}
              </pre>

              <div className="bg-blue-50/50 border border-blue-100 text-slate-600 p-3 rounded-xl text-[10px] leading-relaxed space-y-1 font-semibold">
                <div className="text-blue-800 font-bold uppercase">Setup Steps:</div>
                <div className="list-decimal pl-1 space-y-1">
                  <div>1. Go to your <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">Supabase Dashboard</a>.</div>
                  <div>2. Select project <strong>TACLMS</strong>.</div>
                  <div>3. Open the <strong>SQL Editor</strong> tab.</div>
                  <div>4. Paste the SQL script above and click <strong>Run</strong>.</div>
                  <div>5. Refresh this page to establish sync!</div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
