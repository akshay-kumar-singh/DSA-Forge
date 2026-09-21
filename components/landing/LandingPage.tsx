import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Zap, Target, Shield, ChevronRight, Sun, Moon, Flame, Clock, Code2, Network, Users, Timer } from 'lucide-react';
import { useGoogleSummary } from '@/components/google/useGoogleSummary';
import { planFor, computePlanStatus, EMPTY_START } from '@/lib/google/plan';
import { GOOGLE_TOTAL } from '@/lib/google/problems';

const ThreeBackground = dynamic(() => import('./ThreeBackground'), { ssr: false });

interface LandingPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  masteredCount: number;
  totalProblems: number;
  onEnter: () => void;
}

export default function LandingPage({ theme, onToggleTheme, masteredCount, totalProblems, onEnter }: LandingPageProps) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-bg-base flex flex-col items-center justify-center tech-grid py-16">
      {/* Three.js animated background */}
      <ThreeBackground active />

      {/* Scan line overlay */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"
          style={{ animation: 'scan 6s linear infinite' }}
        />
      </div>

      {/* Theme toggle in top right */}
      <div className="fixed top-6 right-6 z-30">
        <button
          onClick={onToggleTheme}
          className="forge-btn w-9 h-9 px-0 flex items-center justify-center border-border-default text-blue-400"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-20 flex flex-col items-center text-center px-6 max-w-5xl w-full space-y-8"
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
            <span className="text-text-primary">DSA </span>
            <span
              className="text-transparent"
              style={{ WebkitTextStroke: '2px #3b82f6', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' }}
            >
              FORGE
            </span>
          </h1>
          <p className="text-base font-medium text-text-secondary tracking-wide">
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
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-bg-surface border border-border-subtle text-[11px] font-bold text-text-secondary"
            >
              <Icon size={11} className="text-blue-400" />
              {label}
            </div>
          ))}
        </div>

        {/* Two tracks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full text-left pt-2">
          <NeetCodeCard masteredCount={masteredCount} totalProblems={totalProblems} onEnter={onEnter} />
          <GoogleCard />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">Choose a track · progress is saved separately for each</p>
      </motion.div>

      {/* Corner decorations */}
      <div className="fixed top-6 left-6 w-12 h-12 border-l-2 border-t-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="fixed top-6 right-6 w-12 h-12 border-r-2 border-t-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="fixed bottom-6 left-6 w-12 h-12 border-l-2 border-b-2 border-blue-500/30 pointer-events-none z-20" />
      <div className="fixed bottom-6 right-6 w-12 h-12 border-r-2 border-b-2 border-blue-500/30 pointer-events-none z-20" />
    </div>
  );
}

const cardClass = 'group relative w-full flex flex-col rounded-2xl border border-border-default bg-bg-surface/85 backdrop-blur-md p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/50 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.25),0_16px_40px_rgba(59,130,246,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

function NeetCodeCard({ masteredCount, totalProblems, onEnter }: { masteredCount: number; totalProblems: number; onEnter: () => void }) {
  const pct = Math.min((masteredCount / Math.max(totalProblems, 1)) * 100, 100);
  const rank = masteredCount >= 40 ? 'COMMANDER' : masteredCount >= 25 ? 'SPECIALIST' : masteredCount >= 10 ? 'AGENT' : masteredCount >= 3 ? 'RECRUIT' : 'INITIATE';
  return (
    <motion.button whileTap={{ scale: 0.99 }} onClick={onEnter} className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-blue-500/12 border border-blue-500/30 flex items-center justify-center text-blue-400"><Flame size={20} /></span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-400">Track 01</div>
            <div className="text-xl font-black uppercase tracking-tight text-text-primary leading-tight">NeetCode 150</div>
          </div>
        </div>
        <span className="text-[10px] font-black tracking-widest text-blue-400 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">{rank}</span>
      </div>
      <p className="text-[13px] text-text-secondary mt-4">Missions by pattern, a Socratic coach that never spoils, and a 7 → 14 → 30-day revision ladder.</p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-black text-text-primary leading-none">{masteredCount}</span>
        <span className="text-sm font-bold text-text-muted mb-0.5">/ {totalProblems} mastered</span>
      </div>
      <div className="mt-3 w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
        <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-4 text-[11px] font-bold text-text-muted">
          <span className="flex items-center gap-1"><Code2 size={12} className="text-blue-400" />18 divisions</span>
          <span className="flex items-center gap-1"><Clock size={12} className="text-blue-400" />Spaced repetition</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-blue-400">Enter Forge <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
      </div>
    </motion.button>
  );
}

function GoogleCard() {
  const g = useGoogleSummary();
  // Before any progress exists, show what a fresh plan from the default start date projects.
  const fresh = computePlanStatus(planFor(EMPTY_START), { planDone: {}, planStart: EMPTY_START });
  const daysLeft = g ? g.daysLeft : fresh.daysLeft;
  const readyBy = (g ? g.readyBy : fresh.projectedReady).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const status = !g ? 'Not started' : !g.started ? `Starts in ${g.startsIn} day${g.startsIn === 1 ? '' : 's'}` : g.delta === 0 ? 'On schedule' : `${Math.abs(g.delta)}d ${g.delta > 0 ? 'ahead' : 'behind'}`;
  const statusColor = !g || !g.started ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : g.delta >= 0 ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';
  return (
    <Link href="/prep" className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center">
            <Target size={20} className="text-green-400" aria-hidden />
          </span>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-green-400">Track 02</div>
            <div className="text-xl font-black uppercase tracking-tight text-text-primary leading-tight">Interview Prep</div>
          </div>
        </div>
        <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded border ${statusColor}`}>{status}</span>
      </div>
      <p className="text-[13px] text-text-secondary mt-4">{`The 26-week roadmap as a daily plan: ${g?.totalProblems ?? GOOGLE_TOTAL} problems by pattern, system design on a whiteboard, STAR stories, graded mocks.`}</p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-black text-text-primary leading-none">{daysLeft}</span>
        <span className="text-sm font-bold text-text-muted mb-0.5">days left · ready by {readyBy}</span>
      </div>
      <div className="mt-3 w-full h-1.5 bg-bg-base rounded-full overflow-hidden border border-border-subtle">
        <div className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full" style={{ width: `${(g?.pct ?? 0) * 100}%` }} />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        {[
          { icon: Code2, label: 'DSA', value: `${g?.mastered ?? 0}/${g?.totalProblems ?? GOOGLE_TOTAL}` },
          { icon: Network, label: 'Designs', value: `${g?.designs ?? 0}/${g?.totalDesigns ?? 21}` },
          { icon: Users, label: 'Stories', value: `${g?.stories ?? 0}/${g?.totalStories ?? 12}` },
          { icon: Timer, label: 'Mocks', value: g?.avg != null ? `${g.mocks} · ${g.avg.toFixed(1)}` : `${g?.mocks ?? 0}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg bg-bg-base/70 border border-border-subtle px-2 py-1.5">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-muted flex items-center gap-1"><Icon size={10} className="text-green-400" />{label}</div>
            <div className="text-[13px] font-black text-text-primary">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-end">
        <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-green-400">Open Interview Prep <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></span>
      </div>
    </Link>
  );
}
