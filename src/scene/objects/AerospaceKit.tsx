import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  CatmullRomCurve3,
  CanvasTexture,
  CylinderGeometry,
  ExtrudeGeometry,
  InstancedMesh,
  Material,
  Object3D,
  Quaternion,
  Shape,
  SRGBColorSpace,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

export type Point2 = readonly [number, number];
export type Point3 = readonly [number, number, number];

const UP = new Vector3(0, 1, 0);
const FASTENER_GEOMETRY = new CylinderGeometry(0.037, 0.047, 0.018, 14);
const JOINT_GEOMETRY = new SphereGeometry(1, 12, 8);

export function createAerospacePanel(outline: readonly Point2[], depth: number, bevel = 0.035) {
  const shape = new Shape();
  shape.moveTo(...outline[0]);
  outline.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();

  const geometry = new ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    curveSegments: 1,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

interface AerospacePanelProps {
  outline: readonly Point2[];
  depth: number;
  surface: Material;
  edge: Material;
  position?: Point3;
  rotation?: Point3;
  bevel?: number;
}

export function AerospacePanel({ outline, depth, surface, edge, position = [0, 0, 0], rotation = [0, 0, 0], bevel = 0.035 }: AerospacePanelProps) {
  const geometry = useMemo(() => createAerospacePanel(outline, depth, bevel), [outline, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={[surface, edge]} position={position} rotation={rotation} castShadow receiveShadow />;
}

function insetOutline(outline: readonly Point2[], fraction: number): Point2[] {
  const centerX = outline.reduce((sum, point) => sum + point[0], 0) / outline.length;
  const centerY = outline.reduce((sum, point) => sum + point[1], 0) / outline.length;
  return outline.map(([x, y]) => [x + (centerX - x) * fraction, y + (centerY - y) * fraction]);
}

interface MaintenancePanelProps {
  outline: readonly Point2[];
  position: Point3;
  gasket: Material;
  cover: Material;
  fastener: Material;
}

export function MaintenancePanel({ outline, position, gasket, cover, fastener }: MaintenancePanelProps) {
  const inset = useMemo(() => insetOutline(outline, 0.09), [outline]);
  const bolts = useMemo<Point3[]>(() => inset.map(([x, y]) => [x, y, 0.067]), [inset]);

  return (
    <group position={position}>
      <AerospacePanel outline={outline} depth={0.025} surface={gasket} edge={gasket} bevel={0.008} />
      <AerospacePanel outline={inset} depth={0.025} surface={cover} edge={cover} position={[0, 0, 0.039]} bevel={0.009} />
      <FastenerRow points={bolts} material={fastener} />
    </group>
  );
}

function railTransform(from: Point3, to: Point3) {
  const start = new Vector3(...from);
  const end = new Vector3(...to);
  const direction = end.clone().sub(start);
  return {
    center: start.add(end).multiplyScalar(0.5),
    length: direction.length(),
    quaternion: new Quaternion().setFromUnitVectors(UP, direction.normalize()),
  };
}

interface StructuralRailProps {
  from: Point3;
  to: Point3;
  width: number;
  depth: number;
  material: Material;
  radius?: number;
}

export function StructuralRail({ from, to, width, depth, material, radius = 0.025 }: StructuralRailProps) {
  const { center, length, quaternion } = useMemo(() => railTransform(from, to), [from, to]);
  return (
    <group position={center} quaternion={quaternion}>
      <RoundedBox args={[width, length, depth]} radius={radius} smoothness={2} material={material} castShadow receiveShadow />
    </group>
  );
}

interface FastenerRowProps {
  points: readonly Point3[];
  material: Material;
}

export function FastenerRow({ points, material }: FastenerRowProps) {
  const instances = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const dummy = new Object3D();
    dummy.rotation.x = Math.PI / 2;
    points.forEach((point, index) => {
      dummy.position.set(...point);
      dummy.updateMatrix();
      instances.current?.setMatrixAt(index, dummy.matrix);
    });
    if (instances.current) instances.current.instanceMatrix.needsUpdate = true;
  }, [points]);

  return <instancedMesh ref={instances} args={[FASTENER_GEOMETRY, material, points.length]} />;
}

interface VentAssemblyProps {
  position: Point3;
  rotation?: number;
  frame: Material;
  cavity: Material;
  slat: Material;
}

const VENT_OUTER: Point2[] = [[-0.29, 0.41], [0.18, 0.34], [0.3, -0.39], [-0.22, -0.46]];
const VENT_INNER: Point2[] = [[-0.21, 0.33], [0.12, 0.28], [0.21, -0.32], [-0.15, -0.37]];

export function VentAssembly({ position, rotation = 0, frame, cavity, slat }: VentAssemblyProps) {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <AerospacePanel outline={VENT_OUTER} depth={0.075} surface={frame} edge={frame} bevel={0.012} />
      <AerospacePanel outline={VENT_INNER} depth={0.02} surface={cavity} edge={cavity} position={[0, 0, 0.053]} bevel={0.005} />
      {[-0.22, -0.08, 0.06, 0.2].map((y) => (
        <StructuralRail key={y} from={[-0.15, y + 0.045, 0.089]} to={[0.16, y - 0.02, 0.089]} width={0.038} depth={0.038} material={slat} radius={0.008} />
      ))}
    </group>
  );
}

interface ActuatorProps {
  from: Point3;
  to: Point3;
  sleeve: Material;
  rod: Material;
}

export function Actuator({ from, to, sleeve, rod }: ActuatorProps) {
  const { center, length, quaternion } = useMemo(() => railTransform(from, to), [from, to]);
  return (
    <group position={center} quaternion={quaternion}>
      <mesh position={[0, -length * 0.18, 0]} material={sleeve} castShadow>
        <cylinderGeometry args={[0.105, 0.12, length * 0.62, 14]} />
      </mesh>
      <mesh position={[0, length * 0.19, 0]} material={rod} castShadow>
        <cylinderGeometry args={[0.055, 0.055, length * 0.63, 14]} />
      </mesh>
      <mesh geometry={JOINT_GEOMETRY} material={rod} scale={[0.12, 0.12, 0.12]} position={[0, -length / 2, 0]} />
      <mesh geometry={JOINT_GEOMETRY} material={rod} scale={[0.12, 0.12, 0.12]} position={[0, length / 2, 0]} />
    </group>
  );
}

interface CableBundleProps {
  paths: readonly (readonly Point3[])[];
  material: Material;
}

export function CableBundle({ paths, material }: CableBundleProps) {
  const geometries = useMemo(() => paths.map((path) => new TubeGeometry(
    new CatmullRomCurve3(path.map((point) => new Vector3(...point))),
    24,
    0.025,
    6,
    false,
  )), [paths]);

  useEffect(() => () => geometries.forEach((geometry) => geometry.dispose()), [geometries]);

  return <>{geometries.map((geometry, index) => <mesh key={index} geometry={geometry} material={material} />)}</>;
}

interface SerialMarkProps {
  text: string;
  position: Point3;
  rotation?: Point3;
}

export function SerialMark({ text, position, rotation = [0, 0, 0] }: SerialMarkProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#d5d0c4';
      context.font = '500 48px monospace';
      context.textBaseline = 'middle';
      context.fillText(text, 12, 64);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [text]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[0.6, 0.15]} />
      <meshBasicMaterial map={texture} transparent opacity={0.62} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
