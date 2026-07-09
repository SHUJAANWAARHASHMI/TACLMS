import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { User } from '../types';
import { MessageSquare, Pin, Send, User as UserIcon } from 'lucide-react';

interface StudentDoubtSectionProps {
  itemId: string;
  user: User;
}

export default function StudentDoubtSection({ itemId, user }: StudentDoubtSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadComments();
  }, [itemId]);

  const loadComments = async () => {
    try {
      const data = await api.getComments(itemId);
      // Sort pinned comments first, then chronological
      const sorted = data.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
      setComments(sorted);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || loading) return;

    setLoading(true);
    try {
      await api.addComment(itemId, newCommentText);
      setNewCommentText('');
      await loadComments();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (commentId: string) => {
    if (user.role !== 'admin') return;
    try {
      await api.togglePinComment(commentId);
      loadComments();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 justify-between" id="discussions-panel">
      
      {/* Scrollable thread list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 max-h-[calc(100vh-170px)]">
        {comments.map((comment) => (
          <div 
            key={comment.id} 
            className={`p-3.5 rounded-2xl border ${
              comment.isPinned 
                ? 'bg-amber-50/70 border-amber-200' 
                : comment.userRole === 'admin' 
                  ? 'bg-sky-50/50 border-sky-100' 
                  : 'bg-white border-slate-100'
            } transition-all shadow-xs relative group`}
            id={`comment-bubble-${comment.id}`}
          >
            {/* Pinned label */}
            {comment.isPinned && (
              <span className="absolute top-2 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shadow-xs">
                <Pin size={10} fill="currentColor" />
                <span>PINNED</span>
              </span>
            )}

            <div className="flex gap-2.5 items-start">
              <div className={`p-1.5 rounded-full shrink-0 ${
                comment.userRole === 'admin' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <UserIcon size={14} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">{comment.userName}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                    comment.userRole === 'admin' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {comment.userRole === 'admin' ? 'Lecturer' : 'Student'}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed break-words">{comment.text}</p>
              </div>
            </div>

            {/* Pin action for admins on hover */}
            {user.role === 'admin' && (
              <button
                onClick={() => handleTogglePin(comment.id)}
                className="absolute right-3 bottom-2.5 opacity-0 group-hover:opacity-100 hover:opacity-100 p-1 bg-white hover:bg-slate-50 rounded border border-gray-200 text-slate-400 hover:text-amber-500 transition-opacity cursor-pointer flex items-center gap-0.5 text-[9px] font-bold"
                id={`comment-pin-btn-${comment.id}`}
              >
                <Pin size={10} />
                <span>{comment.isPinned ? 'Unpin' : 'Pin'}</span>
              </button>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
            <MessageSquare size={32} className="text-slate-300" />
            <p>No questions posted yet. Start the thread with a doubt!</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message post textbox */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3 flex gap-2 items-center" id="comment-form">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder="Ask a doubt or start a discussion..."
          className="flex-1 bg-slate-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent rounded-xl px-3 py-2 text-xs text-slate-800"
          id="comment-input"
        />
        <button
          type="submit"
          disabled={loading || !newCommentText.trim()}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white p-2.5 rounded-xl cursor-pointer shadow-xs transition-colors shrink-0"
          id="comment-submit"
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
}
