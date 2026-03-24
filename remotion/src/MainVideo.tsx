import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Pain } from "./scenes/Scene2Pain";
import { Scene3Solution } from "./scenes/Scene3Solution";
import { Scene4Savings } from "./scenes/Scene4Savings";
import { Scene5CTA } from "./scenes/Scene5CTA";

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Persistent animated background
  const bgHue = interpolate(frame, [0, 900], [0, 15]);

  return (
    <AbsoluteFill style={{ backgroundColor: `hsl(${bgHue}, 5%, 5%)` }}>
      {/* Subtle animated grain overlay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at ${50 + Math.sin(frame * 0.02) * 10}% ${50 + Math.cos(frame * 0.015) * 10}%, rgba(230, 51, 41, 0.04) 0%, transparent 70%)`,
        }}
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene1Hook />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene2Pain />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene3Solution />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene4Savings />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: 20 })}
        />

        <TransitionSeries.Sequence durationInFrames={260}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
