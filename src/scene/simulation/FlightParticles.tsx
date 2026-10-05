import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  MathUtils,
  PointsMaterial,
} from 'three';
import type { SimulationLayerProps } from './SimulationEnvironment';
import { simulationFade } from './simulationTimeline';

const PARTICLE_DEPTH = 48;
const PALE = new Color('#9fafae');
const WARM = new Color('#b26b60');

function random(index: number, seed: number) {
  const value = Math.sin((index + 1) * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function makeParticles(mobile: boolean) {
  const count = mobile ? 46 : 112;
  const base = new Float32Array(count * 3);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    let x = (random(index, 1) * 2 - 1) * 17;
    if (Math.abs(x) < 1.7) x += x < 0 ? -1.7 : 1.7;
    base[index * 3] = x;
    base[index * 3 + 1] = random(index, 2) * 10 - 2.4;
    base[index * 3 + 2] = random(index, 3) * PARTICLE_DEPTH - 44;
    speeds[index] = 0.72 + random(index, 4) * 0.56;
    phases[index] = random(index, 5) * Math.PI * 2;

    const color = index % 23 === 0 ? WARM : PALE;
    const brightness = 0.34 + random(index, 6) * 0.46;
    colors[index * 3] = color.r * brightness;
    colors[index * 3 + 1] = color.g * brightness;
    colors[index * 3 + 2] = color.b * brightness;
  }

  positions.set(base);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3).setUsage(DynamicDrawUsage));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return { geometry, base, speeds, phases };
}

export function FlightParticles({ progress, pointer, mobile, reducedMotion }: SimulationLayerProps) {
  const root = useRef<Group>(null);
  const { geometry, base, speeds, phases } = useMemo(() => makeParticles(mobile), [mobile]);
  const material = useMemo(() => new PointsMaterial({
    size: mobile ? 1.65 : 2.1,
    sizeAttenuation: false,
    vertexColors: true,
    transparent: true,
    opacity: mobile ? 0.44 : 0.57,
    depthWrite: false,
    toneMapped: false,
  }), [mobile]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(({ clock }, delta) => {
    const time = reducedMotion ? 0 : clock.elapsedTime;
    const attribute = geometry.getAttribute('position');

    for (let index = 0; index < speeds.length; index += 1) {
      const offset = index * 3;
      const phase = phases[index];
      attribute.setXYZ(
        index,
        base[offset] + Math.sin(time * 0.28 + phase) * 0.25,
        base[offset + 1] + Math.cos(time * 0.34 + phase) * 0.2,
        -44 + ((base[offset + 2] + 44 + time * 1.65 * speeds[index]) % PARTICLE_DEPTH),
      );
    }
    attribute.needsUpdate = true;

    if (root.current) {
      const cursorX = mobile || reducedMotion || !pointer.current.present ? 0 : pointer.current.x;
      const cursorY = mobile || reducedMotion || !pointer.current.present ? 0 : pointer.current.y;
      root.current.position.x = MathUtils.damp(root.current.position.x, -cursorX * 0.55, 1.6, delta);
      root.current.position.y = MathUtils.damp(root.current.position.y, -cursorY * 0.22, 1.6, delta);
    }
    material.opacity = (mobile ? 0.44 : 0.57) * simulationFade(reducedMotion ? 0 : progress.current);
  });

  return <group ref={root}><points geometry={geometry} material={material} /></group>;
}
