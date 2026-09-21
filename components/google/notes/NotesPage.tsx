'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { NotebookPen, Search, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { GoogleStore } from '../useGoogleStore';
import type { NotebookNote } from '@/lib/google/types';
import { PLAN_WEEKS } from '@/lib/google/plan';
import { trackGoogle } from '@/lib/google/track';

interface Props {
  store: GoogleStore;
  /** Plan week of the current day — new notes are stamped with it */
  currentWeek: number;
}

/**
 * The notebook. Copy a question or topic in, write the answer, come back to
 * it later. Notes are stamped with the plan week they were written in and
 * grouped by it, so reading them back follows the plan.
 */
export default function NotesPage({ store, currentWeek }: Props) {
  const s = store.state;
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const needle = q.trim().toLowerCase();
  const byWeek = useMemo(() => {
    const groups = new Map<number, NotebookNote[]>();
    for (const n of s.notebook) {
      if (needle && !(n.title.toLowerCase().includes(needle) || n.body.toLowerCase().includes(needle))) continue;
      groups.set(n.week, [...(groups.get(n.week) ?? []), n]);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([week, notes]) => ({ week, notes: notes.sort((a, b) => a.created.localeCompare(b.created)) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.tick, needle]);

  const add = () => {
    const now = new Date().toISOString();
    const note: NotebookNote = { id: `n-${Date.now()}`, title: '', body: '', week: currentWeek, created: now, updated: now };
    store.update(st => { st.notebook = [...st.notebook, note]; });
    setQ('');
    setCollapsed(c => ({ ...c, [currentWeek]: false }));
    setOpenId(note.id);
  };
  const patch = (id: string, fields: Partial<NotebookNote>) => store.update(st => {
    const n = st.notebook.find(x => x.id === id);
    if (n) Object.assign(n, fields, { updated: new Date().toISOString() });
  });
  const remove = (id: string) => {
    if (!confirm('Delete this note?')) return;
    store.update(st => { st.notebook = st.notebook.filter(x => x.id !== id); });
    if (openId === id) setOpenId(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        <div className="gp-card p-4 flex flex-wrap items-center gap-3">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center gp-blue shrink-0" style={{ background: 'var(--gp-blue-wash)' }}><NotebookPen size={17} /></span>
          <div className="min-w-0">
            <div className="gp-h2">Notes</div>
            <div className="text-[12px] gp-t3">{s.notebook.length} note{s.notebook.length === 1 ? '' : 's'} · grouped by plan week</div>
          </div>
          <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
            <label className="flex items-center gap-2 gp-input gp-input-sm flex-1 sm:w-64">
              <Search size={13} className="gp-t3 shrink-0" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="bg-transparent outline-none flex-1 min-w-0 text-[13px]" />
            </label>
            <button onClick={add} className="gp-btn gp-btn-primary gp-btn-sm shrink-0"><Plus size={14} />New note</button>
          </div>
        </div>

        {byWeek.length === 0 && (
          <div className="gp-card p-8 text-center space-y-2">
            <NotebookPen className="mx-auto gp-t3" />
            <div className="gp-h2">{needle ? 'Nothing matches.' : 'Your notebook is empty.'}</div>
            {!needle && <p className="text-sm gp-t2">Paste a question or topic as the title, write your answer underneath. Theory, resume bullets, STAR stories, anything you want to read again.</p>}
          </div>
        )}

        {byWeek.map(({ week, notes }) => {
          const isCollapsed = collapsed[week] ?? false;
          return (
            <section key={week} className="space-y-2">
              <button onClick={() => setCollapsed(c => ({ ...c, [week]: !isCollapsed }))} className="w-full flex items-center gap-2 px-1 py-1 text-left">
                {isCollapsed ? <ChevronRight size={14} className="gp-t3" /> : <ChevronDown size={14} className="gp-t3" />}
                <span className={clsx('gp-chip gp-chip-xs', week === currentWeek && 'gp-chip-blue')}>W{week}</span>
                <span className="text-[13.5px] font-semibold gp-t1">{PLAN_WEEKS[week]?.theme ?? `Week ${week}`}</span>
                <span className="text-[11.5px] gp-t3 ml-auto">{notes.length}</span>
              </button>
              {!isCollapsed && notes.map(n => (
                <NoteCard key={n.id} note={n} open={openId === n.id} onOpen={() => setOpenId(openId === n.id ? null : n.id)} onChange={f => patch(n.id, f)} onDelete={() => remove(n.id)} />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function NoteCard({ note, open, onOpen, onChange, onDelete }: { note: NotebookNote; open: boolean; onOpen: () => void; onChange: (f: Partial<NotebookNote>) => void; onDelete: () => void }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  // Local drafts; the store is written 500 ms after the last keystroke and on close.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) { setTitle(note.title); setBody(note.body); } }
  useEffect(() => { if (open && !note.title) titleRef.current?.focus(); }, [open, note.title]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const queue = (t: string, b: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { onChange({ title: t, body: b }); if (!note.title && t.trim()) trackGoogle('save', `note: ${t.trim().slice(0, 60)}`); }, 500);
  };
  const flush = () => { if (timer.current) clearTimeout(timer.current); if (title !== note.title || body !== note.body) onChange({ title, body }); };
  const stamp = new Date(note.updated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  if (!open) {
    return (
      <button onClick={onOpen} className="w-full gp-card gp-card-hover px-4 py-3 text-left">
        <div className="flex items-baseline gap-3">
          <span className="text-[14px] font-semibold gp-t1 truncate flex-1 min-w-0">{note.title.trim() || 'Untitled'}</span>
          <span className="text-[11px] gp-t3 shrink-0">{stamp}</span>
        </div>
        {note.body.trim() && <p className="text-[12.5px] gp-t3 mt-1 line-clamp-2 whitespace-pre-wrap">{note.body}</p>}
      </button>
    );
  }
  return (
    <div className="gp-card gp-accent-card p-4 space-y-2">
      <input ref={titleRef} value={title} onChange={e => { setTitle(e.target.value); queue(e.target.value, body); }} onBlur={flush} placeholder="Question or topic" className="gp-input w-full font-semibold text-[14px]" />
      <textarea value={body} onChange={e => { setBody(e.target.value); queue(title, e.target.value); }} onBlur={flush} placeholder="Your answer / notes…" rows={Math.min(24, Math.max(6, body.split('\n').length + 2))} className="gp-input gp-textarea w-full text-[13.5px] !resize-y" />
      <div className="flex items-center gap-2 text-[11px] gp-t3">
        <span>Saved automatically · last {stamp}</span>
        <button onClick={onDelete} className="ml-auto gp-btn gp-btn-ghost gp-btn-sm gp-red" title="Delete this note"><Trash2 size={12} />Delete</button>
        <button onClick={() => { flush(); onOpen(); }} className="gp-btn gp-btn-sm">Done</button>
      </div>
    </div>
  );
}
