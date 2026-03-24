import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

export const Scene4Savings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Savings counter animation
  const savingsValue = Math.floor(interpolate(frame, [20, 90], [0, 1650], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const mainScale = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 80 } });

  // Comparison items
  const COMPARISON = [
    { tool: "HubSpot + RD Station", price: "R$ 800", replacement: "CRM AG Sell" },
    { tool: "ActiveCampaign", price: "R$ 350", replacement: "E-mail AG Sell" },
    { tool: "ManyChat + SellFlux", price: "R$ 400", replacement: "Automação AG Sell" },
    { tool: "Intercom", price: "R$ 300", replacement: "SAC AG Sell" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Green glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          width: 600,
          height: 400,
          marginLeft: -300,
          borderRadius: "50%",
          backgroundColor: "#4ADE80",
          opacity: 0.06,
          filter: "blur(100px)",
        }}
      />

      {/* Main savings number */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          width: "100%",
          textAlign: "center",
          transform: `scale(${mainScale})`,
        }}
      >
        <div style={{ fontSize: 22, color: "#4ADE80", letterSpacing: 8, fontWeight: 700, marginBottom: 16 }}>
          ECONOMIA MENSAL
        </div>
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: "#4ADE80",
            letterSpacing: -4,
            textShadow: "0 0 80px rgba(74, 222, 128, 0.3)",
          }}
        >
          R$ {savingsValue.toLocaleString("pt-BR")}
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
          por mês, comparado a ferramentas separadas
        </div>
      </div>

      {/* Comparison breakdown */}
      <Sequence from={60}>
        <div
          style={{
            position: "absolute",
            top: "54%",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 16,
            padding: "0 120px",
          }}
        >
          {COMPARISON.map((item, i) => {
            const delay = i * 10;
            const s = spring({ frame: frame - 60 - delay, fps, config: { damping: 20 } });
            return (
              <div
                key={item.tool}
                style={{
                  flex: 1,
                  padding: "20px 16px",
                  borderRadius: 16,
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  textAlign: "center",
                  transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                  opacity: s,
                }}
              >
                <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", textDecoration: "line-through" }}>
                  {item.tool}
                </div>
                <div style={{ fontSize: 28, color: "#E63329", fontWeight: 900, margin: "8px 0" }}>
                  {item.price}
                </div>
                <div style={{ fontSize: 14, color: "#4ADE80", fontWeight: 700 }}>
                  → {item.replacement}
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>

      {/* Bottom: AG Sell price */}
      <Sequence from={120}>
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 120, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <span style={{ fontSize: 36, color: "rgba(255,255,255,0.5)" }}>
            Tudo isso a partir de{" "}
          </span>
          <span style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>
            R$ 197<span style={{ fontSize: 28, color: "rgba(255,255,255,0.5)" }}>/mês</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
