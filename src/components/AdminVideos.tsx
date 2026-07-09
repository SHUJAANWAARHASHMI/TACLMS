import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ClassRoom, Subject, Chapter, Video } from '../types';
import { Video as VideoIcon, Plus, Trash2, Check, AlertTriangle, ArrowRight, PlayCircle } from 'lucide-react';

export default function AdminVideos() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  // Live validity checks state
  const [validityHint, setValidityHint] = useState<{ videoId: string | null; isValid: boolean }>({ videoId: null, isValid: false });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSelectors();
    loadVideos();
  }, []);

  // Live URL validation check on keypress
  useEffect(() => {
    if (!url.trim()) {
      setValidityHint({ videoId: null, isValid: false });
      return;
    }

    // Call API parser
    api.parseYoutube(url)
      .then(res => setValidityHint(res))
      .catch(() => setValidityHint({ videoId: null, isValid: false }));

  }, [url]);

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

  const loadVideos = async () => {
    try {
      const allVids = await api.getVideos();
      setVideos(allVids);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedChapterId) {
      setError('Please select a target chapter folder first.');
      return;
    }
    if (!title.trim() || !url.trim()) {
      setError('Title and URL link are required.');
      return;
    }

    setLoading(true);
    try {
      await api.addVideo({
        chapterId: selectedChapterId,
        title,
        url,
        description
      });
      setSuccess(true);
      setTitle('');
      setUrl('');
      setDescription('');
      await loadVideos();
    } catch (err: any) {
      setError(err.message || 'Failed to add video lecture');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!window.confirm('Wipe this video lecture from the course folder?')) return;
    try {
      await api.deleteVideo(id);
      await loadVideos();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredSubjects = subjects.filter(s => s.classId === selectedClassId);
  const filteredChapters = chapters.filter(c => c.subjectId === selectedSubjectId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" id="videos-manager-root">
      
      {/* COLUMN 1: Video lecture upload form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs h-fit space-y-4" id="video-upload-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <VideoIcon size={16} className="text-sky-500" />
          <span>Add Lecture Video Link</span>
        </h3>

        <form onSubmit={handleSaveVideo} className="space-y-4 text-xs font-semibold text-slate-500" id="video-adder-form">
          
          {/* Chapter Cascades */}
          <div className="space-y-2">
            <div>
              <label className="block mb-1">Target Class Grade Slot</label>
              <select
                required
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedSubjectId(''); setSelectedChapterId(''); }}
                className="w-full p-2 border border-gray-200 rounded-xl bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400"
                id="videos-class-select"
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
                id="videos-sub-select"
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
                id="videos-chap-select"
              >
                <option value="">-- Choose Chapter Folder --</option>
                {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </div>

          {/* Video parameters */}
          <div className="space-y-3 pt-2">
            <div>
              <label className="block mb-1">Lecture Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Kinematics Lecture 1: Motion Terms"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="video-title-input"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label>YouTube / Video Link</label>
                
                {/* Real-time recognized/unrecognized live URL feedback indicators */}
                {url.trim() && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-bold ${
                    validityHint.isValid ? 'text-teal-600' : 'text-amber-600'
                  }`} id="live-validity-hint">
                    {validityHint.isValid ? (
                      <>
                        <Check size={11} />
                        <span>Recognized YouTube Link ✓</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={11} />
                        <span>Unrecognized Source ⚠</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Paste share link, shorts, embed, or live URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="video-url-input"
              />
            </div>

            <div>
              <label className="block mb-1">Short Outline Description</label>
              <textarea
                placeholder="Summary outline for students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                id="video-desc-input"
              />
            </div>
          </div>

          {/* Recognized Youtube preview container box */}
          {validityHint.isValid && validityHint.videoId && (
            <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center gap-2.5" id="parsed-video-preview">
              <div className="w-24 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 shadow-xs border">
                <img 
                  src={`https://img.youtube.com/vi/${validityHint.videoId}/hqdefault.jpg`} 
                  alt="YouTube Preview" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 space-y-0.5">
                <span className="text-[9px] font-bold text-sky-500 uppercase">Recognized Video Thumbnail</span>
                <p className="text-[10px] text-gray-400 font-mono">ID: {validityHint.videoId}</p>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 font-bold">{error}</p>}
          {success && <p className="text-xs text-teal-600 font-bold">Lecture linked and published successfully!</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:bg-sky-300"
            id="video-submit-btn"
          >
            <span>{loading ? 'Adding Link...' : 'Publish Video Lecture'}</span>
            <ArrowRight size={14} />
          </button>

        </form>
      </div>

      {/* COLUMN 2 & 3: Video directory directory list */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4" id="videos-list-col">
        <h3 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5 border-b border-gray-50 pb-3">
          <PlayCircle size={16} className="text-amber-500" />
          <span>Lecture Video Folder Directory</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[80vh] overflow-y-auto pr-1" id="videos-directory-list">
          {videos.map((vid) => {
            const chap = chapters.find(c => c.id === vid.chapterId);
            const sub = chap ? subjects.find(s => s.id === chap.subjectId) : null;
            const cls = sub ? classes.find(c => c.id === sub.classId) : null;

            return (
              <div key={vid.id} className="border border-gray-100 p-3 rounded-2xl bg-white hover:shadow-md transition-shadow flex flex-col justify-between gap-3" id={`video-card-admin-${vid.id}`}>
                <div className="space-y-2.5">
                  {vid.thumbnailUrl ? (
                    <div className="w-full aspect-video bg-slate-900 rounded-xl overflow-hidden relative border">
                      <img 
                        src={vid.thumbnailUrl} 
                        alt={vid.title} 
                        className="w-full h-full object-cover opacity-80"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <PlayCircle size={28} className="text-white drop-shadow-lg" fill="currentColor" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-slate-50 border rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <AlertTriangle size={24} />
                      <span className="text-[10px] font-semibold mt-1">Embed Playback Depends on Source</span>
                    </div>
                  )}

                  <div className="space-y-1 px-1">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] font-bold bg-sky-50 text-sky-600 px-2 py-0.5 rounded-full">
                        {cls ? cls.name : 'Class'} &rarr; {sub ? sub.name : 'Subject'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{vid.title}</h4>
                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">{vid.description || 'No outlines provided.'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-50 pt-2 px-1 text-[10px] text-slate-400">
                  <span className="font-mono truncate max-w-[120px]" title={vid.url}>
                    {vid.youtubeId ? `ID: ${vid.youtubeId}` : 'External URL'}
                  </span>
                  
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-500 font-semibold cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
          {videos.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-400 text-xs">
              No video lectures added yet. Link your YouTube videos using the left configuration form.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
