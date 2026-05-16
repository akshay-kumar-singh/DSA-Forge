'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, StickyNote } from 'lucide-react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

interface FieldNotesProps {
  show: boolean;
  problem: string;
  noteValue: string;
  onNoteChange: (val: string) => void;
  onClose: () => void;
}

export default function FieldNotes({ show, problem, noteValue, onNoteChange, onClose }: FieldNotesProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="absolute inset-0 z-30 flex flex-col bg-[#0f0f1a] border-l border-blue-500/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/10 shrink-0">
            <div className="flex items-center gap-2">
              <StickyNote size={16} className="text-blue-400" />
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">
                  Field Notes
                </div>
                <div className="text-[9px] text-[#475569] uppercase tracking-wider">{problem}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-[#475569] hover:text-[#94a3b8] transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Notes textarea — top half */}
            <div className="h-1/2 p-4 flex flex-col gap-2 border-b border-blue-500/10">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#475569]">
                Notes
              </span>
              <textarea
                value={noteValue}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Write your logic, complexity analysis, key observations..."
                className="flex-1 w-full bg-[#0a0a0f] border border-blue-500/15 rounded p-3 text-sm font-mono text-[#e2e8f0] placeholder:text-[#334155] resize-none outline-none focus:border-blue-500/40 transition-colors leading-relaxed"
              />
            </div>

            {/* TlDraw whiteboard — bottom half */}
            <div className="h-1/2 relative border-t border-blue-500/10 tldraw-container">
              <div className="absolute top-2 left-3 z-10 flex flex-col gap-1 pointer-events-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#475569]">
                  Whiteboard
                </span>
                <span className="text-[8px] text-[#334155] uppercase">
                  Ctrl+Z to Undo • Del to Delete
                </span>
              </div>
              <div className="absolute inset-0 overflow-hidden">
                <Tldraw
                  key={`tldraw-${problem}`}
                  inferDarkMode
                  persistenceKey={`dsa-forge-sketch-v2-${problem}`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
