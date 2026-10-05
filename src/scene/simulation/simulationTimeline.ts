import { MathUtils } from 'three';

export function simulationFade(progress: number) {
  const t = MathUtils.clamp((progress - 0.52) / 0.48, 0, 1);
  return 1 - (t * t * (3 - 2 * t)) * 0.94;
}
