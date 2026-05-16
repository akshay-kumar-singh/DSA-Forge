'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;
    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
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
  }, [chart]);

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
      className="mermaid-wrap my-3 p-4 rounded-lg bg-[#0d1117] border border-blue-500/20 overflow-x-auto"
    />
  );
}
