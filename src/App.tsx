import { useRef } from 'react';
import { ExperienceCanvas } from './scene/ExperienceCanvas';
import { Interface } from './ui/Interface';
import { useMediaQuery } from './interaction/useMediaQuery';

export function App() {
  const progress = useRef(0);
  const mobile = useMediaQuery('(max-width: 700px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <main className="experience" id="experience">
      <div className="scene-shell" aria-hidden="true">
        <ExperienceCanvas progress={progress} mobile={mobile} reducedMotion={reducedMotion} />
      </div>
      <Interface />
    </main>
  );
}
