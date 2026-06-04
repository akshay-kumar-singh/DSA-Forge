'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
  theme: 'dark' | 'light';
}

export default function MermaidDiagram({ chart, theme }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        const isLight = theme === 'light';
        
        mermaid.initialize({
          startOnLoad: false,
          theme: isLight ? 'default' : 'dark',
          themeVariables: isLight ? {
            primaryColor: '#f1f5f9',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#2563eb',
            lineColor: '#2563eb',
            secondaryColor: '#e2e8f0',
            tertiaryColor: '#f1f5f9',
            background: 'transparent',
            mainBkg: '#ffffff',
            nodeBorder: '#2563eb',
            clusterBkg: '#f8fafc',
            titleColor: '#0f172a',
            edgeLabelBackground: '#ffffff',
            textColor: '#0f172a',
          } : {
            primaryColor: '#1e293b',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#3b82f6',
            lineColor: '#3b82f6',
            secondaryColor: '#0f172a',
            tertiaryColor: '#1e293b',
            background: 'transparent',
            mainBkg: '#1e293b',
            nodeBorder: '#3b82f6',
            clusterBkg: '#0f172a',
            titleColor: '#e2e8f0',
            edgeLabelBackground: '#1e293b',
            textColor: '#e2e8f0',
          },
          fontFamily: 'Inter, ui-sans-serif',
          fontSize: 14,
        });

        const id = `forge-diagram-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const { svg } = await mermaid.render(id, chart.trim());

        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not render diagram');
          console.error('Mermaid error:', err);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [chart, theme]);

  if (error) {
    return (
      <div className="my-2 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
        ⚠ {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-wrap my-3 p-4 rounded-lg bg-bg-base border border-border-default overflow-x-auto"
    />
  );
}
