import React, { useState, useEffect, useRef } from 'react';
import { api, getApiBaseUrl } from '../utils/api';
import { User } from '../types';
import { 
  MessageSquare, Send, Trash2, HelpCircle, GraduationCap, 
  Sparkles, ShieldAlert, ArrowLeft, Bot, CheckCircle, RefreshCw, AlertCircle
} from 'lucide-react';

interface AiChatbotProps {
  user: User;
  onBack?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export type BotRoleId = 'academic_tutor' | 'study_counselor' | 'concept_checker';

interface BotRoleConfig {
  id: BotRoleId;
  name: string;
  avatar: string;
  roleTitle: string;
  modelName: string;
  speed: string;
  complexity: string;
  description: string;
  themeColor: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  suggestions: string[];
}

const ROLES: BotRoleConfig[] = [
  {
    id: 'academic_tutor',
    name: "Prof. Ali",
    roleTitle: "LMS Academic Tutor",
    modelName: "gemini-3.1-pro-preview",
    speed: "Standard",
    complexity: "Advanced Reasoner",
    description: "Expert in science, math, physics, accounting & commerce. Solves problems step-by-step.",
    themeColor: "bg-blue-600 hover:bg-blue-700",
    bgGradient: "from-blue-600 to-indigo-700",
    textColor: "text-blue-600",
    borderColor: "border-blue-600",
    avatar: "👨‍🏫",
    suggestions: [
      "Explain Spaced Repetition with an analogy.",
      "How can I study for Accounting MCQ tests?",
      "Solve step-by-step: 2x + 5 = 15.",
      "Explain Newton's Second Law of Motion."
    ]
  },
  {
    id: 'study_counselor',
    name: "Dr. Hena",
    roleTitle: "Collegiate Counselor",
    modelName: "gemini-3.5-flash",
    speed: "Fast",
    complexity: "General Expert",
    description: "Helps you plan schedules, learn time management, fight stress, and find study motivation.",
    themeColor: "bg-emerald-600 hover:bg-emerald-700",
    bgGradient: "from-emerald-600 to-teal-700",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-600",
    avatar: "🧠",
    suggestions: [
      "Help me design a weekly study routine.",
      "I am feeling burnt out. What should I do?",
      "What is the Pomodoro Technique?",
      "Tips for maintaining a daily study habit."
    ]
  },
  {
    id: 'concept_checker',
    name: "Quizzy",
    roleTitle: "Rapid Concept Revision",
    modelName: "gemini-3.1-flash-lite",
    speed: "Super Fast",
    complexity: "Lite Revisionist",
    description: "Provides extremely quick, punchy, direct definitions and core formulas in seconds.",
    themeColor: "bg-amber-600 hover:bg-amber-700",
    bgGradient: "from-amber-50 to-amber-100",
    textColor: "text-amber-600",
    borderColor: "border-amber-500",
    avatar: "⚡",
    suggestions: [
      "Define Gross Profit Margin.",
      "What is the formula for kinetic energy?",
      "What is photosynthesis in 2 sentences?",
      "List 3 properties of an acid."
    ]
  }
];

export default function AiChatbot({ user, onBack }: AiChatbotProps) {
  const [selectedRole, setSelectedRole] = useState<BotRoleId>('academic_tutor');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeBot = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  // Load chat history from localStorage on active role or user change
  useEffect(() => {
    try {
      const storageKey = `taclms_gemini_chat_${user.id}_${selectedRole}`;
      const savedHistory = localStorage.getItem(storageKey);
      if (savedHistory) {
        setMessages(JSON.parse(savedHistory));
      } else {
        // Initial bot greeting message
        const initialGreeting: ChatMessage = {
          id: `greet-${Date.now()}`,
          sender: 'bot',
          text: getInitialGreetingText(selectedRole, user.name),
          timestamp: new Date().toISOString()
        };
        setMessages([initialGreeting]);
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
    setErrorMsg(null);
  }, [selectedRole, user.id]);

  // Save chat history to localStorage on change
  const saveChatHistory = (updatedMessages: ChatMessage[]) => {
    try {
      const storageKey = `taclms_gemini_chat_${user.id}_${selectedRole}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
    } catch (e) {
      console.error('Failed to save chat history:', e);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  function getInitialGreetingText(roleId: BotRoleId, userName: string) {
    switch (roleId) {
      case 'academic_tutor':
        return `Hello **${userName}**! I am **Prof. Ali**, your academic AI tutor. 📚\n\nI can help you understand complex calculations, science concepts, or explain study materials step-by-step. What subject or academic problem can we tackle today?`;
      case 'study_counselor':
        return `Hi **${userName}**! I am **Dr. Hena**, your study counselor. 🧠✨\n\nI specialize in helping you stay organized, designing customized revision routines, handling exam anxiety, and giving practical study advice. How are your preparations going?`;
      case 'concept_checker':
        return `Hey **${userName}**! I'm **Quizzy**, your speed revision buddy. ⚡\n\nAsk me for quick, direct definitions, concepts, or formulas. I will give you the answer fast and without any fluff! What word should I define?`;
    }
  }

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    setErrorMsg(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await fetch(`${API_BASE_URL}/api/gemini/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id}`
        },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ sender: m.sender, text: m.text })),
          roleId: selectedRole
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Communication failed with the backend.');
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected communication error occurred.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear this chat history?")) {
      const storageKey = `taclms_gemini_chat_${user.id}_${selectedRole}`;
      localStorage.removeItem(storageKey);
      
      const initialGreeting: ChatMessage = {
        id: `greet-${Date.now()}`,
        sender: 'bot',
        text: getInitialGreetingText(selectedRole, user.name),
        timestamp: new Date().toISOString()
      };
      setMessages([initialGreeting]);
      setErrorMsg(null);
    }
  };

  // Simple, robust custom formatter for text containing Markdown bold or new lines
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lIdx) => {
      // Basic Bold Match **text**
      const parts = line.split(/\*\*([^*]+)\*\*/g);
      const elements = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part}</strong>;
        }
        return part;
      });

      return (
        <div key={lIdx} className="min-h-[1.2em] leading-relaxed">
          {elements}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-4 border-[#00175c] rounded-3xl overflow-hidden shadow-2xl" id="ai-companion-interface">
      
      {/* Bot Chat Header / Identity Info */}
      <div className={`p-4 text-white bg-gradient-to-r ${activeBot.bgGradient} flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-[#00175c] shadow-md`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer transition-all mr-1"
              title="Back"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
          )}
          <span className="text-3xl filter drop-shadow-xs">{activeBot.avatar}</span>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm font-black uppercase tracking-wider">{activeBot.name}</h2>
              <span className="bg-white/20 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                {activeBot.roleTitle}
              </span>
            </div>
            <p className="text-[10px] text-white/80 font-medium leading-snug mt-0.5 max-w-md">{activeBot.description}</p>
          </div>
        </div>

        {/* Model status tags under the hood info */}
        <div className="flex flex-col items-end shrink-0 text-right self-stretch md:self-auto justify-between md:justify-center border-t border-white/10 md:border-none pt-2.5 md:pt-0">
          <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider bg-black/20 px-2.5 py-1 rounded-md">
            <Sparkles size={8} className="text-[#facc15]" fill="currentColor" />
            <span>Model: {activeBot.modelName}</span>
          </div>
          <span className="text-[8px] text-white/60 font-semibold tracking-wider mt-1 block">
            Latency: {activeBot.speed} &bull; Logic: {activeBot.complexity}
          </span>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-none" id="ai-role-tabs">
        {ROLES.map((role) => {
          const isActive = selectedRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer border-2 transition-all ${
                isActive 
                  ? 'bg-[#00175c] text-white border-[#00175c] scale-95 shadow-md' 
                  : 'bg-slate-50 text-[#00175c] border-slate-200 hover:border-[#00175c] hover:bg-[#00175c]/5'
              }`}
            >
              <span>{role.avatar}</span>
              <span>{role.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Conversation Screen */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[calc(100vh-290px)]" id="chatbot-thread">
        
        {/* Error Messages */}
        {errorMsg && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 flex items-start gap-2.5 animate-fade-in text-red-800">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-wider">Communication Fault</h4>
              <p className="text-[11px] leading-relaxed font-semibold">{errorMsg}</p>
              <button 
                onClick={() => handleSend(inputText || messages[messages.length-1]?.text)} 
                className="mt-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}
              id={`ai-message-${msg.id}`}
            >
              {/* Avatar Icon */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black uppercase shrink-0 shadow-xs border ${
                isUser 
                  ? 'bg-[#00175c] text-white border-[#00175c]' 
                  : `bg-[#00175c]/5 text-[#00175c] border-slate-200`
              }`}>
                {isUser ? user.name.substring(0, 2) : activeBot.avatar}
              </div>

              {/* Message Content Bubble */}
              <div className={`max-w-[85%] rounded-2xl p-3.5 border text-xs shadow-xs space-y-1.5 ${
                isUser 
                  ? 'bg-[#00175c] text-white border-[#00175c] rounded-tr-none' 
                  : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
              }`}>
                
                {/* Header (Sender and Date) */}
                <div className={`flex items-center gap-2 text-[9px] font-bold ${isUser ? 'text-white/60' : 'text-slate-400'}`}>
                  <span>{isUser ? user.name : activeBot.name}</span>
                  <span>&bull;</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Formatted Text */}
                <div className="space-y-1 text-[11px] font-medium leading-relaxed break-words">
                  {renderFormattedText(msg.text)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Placeholder */}
        {isTyping && (
          <div className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-black shrink-0 border border-slate-300">
              {activeBot.avatar}
            </div>
            <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-none p-3.5 border border-slate-200 max-w-[80%] text-xs shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">{activeBot.name} is thinking...</span>
              <div className="flex items-center gap-1 py-1.5">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions / Prompt starters section */}
      {messages.length <= 1 && (
        <div className="bg-white border-t border-slate-100 p-4 space-y-2.5" id="chatbot-suggestions">
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <HelpCircle size={10} />
            <span>Recommended Starters</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activeBot.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setInputText(suggestion);
                  handleSend(suggestion);
                }}
                className="p-2.5 bg-slate-50 hover:bg-[#00175c]/5 text-slate-700 hover:text-[#00175c] border border-slate-200 hover:border-[#00175c] rounded-xl text-left text-[11px] font-bold transition-all cursor-pointer truncate"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input controls form bar */}
      <div className="bg-white border-t-2 border-[#00175c] p-3 flex gap-2.5 items-center" id="chatbot-controls-bar">
        {/* Clear Chat Button */}
        <button
          onClick={handleClearHistory}
          className="p-2.5 border-2 border-red-100 hover:border-red-500 text-red-400 hover:text-red-500 rounded-xl transition-all cursor-pointer hover:bg-red-50 shrink-0"
          title="Clear Conversation History"
          id="clear-chat-history-btn"
        >
          <Trash2 size={16} />
        </button>

        {/* Input box */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSend(inputText);
            }
          }}
          disabled={isTyping}
          placeholder={`Message ${activeBot.name}...`}
          className="flex-1 bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-[#00175c] rounded-xl px-3.5 py-2 text-xs text-slate-800 disabled:bg-slate-100 font-medium"
          id="chatbot-message-input"
        />

        {/* Send button */}
        <button
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim() || isTyping}
          className="bg-[#00175c] hover:bg-[#00175c]/90 disabled:bg-[#00175c]/35 text-white p-2.5 rounded-xl cursor-pointer shadow-md shadow-[#00175c]/10 transition-all shrink-0"
          id="chatbot-send-msg-btn"
        >
          <Send size={15} />
        </button>
      </div>

    </div>
  );
}
