// Cena 1: Hook — "Você está perdendo vendas todos os dias"
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleY = interpolate(spring({ frame: frame - 5, fps, config: { damping: 18 } }), [0, 1], [40, 0]);
  const titleOp = interpolate(frame, [5, 30], [0, 1], { extrapolateRight: 'clamp' });
  const lossOp = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: 'clamp' });
  const lossY = interpolate(spring({ frame: frame - 55, fps, config: { damping: 14 } }), [0, 1], [30, 0]);

  const items = [
    { delay: 90, label: 'WhatsApp', detail: 'Mensagens não respondidas' },
    { delay: 110, label: 'Email', detail: 'Leads esquecidos' },
    { delay: 130, label: 'Atendimento', detail: 'Conversas perdidas' },
  ];

  const pulse = Math.sin(frame * 0.08) * 0.03 + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, rgba(230,51,41,0.15), transparent 60%)` }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 80 }}>
        <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
          <div style={{ fontSize: 18, color: '#E63329', letterSpacing: 4, fontWeight: 700, marginBottom: 24, textTransform: 'uppercase' }}>
            ⚠ Atenção
          </div>
          <h1 style={{ fontSize: 96, fontWeight: 900, margin: 0, letterSpacing: -3, lineHeight: 1.05, transform: `scale(${pulse})` }}>
            Você está perdendo<br />
            <span style={{ background: 'linear-gradient(90deg, #E63329, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>vendas todos os dias</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 70, opacity: lossOp, transform: `translateY(${lossY}px)` }}>
          {items.map((item, i) => {
            const op = interpolate(frame, [item.delay, item.delay + 20], [0, 1], { extrapolateRight: 'clamp' });
            const y = interpolate(spring({ frame: frame - item.delay, fps, config: { damping: 16 } }), [0, 1], [30, 0]);
            return (
              <div key={i} style={{
                opacity: op, transform: `translateY(${y}px)`,
                padding: '20px 28px', backgroundColor: 'rgba(230,51,41,0.08)',
                border: '1px solid rgba(230,51,41,0.3)', borderRadius: 12, minWidth: 240,
              }}>
                <div style={{ fontSize: 14, color: '#E63329', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: 16, color: '#a1a1aa', marginTop: 6 }}>{item.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
