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
          className="absolute inset-0 z-30 flex flex-col bg-[#0f0f1a] border-l border-blue-500/20"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/10 shrink-0">
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-blue-400" />
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">
                  Approach Board
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

          {/* Guidance */}
          <div className="px-4 py-3 bg-blue-500/5 border-b border-blue-500/10">
            <p className="text-[10px] text-blue-400/70 leading-relaxed">
              Write your thinking here <strong className="text-blue-400">before you code</strong>.
              FORGE AI reads this and will comment on your approach direction.
              Think: What data structure? What pattern? What's the time complexity target?
            </p>
          </div>

          {/* Textarea */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Example:\n- I think this is a hash map problem\n- For each element, store its complement\n- Time: O(n), Space: O(n)\n\n...write your approach here`}
              className="flex-1 w-full bg-[#0a0a0f] border border-blue-500/15 rounded p-3 text-sm font-mono text-[#e2e8f0] placeholder:text-[#334155] resize-none outline-none focus:border-blue-500/40 transition-colors leading-relaxed"
            />
          </div>

          <div className="px-4 pb-3">
            <p className="text-[9px] text-[#334155] uppercase tracking-wider">
              AI reads this automatically — no need to paste it into chat
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
