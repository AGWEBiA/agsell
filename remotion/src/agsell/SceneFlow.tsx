// Cena 5: Flow Builder visual
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AGShell } from './AGShell';

const nodes = [
  { id: 'trigger', label: 'Trigger', sub: 'Novo lead', x: 80, y: 140, color: '#E63329', icon: '⚡' },
  { id: 'wait', label: 'Aguardar', sub: '5 minutos', x: 320, y: 140, color: '#f59e0b', icon: '⏱' },
  { id: 'wpp', label: 'WhatsApp', sub: 'Mensagem boas-vindas', x: 560, y: 60, color: '#22c55e', icon: '💬' },
  { id: 'email', label: 'Email', sub: 'Enviar template', x: 560, y: 220, color: '#3b82f6', icon: '✉' },
  { id: 'cond', label: 'Condição', sub: 'Respondeu?', x: 800, y: 140, color: '#8b5cf6', icon: '◇' },
  { id: 'crm', label: 'CRM', sub: 'Mover para pipeline', x: 1040, y: 140, color: '#E63329', icon: '◉' },
];

const edges: Array<[string, string]> = [
  ['trigger', 'wait'], ['wait', 'wpp'], ['wait', 'email'],
  ['wpp', 'cond'], ['email', 'cond'], ['cond', 'crm'],
];

export const SceneFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AGShell active="flow" title="Flow Builder" badge="● Editando">
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0c0c0e', borderRadius: 12, border: '1px solid #27272a', overflow: 'hidden' }}>
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, #27272a 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.4 }} />

          {/* Edges */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            {edges.map(([from, to], i) => {
              const a = nodeMap[from]; const b = nodeMap[to];
              const x1 = a.x + 180, y1 = a.y + 35, x2 = b.x, y2 = b.y + 35;
              const delay = 25 + i * 5;
              const prog = interpolate(spring({ frame: frame - delay, fps, config: { damping: 22 } }), [0, 1], [0, 1]);
              const midX = (x1 + x2) / 2;
              const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
              return (
                <g key={i}>
                  <path d={path} stroke="#27272a" strokeWidth="2" fill="none" />
                  <path d={path} stroke="#E63329" strokeWidth="2.5" fill="none"
                    strokeDasharray="600" strokeDashoffset={600 - 600 * prog} />
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((n, i) => {
            const delay = i * 8;
            const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 130 } });
            const ny = interpolate(s, [0, 1], [20, 0]);
            const nOp = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div key={n.id} style={{
                position: 'absolute', left: n.x, top: n.y,
                width: 180, opacity: nOp, transform: `translateY(${ny}px) scale(${interpolate(s, [0, 1], [0.85, 1])})`,
                backgroundColor: '#18181b', border: `2px solid ${n.color}`, borderRadius: 12,
                padding: 14, boxShadow: `0 8px 24px ${n.color}25`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${n.color}25`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{n.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{n.label}</div>
                </div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>{n.sub}</div>
              </div>
            );
          })}

          {/* Toolbar */}
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, padding: 8, backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: 999 }}>
            {['⚡', '⏱', '💬', '✉', '◇', '◉', '✱'].map((ic, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: i === 6 ? 'rgba(230,51,41,0.2)' : 'transparent', color: i === 6 ? '#E63329' : '#a1a1aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{ic}</div>
            ))}
          </div>
        </div>
      </AGShell>
    </AbsoluteFill>
  );
};
