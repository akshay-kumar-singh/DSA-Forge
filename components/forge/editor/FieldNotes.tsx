'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, StickyNote } from 'lucide-react';

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
          className="absolute inset-0 z-30 flex flex-col bg-bg-surface border-l border-border-default"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-2">
              <StickyNote size={16} className="text-blue-400" />
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-text-primary">
                  Field Notes
                </div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">{problem}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg-card text-text-muted hover:text-text-secondary transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
              Notes
            </span>
            <textarea
              value={noteValue}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Write your logic, complexity analysis, key observations..."
              className="flex-1 w-full bg-bg-base border border-border-subtle rounded p-3 text-sm font-mono text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-blue-500/40 transition-colors leading-relaxed"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
