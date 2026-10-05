import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute, Group, MathUtils, PointsMaterial } from 'three';
import type { SimulationLayerProps } from './SimulationEnvironment';
import { createSignalTexture } from './simulationGeometry';
import { simulationFade } from './simulationTimeline';

const MARKERS: readonly (readonly [number, number, number])[] = [
  [-12.2, -4.63, -9], [-7.7, -4.63, -16], [-2.6, -4.63, -11],
  [3.7, -4.63, -15], [10.2, -4.63, -24], [14.6, -4.63, -12],
  [7.6, 0.9, -18.5],
];

export function SignalMarkers({ progress, pointer, mobile, reducedMotion }: SimulationLayerProps) {
  const root = useRef<Group>(null);
  const texture = useMemo(createSignalTexture, []);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute((mobile ? [MARKERS[1], MARKERS[3], MARKERS[6]] : MARKERS).flat(), 3));
    return result;
  }, [mobile]);
  const glowMaterial = useMemo(() => new PointsMaterial({ color: '#ff3d43', map: texture, size: mobile ? 18 : 30, sizeAttenuation: false, transparent: true, opacity: 0.95, depthWrite: false, fog: false, toneMapped: false }), [mobile, texture]);
  const coreMaterial = useMemo(() => new PointsMaterial({ color: '#ff817b', size: mobile ? 2.3 : 3.1, sizeAttenuation: false, transparent: true, opacity: 1, depthWrite: false, fog: false, toneMapped: false }), [mobile]);

  useEffect(() => () => { geometry.dispose(); glowMaterial.dispose(); coreMaterial.dispose(); texture.dispose(); }, [geometry, glowMaterial, coreMaterial, texture]);
  useFrame((_, delta) => {
    if (!root.current) return;
    const travel = reducedMotion ? 0 : progress.current;
    const pointerX = mobile || reducedMotion || !pointer.current.present ? 0 : pointer.current.x;
    root.current.position.x = MathUtils.damp(root.current.position.x, -pointerX * 0.065, 1.6, delta);
    root.current.position.z = MathUtils.damp(root.current.position.z, -Math.min(1, travel / 0.55) * 0.85, 1.3, delta);
    glowMaterial.opacity = 0.95 * simulationFade(travel);
    coreMaterial.opacity = simulationFade(travel);
  });

  return (
    <group ref={root}>
      <points geometry={geometry} material={glowMaterial} />
      <points geometry={geometry} material={coreMaterial} />
    </group>
  );
}
