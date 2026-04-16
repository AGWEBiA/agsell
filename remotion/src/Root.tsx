import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MetaDemoVideo } from "./MetaDemoVideo";
import { AgsellPresentationVideo } from "./AgsellPresentationVideo";

// AgsellPresentation: 7 scenes (210+240+300+300+300+210+240) - 6 transitions*12 = 1728 frames
export const RemotionRoot = () => (
  <>
    <Composition
      id="agsell-presentation"
      component={AgsellPresentationVideo}
      durationInFrames={1728}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={3090}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="meta-demo"
      component={MetaDemoVideo}
      durationInFrames={890}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
