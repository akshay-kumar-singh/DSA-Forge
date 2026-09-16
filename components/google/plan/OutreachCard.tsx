'use client';

// ======================================================
// Referral map & applications — the workstream the roadmap
// calls a prerequisite. 25 named people, asks from week 18,
// applications from week 20; Gate 3 reads its counts from here.
// ======================================================

import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Users, Plus, Trash2, ChevronDown, ChevronRight, Send, Info } from 'lucide-react';
import type { GoogleStore } from '../useGoogleStore';
import type { Contact, ContactStatus, Application, ApplicationStatus } from '@/lib/google/types';
import { trackGoogle } from '@/lib/google/track';

export const CONTACT_TARGET = 25;
const VIA = ['College senior', 'Ex-colleague', 'Open-source maintainer', 'GDG / meetup', 'LinkedIn / X', 'Friend of a friend', 'Recruiter', 'Other'];
const C_STATUS: { id: ContactStatus; label: string; chip: string }[] = [
  { id: 'mapped', label: 'Mapped', chip: '' },
  { id: 'asked', label: 'Asked', chip: 'gp-chip-blue' },
  { id: 'replied', label: 'Replied', chip: 'gp-chip-yellow' },
  { id: 'referred', label: 'Referred ✓', chip: 'gp-chip-green' },
  { id: 'declined', label: 'Declined', chip: 'gp-chip-red' },
];
const A_STATUS: { id: ApplicationStatus; label: string; chip: string }[] = [
  { id: 'applied', label: 'Applied', chip: '' },
  { id: 'recruiter', label: 'Recruiter screen', chip: 'gp-chip-blue' },
  { id: 'phone', label: 'Phone screen', chip: 'gp-chip-blue' },
  { id: 'onsite', label: 'Onsite loop', chip: 'gp-chip-yellow' },
  { id: 'offer', label: 'Offer', chip: 'gp-chip-green' },
  { id: 'rejected', label: 'Rejected', chip: 'gp-chip-red' },
];

/** Numbers Gate 3 cares about. */
export function outreachSummary(contacts: Contact[], applications: Application[]) {
  const inFlight = contacts.filter(c => c.status === 'asked' || c.status === 'replied' || c.status === 'referred').length;
  const referred = contacts.filter(c => c.status === 'referred').length;
  return { mapped: contacts.length, inFlight, referred, applications: applications.length };
}

interface Props { store: GoogleStore; open: boolean; onToggle: () => void }

export default function OutreachCard({ store, open, onToggle }: Props) {
  const s = store.state;
  const sum = outreachSummary(s.contacts, s.applications);
  const [tab, setTab] = useState<'people' | 'apps'>('people');

  const addContact = () => store.update(st => { st.contacts = [...st.contacts, { id: `c-${Date.now()}`, name: '', via: VIA[0], status: 'mapped', note: '', updated: new Date().toISOString() }]; });
  const patchContact = (id: string, patch: Partial<Contact>) => {
    const before = s.contacts.find(c => c.id === id);
    store.update(st => { st.contacts = st.contacts.map(c => (c.id === id ? { ...c, ...patch, updated: new Date().toISOString() } : c)); });
    if (patch.status === 'referred' && before && before.status !== 'referred') trackGoogle('referral', before.name || 'a contact');
  };
  const removeContact = (id: string) => store.update(st => { st.contacts = st.contacts.filter(c => c.id !== id); });

  const addApp = () => {
    store.update(st => { st.applications = [...st.applications, { id: `a-${Date.now()}`, role: 'Software Engineer II', date: new Date().toISOString().slice(0, 10), status: 'applied', note: '' }]; });
    trackGoogle('apply', 'Software Engineer II');
  };
  const patchApp = (id: string, patch: Partial<Application>) => store.update(st => { st.applications = st.applications.map(a => (a.id === id ? { ...a, ...patch } : a)); });
  const removeApp = (id: string) => store.update(st => { st.applications = st.applications.filter(a => a.id !== id); });

  return (
    <div id="gp-outreach" className="gp-card">
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {open ? <ChevronDown size={15} className="gp-t3" /> : <ChevronRight size={15} className="gp-t3" />}
        <span className="w-7 h-7 rounded-lg flex items-center justify-center gp-purple shrink-0" style={{ background: 'var(--gp-purple-wash)' }}><Users size={14} /></span>
        <span className="flex-1 min-w-0 text-[14px] font-semibold gp-t1 truncate">Referral map & applications</span>
        <span className="hidden sm:flex items-center gap-1.5">
          <span className={clsx('gp-chip gp-chip-xs', sum.mapped >= CONTACT_TARGET && 'gp-chip-green')}>{sum.mapped}/{CONTACT_TARGET} mapped</span>
          <span className={clsx('gp-chip gp-chip-xs', sum.inFlight >= 3 && 'gp-chip-green')}>{sum.inFlight} in flight</span>
          <span className={clsx('gp-chip gp-chip-xs', sum.referred > 0 && 'gp-chip-green')}>{sum.referred} referred</span>
          <span className="gp-chip gp-chip-xs">{sum.applications} applied</span>
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[12.5px] gp-t2 flex items-start gap-1.5"><Info size={13} className="shrink-0 mt-0.5 gp-t3" />Week 0: name 25 people, contact nobody. Week 18–19: 16 asks, two a day, each with a specific req link and a two-line XYZ summary. Week 20: applications go out — referral and direct application in the same week. Gate 3 reads &ldquo;in flight&rdquo; (asked / replied / referred) and the application count from this card.</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setTab('people')} className={clsx('gp-tab !h-8', tab === 'people' && 'gp-tab-active')}>People · {s.contacts.length}</button>
            <button onClick={() => setTab('apps')} className={clsx('gp-tab !h-8', tab === 'apps' && 'gp-tab-active')}>Applications · {s.applications.length}</button>
            <button onClick={tab === 'people' ? addContact : addApp} className="ml-auto gp-btn gp-btn-primary gp-btn-sm"><Plus size={13} />{tab === 'people' ? 'Add person' : 'Log application'}</button>
          </div>

          {tab === 'people' ? (
            s.contacts.length === 0 ? <Empty text="No one mapped yet. Start with college seniors now at Google, ex-colleagues who moved, and maintainers you have sent PRs to." /> : (
              <div className="space-y-1.5">
                {s.contacts.map(c => {
                  const st = C_STATUS.find(x => x.id === c.status)!;
                  return (
                    <div key={c.id} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.6fr)_auto] gap-1.5 items-center">
                      <input value={c.name} onChange={e => patchContact(c.id, { name: e.target.value })} placeholder="Name" className="gp-input gp-input-sm min-w-0" aria-label="Name" />
                      <select value={c.via} onChange={e => patchContact(c.id, { via: e.target.value })} className="gp-input gp-select gp-input-sm min-w-0" aria-label="How you know them">{VIA.map(v => <option key={v}>{v}</option>)}</select>
                      <select value={c.status} onChange={e => patchContact(c.id, { status: e.target.value as ContactStatus })} className={clsx('gp-input gp-select gp-input-sm min-w-0 font-semibold', st.id === 'referred' && 'gp-green', st.id === 'declined' && 'gp-red')} aria-label="Status">{C_STATUS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                      <input value={c.note} onChange={e => patchContact(c.id, { note: e.target.value })} placeholder="Team / req link / last message" className="gp-input gp-input-sm min-w-0" aria-label="Note" />
                      <button onClick={() => removeContact(c.id)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Remove"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            s.applications.length === 0 ? <Empty text="Nothing submitted — correct until week 20. A rejection before you are ready costs a 6–12 month cooldown." /> : (
              <div className="space-y-1.5">
                {s.applications.map(a => (
                  <div key={a.id} className="grid grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)_minmax(0,1.6fr)_auto] gap-1.5 items-center">
                    <input value={a.role} onChange={e => patchApp(a.id, { role: e.target.value })} placeholder="Role / req id" className="gp-input gp-input-sm min-w-0" aria-label="Role" />
                    <input type="date" value={a.date} onChange={e => patchApp(a.id, { date: e.target.value })} className="gp-input gp-input-sm" aria-label="Date" />
                    <select value={a.status} onChange={e => patchApp(a.id, { status: e.target.value as ApplicationStatus })} className="gp-input gp-select gp-input-sm min-w-0 font-semibold" aria-label="Status">{A_STATUS.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                    <input value={a.note} onChange={e => patchApp(a.id, { note: e.target.value })} placeholder="Referrer / recruiter / next step" className="gp-input gp-input-sm min-w-0" aria-label="Note" />
                    <button onClick={() => removeApp(a.id)} className="gp-btn gp-btn-ghost gp-btn-sm gp-btn-icon gp-t3" title="Remove"><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )
          )}
          <p className="text-[11.5px] gp-t3 flex items-center gap-1.5"><Send size={11} />The ask that works: one specific req, a two-line XYZ summary, and &ldquo;would you be comfortable referring me?&rdquo; — never &ldquo;can you get me a job&rdquo;.</p>
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="gp-inset p-4 text-[13px] gp-t3 text-center">{text}</div>;
}
