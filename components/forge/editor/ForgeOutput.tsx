'use client';

import { X } from 'lucide-react';

interface ForgeOutputProps {
  output: string;
  height: number;
  onClose: () => void;
  onResize: (delta: number) => void;
}

export default function ForgeOutput({ output, height, onClose, onResize }: ForgeOutputProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startH = height;

    const onMove = (ev: MouseEvent) => {
      const delta = startY - ev.clientY;
      onResize(Math.max(100, Math.min(window.innerHeight * 0.75, startH + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  return (
    <div
      style={{ height }}
      className="absolute bottom-0 left-0 right-0 flex flex-col z-30 bg-bg-surface border-t border-border-default forge-in"
    >
      {/* Drag handle */}
      <div
        className="h-2 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-blue-500/8 transition-colors"
        onMouseDown={handleMouseDown}
      >
        <div className="w-8 h-[2px] rounded-full bg-blue-500/30" />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
              Forge Output
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-bg-card transition-colors text-text-muted hover:text-text-secondary"
          >
            <X size={12} />
          </button>
        </div>

        {/* Output */}
        <div className="flex-1 overflow-auto bg-bg-base rounded p-3 border border-border-subtle">
          <pre className="whitespace-pre-wrap text-[12px] font-mono text-text-primary leading-relaxed">
            {output}
          </pre>
        </div>
      </div>
    </div>
  );
}
