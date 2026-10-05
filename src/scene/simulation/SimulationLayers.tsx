import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  FogExp2,
  Group,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  PointsMaterial,
} from 'three';
import type { SimulationPointer } from '../../interaction/useSimulationPointer';
import type { SimulationLayerProps } from './SimulationEnvironment';
import { simulationFade } from './simulationTimeline';
import {
  createOrbitArcGeometry,
  createAtmosphereTexture,
  createGeodesicSphereGeometry,
  createMountainTerrainGeometry,
  createPerspectiveGridGeometry,
  createReferenceSphereGeometry,
} from './simulationGeometry';
import type { OrbitArcSpec } from './simulationGeometry';

function pointerX(pointer: RefObject<SimulationPointer>, mobile: boolean, reducedMotion: boolean) {
  return mobile || reducedMotion || !pointer.current.present ? 0 : pointer.current.x;
}

export function AtmosphericLayer({ progress, reducedMotion, mobile }: { progress: RefObject<number>; reducedMotion: boolean; mobile: boolean }) {
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2('#070908', 0.014), []);
  const mistTexture = useMemo(() => createAtmosphereTexture(39), []);
  const haloTexture = useMemo(() => createAtmosphereTexture(11, true), []);
  const mistMaterial = useMemo(() => new MeshBasicMaterial({ map: mistTexture, transparent: true, opacity: mobile ? 0.42 : 0.7, depthWrite: false, fog: false, toneMapped: false, side: DoubleSide }), [mistTexture, mobile]);
  const haloMaterial = useMemo(() => new MeshBasicMaterial({ map: haloTexture, transparent: true, opacity: mobile ? 0.48 : 0.72, depthWrite: false, fog: false, toneMapped: false, side: DoubleSide }), [haloTexture, mobile]);

  useEffect(() => {
    const previous = scene.fog;
    scene.fog = fog;
    return () => { scene.fog = previous; };
  }, [fog, scene]);
  useEffect(() => () => { mistMaterial.dispose(); haloMaterial.dispose(); mistTexture.dispose(); haloTexture.dispose(); }, [mistMaterial, haloMaterial, mistTexture, haloTexture]);

  useFrame(() => {
    const travel = reducedMotion ? 0 : progress.current;
    fog.density = 0.014 + travel * 0.014;
    mistMaterial.opacity = (mobile ? 0.42 : 0.7) * simulationFade(travel);
    haloMaterial.opacity = (mobile ? 0.48 : 0.72) * simulationFade(travel);
  });

  return (
    <group>
      <mesh position={[2.2, -1.3, -44]} material={haloMaterial}>
        <planeGeometry args={[45, 15]} />
      </mesh>
      <mesh position={[-2.5, -2.4, -17]} material={mistMaterial}>
        <planeGeometry args={[61, 9]} />
      </mesh>
      {!mobile && <mesh position={[3.5, -1.3, -26]} scale={[-1, 1, 1]} material={mistMaterial}>
        <planeGeometry args={[53, 7]} />
      </mesh>}
    </group>
  );
}

export function PerspectiveGrid({ progress, pointer, mobile, reducedMotion }: SimulationLayerProps) {
  const grid = useRef<Group>(null);
  const geometry = useMemo(() => createPerspectiveGridGeometry(mobile), [mobile]);
  const material = useMemo(() => new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: mobile ? 0.24 : 0.42, depthWrite: false, toneMapped: false }), [mobile]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(({ clock }, delta) => {
    if (!grid.current) return;
    const travel = reducedMotion ? 0 : progress.current;
    const early = Math.min(travel / 0.57, 1);
    const flight = reducedMotion ? 0 : clock.elapsedTime;
    const repeat = mobile ? 3.5 : 2.75;
    grid.current.position.z = -((flight * (mobile ? 0.72 : 1.05)) % repeat) - early * 5.2;
    grid.current.position.x = MathUtils.damp(grid.current.position.x, pointerX(pointer, mobile, reducedMotion) * -0.38, 1.6, delta);
    material.opacity = (mobile ? 0.24 : 0.42) * simulationFade(travel);
  });

  return <group ref={grid}><lineSegments geometry={geometry} material={material} /></group>;
}

export function TerrainFar({ progress, pointer, mobile, reducedMotion }: SimulationLayerProps) {
  const nearRidge = useRef<Group>(null);
  const rearRidge = useRef<Group>(null);
  const geometry = useMemo(() => createMountainTerrainGeometry(76, 29, mobile ? 40 : 82, mobile ? 13 : 30, mobile ? 8.8 : 10.2, 71), [mobile]);
  const rearGeometry = useMemo(() => mobile ? null : createMountainTerrainGeometry(88, 30, 64, 22, 7.8, 118), [mobile]);
  const fill = useMemo(() => new MeshBasicMaterial({ color: '#080b10', side: DoubleSide }), []);
  const rearFill = useMemo(() => new MeshBasicMaterial({ color: '#090d12', side: DoubleSide }), []);
  const wire = useMemo(() => new MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: mobile ? 0.3 : 0.53, depthWrite: false, toneMapped: false, side: DoubleSide }), [mobile]);
  const rearWire = useMemo(() => new MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.24, depthWrite: false, toneMapped: false, side: DoubleSide }), []);

  useEffect(() => () => { geometry.dispose(); rearGeometry?.dispose(); fill.dispose(); rearFill.dispose(); wire.dispose(); rearWire.dispose(); }, [geometry, rearGeometry, fill, rearFill, wire, rearWire]);
  useFrame(({ clock }, delta) => {
    const travel = reducedMotion ? 0 : progress.current;
    const fade = simulationFade(travel);
    const flight = reducedMotion ? 0 : clock.elapsedTime;
    if (nearRidge.current) {
      nearRidge.current.position.x = MathUtils.damp(nearRidge.current.position.x, pointerX(pointer, mobile, reducedMotion) * -0.18 + Math.sin(flight * 0.1) * 0.3, 1.2, delta);
      nearRidge.current.position.z = MathUtils.damp(nearRidge.current.position.z, -30 - travel * 1.7, 1.1, delta);
      nearRidge.current.rotation.x = -Math.PI / 2 + travel * 0.012;
    }
    if (rearRidge.current) rearRidge.current.position.x = MathUtils.damp(rearRidge.current.position.x, pointerX(pointer, mobile, reducedMotion) * -0.08 + Math.sin(flight * 0.07) * 0.17, 1.1, delta);
    wire.opacity = (mobile ? 0.3 : 0.53) * fade;
    rearWire.opacity = 0.24 * fade;
  });

  return (
    <>
      <group ref={nearRidge} position={[0, -6.1, -30]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={geometry} material={fill} />
        <mesh geometry={geometry} material={wire} position={[0, 0, 0.025]} />
      </group>
      {rearGeometry && <group ref={rearRidge} position={[0, -5.6, -46]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={rearGeometry} material={rearFill} />
        <mesh geometry={rearGeometry} material={rearWire} position={[0, 0, 0.025]} />
      </group>}
    </>
  );
}

function createSpherePoints(radius: number, count: number) {
  const positions: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index + 0.5) * 2 / count;
    const r = Math.sqrt(1 - y * y);
    const a = index * Math.PI * (3 - Math.sqrt(5));
    positions.push(Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

function ReferenceSphere({ progress, pointer, mobile, reducedMotion, variant }: SimulationLayerProps & { variant: 'a' | 'b' }) {
  const sphere = useRef<Group>(null);
  const radius = variant === 'a' ? 18 : 9;
  const geometry = useMemo(() => variant === 'a' ? createGeodesicSphereGeometry(radius, mobile) : createReferenceSphereGeometry(radius, mobile), [radius, mobile, variant]);
  const points = useMemo(() => createSpherePoints(radius, mobile ? 7 : 18), [radius, mobile]);
  const material = useMemo(() => new LineBasicMaterial({ color: variant === 'a' ? '#81939e' : '#74858e', transparent: true, opacity: mobile ? 0.16 : variant === 'a' ? 0.28 : 0.17, depthWrite: false, fog: false, toneMapped: false }), [mobile, variant]);
  const pointMaterial = useMemo(() => new PointsMaterial({ color: '#a6b5bb', size: 1.6, sizeAttenuation: false, transparent: true, opacity: mobile ? 0.16 : 0.29, depthWrite: false, fog: false, toneMapped: false }), [mobile]);

  useEffect(() => () => { geometry.dispose(); points.dispose(); material.dispose(); pointMaterial.dispose(); }, [geometry, points, material, pointMaterial]);
  useFrame(({ clock }, delta) => {
    if (!sphere.current) return;
    const travel = reducedMotion ? 0 : progress.current;
    sphere.current.rotation.y = reducedMotion ? 0 : clock.elapsedTime * (variant === 'a' ? 0.0022 : -0.0015) + travel * (variant === 'a' ? 0.055 : -0.03);
    sphere.current.position.x = MathUtils.damp(sphere.current.position.x, (variant === 'a' ? -16 : 14.5) + pointerX(pointer, mobile, reducedMotion) * (variant === 'a' ? -0.035 : -0.018), 1.1, delta);
    material.opacity = (mobile ? 0.16 : variant === 'a' ? 0.28 : 0.17) * simulationFade(travel);
    pointMaterial.opacity = (mobile ? 0.16 : variant === 'a' ? 0.29 : 0.18) * simulationFade(travel);
  });

  return (
    <group ref={sphere} position={[variant === 'a' ? -16 : 14.5, variant === 'a' ? 7.4 : 8.3, variant === 'a' ? -28 : -38]}>
      <lineSegments geometry={geometry} material={material} />
      <points geometry={points} material={pointMaterial} />
    </group>
  );
}

export function OrbitalSphereA(props: SimulationLayerProps) { return <ReferenceSphere {...props} variant="a" />; }
export function OrbitalSphereB(props: SimulationLayerProps) { return <ReferenceSphere {...props} variant="b" />; }

const ARCS: readonly OrbitArcSpec[] = [
  { center: [7.6, 0.9, -19], radii: [7.8, 6.2], start: -0.25, end: 2.7, tilt: [0.06, -0.12, 0.02] },
  { center: [7.6, 0.9, -19], radii: [6.3, 5.1], start: 2.3, end: 5.85, tilt: [-0.04, 0.09, 0.01] },
  { center: [-5.2, 2.5, -25], radii: [13.5, 5.7], start: 2.8, end: 5.65, tilt: [0.13, 0.2, -0.17] },
];

function OrbitArc({ spec, index, progress, pointer, mobile, reducedMotion }: SimulationLayerProps & { spec: OrbitArcSpec; index: number }) {
  const arc = useRef<Group>(null);
  const geometry = useMemo(() => createOrbitArcGeometry(spec), [spec]);
  const material = useMemo(() => new LineBasicMaterial({ color: '#95a4ac', transparent: true, opacity: mobile ? 0.16 : index === 0 ? 0.3 : index === 1 ? 0.18 : 0.09, depthWrite: false, fog: false, toneMapped: false }), [index, mobile]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame((_, delta) => {
    if (!arc.current) return;
    const travel = reducedMotion ? 0 : progress.current;
    arc.current.rotation.z = (index % 2 ? -1 : 1) * travel * 0.105;
    arc.current.position.x = MathUtils.damp(arc.current.position.x, pointerX(pointer, mobile, reducedMotion) * -0.04, 1.1, delta);
    material.opacity = (mobile ? 0.16 : index === 0 ? 0.3 : index === 1 ? 0.18 : 0.09) * simulationFade(travel);
  });

  return <group ref={arc}><lineSegments geometry={geometry} material={material} /></group>;
}

export function OrbitLines(props: SimulationLayerProps) {
  return <group>{ARCS.slice(0, props.mobile ? 1 : 3).map((spec, index) => <OrbitArc key={index} spec={spec} index={index} {...props} />)}</group>;
}

const STARS: readonly (readonly [number, number, number])[] = [
  [-14.2, 7.1, -43], [-10.6, 4.9, -37], [-7.4, 6.8, -40], [-4.1, 5.8, -45],
  [0.9, 7.4, -42], [4.8, 5.5, -39], [8.3, 7.9, -44], [13.6, 5.4, -40],
  [-12.7, 1.2, -39], [-8.8, -1.9, -42], [-3.3, 2.2, -37], [2.7, 3.9, -41],
  [7.8, -0.7, -43], [12.4, 2.4, -38], [-6.1, -4.6, -45], [5.2, -3.9, -41],
];

export function StarLayer({ progress, mobile, reducedMotion }: SimulationLayerProps) {
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(STARS.slice(0, mobile ? 7 : STARS.length).flat(), 3));
    return result;
  }, [mobile]);
  const material = useMemo(() => new PointsMaterial({ color: '#aeb7b2', size: 1.15, sizeAttenuation: false, transparent: true, opacity: 0.24, depthWrite: false, fog: false, toneMapped: false }), []);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(() => { material.opacity = 0.24 * simulationFade(reducedMotion ? 0 : progress.current); });

  return <points geometry={geometry} material={material} />;
}
