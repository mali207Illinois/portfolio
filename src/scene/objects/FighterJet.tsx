import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, DoubleSide, Float32BufferAttribute, MeshPhysicalMaterial, MeshStandardMaterial } from 'three';
import type { Group } from 'three';
import { aerospaceMaterials as m } from './AerospaceMaterials';
import { AerospacePanel, SerialMark, StructuralRail } from './AerospaceKit';
import { JetSmokeTrails } from './JetSmokeTrails';
import type { Point2, Point3 } from './AerospaceKit';

interface FighterJetProps {
  mobile: boolean;
  reducedMotion: boolean;
}

// The aircraft is modeled nose-first along local Y. The presentation group
// lays it level in the world before the outer group turns it like a display.
const FUSELAGE_STATIONS = [
  { y: -3.48, width: 0.57, top: 0.28, bottom: -0.34 },
  { y: -2.83, width: 0.71, top: 0.42, bottom: -0.4 },
  { y: -1.8, width: 0.77, top: 0.51, bottom: -0.46 },
  { y: -0.55, width: 0.84, top: 0.59, bottom: -0.43 },
  { y: 0.63, width: 0.71, top: 0.65, bottom: -0.35 },
  { y: 1.7, width: 0.46, top: 0.59, bottom: -0.25 },
  { y: 2.68, width: 0.3, top: 0.44, bottom: -0.17 },
  { y: 3.56, width: 0.13, top: 0.24, bottom: -0.1 },
  { y: 4.14, width: 0.012, top: 0.045, bottom: -0.045 },
] as const;

function createFuselageGeometry() {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  const ringSize = 8;

  FUSELAGE_STATIONS.forEach(({ y, width, top, bottom }) => {
    const crossSection = [
      [0, top], [width * 0.72, top - 0.1], [width, -0.02],
      [width * 0.7, bottom + 0.09], [0, bottom],
      [-width * 0.7, bottom + 0.09], [-width, -0.02],
      [-width * 0.72, top - 0.1],
    ];
    crossSection.forEach(([x, z]) => positions.push(x, y, z));
  });

  for (let station = 0; station < FUSELAGE_STATIONS.length - 1; station += 1) {
    for (let side = 0; side < ringSize; side += 1) {
      const start = indices.length;
      const a = station * ringSize + side;
      const b = station * ringSize + (side + 1) % ringSize;
      const c = (station + 1) * ringSize + side;
      const d = (station + 1) * ringSize + (side + 1) % ringSize;
      indices.push(a, b, c, b, d, c);
      geometry.addGroup(start, 6, side <= 1 || side >= 6 ? 0 : 1);
    }
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const WING: Point2[] = [
  [0.56, 0.81], [1.04, 0.37], [3.28, -1.36], [3.36, -1.75],
  [2.7, -2.2], [0.69, -2.53],
];
const WING_INSERT: Point2[] = [
  [1.2, 0.08], [2.95, -1.43], [2.8, -1.79], [1.14, -1.47],
];
const AILERON: Point2[] = [
  [1.44, -1.87], [2.75, -2.04], [2.42, -2.2], [1.29, -2.37],
];
const STABILIZER: Point2[] = [
  [0.56, -2.47], [1.57, -2.65], [2.12, -3.12],
  [2.02, -3.43], [0.65, -3.3],
];
const LERX: Point2[] = [[0.57, 1.1], [1.16, 0.05], [0.72, -0.55]];
const INTAKE: Point2[] = [[0.68, 0.25], [1.08, -0.12], [1.04, -0.86], [0.73, -1.02]];

const CANOPY_STATIONS = [
  { y: 0.42, width: 0.32, base: 0.64, crown: 0.66 },
  { y: 0.84, width: 0.4, base: 0.66, crown: 0.82 },
  { y: 1.58, width: 0.35, base: 0.62, crown: 0.83 },
  { y: 2.24, width: 0.25, base: 0.52, crown: 0.66 },
  { y: 2.7, width: 0.014, base: 0.43, crown: 0.445 },
] as const;
const DORSAL_PANEL: Point2[] = [
  [-0.32, 0.25], [0.32, 0.25], [0.47, -0.35],
  [0.34, -2.1], [0, -2.37], [-0.34, -2.1], [-0.47, -0.35],
];
const TAIL_FIN: Point2[] = [
  [0.51, -1.74], [0.93, -1.99], [1.18, -3.07],
  [0.87, -3.41], [0.54, -3.08],
];

function mirrored(outline: readonly Point2[], side: number): Point2[] {
  return side === 1 ? [...outline] : outline.map(([x, y]) => [-x, y] as Point2).reverse();
}

const finMaterial = new MeshStandardMaterial({
  color: '#57625b', metalness: 0.28, roughness: 0.68,
  emissive: '#1d2925', emissiveIntensity: 0.22, side: DoubleSide,
});
const canopyMaterial = new MeshPhysicalMaterial({
  color: '#1b2b2f', metalness: 0.35, roughness: 0.18,
  clearcoat: 0.95, clearcoatRoughness: 0.1, side: DoubleSide,
});
const flightTestMarking = new MeshStandardMaterial({
  color: '#d19a4c', metalness: 0.32, roughness: 0.56,
  emissive: '#583416', emissiveIntensity: 0.12, side: DoubleSide,
});
const FIXED_AIRCRAFT_YAW = Math.PI - (5 * Math.PI / 180);

function createCanopyGeometry() {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];

  CANOPY_STATIONS.forEach(({ y, width, base, crown }) => {
    positions.push(-width, y, base, 0, y, crown, width, y, base);
  });
  for (let index = 0; index < CANOPY_STATIONS.length - 1; index += 1) {
    const current = index * 3;
    const next = (index + 1) * 3;
    indices.push(current, next, current + 1, current + 1, next, next + 1);
    indices.push(current + 1, next + 1, current + 2, current + 2, next + 1, next + 2);
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Canopy() {
  const geometry = useMemo(createCanopyGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} material={canopyMaterial} castShadow />
      {[-1, 1].map((side) => CANOPY_STATIONS.slice(0, -1).map((station, index) => {
        const next = CANOPY_STATIONS[index + 1];
        return <StructuralRail
          key={`${side}-${index}`}
          from={[side * station.width, station.y, station.base]}
          to={[side * next.width, next.y, next.base]}
          width={0.035} depth={0.028} material={m.shellEdge} radius={0.007}
        />;
      }))}
      <StructuralRail from={[-0.4, 0.84, 0.66]} to={[0.4, 0.84, 0.66]} width={0.043} depth={0.031} material={m.frame} radius={0.008} />
    </group>
  );
}

function createVerticalFinGeometry(side: number) {
  const geometry = new BufferGeometry();
  const vertices = [
    [side * 0.55, -1.82, 0.4],
    [side * 1.07, -2.41, 1.32],
    [side * 1.13, -2.99, 1.16],
    [side * 0.58, -3.42, 0.39],
  ];
  geometry.setAttribute('position', new Float32BufferAttribute(vertices.flat(), 3));
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();
  return geometry;
}

function VerticalFin({ side }: { side: number }) {
  const geometry = useMemo(() => createVerticalFinGeometry(side), [side]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <AerospacePanel outline={mirrored(TAIL_FIN, side)} depth={0.08} surface={m.shellDark} edge={m.shellEdge} position={[0, 0, 0.39]} bevel={0.015} />
      <mesh geometry={geometry} material={finMaterial} castShadow />
      <StructuralRail
        from={[side * 0.55, -1.82, 0.4]}
        to={[side * 1.07, -2.41, 1.32]}
        width={0.055} depth={0.055} material={m.shellEdge} radius={0.012}
      />
    </group>
  );
}

function Wing({ side, mobile }: { side: number; mobile: boolean }) {
  const tip: Point3 = [side * 3.32, -1.56, -0.07];

  return (
    <group>
      <AerospacePanel outline={mirrored(STABILIZER, side)} depth={0.16} surface={m.shellDark} edge={m.shellEdge} position={[0, 0, -0.21]} bevel={0.025} />
      <AerospacePanel outline={mirrored(WING, side)} depth={0.19} surface={m.shell} edge={m.shellEdge} position={[0, 0, -0.19]} bevel={0.035} />
      <AerospacePanel outline={mirrored(LERX, side)} depth={0.13} surface={m.frame} edge={m.shellEdge} position={[0, 0, -0.11]} bevel={0.016} />
      <AerospacePanel outline={mirrored(WING_INSERT, side)} depth={0.022} surface={m.shellDark} edge={m.shellDark} position={[0, 0, -0.067]} bevel={0.006} />
      <AerospacePanel outline={mirrored(AILERON, side)} depth={0.018} surface={m.shellDark} edge={m.shellEdge} position={[0, 0, -0.057]} bevel={0.005} />
      {!mobile && <AerospacePanel
        outline={mirrored([[1.36, -0.22], [1.58, -0.38], [1.49, -0.52], [1.27, -0.36]], side)}
        depth={0.012} surface={flightTestMarking} edge={flightTestMarking}
        position={[0, 0, -0.078]} bevel={0.003}
      />}
      <StructuralRail from={[side * 0.99, 0.34, -0.055]} to={[side * 3.26, -1.41, -0.055]} width={0.035} depth={0.025} material={m.shellEdge} radius={0.005} />
      {!mobile && <SerialMark text={side === 1 ? 'MA / 07' : 'XF / 07'} position={[side * 1.89, -1.55, -0.043]} rotation={[0, 0, side === 1 ? -0.2 : 0.2]} />}
      <mesh position={tip}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshBasicMaterial color={side === 1 ? '#93aaa0' : '#b5564d'} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Engine({ side }: { side: number }) {
  return (
    <group position={[side * 0.39, -2.65, -0.18]}>
      <mesh material={m.heat} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.39, 1.84, 12]} />
      </mesh>
      <mesh position={[0, -0.89, 0]} material={m.frame} castShadow>
        <cylinderGeometry args={[0.37, 0.32, 0.22, 12]} />
      </mesh>
      <mesh position={[0, -1.015, 0]} material={m.cavity}>
        <cylinderGeometry args={[0.26, 0.26, 0.028, 12]} />
      </mesh>
      <mesh position={[0, -1.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshBasicMaterial color="#9fb6ac" transparent opacity={0.46} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      <StructuralRail from={[0, 0.83, 0.29]} to={[0, -0.67, 0.34]} width={0.095} depth={0.045} material={m.shellEdge} radius={0.012} />
    </group>
  );
}

export function FighterJet({ mobile, reducedMotion }: FighterJetProps) {
  const aircraft = useRef<Group>(null);
  const fuselage = useMemo(createFuselageGeometry, []);
  useEffect(() => () => fuselage.dispose(), [fuselage]);

  useFrame(({ clock }) => {
    if (!aircraft.current) return;
    const drift = reducedMotion ? 0 : clock.elapsedTime;
    aircraft.current.position.y = reducedMotion ? 0.25 : 0.25 + Math.sin(drift * 0.35) * 0.035;
  });

  return (
    <>
    <group ref={aircraft} position={[0, 0.25, 0]} rotation={[0, FIXED_AIRCRAFT_YAW, 0]} scale={mobile ? 0.7 : 0.81} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
      <Wing side={-1} mobile={mobile} />
      <Wing side={1} mobile={mobile} />
      <Engine side={-1} />
      <Engine side={1} />
      <mesh geometry={fuselage} material={[m.shell, m.shellDark]} castShadow receiveShadow />

      <AerospacePanel outline={DORSAL_PANEL} depth={0.07} surface={m.frame} edge={m.shellEdge} position={[0, 0, 0.54]} bevel={0.015} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <AerospacePanel outline={mirrored(INTAKE, side)} depth={0.055} surface={m.cavity} edge={m.frame} position={[0, 0, 0.26]} bevel={0.01} />
          <StructuralRail from={[side * 0.75, 0.19, 0.31]} to={[side * 1.02, -0.16, 0.31]} width={0.055} depth={0.055} material={m.shellEdge} radius={0.01} />
          <VerticalFin side={side} />
        </group>
      ))}

      <Canopy />
      <StructuralRail from={[0, 3.18, 0.25]} to={[0, 3.84, 0.11]} width={0.018} depth={0.018} material={m.bone} radius={0.004} />
      </group>
    </group>
    <JetSmokeTrails aircraft={aircraft} mobile={mobile} reducedMotion={reducedMotion} />
    </>
  );
}
