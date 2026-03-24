import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene5CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const mainSpring = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 80 } });

  // Pulsing button
  const buttonPulse = 1 + Math.sin(frame * 0.12) * 0.03;
  const buttonGlow = 0.3 + Math.sin(frame * 0.12) * 0.15;

  // Guarantee badge
  const badgeSpring = spring({ frame: frame - 40, fps, config: { damping: 15 } });

  // Final logo
  const logoOpacity = interpolate(frame, [160, 200], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 160, fps, config: { damping: 20 } });

  // Tagline
  const tagOpacity = interpolate(frame, [200, 230], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Red ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: 900,
          height: 600,
          marginLeft: -450,
          borderRadius: "50%",
          backgroundColor: "#E63329",
          opacity: 0.08,
          filter: "blur(120px)",
        }}
      />

      {/* Main CTA text */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          width: "100%",
          textAlign: "center",
          opacity: mainSpring,
          transform: `scale(${mainSpring})`,
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
          Pare de mandar dinheiro
          <br />
          <span style={{ color: "#E63329" }}>para os EUA.</span>
        </div>
      </div>

      {/* CTA Button */}
      <Sequence from={30}>
        <div
          style={{
            position: "absolute",
            top: "45%",
            width: "100%",
            textAlign: "center",
            opacity: spring({ frame: frame - 30, fps, config: { damping: 15 } }),
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "28px 80px",
              backgroundColor: "#E63329",
              borderRadius: 20,
              fontSize: 36,
              fontWeight: 900,
              color: "#fff",
              letterSpacing: 2,
              transform: `scale(${buttonPulse})`,
              boxShadow: `0 0 ${60 * buttonGlow}px rgba(230, 51, 41, ${buttonGlow})`,
            }}
          >
            COMEÇAR AGORA →
          </div>
        </div>
      </Sequence>

      {/* Guarantee badges */}
      <Sequence from={40}>
        <div
          style={{
            position: "absolute",
            top: "62%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 40,
            opacity: badgeSpring,
            transform: `translateY(${interpolate(badgeSpring, [0, 1], [30, 0])}px)`,
          }}
        >
          {[
            { icon: "🛡️", text: "Garantia de Migração" },
            { icon: "📋", text: "Sem Contrato Anual" },
            { icon: "🔒", text: "Sem Multas" },
          ].map((badge) => (
            <div
              key={badge.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 24px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <span style={{ fontSize: 28 }}>{badge.icon}</span>
              <span style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                {badge.text}
              </span>
            </div>
          ))}
        </div>
      </Sequence>

      {/* Final logo + tagline */}
      <Sequence from={160}>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            width: "100%",
            textAlign: "center",
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, color: "#fff" }}>
            AG <span style={{ color: "#E63329" }}>Sell</span>
          </div>
        </div>
      </Sequence>

      <Sequence from={200}>
        <div
          style={{
            position: "absolute",
            bottom: "5%",
            width: "100%",
            textAlign: "center",
            opacity: tagOpacity,
          }}
        >
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", letterSpacing: 4 }}>
            MENOS FERRAMENTAS. MAIS VENDAS.
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
