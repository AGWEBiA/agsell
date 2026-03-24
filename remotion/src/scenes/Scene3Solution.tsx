import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const FEATURES = [
  { icon: "💬", label: "WhatsApp Nativo" },
  { icon: "📧", label: "E-mail Marketing" },
  { icon: "📱", label: "Instagram DM" },
  { icon: "🤖", label: "Agentes IA" },
  { icon: "📊", label: "CRM Completo" },
  { icon: "⚡", label: "Automação" },
  { icon: "📞", label: "VoIP Nativo" },
  { icon: "🎯", label: "Lead Scoring" },
];

export const Scene3Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo reveal
  const logoScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  // Red glow explosion
  const glowSize = interpolate(frame, [10, 60], [0, 800], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [10, 40, 80], [0, 0.2, 0.05], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Radial glow behind logo */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: glowSize,
          height: glowSize,
          marginLeft: -glowSize / 2,
          marginTop: -glowSize / 2,
          borderRadius: "50%",
          backgroundColor: "#E63329",
          opacity: glowOpacity,
          filter: "blur(80px)",
        }}
      />

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: 100,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <span style={{ fontSize: 22, color: "#E63329", letterSpacing: 8, fontWeight: 700 }}>
          A SOLUÇÃO
        </span>
      </div>

      {/* AG SELL Logo Text */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          width: "100%",
          textAlign: "center",
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, color: "#fff", letterSpacing: -3 }}>
          AG <span style={{ color: "#E63329" }}>Sell</span>
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.5)", marginTop: 12, letterSpacing: 3 }}>
          PLATAFORMA ALL-IN-ONE
        </div>
      </div>

      {/* Feature pills appearing */}
      <Sequence from={50}>
        <div
          style={{
            position: "absolute",
            top: "58%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "0 200px",
          }}
        >
          {FEATURES.map((f, i) => {
            const delay = i * 6;
            const s = spring({ frame: frame - 50 - delay, fps, config: { damping: 15 } });
            return (
              <div
                key={f.label}
                style={{
                  padding: "14px 28px",
                  borderRadius: 12,
                  border: "1px solid rgba(230,51,41,0.25)",
                  backgroundColor: "rgba(230,51,41,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transform: `scale(${s}) translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                  opacity: s,
                }}
              >
                <span style={{ fontSize: 24 }}>{f.icon}</span>
                <span style={{ fontSize: 20, color: "#fff", fontWeight: 700 }}>{f.label}</span>
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Bottom tagline */}
      <Sequence from={110}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 110, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>
            Construída para a realidade do{" "}
            <span style={{ color: "#4ADE80", fontWeight: 900 }}>empresário brasileiro.</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
