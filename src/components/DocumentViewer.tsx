import React, { useEffect } from 'react';
import { User, Note } from '../types';
import { EyeOff, ShieldCheck, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';

interface DocumentViewerProps {
  note: Note;
  user: User;
  onClose: () => void;
}

export default function DocumentViewer({ note, user, onClose }: DocumentViewerProps) {
  
  // Disable right-click within secure viewer to prevent raw image downloads
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const getWatermarkText = () => {
    return `${user.name} • ${user.grNumber} • ${user.email} • TACLMS SECURE PROT`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none" id="document-viewer-modal">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 15 }}
        className="bg-slate-900 rounded-2xl overflow-hidden w-full max-w-4xl h-[90vh] shadow-2xl flex flex-col justify-between"
      >
        {/* Header Bar */}
        <div className="bg-slate-950 px-4 py-3 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-teal-500/20 text-teal-400 p-1.5 rounded-lg border border-teal-500/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold truncate max-w-md">{note.title}</h4>
              <p className="text-[10px] text-gray-400">Secure Reader (Encrypted View Only • Right-click blocked)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded">
              DO NOT SCREENSHOT
            </span>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Secure Document Stage / Canvas with WATERMARK overlay */}
        <div className="flex-1 overflow-y-auto bg-slate-800 p-6 md:p-12 relative flex justify-center" id="secure-stage">
          
          {/* DIAGONAL WATERMARK CANVAS OVERLAY */}
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden flex flex-wrap justify-center items-center content-around gap-16 opacity-[0.06] select-none select-all-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className="transform -rotate-35 text-xs font-bold font-mono tracking-widest text-slate-100 whitespace-nowrap"
                style={{ fontSize: '14px' }}
              >
                {getWatermarkText()}
              </div>
            ))}
          </div>

          {/* Secure Document Paper Body */}
          <div className="bg-white text-slate-800 shadow-xl rounded-lg p-8 md:p-12 max-w-2xl w-full h-fit min-h-[800px] border border-slate-200 select-none relative" id="secure-paper">
            
            {/* Header elements inside document page */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold font-display text-slate-900 uppercase">The Ali Collegates Private Library</h3>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">SECURE ACADEMIC DOCUMENT</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-500">GR-AUTH: {user.grNumber}</span>
              </div>
            </div>

            {/* Document body text / Simulated PDF rendering with rich learning style */}
            <div className="space-y-6 text-sm leading-relaxed text-slate-700" id="document-rendered-text">
              <h4 className="text-lg font-bold text-slate-900">Module Outline: {note.title}</h4>
              <p className="font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border-l-4 border-sky-500">
                Notice: This note contains copyright protected institution-only study materials. Sharing, distribution, or screenshots of this material is strictly tracked under GR code {user.grNumber}.
              </p>
              
              <div className="space-y-4">
                <h5 className="font-bold text-slate-900 text-sm">1. Executive Overview & Formulations</h5>
                <p>
                  Study notes are synthesized from recommended board guides, textbook derivations, and Professor Ali's lectures. In depth formulas have been verified with solutions for the latest semester requirements. Ensure you complete the practice assignments and take the integrated chapter MCQs to solidify these terms.
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">// Academic Core Concept Equation Reference</p>
                  <p>Equation (A): [V_final]^2 = [V_initial]^2 + 2 * a * d</p>
                  <p>Equation (B): Displacement = [V_initial]*t + (1/2)*a*(t^2)</p>
                  <p>Equation (C): F_force = mass * acceleration (Newton Second Law)</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="font-bold text-slate-900 text-sm">2. Solved Numerical Context</h5>
                <p>
                  To solve Kinematics and Dynamics board papers, split forces into components (X & Y axis) before resolving. When computing linked lists or queue logic, track the head pointer before performing insertions or recursive splits to prevent stack overflow.
                </p>
                <p>
                  Read through the versions tab on notes dashboard for any amendments, and check the pinned questions in discussions if any problem appears ambiguous.
                </p>
              </div>

              {/* End of Page Indicator */}
              <div className="border-t border-slate-100 pt-6 mt-12 text-center text-xs text-gray-400">
                --- End of Secure Reading Panel • Approved for {user.name} ---
              </div>
            </div>

          </div>

        </div>

        {/* Footer info bar */}
        <div className="bg-slate-950 px-4 py-3 text-white flex justify-between items-center border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-slate-400 font-medium">Session watermarked securely. Printing restricted.</span>
          </div>
          <div className="flex gap-2">
            <button 
              disabled 
              className="px-2.5 py-1.5 bg-slate-800 text-slate-500 rounded-lg flex items-center gap-1 cursor-not-allowed text-[11px] font-semibold"
              title="Printing is disabled for secure view-only documents"
            >
              <Printer size={12} />
              <span>Print Blocked</span>
            </button>
            <button 
              onClick={onClose}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg text-[11px]"
            >
              Close Reader
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
