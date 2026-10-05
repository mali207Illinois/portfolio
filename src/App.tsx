import { useEffect, useRef, useState } from 'react';
import { ExperienceCanvas } from './scene/ExperienceCanvas';
import { Interface } from './ui/Interface';
import { TerminalChapter } from './ui/TerminalChapter';
import { useMediaQuery } from './interaction/useMediaQuery';
import { attachExperienceTimeline } from './timeline/experienceTimeline';

export function App() {
  const experienceRef = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [terminalActive, setTerminalActive] = useState(false);
  const mobile = useMediaQuery('(max-width: 700px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    if (!experienceRef.current) return;
    return attachExperienceTimeline(experienceRef.current, progress, setTerminalActive);
  }, []);

  return (
    <main className="experience" id="experience" ref={experienceRef}>
      <div className="scene-shell" aria-hidden="true">
        <ExperienceCanvas progress={progress} mobile={mobile} reducedMotion={reducedMotion} />
      </div>
      <Interface mobile={mobile} />
      <div className="scene-blackout" aria-hidden="true" />
      <div className="system-handoff" aria-hidden="true">
        <span className="system-handoff-index">02 / SYSTEM LINK</span>
        <span className="system-handoff-reticle">+</span>
        <span className="system-handoff-label">INITIALIZING PORTFOLIO TERMINAL</span>
        <span className="system-handoff-track"><span /></span>
      </div>
      <TerminalChapter active={terminalActive} reducedMotion={reducedMotion} />
      <div className="scroll-runway" aria-hidden="true" />
    </main>
  );
}
