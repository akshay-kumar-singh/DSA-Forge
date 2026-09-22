'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { clsx } from 'clsx';

const MermaidDiagram = dynamic(() => import('@/components/forge/editor/MermaidDiagram'), { ssr: false });

/** Split ```mermaid / ~~~mermaid fences out so they render as diagrams, not code. */
function splitMermaid(text: string): { type: 'md' | 'mermaid'; value: string }[] {
  const parts: { type: 'md' | 'mermaid'; value: string }[] = [];
  const re = /^(```|~~~)mermaid[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'md', value: text.slice(last, m.index) });
    parts.push({ type: 'mermaid', value: m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'md', value: text.slice(last) });
  return parts;
}

/** Markdown (GFM: tables, task lists) in the Prep design system, with mermaid diagrams. */
export default function Markdown({ text, theme, className }: { text: string; theme: 'dark' | 'light'; className?: string }) {
  const parts = useMemo(() => splitMermaid(text), [text]);
  return (
    <div className={clsx('gp-prose', className)}>
      {parts.map((p, i) => p.type === 'mermaid'
        ? <MermaidDiagram key={i} theme={theme} chart={p.value} />
        : <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{p.value}</ReactMarkdown>)}
    </div>
  );
}
