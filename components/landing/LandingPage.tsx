'use client';

import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { Zap, Target, Shield, ChevronRight } from 'lucide-react';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), { ssr: false });

interface LandingPageProps {
  masteredCount: number;
  totalProblems: number;
  onEnter: () => void;
}

export default function LandingPage({ masteredCount, totalProblems, onEnter }: LandingPageProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0a0f] flex flex-col items-center justify-center tech-grid">
      {/* Three.js animated background */}
      <ThreeBackground active />

      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
          style={{ animation: 'scan 6s linear infinite' }}
        />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-20 flex flex-col items-center text-center px-6 max-w-3xl w-full space-y-8"
      >
        {/* Badge */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
          <Shield size={12} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
            S.H.I.E.L.D. Training Facility
          </span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            <span className="text-[#e2e8f0]">DSA </span>
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '2px #3b82f6', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' }}
            >
              FORGE
            </span>
          </h1>
          <p className="text-base font-medium text-[#94a3b8] tracking-wide">
            Your Personal Training Facility. No Answers. Only Growth.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Zap,    label: 'Forge Mode — Always On' },
            { icon: Target, label: 'AI-Guided, Never Spoiled' },
            { icon: Shield, label: 'Mermaid Diagrams' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#0f0f1a] border border-blue-500/15 text-[11px] font-bold text-[#94a3b8]"
            >
              <Icon size={11} className="text-blue-400" />
              {label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onEnter}
          className="group relative flex items-center gap-3 px-10 py-4 rounded-lg font-black text-lg uppercase tracking-widest text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', boxShadow: '0 0 24px rgba(59,130,246,0.35), 0 0 48px rgba(59,130,246,0.15)' }}
        >
          <span>Enter Forge</span>
          <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          {/* Shimmer */}
          <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.button>

        {/* Stats row */}
        <div className="flex items-center gap-8 pt-2">
          {[
            { label: 'Mastered', value: masteredCount, color: 'text-blue-400' },
            { label: 'Total Missions', value: totalProblems, color: 'text-[#94a3b8]' },
            { label: 'Mode', value: 'FORGE', color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#475569]">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="absolute top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="absolute bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="absolute bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-blue-500/30 pointer-events-none z-20" />
    </div>
  );
}
