// ======================================================
// GOOGLE PREP — Excalidraw scene → text graph
// Lets a text-only model "see" the whiteboard:
//   Nodes: Client, LB, API, Redis, Postgres
//   Edges: Client -> LB, LB -> API (HTTPS), API -> Redis (cache)
// ======================================================

type El = {
  id: string; type: string; isDeleted?: boolean; text?: string;
  containerId?: string | null;
  boundElements?: { id: string; type: string }[] | null;
  startBinding?: { elementId: string } | null;
  endBinding?: { elementId: string } | null;
  x?: number; y?: number; width?: number; height?: number;
};

const SHAPES = new Set(['rectangle', 'ellipse', 'diamond', 'image', 'frame']);

export function diagramToText(elements: unknown): string {
  if (!Array.isArray(elements)) return '';
  const els = (elements as El[]).filter(e => e && !e.isDeleted);
  const byId = new Map(els.map(e => [e.id, e]));

  // label of a shape = its bound text element(s)
  const labelOf = (e: El): string => {
    const ids = (e.boundElements ?? []).filter(b => b.type === 'text').map(b => b.id);
    const txt = ids.map(id => byId.get(id)?.text ?? '').filter(Boolean).join(' ').trim();
    return txt || `${e.type}#${e.id.slice(0, 4)}`;
  };

  const shapes = els.filter(e => SHAPES.has(e.type));
  const arrows = els.filter(e => e.type === 'arrow' || e.type === 'line');
  const looseText = els.filter(e => e.type === 'text' && !e.containerId && e.text?.trim());

  const nodes = shapes
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0))
    .map(labelOf);

  const edges = arrows.map(a => {
    const from = a.startBinding ? byId.get(a.startBinding.elementId) : undefined;
    const to = a.endBinding ? byId.get(a.endBinding.elementId) : undefined;
    const label = labelOf(a);
    const lab = label.startsWith(a.type + '#') ? '' : ` (${label})`;
    if (!from && !to) return null;
    return `${from ? labelOf(from) : '?'} -> ${to ? labelOf(to) : '?'}${lab}`;
  }).filter(Boolean) as string[];

  const notes = looseText.map(t => (t.text ?? '').replace(/\s+/g, ' ').trim());

  const out: string[] = [];
  if (nodes.length) out.push(`Nodes (${nodes.length}): ${nodes.join(', ')}`);
  if (edges.length) out.push(`Edges (${edges.length}):\n  ${edges.join('\n  ')}`);
  if (notes.length) out.push(`Free text: ${notes.join(' | ')}`);
  return out.join('\n');
}
