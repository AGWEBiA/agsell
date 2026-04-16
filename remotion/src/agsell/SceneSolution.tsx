// Cena 2: Solução AG Sell — logo + tagline
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const SceneSolution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 12, stiffness: 120 } });
  const titleOp = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: 'clamp' });
  const taglineOp = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: 'clamp' });
  const pillsOp = interpolate(frame, [90, 110], [0, 1], { extrapolateRight: 'clamp' });

  const pills = ['Tudo em uma plataforma', 'Sem complicação', 'Pronto para escalar'];

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, rgba(230,51,41,0.2), transparent 65%)' }} />
      <div style={{ transform: `scale(${logoScale})`, marginBottom: 32 }}>
        <Img src={staticFile('images/logo.png')} style={{ width: 140, height: 140, objectFit: 'contain' }} />
      </div>
      <h1 style={{ fontSize: 130, fontWeight: 900, margin: 0, letterSpacing: -4, opacity: titleOp, lineHeight: 1 }}>
        AG <span style={{ color: '#E63329' }}>Sell</span>
      </h1>
      <p style={{ fontSize: 28, color: '#a1a1aa', margin: '20px 0 0', opacity: taglineOp, fontWeight: 500, letterSpacing: -0.5 }}>
        Tudo o que sua operação de vendas precisa. Em um só lugar.
      </p>
      <div style={{ display: 'flex', gap: 16, marginTop: 50, opacity: pillsOp }}>
        {pills.map((p, i) => (
          <div key={i} style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, rgba(230,51,41,0.12), rgba(230,51,41,0.04))',
            border: '1px solid rgba(230,51,41,0.3)',
            borderRadius: 999, fontSize: 16, fontWeight: 600,
          }}>
            ✓ {p}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
