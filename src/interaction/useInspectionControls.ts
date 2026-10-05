import { useEffect } from 'react';
import type { RefObject } from 'react';

export interface InspectionOffset {
  yaw: number;
  elevation: number;
  dragging: boolean;
}

export function useInspectionControls(canvas: HTMLCanvasElement, enabled: boolean, onChange: () => void, offset: RefObject<InspectionOffset>) {
  useEffect(() => {
    if (!enabled) return;

    let activePointer: number | null = null;
    let previousX = 0;
    let previousY = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || activePointer !== null) return;
      activePointer = event.pointerId;
      offset.current.dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      onChange();
      canvas.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      offset.current.yaw = Math.max(-0.7, Math.min(0.7, offset.current.yaw + (event.clientX - previousX) * 0.004));
      offset.current.elevation = Math.max(-0.45, Math.min(0.45, offset.current.elevation + (event.clientY - previousY) * 0.003));
      previousX = event.clientX;
      previousY = event.clientY;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointer) return;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      activePointer = null;
      offset.current.dragging = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
    };
  }, [canvas, enabled, onChange, offset]);
}
