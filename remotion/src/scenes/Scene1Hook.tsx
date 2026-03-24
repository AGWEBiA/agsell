import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["700", "900"], subsets: ["latin"] });

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dollar counter rising fast
  const dollarValue = Math.floor(interpolate(frame, [0, 120], [0, 2400], { extrapolateRight: "clamp" }));
  const formatted = dollarValue.toLocaleString("en-US");

  // Counter opacity
  const counterOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  // Pulse effect on the dollar sign
  const pulse = Math.sin(frame * 0.3) * 0.05 + 1;

  // "Você está pagando..." text
  const textOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const textY = interpolate(frame, [30, 50], [30, 0], { extrapolateRight: "clamp" });

  // Red flash when counter hits high values
  const redIntensity = frame > 60 ? interpolate(frame, [60, 120], [0, 0.15], { extrapolateRight: "clamp" }) : 0;

  // Subtitle text
  const subOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [80, 100], [20, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Red danger pulse */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, rgba(230, 51, 41, ${redIntensity}) 0%, transparent 60%)`,
        }}
      />

      {/* Scanning lines effect */}
      <AbsoluteFill style={{ opacity: 0.03 }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${(i * 2.5 + frame * 0.3) % 100}%`,
              width: "100%",
              height: 1,
              backgroundColor: "#E63329",
            }}
          />
        ))}
      </AbsoluteFill>

      {/* Dollar counter */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          width: "100%",
          textAlign: "center",
          opacity: counterOpacity,
          transform: `scale(${pulse})`,
        }}
      >
        <span
          style={{
            fontSize: 180,
            fontWeight: 900,
            color: frame > 90 ? "#E63329" : "#ffffff",
            letterSpacing: -4,
            textShadow: frame > 90 ? "0 0 60px rgba(230,51,41,0.5)" : "none",
          }}
        >
          ${formatted}
        </span>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.3)", marginTop: 8, letterSpacing: 6 }}>
          POR MÊS EM FERRAMENTAS GRINGAS
        </div>
      </div>

      {/* Question text */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          width: "100%",
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <span style={{ fontSize: 48, fontWeight: 700, color: "#fff" }}>
          Você já sentiu aquela{" "}
          <span style={{ color: "#E63329" }}>pontada no peito</span>
          <br />
          toda vez que o dólar sobe?
        </span>
      </div>

      {/* IOF / Dólar badges */}
      <Sequence from={100}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 24,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          {["IOF 6,38%", "DÓLAR A R$ 6,20", "SUPORTE EM INGLÊS"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "10px 24px",
                border: "1px solid rgba(230,51,41,0.3)",
                borderRadius: 8,
                color: "rgba(255,255,255,0.5)",
                fontSize: 18,
                letterSpacing: 2,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
