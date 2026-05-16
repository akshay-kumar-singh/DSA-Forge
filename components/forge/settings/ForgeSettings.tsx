'use client';

import { X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AI_PROVIDERS } from '@/lib/problems';
import type { AIProvider } from '@/lib/types';

interface ForgeSettingsProps {
  show: boolean;
  selectedProvider: AIProvider;
  selectedModel: string;
  editorFontSize: number;
  editorFontFamily: string;
  onClose: () => void;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onFontSizeChange: (size: number) => void;
  onFontFamilyChange: (family: string) => void;
}

const FONT_OPTIONS = [
  { value: 'var(--font-mono)', label: 'JetBrains Mono' },
  { value: 'var(--font-fira)', label: 'Fira Code' },
  { value: 'var(--font-anonymous)', label: 'Anonymous Pro' },
];

export default function ForgeSettings({
  show,
  selectedProvider,
  selectedModel,
  editorFontSize,
  editorFontFamily,
  onClose,
  onProviderChange,
  onModelChange,
  onFontSizeChange,
  onFontFamilyChange,
}: ForgeSettingsProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-md bg-[#0f0f1a] border border-blue-500/25 rounded-lg shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-blue-500/15">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-blue-400" />
                <h2 className="text-sm font-black uppercase tracking-widest text-[#e2e8f0]">
                  Forge Settings
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-[#475569] hover:text-[#94a3b8] transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* AI Provider */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
                  AI Engine
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedProvider.id}
                    onChange={(e) => {
                      const p = AI_PROVIDERS.find(x => x.id === e.target.value)!;
                      onProviderChange(p);
                    }}
                    className="h-9 px-3 text-[11px] font-bold uppercase bg-[#0a0a0f] border border-blue-500/20 text-[#94a3b8] rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors"
                  >
                    {AI_PROVIDERS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="h-9 px-3 text-[11px] bg-[#0a0a0f] border border-blue-500/20 text-[#94a3b8] rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors truncate"
                  >
                    {selectedProvider.models.map(m => (
                      <option key={m} value={m}>{m.split('/').pop()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Editor font */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
                  Editor Font
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={editorFontFamily}
                    onChange={(e) => onFontFamilyChange(e.target.value)}
                    className="h-9 px-3 text-[11px] bg-[#0a0a0f] border border-blue-500/20 text-[#94a3b8] rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={editorFontSize}
                    onChange={(e) => onFontSizeChange(Number(e.target.value))}
                    className="h-9 px-3 text-[11px] bg-[#0a0a0f] border border-blue-500/20 text-[#94a3b8] rounded outline-none cursor-pointer hover:border-blue-500/40 transition-colors"
                  >
                    {[12, 13, 14, 15, 16, 18, 20].map(s => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Forge Mode info */}
              <div className="p-3 rounded bg-blue-500/5 border border-blue-500/15 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Forge Mode — Always On
                </div>
                <p className="text-[10px] text-[#475569] leading-relaxed">
                  FORGE AI never gives solution code. It guides you through approach hints, conceptual explanations, and Mermaid diagrams. Ask for hints naturally in chat.
                </p>
              </div>
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={onClose}
                className="w-full forge-btn forge-btn-primary h-10 justify-center"
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
