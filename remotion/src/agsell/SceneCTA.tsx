// Cena 7: CTA final
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame: frame - 5, fps, config: { damping: 14 } });
  const titleY = interpolate(titleS, [0, 1], [30, 0]);
  const titleOp = interpolate(frame, [5, 30], [0, 1], { extrapolateRight: 'clamp' });
  const subOp = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: 'clamp' });
  const ctaS = spring({ frame: frame - 70, fps, config: { damping: 10, stiffness: 120 } });
  const urlOp = interpolate(frame, [110, 130], [0, 1], { extrapolateRight: 'clamp' });
  const pulse = Math.sin(frame * 0.1) * 0.04 + 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090b', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', justifyContent: 'center', alignItems: 'center' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 50%, rgba(230,51,41,0.25), transparent 70%)' }} />

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 }}>
        <Img src={staticFile('images/logo.png')} style={{ width: 80, height: 80, objectFit: 'contain' }} />
        <div style={{ fontSize: 60, fontWeight: 900, letterSpacing: -2 }}>
          AG <span style={{ color: '#E63329' }}>Sell</span>
        </div>
      </div>

      <h1 style={{ fontSize: 88, fontWeight: 900, margin: 0, textAlign: 'center', letterSpacing: -3, lineHeight: 1.05, opacity: titleOp, transform: `translateY(${titleY}px)` }}>
        Pare de improvisar.<br />
        <span style={{ background: 'linear-gradient(90deg, #E63329, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Comece a escalar.
        </span>
      </h1>

      <p style={{ fontSize: 24, color: '#a1a1aa', margin: '24px 0 0', opacity: subOp, fontWeight: 500 }}>
        A plataforma de vendas que pensa como você.
      </p>

      <div style={{ marginTop: 50, transform: `scale(${ctaS * pulse})`, opacity: ctaS }}>
        <div style={{
          padding: '20px 56px',
          background: 'linear-gradient(135deg, #E63329, #b91c1c)',
          borderRadius: 999, fontSize: 22, fontWeight: 800, letterSpacing: 0.3,
          boxShadow: '0 20px 60px rgba(230,51,41,0.5)',
        }}>
          Comece agora →
        </div>
      </div>

      <div style={{ marginTop: 28, opacity: urlOp, fontSize: 16, color: '#71717a', letterSpacing: 1 }}>
        agsell.com.br
      </div>
    </AbsoluteFill>
  );
};
