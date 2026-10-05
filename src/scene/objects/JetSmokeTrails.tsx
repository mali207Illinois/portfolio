import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  DoubleSide,
  InstancedMesh,
  LinearFilter,
  PlaneGeometry,
  RGBAFormat,
  UnsignedByteType,
  Vector3,
  MeshBasicMaterial,
  Object3D,
} from 'three';
import type { Group } from 'three';

interface JetSmokeTrailsProps {
  aircraft: RefObject<Group | null>;
  mobile: boolean;
  reducedMotion: boolean;
}

function noise(index: number, seed: number) {
  const value = Math.sin((index + 1) * 127.1 + seed * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(start: number, end: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function makeSmokeTexture() {
  const size = 48;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const ny = ((y + 0.5) / size) * 2 - 1;
      const angle = Math.atan2(ny, nx);
      const ripple = 0.06 * Math.sin(angle * 5 + 0.7) + 0.035 * Math.sin(angle * 9 - 1.2);
      const radius = Math.sqrt(nx * nx + ny * ny) * (1 + ripple);
      const grain = 0.86 + 0.14 * Math.sin(nx * 13 + ny * 8) * Math.sin(ny * 11 - nx * 4);
      const alpha = Math.pow(Math.max(0, 1 - radius), 1.65) * grain;
      const offset = (y * size + x) * 4;
      pixels[offset] = 255;
      pixels[offset + 1] = 255;
      pixels[offset + 2] = 255;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new DataTexture(pixels, size, size, RGBAFormat, UnsignedByteType);
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeParticles(count: number) {
  return {
    geometry: new PlaneGeometry(1, 1),
    positions: new Float32Array(count * 3),
    lives: new Float32Array(count),
    sizes: new Float32Array(count),
    velocities: new Float32Array(count * 3),
    lifetimes: new Float32Array(count),
    phases: new Float32Array(count),
    count,
  };
}

export function JetSmokeTrails({ aircraft, mobile, reducedMotion }: JetSmokeTrailsProps) {
  const smoke = useRef<InstancedMesh>(null);
  const particles = useMemo(() => makeParticles(mobile ? 68 : 124), [mobile]);
  const texture = useMemo(makeSmokeTexture, []);
  const material = useMemo(() => new MeshBasicMaterial({
    map: texture,
    color: '#d1d9d3',
    transparent: true,
    opacity: 0.58,
    alphaTest: 0.008,
    depthWrite: false,
    side: DoubleSide,
    toneMapped: false,
  }), [texture]);
  const state = useRef({ initialized: false, cursor: 0, emitted: 0, accumulator: 0 });
  const vectors = useMemo(() => ({
    source: new Vector3(),
    aft: new Vector3(),
    lateral: new Vector3(),
    color: new Color(),
    dummy: new Object3D(),
  }), []);

  useEffect(() => () => particles.geometry.dispose(), [particles]);
  useEffect(() => () => {
    material.dispose();
    texture.dispose();
  }, [material, texture]);

  useFrame(({ camera, clock }, delta) => {
    const jet = aircraft.current;
    const cloud = smoke.current;
    if (!jet || !cloud) return;

    jet.updateWorldMatrix(true, false);
    cloud.updateWorldMatrix(true, false);
    const { source, aft, lateral, color, dummy } = vectors;

    const emit = (age: number) => {
      const serial = state.current.emitted++;
      const index = state.current.cursor;
      state.current.cursor = (index + 1) % particles.count;
      const side = serial % 2 ? 1 : -1;

      // The presentation group turns the model's aft -Y into local +Z.
      source.set(side * 0.39, -0.18, 3.69);
      aft.set(side * 0.39, -0.18, 4.69);
      jet.localToWorld(source);
      jet.localToWorld(aft);
      cloud.worldToLocal(source);
      cloud.worldToLocal(aft);
      aft.sub(source).normalize();
      lateral.set(-aft.z, 0, aft.x).normalize();

      const speed = 1.52 + noise(serial, 1) * 0.42;
      const lifetime = 3.2 + noise(serial, 2) * 0.55;
      const spread = (noise(serial, 3) - 0.5) * (0.05 + age * 0.52);
      const rise = (noise(serial, 4) - 0.5) * (0.05 + age * 0.28);
      const distance = age * lifetime * speed;
      const offset = index * 3;

      particles.positions[offset] = source.x + aft.x * distance + lateral.x * spread;
      particles.positions[offset + 1] = source.y + aft.y * distance + rise;
      particles.positions[offset + 2] = source.z + aft.z * distance + lateral.z * spread;
      particles.velocities[offset] = aft.x * speed + lateral.x * (noise(serial, 5) - 0.5) * 0.12;
      particles.velocities[offset + 1] = aft.y * speed + 0.035 + noise(serial, 6) * 0.075;
      particles.velocities[offset + 2] = aft.z * speed + lateral.z * (noise(serial, 5) - 0.5) * 0.12;
      particles.lives[index] = 1 - age;
      particles.lifetimes[index] = lifetime;
      particles.sizes[index] = 0.8 + noise(serial, 7) * 0.48;
      particles.phases[index] = noise(serial, 8) * Math.PI * 2;
    };

    if (!state.current.initialized) {
      for (let index = 0; index < particles.count * 0.55; index += 1) {
        emit(0.04 + (index / (particles.count * 0.55)) * 0.66);
      }
      state.current.initialized = true;
    }

    if (!reducedMotion) {
      const step = Math.min(delta, 0.05);
      for (let index = 0; index < particles.count; index += 1) {
        if (particles.lives[index] <= 0) continue;
        particles.lives[index] = Math.max(0, particles.lives[index] - step / particles.lifetimes[index]);
        const offset = index * 3;
        const wobble = Math.sin(clock.elapsedTime * 1.6 + particles.phases[index]) * 0.018 * step;
        particles.positions[offset] += particles.velocities[offset] * step + wobble;
        particles.positions[offset + 1] += particles.velocities[offset + 1] * step;
        particles.positions[offset + 2] += particles.velocities[offset + 2] * step - wobble;
      }

      state.current.accumulator += step * (mobile ? 19 : 31);
      while (state.current.accumulator >= 1) {
        emit(0.025);
        state.current.accumulator -= 1;
      }
    }

    for (let index = 0; index < particles.count; index += 1) {
      const life = particles.lives[index];
      if (life <= 0) {
        dummy.position.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        cloud.setMatrixAt(index, dummy.matrix);
        continue;
      }

      const age = 1 - life;
      const fade = smoothstep(0, 0.1, age) * (1 - smoothstep(0.7, 1, age));
      const size = (0.26 + age * 0.92) * particles.sizes[index];
      const offset = index * 3;
      dummy.position.set(particles.positions[offset], particles.positions[offset + 1], particles.positions[offset + 2]);
      dummy.quaternion.copy(camera.quaternion);
      dummy.scale.set(size * (1 + Math.sin(particles.phases[index]) * 0.08), size, 1);
      dummy.updateMatrix();
      cloud.setMatrixAt(index, dummy.matrix);
      color.setRGB(0.78 * fade, 0.86 * fade, 0.82 * fade);
      cloud.setColorAt(index, color);
    }

    cloud.instanceMatrix.needsUpdate = true;
    if (cloud.instanceColor) cloud.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={smoke} args={[particles.geometry, material, particles.count]} frustumCulled={false} />;
}
