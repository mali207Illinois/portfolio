import { useEffect, useRef, useState } from 'react';
import { ExperienceCanvas } from './scene/ExperienceCanvas';
import { Interface } from './ui/Interface';
import { useMediaQuery } from './interaction/useMediaQuery';

export function App() {
  const progress = useRef(0);
  const mobile = useMediaQuery('(max-width: 700px)');
  const hasMouse = useMediaQuery('(any-hover: hover) and (any-pointer: fine)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [sceneReady, setSceneReady] = useState(false);
  const showScene = !mobile && hasMouse;

  useEffect(() => {
    if (!showScene) {
      setSceneReady(false);
      return;
    }

    // Reveal the page's fallback if WebGL never produces a frame.
    const timeout = window.setTimeout(() => setSceneReady(true), 12000);
    return () => window.clearTimeout(timeout);
  }, [showScene]);

  return (
    <main className={`experience${showScene ? '' : ' is-static'}`} id="experience">
      {showScene && (
        <div className="scene-shell" aria-hidden="true">
          <ExperienceCanvas progress={progress} mobile={mobile} reducedMotion={reducedMotion} onReady={() => setSceneReady(true)} />
        </div>
      )}
      {mobile && (
        <div className="mobile-particles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
        </div>
      )}
      <Interface />
      {showScene && (
        <div className={`scene-loading${sceneReady ? ' is-ready' : ''}`} role="status" aria-label="Loading the 3D scene" aria-hidden={sceneReady}>
          <div className="scene-loading-content">
            <span className="scene-loading-index">FLIGHT SYSTEM / 01</span>
            <span className="scene-loading-title">Preparing the scene</span>
            <span className="scene-loading-track" aria-hidden="true"><span /></span>
            <span className="scene-loading-status">Initializing view</span>
          </div>
        </div>
      )}
    </main>
  );
}
