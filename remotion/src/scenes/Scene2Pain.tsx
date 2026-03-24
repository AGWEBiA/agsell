import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });

const TOOLS = [
  { name: "HubSpot", price: "$800/mês", color: "#FF7A59" },
  { name: "ActiveCampaign", price: "$350/mês", color: "#356AE6" },
  { name: "ManyChat", price: "$150/mês", color: "#0084FF" },
  { name: "Intercom", price: "$400/mês", color: "#6AFDEF" },
  { name: "SellFlux", price: "$200/mês", color: "#8B5CF6" },
  { name: "ChatGPT API", price: "$100/mês", color: "#10A37F" },
];

export const Scene2Pain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a", fontFamily }}>
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 80,
          width: "100%",
          textAlign: "center",
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(frame, [0, 20], [30, 0], { extrapolateRight: "clamp" })}px)`,
        }}
      >
        <span style={{ fontSize: 28, color: "#E63329", fontWeight: 700, letterSpacing: 6 }}>
          O PROBLEMA
        </span>
        <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", marginTop: 16 }}>
          O "Frankenstein" de Software
        </div>
      </div>

      {/* Tool cards appearing and getting crossed */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 20,
          padding: "0 80px",
          flexWrap: "wrap",
        }}
      >
        {TOOLS.map((tool, i) => {
          const delay = 20 + i * 15;
          const appear = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
          const crossDelay = 90 + i * 8;
          const crossProgress = interpolate(frame, [crossDelay, crossDelay + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

          return (
            <div
              key={tool.name}
              style={{
                width: 270,
                padding: "28px 20px",
                borderRadius: 16,
                border: `1px solid ${tool.color}33`,
                backgroundColor: `${tool.color}08`,
                textAlign: "center",
                transform: `scale(${appear})`,
                opacity: appear,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {tool.name}
              </div>
              <div style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}>
                {tool.price}
              </div>

              {/* Red X overlay */}
              {crossProgress > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `rgba(230, 51, 41, ${crossProgress * 0.2})`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 100,
                      fontWeight: 900,
                      color: "#E63329",
                      opacity: crossProgress,
                      transform: `scale(${interpolate(crossProgress, [0, 1], [2, 1])}) rotate(${interpolate(crossProgress, [0, 1], [-15, 0])}deg)`,
                    }}
                  >
                    ✕
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom text */}
      <Sequence from={130}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            width: "100%",
            textAlign: "center",
            opacity: interpolate(frame - 130, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame - 130, [0, 20], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          <span style={{ fontSize: 36, color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
            Sua equipe gasta mais tempo{" "}
            <span style={{ color: "#E63329", fontWeight: 700 }}>gerenciando dados</span>
            <br />
            do que <span style={{ color: "#fff", fontWeight: 700 }}>fechando contratos.</span>
          </span>
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
