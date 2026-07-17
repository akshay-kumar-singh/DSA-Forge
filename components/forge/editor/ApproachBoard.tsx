'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Eye } from 'lucide-react';

interface ApproachBoardProps {
  show: boolean;
  problem: string;
  value: string;
  onChange: (val: string) => void;
  onClose: () => void;
}

export default function ApproachBoard({ show, problem, value, onChange, onClose }: ApproachBoardProps) {
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
              <Eye size={16} className="text-blue-400" />
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-text-primary">
                  Approach Board
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

          {/* Guidance */}
          <div className="px-4 py-3 bg-blue-500/5 border-b border-border-subtle">
            <p className="text-[10px] text-blue-400/70 leading-relaxed">
              Write your thinking here <strong className="text-blue-400">before you code</strong>.
              FORGE AI reads this and will comment on your approach direction.
              Think: What data structure? What pattern? What&apos;s the time complexity target?
            </p>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Example:\n- I think this is a hash map problem\n- For each element, store its complement\n- Time: O(n), Space: O(n)\n\n...write your approach here`}
              className="flex-1 w-full bg-bg-base border border-border-subtle rounded p-3 text-sm font-mono text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-blue-500/40 transition-colors leading-relaxed"
            />
          </div>

          <div className="px-4 pb-3">
            <p className="text-[9px] text-text-muted uppercase tracking-wider">
              AI reads this automatically — no need to paste it into chat
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
