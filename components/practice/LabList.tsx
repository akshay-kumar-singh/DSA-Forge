'use client';

import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Search, X, Check, Trash2 } from 'lucide-react';

export interface LabItem {
  id: string;
  title: string;
  sub: string;
  done: boolean;
  updated: string;
}

interface Props {
  icon: React.ReactNode;
  heading: string;
  /** Plural noun for the empty state and the New button: "problem" / "design" */
  noun: string;
  items: LabItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  hint: string;
}

/** The left column of both labs: search, new, and the list of saved items (newest first). */
export default function LabList({ icon, heading, noun, items, selectedId, onSelect, onNew, onDelete, onClose, hint }: Props) {
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => items
      .filter(i => !needle || i.title.toLowerCase().includes(needle) || i.sub.toLowerCase().includes(needle))
      .slice()
      .sort((a, b) => b.updated.localeCompare(a.updated)),
    [items, needle],
  );
  const done = items.filter(i => i.done).length;

  return (
    <div className="h-full w-full min-w-0 flex flex-col overflow-hidden gp-side border-r">
      <div className="gp-side-head shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center gp-purple shrink-0" style={{ background: 'var(--gp-purple-wash)' }}>{icon}</span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold gp-t1 truncate">{heading}</div>
            <div className="text-[11px] gp-t3">{items.length} saved{items.length ? ` · ${done} done` : ''}</div>
          </div>
        </div>
        <button onClick={onClose} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Close the list"><X size={14} /></button>
      </div>

      <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
        <button onClick={onNew} className="gp-btn gp-btn-primary gp-btn-sm w-full justify-center"><Plus size={14} />New {noun}</button>
        {items.length > 3 && (
          <label className="flex items-center gap-2 gp-input gp-input-sm">
            <Search size={13} className="gp-t3 shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="bg-transparent outline-none flex-1 min-w-0 text-[13px]" />
          </label>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 pb-4 space-y-1">
        {shown.length === 0 && (
          <p className="px-2 py-6 text-[12.5px] gp-t3 text-center leading-relaxed">{needle ? 'Nothing matches.' : hint}</p>
        )}
        {shown.map(i => (
          <div key={i.id} className="group relative">
            <button
              onClick={() => onSelect(i.id)}
              className={clsx('w-full text-left px-3 py-2.5 rounded-[10px] border transition-colors', i.id === selectedId ? 'gp-accent-card' : 'border-transparent hover:bg-[var(--gp-surface-2)]')}
            >
              <div className="flex items-center gap-1.5">
                {i.done && <Check size={12} className="gp-green shrink-0" />}
                <span className={clsx('flex-1 min-w-0 truncate text-[13.5px] font-semibold', i.id === selectedId ? 'gp-blue' : 'gp-t1')}>{i.title || 'Untitled'}</span>
              </div>
              {i.sub && <div className="text-[11.5px] gp-t3 truncate mt-0.5 pr-6">{i.sub}</div>}
            </button>
            <button
              onClick={() => onDelete(i.id)}
              className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 focus:opacity-100 gp-t3 hover:gp-red transition-opacity"
              title={`Delete this ${noun}`}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
