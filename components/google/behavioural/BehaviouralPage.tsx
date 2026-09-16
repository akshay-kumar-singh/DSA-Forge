'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
import { GripVertical, GripHorizontal, Users, Play, Pause, RotateCcw, Flag, X, Menu, MessageCircleQuestion, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import GoogleChatPanel, { type QuickAction } from '../shared/GoogleChatPanel';
import { useChat } from '../shared/useChat';
import { useTimer, fmtClock } from '../shared/useTimer';
import type { GoogleStore } from '../useGoogleStore';
import type { AIProvider } from '@/lib/types';
import type { StarStory } from '@/lib/google/types';
import { STORY_SEEDS, GL_QUESTIONS, GL_ATTRIBUTES, STAR_RULES } from '@/lib/google/behavioural';
import { buildBehaviouralInterviewerPrompt, parseGrade, stripGradeBlock } from '@/lib/google/ai';
import { trackGoogle } from '@/lib/google/track';

export interface BehaviouralMockHandlers {
  questions: string[];
  onEnd: (r: { score: number | null; verdict: string; feedback: string; minutes: number; strengths?: string[]; improvements?: string[] }) => void;
  onAbort: () => void;
}

interface Props {
  theme: 'dark' | 'light';
  store: GoogleStore;
  provider: AIProvider;
  model: string;
  orientation: 'horizontal' | 'vertical';
  focus?: { n: number; id?: string };
  mock?: BehaviouralMockHandlers;
}

const EMPTY: StarStory = { situation: '', task: '', action: '', result: '' };
const TITLES: Record<string, string> = Object.fromEntries(STORY_SEEDS.map(s => [s.id, s.title]));
const FIELDS: { k: keyof StarStory; hint: string; ph: string; rows: number }[] = [
  { k: 'situation', hint: 'Two sentences — where were you, what was at stake?', ph: 'At Paywize, our BBPS reconciliation job was silently dropping…', rows: 3 },
  { k: 'task', hint: 'One or two sentences — what were you responsible for?', ph: 'I owned the integration and had to find the mismatch before month-end…', rows: 2 },
  { k: 'action', hint: 'The bulk of the story. What YOU did, step by step — "I", not "we".', ph: 'I pulled the PSP reports, wrote a diff script, found that…', rows: 7 },
  { k: 'result', hint: 'What changed, by how much, and what you learned. A number if you have one.', ph: 'Mismatches dropped from ~40/day to zero; I added an idempotency key and…', rows: 3 },
];

export default function BehaviouralPage({ theme, store, provider, model, orientation, focus, mock }: Props) {
  const s = store.state;
  const isMock = !!mock;
  const [storyId, setStoryId] = useState(STORY_SEEDS[0].id);
  const [showLeft, setShowLeft] = useState(!isMock);
  const [showRight, setShowRight] = useState(isMock); // chat opens on demand; a mock round is the interview, so it starts open
  const [showQs, setShowQs] = useState(false);
  const seed = STORY_SEEDS.find(x => x.id === storyId)!;
  const story = s.stories[storyId] ?? EMPTY;
  const complete = (x?: StarStory) => !!(x && x.situation.trim() && x.action.trim() && x.result.trim());
  const setField = (k: keyof StarStory, v: string) => {
    const before = complete(s.stories[storyId]);
    store.update(st => { st.stories[storyId] = { ...(st.stories[storyId] ?? EMPTY), [k]: v }; });
    if (!before && complete(s.stories[storyId])) trackGoogle('story', TITLES[storyId] ?? storyId); // first time the story is complete
  };
  const rehearsal = useTimer();
  const mockTimer = useTimer();

  const questions = useMemo(() => mock?.questions ?? [seed.answers[0]], [mock, seed]);
  const greeting = isMock
    ? `**Mock Googleyness & Leadership round** — ${questions.length} questions, 45 minutes. Press **Start**, then say "ready".`
    : `Practice: say "ask me" and I'll ask **"${seed.answers[0]}"** — answer in STAR, two minutes, then I'll probe like a real interviewer.`;
  const chat = useChat(provider, model, greeting);
  const buildSystem = useCallback(() => buildBehaviouralInterviewerPrompt(questions, s.stories, TITLES, isMock ? 'mock' : 'practice'), [questions, s.stories, isMock]);
  const handleSend = useCallback((text?: string) => { const t = text ?? chat.input; if (t.trim()) chat.send(t, buildSystem); }, [chat, buildSystem]);

  const selectStory = useCallback((id: string) => {
    if (!STORY_SEEDS.some(x => x.id === id)) return;
    setStoryId(id);
    rehearsal.reset();
    const sd = STORY_SEEDS.find(x => x.id === id)!;
    chat.reset(`Practice: say "ask me" and I'll ask **"${sd.answers[0]}"**.`);
  }, [chat, rehearsal]);

  const [prevFocusN, setPrevFocusN] = useState(focus?.n ?? 0);
  if (!isMock && focus && focus.n !== prevFocusN) {
    setPrevFocusN(focus.n);
    if (focus.id && focus.id !== storyId && STORY_SEEDS.some(x => x.id === focus.id)) setStoryId(focus.id);
  }

  const [grading, setGrading] = useState(false);
  const endMock = useCallback(async () => {
    if (!mock) return;
    setGrading(true); mockTimer.pause();
    const full = await chat.send('The interview is over. Please grade me now.', buildSystem);
    const g = parseGrade(full);
    setGrading(false);
    mock.onEnd({ score: g?.score ?? null, verdict: g?.verdict ?? 'Ungraded', feedback: stripGradeBlock(full), minutes: Math.round(mockTimer.seconds / 60), strengths: g?.strengths, improvements: g?.improvements });
  }, [mock, chat, buildSystem, mockTimer]);

  const actions: QuickAction[] = isMock
    ? [{ label: 'Ready', msg: "I'm ready — ask the first question." }, { label: 'Next question', msg: "I've finished that answer. Next question, please." }]
    : [{ label: 'Ask me', icon: MessageCircleQuestion, msg: 'Ask me the question now.' }, { label: 'Probe harder', msg: 'Probe my last answer the way a sceptical Google interviewer would.' }, { label: 'Score it', msg: 'Give me a 1.0–4.0 score for that answer with one sentence on why, and the single change that would raise it most.' }];

  const doneCount = STORY_SEEDS.filter(x => complete(s.stories[x.id])).length;
  const words = [story.situation, story.task, story.action, story.result].join(' ').trim().split(/\s+/).filter(Boolean).length;
  const spoken = Math.round(words / 130 * 60);
  const isH = orientation === 'horizontal';
  const sep = clsx('gp-handle shrink-0', isH ? 'w-1.5 cursor-col-resize border-x' : 'h-1.5 w-full cursor-row-resize border-y');
  const Grip = isH ? GripVertical : GripHorizontal;

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'var(--gp-ground)' }}>
      <PanelGroup orientation={orientation} className="h-full w-full">
        {showLeft && !isMock && (
          <>
            <Panel id="b-side" defaultSize="24%" minSize="220px" maxSize="36%" className="min-w-0 min-h-0 overflow-hidden">
              <div className="h-full flex flex-col gp-side border-r">
                <div className="gp-side-head shrink-0">
                  <div className="flex items-center gap-2"><span className="w-8 h-8 rounded-lg flex items-center justify-center gp-purple" style={{ background: 'var(--gp-purple-wash)' }}><Users size={16} /></span><div><div className="text-[14px] font-bold gp-t1">Story bank</div><div className="text-[11px] gp-t3">{doneCount}/{STORY_SEEDS.length} written · 2 min each</div></div></div>
                  <button onClick={() => setShowLeft(false)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3"><X size={14} /></button>
                </div>
                <div className="mx-3 mt-3 gp-track h-1.5"><div className="gp-bar" style={{ width: `${(doneCount / STORY_SEEDS.length) * 100}%` }} /></div>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5">
                  {STORY_SEEDS.map((x, i) => (
                    <button key={x.id} onClick={() => selectStory(x.id)} className={clsx('gp-side-item', x.id === storyId && 'gp-side-item-active')}>
                      <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold', complete(s.stories[x.id]) ? 'gp-chip-green' : 'gp-inset gp-t3')}>{complete(s.stories[x.id]) ? <Check size={11} /> : i + 1}</span>
                      <span className="flex-1 min-w-0 truncate">{x.title}</span>
                    </button>
                  ))}
                  <button onClick={() => setShowQs(v => !v)} className="gp-side-group mt-3">
                    {showQs ? <ChevronDown size={12} /> : <ChevronRight size={12} />}<span className="flex-1 text-left">The 11 questions they ask</span>
                  </button>
                  {showQs && GL_QUESTIONS.map((q, i) => <div key={i} className="text-[12px] gp-t2 pl-3 pr-2 py-1 border-l-2 gp-border ml-2 leading-snug">{q}</div>)}
                  <div className="pt-3 px-1 space-y-1.5">
                    <div className="gp-label">Four attributes</div>
                    {GL_ATTRIBUTES.map(a => <div key={a.name} className="text-[12px] gp-t2 leading-snug"><b className="gp-t1">{a.name}:</b> {a.means}</div>)}
                  </div>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle id="b-sep-l" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
          </>
        )}

        <Panel id="b-main" minSize="35%" className="min-w-0 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col">
            <header className="h-14 border-b gp-border gp-panel flex items-center gap-2 px-3 shrink-0">
              {!showLeft && !isMock && <button onClick={() => setShowLeft(true)} className="gp-btn gp-btn-sm gp-btn-icon"><Menu size={15} /></button>}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><h2 className="text-[15px] font-bold gp-t1 truncate">{isMock ? 'Googleyness & Leadership' : seed.title}</h2>{isMock && <span className="gp-chip gp-chip-xs gp-chip-red">mock</span>}</div>
                <div className="text-[11px] gp-t3 truncate">{isMock ? `${questions.length} questions · 45 minutes` : `Proves: ${seed.attribute}`}</div>
              </div>
              {isMock ? (
                <div className="flex items-center gap-1.5">
                  <span className={clsx('gp-num text-lg', mockTimer.minutes >= 40 ? 'gp-red' : 'gp-t1')}>{fmtClock(mockTimer.seconds)}</span>
                  {mockTimer.running ? <button onClick={mockTimer.pause} className="gp-btn gp-btn-sm gp-btn-icon"><Pause size={14} /></button> : <button onClick={mockTimer.start} className="gp-btn gp-btn-primary gp-btn-sm gp-btn-icon"><Play size={14} /></button>}
                  <button onClick={endMock} disabled={grading} className="gp-btn gp-btn-danger gp-btn-sm"><Flag size={13} />{grading ? 'Grading…' : 'End & grade'}</button>
                  <button onClick={mock?.onAbort} className="gp-btn gp-btn-ghost gp-btn-sm gp-t3">Abandon</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] gp-t3 hidden md:inline">rehearse ≤ 2:00</span>
                  <span className={clsx('gp-num text-lg', rehearsal.seconds > 120 ? 'gp-red' : rehearsal.seconds > 100 ? 'gp-yellow' : 'gp-t1')}>{fmtClock(rehearsal.seconds)}</span>
                  {rehearsal.running ? <button onClick={rehearsal.pause} className="gp-btn gp-btn-sm gp-btn-icon"><Pause size={14} /></button> : <button onClick={rehearsal.start} className="gp-btn gp-btn-primary gp-btn-sm gp-btn-icon" title="Time a spoken rehearsal"><Play size={14} /></button>}
                  <button onClick={rehearsal.reset} className="gp-btn gp-btn-sm gp-btn-icon"><RotateCcw size={14} /></button>
                </div>
              )}
              {!showRight && <button onClick={() => setShowRight(true)} className="gp-btn gp-btn-sm gp-btn-icon"><Users size={15} /></button>}
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
              {isMock ? (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="gp-card p-5 space-y-3">
                    <div className="gp-h2">How this round runs</div>
                    <p className="text-[13.5px] gp-t2 leading-relaxed">Answer in the chat on the right — say it out loud first, then type the beats. The interviewer probes after every answer. Your prepared story bank is visible to it, so it will notice if you wander off your own material.</p>
                    <ol className="space-y-2">{questions.map((q, i) => <li key={i} className="flex gap-3 text-[13.5px] gp-t1"><span className="gp-chip gp-chip-xs gp-chip-purple shrink-0">{i + 1}</span>{q}</li>)}</ol>
                  </div>
                  <Rules />
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="gp-card p-5 space-y-3">
                    <div><div className="gp-label mb-1">Draw from</div><p className="text-[14px] gp-t1 font-medium">{seed.drawFrom}</p></div>
                    <div><div className="gp-label mb-1">Answers</div>{seed.answers.map(q => <p key={q} className="text-[13px] gp-t2">“{q}”</p>)}</div>
                  </div>
                  {FIELDS.map(f => (
                    <div key={f.k} className="gp-card p-4 space-y-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-[12px] font-bold uppercase tracking-wider gp-blue">{f.k}</span>
                        <span className="text-[11.5px] gp-t3 text-right">{f.hint}</span>
                      </div>
                      <textarea value={story[f.k]} onChange={e => setField(f.k, e.target.value)} rows={f.rows} placeholder={f.ph} className="gp-input gp-textarea w-full text-[13.5px]" />
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[12px] gp-t3 px-1">
                    <span>{words} words · ~{spoken}s spoken{spoken > 120 ? <span className="gp-red"> — over two minutes, cut it</span> : ''}</span>
                    <span className="flex items-center gap-1">{complete(story) ? <><Check size={12} className="gp-green" />Complete</> : 'Situation, Action and Result needed'}</span>
                  </div>
                  <Rules />
                </div>
              )}
            </div>
          </div>
        </Panel>

        {showRight && (
          <>
            <PanelResizeHandle id="b-sep-r" className={sep}><Grip size={12} className="gp-t3" /></PanelResizeHandle>
            <Panel id="b-chat" defaultSize="30%" minSize="240px" maxSize="50%" className="min-w-0 min-h-0 overflow-hidden">
              <GoogleChatPanel theme={theme} title="Interviewer" subtitle={isMock ? 'Googleyness & Leadership — mock' : 'Practice — one question at a time'} icon={<Users size={16} />}
                messages={chat.messages} input={chat.input} isLoading={chat.isLoading} quickActions={actions}
                placeholder="Answer here in STAR — Situation, Task, Action, Result…"
                onInputChange={chat.setInput} onSend={handleSend} onStop={chat.stop}
                onClear={isMock ? undefined : () => chat.reset('Chat cleared. Say "ask me" when ready.')} onClose={() => setShowRight(false)} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

function Rules() {
  return (
    <div className="gp-card p-4">
      <div className="gp-label mb-2">Rehearse, don&apos;t script</div>
      <ul className="space-y-1.5">{STAR_RULES.map(r => <li key={r} className="text-[13px] gp-t2 leading-snug flex gap-2"><span className="gp-blue">•</span>{r}</li>)}</ul>
    </div>
  );
}
