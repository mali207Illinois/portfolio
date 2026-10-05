import { useEffect, useRef } from 'react';
import type { RefObject, ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils } from 'three';

export interface SimulationPointer {
  x: number;
  y: number;
  present: boolean;
}

export function SimulationPointerTracker({ pointer, enabled }: { pointer: RefObject<SimulationPointer>; enabled: boolean }) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.current.x = MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1);
      pointer.current.y = MathUtils.clamp(1 - ((event.clientY - bounds.top) / bounds.height) * 2, -1, 1);
      pointer.current.present = true;
      invalidate();
    };
    const onLeave = () => {
      pointer.current.present = false;
      invalidate();
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled, gl, invalidate, pointer]);

  return null;
}

export function HeroParallax({ pointer, enabled, children }: { pointer: RefObject<SimulationPointer>; enabled: boolean; children: ReactNode }) {
  const root = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!root.current) return;
    const targetX = enabled && pointer.current.present ? pointer.current.x * 0.025 : 0;
    const targetY = enabled && pointer.current.present ? pointer.current.y * 0.018 : 0;
    root.current.position.x = MathUtils.damp(root.current.position.x, targetX, 1.7, delta);
    root.current.position.y = MathUtils.damp(root.current.position.y, targetY, 1.7, delta);
  });

  return <group ref={root}>{children}</group>;
}
