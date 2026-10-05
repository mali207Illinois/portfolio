import type { RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function attachExperienceTimeline(element: HTMLElement, progress: RefObject<number>, onTerminalActive: (active: boolean) => void) {
  let terminalActive = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    return clamped * clamped * (3 - 2 * clamped);
  };

  const update = (value: number) => {
    progress.current = value;
    // Leave only a brief all-black beat between the two fades.
    const blackout = ease((value - 0.2) / 0.37);
    const reveal = ease((value - 0.6) / 0.34);
    const handoff = ease((value - 0.22) / 0.1) * (1 - ease((value - 0.45) / 0.11));
    element.style.setProperty('--scene-blackout', blackout.toFixed(4));
    element.style.setProperty('--handoff-opacity', handoff.toFixed(4));
    element.style.setProperty('--handoff-progress', ease((value - 0.22) / 0.34).toFixed(4));
    element.style.setProperty('--terminal-reveal', reveal.toFixed(4));
    element.style.setProperty('--terminal-lift', `${Math.round((1 - reveal) * (reducedMotion ? 0 : 20))}px`);
    element.style.setProperty('--terminal-scale', reducedMotion ? '1' : (0.975 + reveal * 0.025).toFixed(4));

    const nextActive = value >= 0.87;
    if (nextActive !== terminalActive) {
      terminalActive = nextActive;
      onTerminalActive(nextActive);
    }
  };

  const smoothed = { value: 0 };
  let glide: ReturnType<typeof gsap.quickTo> | null = null;
  const moveTo = (value: number) => {
    if (reducedMotion || !glide) {
      smoothed.value = value;
      update(value);
    } else {
      glide(value);
    }
  };

  const trigger = ScrollTrigger.create({
    trigger: element,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => moveTo(self.progress),
    onRefresh: (self) => moveTo(self.progress),
  });

  glide = gsap.quickTo(smoothed, 'value', {
    duration: 0.55,
    ease: 'power2.out',
    onUpdate: () => update(smoothed.value),
  });
  update(trigger.progress);
  return () => {
    trigger.kill();
    glide?.tween.kill();
    element.style.removeProperty('--scene-blackout');
    element.style.removeProperty('--handoff-opacity');
    element.style.removeProperty('--handoff-progress');
    element.style.removeProperty('--terminal-reveal');
    element.style.removeProperty('--terminal-lift');
    element.style.removeProperty('--terminal-scale');
  };
}
