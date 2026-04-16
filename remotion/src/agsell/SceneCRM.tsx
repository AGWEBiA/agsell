// Cena 3: CRM / Pipeline visual com mockup AG Sell
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { AGShell } from './AGShell';

const stages = [
  { name: 'Novo Lead', count: 24, color: '#71717a', deals: ['Maria Silva — R$ 5.200', 'Carlos Lopes — R$ 8.900', 'Joana R. — R$ 3.400'] },
  { name: 'Qualificado', count: 18, color: '#3b82f6', deals: ['Tech Solutions — R$ 12.000', 'Pedro Alves — R$ 7.800'] },
  { name: 'Proposta', count: 12, color: '#f59e0b', deals: ['Acme Corp — R$ 25.000', 'StartUp X — R$ 18.500'] },
  { name: 'Negociação', count: 7, color: '#E63329', deals: ['Mega Group — R$ 48.000'] },
  { name: 'Ganho', count: 31, color: '#22c55e', deals: ['Cliente Beta — R$ 32.000'] },
];

export const SceneCRM: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <AGShell active="crm" title="Pipeline de Vendas" badge="● Ao vivo">
        <div style={{ display: 'flex', gap: 16, height: '100%' }}>
          {stages.map((stage, i) => {
            const colY = interpolate(spring({ frame: frame - i * 6, fps, config: { damping: 18 } }), [0, 1], [40, 0]);
            const colOp = interpolate(frame, [i * 6, i * 6 + 20], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div key={i} style={{ flex: 1, opacity: colOp, transform: `translateY(${colY}px)` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: stage.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{stage.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#71717a', backgroundColor: '#18181b', padding: '2px 8px', borderRadius: 999 }}>{stage.count}</span>
                </div>
                <div style={{ backgroundColor: '#0c0c0e', border: '1px solid #27272a', borderRadius: 10, padding: 8, height: 'calc(100% - 36px)' }}>
                  {stage.deals.map((deal, j) => {
                    const cardDelay = i * 6 + j * 8 + 20;
                    const cardOp = interpolate(frame, [cardDelay, cardDelay + 15], [0, 1], { extrapolateRight: 'clamp' });
                    const cardX = interpolate(spring({ frame: frame - cardDelay, fps, config: { damping: 20 } }), [0, 1], [-20, 0]);
                    const [name, value] = deal.split(' — ');
                    return (
                      <div key={j} style={{
                        opacity: cardOp, transform: `translateX(${cardX}px)`,
                        backgroundColor: '#18181b', border: `1px solid #27272a`,
                        borderLeft: `3px solid ${stage.color}`,
                        borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fafafa', marginBottom: 4 }}>{name}</div>
                        <div style={{ fontSize: 11, color: stage.color, fontWeight: 700 }}>{value}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#E63329', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>A</div>
                          <span style={{ fontSize: 9, color: '#71717a', alignSelf: 'center' }}>há 2h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </AGShell>
    </AbsoluteFill>
  );
};
