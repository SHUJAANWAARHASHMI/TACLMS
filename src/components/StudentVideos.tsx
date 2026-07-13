import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { User, Subject, Chapter, Video, Note, Progress } from '../types';
import { getTranslation } from '../utils/UrduTranslation';
import { 
  Play, Search, Filter, Clock, Sparkles, BookOpen, MessageSquare, 
  Download, Send, ThumbsUp, HelpCircle, ArrowRight, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudentDoubtSection from './StudentDoubtSection';

interface StudentVideosProps {
  user: User;
  lang: 'en' | 'ur';
  onXPUpdated: (newXp: number, newLevel: number, levelUp: boolean) => void;
}

export default function StudentVideos({ user, lang, onXPUpdated }: StudentVideosProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Immersive video player view
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [videoComments, setVideoComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch subjects, chapters, videos, progress and notes
    Promise.all([
      api.getSubjects(),
      api.getChapters(),
      api.getVideos(),
      api.getProgress(),
      api.getNotes()
    ]).then(([subs, chaps, vids, prog, allNotes]) => {
      setSubjects(subs);
      setChapters(chaps);
      setVideos(vids);
      setProgress(prog);
      setNotes(allNotes);
    }).catch(err => console.error('Error loading videos data', err));
  }, [user.id]);

  // Load video comments whenever active video is loaded
  useEffect(() => {
    if (!activeVideo) return;
    api.getComments(activeVideo.id)
      .then(setVideoComments)
      .catch(err => console.error('Error loading comments', err));
  }, [activeVideo]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVideo || !newCommentText.trim() || commenting) return;
    setCommenting(true);
    try {
      const added = await api.addComment(activeVideo.id, newCommentText);
      setVideoComments(prev => [added, ...prev]);
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommenting(false);
    }
  };

  const handleMarkComplete = async (video: Video) => {
    setCompletingId(video.id);
    try {
      const res = await api.markAsCompleted(video.id, 'video');
      if (res.success && res.xpEarned > 0) {
        onXPUpdated(user.xp + res.xpEarned, res.newLevel, res.levelUp);
        // Refresh local progress state
        const updatedProgress = await api.getProgress();
        setProgress(updatedProgress);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingId(null);
    }
  };

  const getYoutubeEmbedUrl = (youtubeId: string) => {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1`;
  };

  const isCompleted = (videoId: string) => progress.some(p => p.itemId === videoId);

  // Filter logic
  const filteredVideos = videos.filter(video => {
    // Match subject if filter is active
    if (selectedSubjectId !== 'all') {
      const chap = chapters.find(c => c.id === video.chapterId);
      if (!chap || chap.subjectId !== selectedSubjectId) return false;
    }
    // Match search query
    if (searchQuery.trim() !== '') {
      const titleMatch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = video.description.toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || descMatch;
    }
    return true;
  });

  // Calculate subject tag
  const getSubjectNameForVideo = (videoId: string, chapterId: string) => {
    const chap = chapters.find(c => c.id === chapterId);
    if (!chap) return 'General';
    const sub = subjects.find(s => s.id === chap.subjectId);
    return sub ? sub.name : 'General';
  };

  // Continue Watching list (simulated based on partially watched videos or recently completed/uncompleted)
  const continueWatchingVideos = videos.slice(0, 3).map((v, index) => ({
    ...v,
    percentWatched: index === 0 ? 75 : index === 1 ? 40 : 15,
    subject: getSubjectNameForVideo(v.id, v.chapterId)
  }));

  // Recommended list
  const recommendedVideos = videos.filter(v => !isCompleted(v.id)).slice(0, 4);

  const isRtl = lang === 'ur';

  return (
    <div className="space-y-6" id="student-videos-container" dir={isRtl ? 'rtl' : 'ltr'}>
      
      <AnimatePresence>
        {activeVideo ? (
          // ----------------- VIDEO PLAYER SCREEN -----------------
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="space-y-6"
            id="video-player-screen"
          >
            {/* Back to library link */}
            <button 
              onClick={() => setActiveVideo(null)}
              className="flex items-center gap-2 text-xs font-bold text-[#004aad] hover:underline cursor-pointer"
            >
              ← {lang === 'en' ? 'Back to Videos Library' : 'ویڈیوز لائبریری پر واپس جائیں'}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Player + description (Left 2 columns) */}
              <div className="lg:col-span-2 space-y-4">
                
                {/* Responsive Aspect Video Container */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video relative shadow-lg border border-slate-800">
                  {activeVideo.youtubeId ? (
                    <iframe
                      src={getYoutubeEmbedUrl(activeVideo.youtubeId)}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                      <div className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={24} fill="currentColor" />
                      </div>
                      <p className="font-bold text-md">{activeVideo.title}</p>
                      <p className="text-xs text-slate-400 max-w-sm">No streaming service has been loaded yet for this host. Contact Sir Ali Aslam.</p>
                    </div>
                  )}
                </div>

                {/* Video Info Panel */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
                    <div>
                      <span className="bg-[#004aad]/10 text-[#004aad] px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                        {getSubjectNameForVideo(activeVideo.id, activeVideo.chapterId)}
                      </span>
                      <h2 className="text-md sm:text-lg font-bold text-slate-900 mt-1 font-display">{activeVideo.title}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Instructor: Sir Ali Aslam • Duration: 18 mins</p>
                    </div>
                    
                    {/* Mark complete checkbox */}
                    <button
                      disabled={isCompleted(activeVideo.id) || completingId === activeVideo.id}
                      onClick={() => handleMarkComplete(activeVideo)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs ${
                        isCompleted(activeVideo.id)
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-[#004aad] text-white hover:bg-[#003e91]'
                      }`}
                    >
                      <CheckCircle size={14} fill={isCompleted(activeVideo.id) ? 'currentColor' : 'none'} />
                      <span>{isCompleted(activeVideo.id) ? (lang === 'en' ? 'Completed' : 'مکمل ہو گیا') : (lang === 'en' ? 'Mark Done (+25 XP)' : 'مکمل نشان لگائیں')}</span>
                    </button>
                  </div>

                  {/* Description Box */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lecture Overview</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {activeVideo.description || 'This premium digital lecture covers standard board derivations, essential definitions, and solved formulas designed by Sir Ali Aslam for examinations. Please follow along with your study notebook and complete the linked homework.'}
                    </p>
                  </div>

                  {/* Attached Downloadable Study Notes */}
                  {notes.filter(n => n.chapterId === activeVideo.chapterId).length > 0 && (
                    <div className="border-t border-gray-100 pt-4 space-y-2.5">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <BookOpen size={14} className="text-amber-500" />
                        <span>Downloadable Lesson Documents</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {notes.filter(n => n.chapterId === activeVideo.chapterId).map(note => (
                          <div key={note.id} className="flex justify-between items-center p-2.5 border border-slate-100 rounded-xl bg-slate-50/50">
                            <span className="text-xs font-bold text-slate-800 truncate flex-1 pr-2">{note.title}</span>
                            {note.downloadAllowed ? (
                              <a
                                href={api.getFileUrl(note.id, true)}
                                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shrink-0"
                                title="Download note"
                              >
                                <Download size={12} />
                              </a>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-semibold italic">Secure View</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Peer Doubt discussion comment board */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-[#004aad]" />
                    <span>Peer Doubt discussion Board</span>
                  </h3>

                  {/* Add comment Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder={lang === 'en' ? 'Ask a doubt or post classmate tips...' : 'اپنا سوال یا تبصرہ لکھیں...'}
                      className="flex-1 px-4 py-2 text-xs border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad] bg-white text-slate-800"
                    />
                    <button
                      type="submit"
                      disabled={commenting || !newCommentText.trim()}
                      className="bg-[#004aad] text-white p-2 px-4 rounded-full text-xs font-bold transition-all disabled:bg-slate-300 flex items-center gap-1.5 hover:bg-[#003e91] cursor-pointer"
                    >
                      <Send size={12} />
                      <span className="hidden sm:inline">Post</span>
                    </button>
                  </form>

                  {/* Comments list */}
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {videoComments.map((c) => (
                      <div key={c.id} className="p-3 border border-slate-50 rounded-xl bg-slate-50/30 flex flex-col gap-1 text-xs">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-[#004aad]">{c.authorName}</span>
                          <span className="text-gray-400 font-normal">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-700 font-medium leading-relaxed mt-0.5">{c.text || c.body}</p>
                      </div>
                    ))}
                    {videoComments.length === 0 && (
                      <p className="text-xs text-slate-400 py-6 text-center italic">No doubts posted yet. Ask the first question!</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Related Videos sidebar (Right 1 column) */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">Other Subject Lectures</h3>
                <div className="space-y-3">
                  {videos
                    .filter(v => v.id !== activeVideo.id)
                    .slice(0, 5)
                    .map(video => (
                      <div
                        key={video.id}
                        onClick={() => setActiveVideo(video)}
                        className="flex gap-3 bg-white p-2.5 border border-slate-100 rounded-xl hover:border-blue-200 transition-all cursor-pointer shadow-2xs group"
                      >
                        {video.thumbnailUrl && (
                          <div className="relative w-24 h-14 bg-slate-900 rounded-lg overflow-hidden shrink-0 border border-slate-150">
                            <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors">
                              <Play size={12} className="text-white" fill="currentColor" />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-[#004aad] transition-colors">{video.title}</h4>
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider">{getSubjectNameForVideo(video.id, video.chapterId)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          // ----------------- VIDEOS INDEX CATALOG -----------------
          <div className="space-y-6" id="videos-catalog-view">
            
            {/* Top row heading + search & filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-xs">
              <div>
                <h2 className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">{lang === 'en' ? 'Video Lectures Library' : 'ویڈیو لیکچر لائبریری'}</h2>
                <p className="text-xs text-slate-400 mt-0.5">YouTube Studio-style streaming with classroom discussions</p>
              </div>

              {/* Search bar inside header */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'en' ? 'Search topic, chapters...' : 'موضوع یا باب تلاش کریں...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#004aad]/10 focus:border-[#004aad] text-xs font-semibold bg-white text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Subject Filter Chips Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="subject-filters-container">
              <button
                onClick={() => setSelectedSubjectId('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                  selectedSubjectId === 'all'
                    ? 'bg-[#004aad] text-white border-[#004aad] shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                All Subjects
              </button>
              {subjects.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                    selectedSubjectId === sub.id
                      ? 'bg-[#004aad] text-white border-[#004aad] shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>

            {/* Netflix-Style "Continue Watching" Row */}
            {continueWatchingVideos.length > 0 && selectedSubjectId === 'all' && !searchQuery && (
              <div className="space-y-3" id="continue-watching-row">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                  <Clock size={14} className="text-amber-500" />
                  <span>{lang === 'en' ? 'Continue Watching' : 'دیکھنا جاری رکھیں'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {continueWatchingVideos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                    >
                      {video.thumbnailUrl && (
                        <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden mb-2.5">
                          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                            <div className="p-2.5 bg-yellow-400 text-[#00245b] rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                              <Play size={14} fill="currentColor" />
                            </div>
                          </div>
                          
                          {/* Continuous progress indicator at bottom of thumbnail */}
                          <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-800">
                            <div className="bg-[#004aad] h-full" style={{ width: `${video.percentWatched}%` }} />
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span>{video.subject}</span>
                          <span className="text-[#004aad]">{video.percentWatched}% Watched</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 truncate mt-1 group-hover:text-[#004aad] transition-colors">{video.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended for You Row */}
            {recommendedVideos.length > 0 && selectedSubjectId === 'all' && !searchQuery && (
              <div className="space-y-3" id="recommended-row">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5 px-1">
                  <Sparkles size={14} className="text-yellow-500 fill-yellow-400/10" />
                  <span>{lang === 'en' ? 'Recommended for You' : 'آپ کے لیے تجویز کردہ'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {recommendedVideos.map(video => (
                    <div
                      key={video.id}
                      onClick={() => setActiveVideo(video)}
                      className="bg-white border border-slate-100 rounded-2xl p-3 shadow-2xs hover:border-blue-200 transition-all cursor-pointer group"
                    >
                      {video.thumbnailUrl && (
                        <div className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden mb-2.5">
                          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-85" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors">
                            <div className="p-2.5 bg-white text-slate-900 rounded-full shadow-md transform group-hover:scale-105 transition-transform">
                              <Play size={12} fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-500 block">
                          {getSubjectNameForVideo(video.id, video.chapterId)}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5 group-hover:text-[#004aad] transition-colors">{video.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Core Lectures Grid list */}
            <div className="space-y-3" id="videos-main-catalog-grid">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-1">
                {lang === 'en' ? 'Browse Chapter Videos' : 'باب کے لحاظ سے ویڈیوز تلاش کریں'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    onClick={() => setActiveVideo(video)}
                    className="bg-white border border-gray-100 rounded-2xl p-4 shadow-2xs hover:shadow-md hover:border-blue-100 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                    id={`video-card-catalog-${video.id}`}
                  >
                    <div>
                      {/* Video Thumbnail */}
                      {video.thumbnailUrl ? (
                        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-3 border border-slate-100">
                          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/25 transition-colors">
                            <div className="p-2.5 bg-yellow-400 text-[#00245b] rounded-full shadow-md shadow-yellow-400/20 transform group-hover:scale-110 transition-transform">
                              <Play size={14} fill="currentColor" />
                            </div>
                          </div>
                          
                          {/* Duration Badge */}
                          <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            18:45
                          </span>
                        </div>
                      ) : (
                        <div className="aspect-video bg-[#00173d] rounded-xl flex items-center justify-center text-white mb-3 text-center relative overflow-hidden">
                          <Play size={20} className="opacity-40" />
                          <span className="absolute bottom-2 right-2 bg-black/80 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">15:00</span>
                        </div>
                      )}

                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <span className="bg-sky-50 text-sky-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider block w-fit">
                            {getSubjectNameForVideo(video.id, video.chapterId)}
                          </span>
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug mt-1.5 group-hover:text-[#004aad] transition-colors">{video.title}</h4>
                        </div>
                      </div>
                      
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-normal font-medium">{video.description || 'No summary notes available.'}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
                      <span className="text-[10px] font-bold text-slate-400">By Sir Ali Aslam</span>
                      
                      {isCompleted(video.id) ? (
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle size={10} fill="currentColor" className="text-emerald-600" />
                          <span>Finished</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#004aad] group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                          <span>Watch Now</span>
                          <span>→</span>
                        </span>
                      )}
                    </div>

                  </div>
                ))}

                {filteredVideos.length === 0 && (
                  <div className="col-span-3 bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
                    {lang === 'en' ? 'No video lectures match your active search filter.' : 'آپ کے فعال تلاش کے فلٹر سے مماثل کوئی ویڈیو لیکچرز نہیں ہیں۔'}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
