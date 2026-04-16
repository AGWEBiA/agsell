// Versão SEM áudio embutido — usada para render de vídeo puro (áudio é muxado depois com ffmpeg)
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { SceneHook } from './agsell/SceneHook';
import { SceneCRM } from './agsell/SceneCRM';
import { SceneInbox } from './agsell/SceneInbox';
import { SceneFlow } from './agsell/SceneFlow';
import { SceneAI } from './agsell/SceneAI';
import { SceneSolution } from './agsell/SceneSolution';
import { SceneCTA } from './agsell/SceneCTA';
import { loadFont } from '@remotion/google-fonts/Inter';

loadFont('normal', { weights: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'] });

const T = 12;
const t = () => <TransitionSeries.Transition presentation={fade()} timing={springTiming({ config: { damping: 200 }, durationInFrames: T })} />;

export const AgsellPresentationVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#09090b' }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={210}><SceneHook /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={240}><SceneCRM /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={300}><SceneInbox /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={300}><SceneFlow /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={300}><SceneAI /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={210}><SceneSolution /></TransitionSeries.Sequence>
      {t()}
      <TransitionSeries.Sequence durationInFrames={240}><SceneCTA /></TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
