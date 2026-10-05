import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { aerospaceMaterials as m } from './AerospaceMaterials';
import {
  Actuator,
  AerospacePanel,
  CableBundle,
  FastenerRow,
  MaintenancePanel,
  SerialMark,
  StructuralRail,
  VentAssembly,
} from './AerospaceKit';
import type { Point2, Point3 } from './AerospaceKit';
import { SensorMechanism } from './SensorMechanism';

// Seven large masses establish the silhouette. The service bay stays open
// between the port armor and the swept starboard shell.
const SPINE: Point2[] = [
  [-0.55, -2.4], [-0.7, -1.22], [-0.56, 0.66], [-0.74, 2.3],
  [-0.43, 3.58], [0.02, 3.73], [0.24, 2.55], [0.43, 0.66],
  [0.35, -1.78], [0.03, -3.25], [-0.25, -3.38],
];
const STARBOARD_SHELL: Point2[] = [
  [0.23, 2.18], [0.96, 2.36], [2.45, 1.62], [2.16, 0.52],
  [1.86, -1.13], [1.1, -2.24], [0.37, -1.7], [0.59, 0.1],
];
const PORT_SHOULDER: Point2[] = [
  [-0.67, 2.36], [-1.72, 2.93], [-2.26, 2.24], [-1.98, 1.18],
  [-1.17, 0.86], [-0.55, 1.45],
];
const PORT_ARMOR: Point2[] = [
  [-1.61, 0.28], [-1.1, -0.08], [-1.12, -1.56], [-1.63, -2.62],
  [-2.15, -1.74], [-2.04, -0.41],
];
const LOWER_ASSEMBLY: Point2[] = [
  [-0.12, -1.83], [0.65, -2.03], [0.89, -2.66], [0.38, -3.77],
  [-0.02, -3.95], [-0.45, -3.09],
];
const AFT_FIN: Point2[] = [
  [0.14, 2.33], [1.12, 3.13], [1.62, 2.68], [0.72, 1.93],
];
const HEAT_SHROUD: Point2[] = [
  [1.43, -0.64], [2.13, -0.46], [2.34, -1.44], [1.87, -2.4],
  [1.07, -2.09],
];
const AFT_SERVICE_FAIRING: Point2[] = [
  [-1.24, 2.22], [-1.75, 1.42], [-1.53, 0.22], [-1.02, -0.18],
  [-1.38, -1.34], [-1.08, -2.68], [-0.29, -3.17], [0.02, -1.83],
  [-0.12, 0.88], [-0.64, 1.96],
];

const SERVICE_WELL: Point2[] = [
  [-1.29, -1.87], [-0.3, -2.03], [0.08, 1.28], [-1.21, 1.72],
];
const SERVICE_INSET: Point2[] = [
  [-1.12, -1.55], [-0.45, -1.72], [-0.24, 1.04], [-1.03, 1.3],
];
const CANOPY: Point2[] = [
  [0.83, 1.71], [1.2, 1.82], [1.75, 1.44], [1.59, 0.92],
  [1.2, 0.72], [0.87, 1.02],
];
const CANOPY_RECESS: Point2[] = [
  [0.76, 1.77], [1.21, 1.91], [1.84, 1.48], [1.67, 0.84],
  [1.18, 0.64], [0.78, 0.97],
];
const ACCESS_HATCH: Point2[] = [
  [0.58, -0.86], [1.05, -0.79], [1.32, -1.34], [1.03, -1.78],
  [0.52, -1.61],
];

const FASTENERS: Point3[] = [
  [0.77, 2.09, 0.9], [1.27, 2.12, 0.9], [2.16, 1.52, 0.9],
  [2.08, 0.57, 0.9], [1.76, -1.09, 0.9], [1.19, -2.06, 0.9],
  [-1.89, 2.22, -0.07], [-1.68, 1.29, -0.07], [-1.82, -1.49, 0.6],
  [-1.55, -2.3, 0.6], [0.61, -1.54, 1.09], [1.01, -1.67, 1.09],
];

const CABLES: Point3[][] = [
  [[-0.94, 1.11, 0.21], [-0.92, 0.67, 0.53], [-1.13, -0.1, 0.48], [-0.94, -1.28, 0.38]],
  [[-0.86, 1.08, 0.17], [-0.72, 0.58, 0.43], [-0.98, -0.26, 0.44], [-0.77, -1.35, 0.34]],
  [[-0.78, 1.02, 0.12], [-0.61, 0.4, 0.38], [-0.83, -0.45, 0.42], [-0.59, -1.48, 0.34]],
];

interface MechanicalObjectProps {
  mobile: boolean;
  reducedMotion: boolean;
}

function InternalCollar({ mobile, reducedMotion }: MechanicalObjectProps) {
  const collar = useRef<Group>(null);
  const tension = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    if (collar.current && !mobile && !reducedMotion) collar.current.rotation.z += Math.min(delta, 0.05) * 0.014;
    if (tension.current) tension.current.position.y = mobile || reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.3) * 0.017;
  });

  return (
    <>
      <group ref={collar} position={[-0.7, -0.43, 0.47]}>
        <mesh material={m.innerFrame} position={[0, 0, -0.39]} castShadow>
          <torusGeometry args={[0.28, 0.052, 10, 36]} />
        </mesh>
        <mesh material={m.innerFrame} castShadow>
          <torusGeometry args={[0.34, 0.065, 10, 36]} />
        </mesh>
        {[0, 2.1, 4.2].map((angle) => (
          <StructuralRail
            key={`depth-${angle}`}
            from={[Math.cos(angle) * 0.29, Math.sin(angle) * 0.29, -0.39]}
            to={[Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0]}
            width={0.045}
            depth={0.045}
            material={m.mechanism}
            radius={0.01}
          />
        ))}
        {[0, 2.1, 4.2].map((angle) => (
          <mesh key={angle} material={m.fastener} rotation={[0, 0, angle]} position={[Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0.02]}>
            <boxGeometry args={[0.11, 0.065, 0.085]} />
          </mesh>
        ))}
      </group>
      <group ref={tension}>
        <Actuator from={[-1.03, -1.67, 0.46]} to={[-0.42, -0.24, 0.48]} sleeve={m.heat} rod={m.mechanism} />
      </group>
    </>
  );
}

export function MechanicalObject({ mobile, reducedMotion }: MechanicalObjectProps) {
  return (
    <group position={[0.44, -0.03, 0]} scale={0.82} dispose={null}>
      <AerospacePanel outline={SPINE} depth={0.57} surface={m.frame} edge={m.shellEdge} position={[0, 0, -0.47]} bevel={0.06} />
      <AerospacePanel outline={AFT_SERVICE_FAIRING} depth={0.66} surface={m.shellDark} edge={m.frame} position={[0, 0, -1.32]} rotation={[0, 0.16, 0]} bevel={0.065} />
      <AerospacePanel outline={AFT_FIN} depth={0.42} surface={m.heat} edge={m.innerFrame} position={[0, 0, -0.82]} rotation={[0, -0.17, 0]} bevel={0.05} />
      <AerospacePanel outline={PORT_SHOULDER} depth={0.5} surface={m.shellDark} edge={m.shellEdge} position={[0, 0, -0.39]} rotation={[0, 0.16, 0]} bevel={0.065} />
      <AerospacePanel outline={LOWER_ASSEMBLY} depth={0.6} surface={m.frame} edge={m.heat} position={[0, 0, -0.18]} rotation={[0, -0.08, 0]} bevel={0.055} />

      <AerospacePanel outline={SERVICE_WELL} depth={0.22} surface={m.heat} edge={m.innerFrame} position={[0, 0, -0.03]} />
      <AerospacePanel outline={SERVICE_INSET} depth={0.07} surface={m.cavity} edge={m.heat} position={[0, 0, 0.015]} bevel={0.015} />
      <StructuralRail from={[-1.18, 1.19, 0.48]} to={[-1.36, 1.03, -1.17]} width={0.09} depth={0.09} material={m.innerFrame} radius={0.014} />
      <StructuralRail from={[-0.36, 0.96, 0.46]} to={[-0.43, 0.85, -1.17]} width={0.075} depth={0.08} material={m.mechanism} radius={0.012} />
      <StructuralRail from={[-1.15, -1.57, 0.42]} to={[-1.31, -1.82, -1.09]} width={0.075} depth={0.1} material={m.innerFrame} radius={0.012} />
      <StructuralRail from={[-1.23, -1.73, 0.32]} to={[-1.11, 1.24, 0.39]} width={0.105} depth={0.12} material={m.frame} />
      <StructuralRail from={[-0.38, -1.75, 0.28]} to={[-0.31, 1.06, 0.35]} width={0.095} depth={0.12} material={m.innerFrame} />
      <StructuralRail from={[-1.2, 0.86, 0.22]} to={[-0.31, 0.66, 0.22]} width={0.1} depth={0.12} material={m.frame} />
      <StructuralRail from={[-1.26, -1.15, 0.18]} to={[-0.33, -1.32, 0.18]} width={0.085} depth={0.12} material={m.innerFrame} />
      <CableBundle paths={CABLES} material={m.cable} />
      <InternalCollar mobile={mobile} reducedMotion={reducedMotion} />
      <Actuator from={[-0.36, 0.69, 0.39]} to={[-0.63, 1.55, -0.02]} sleeve={m.innerFrame} rod={m.mechanism} />
      <Actuator from={[-1.34, -0.94, -1.12]} to={[-1.5, 1.26, -1.01]} sleeve={m.heat} rod={m.mechanism} />
      <SensorMechanism mobile={mobile} reducedMotion={reducedMotion} />

      <AerospacePanel outline={PORT_ARMOR} depth={0.38} surface={m.shellDark} edge={m.frame} position={[0, 0, 0.32]} rotation={[0, 0.09, 0]} bevel={0.05} />
      <AerospacePanel outline={STARBOARD_SHELL} depth={0.52} surface={m.shell} edge={m.shellEdge} position={[0, 0, 0.52]} rotation={[0, -0.08, 0]} bevel={0.07} />
      <AerospacePanel outline={HEAT_SHROUD} depth={0.37} surface={m.heat} edge={m.frame} position={[0, 0, 0.02]} rotation={[0, -0.11, 0]} bevel={0.045} />
      <AerospacePanel outline={CANOPY_RECESS} depth={0.055} surface={m.cavity} edge={m.frame} position={[0, 0, 1.02]} bevel={0.025} />
      <AerospacePanel outline={CANOPY} depth={0.045} surface={m.smokedGlass} edge={m.smokedGlass} position={[0, 0, 1.09]} bevel={0.024} />
      <MaintenancePanel outline={ACCESS_HATCH} position={[0, 0, 1.03]} gasket={m.cavity} cover={m.shellDark} fastener={m.fastener} />
      <VentAssembly position={[1.63, -0.37, 1.04]} rotation={-0.13} frame={m.frame} cavity={m.cavity} slat={m.innerFrame} />
      <StructuralRail from={[0.77, 2.12, 0.93]} to={[0.59, 0.14, 0.93]} width={0.02} depth={0.015} material={m.innerFrame} radius={0.005} />
      <StructuralRail from={[0.58, 0.13, 0.93]} to={[1.21, -0.28, 0.93]} width={0.02} depth={0.015} material={m.innerFrame} radius={0.005} />
      <StructuralRail from={[2.08, 1.36, 0.9]} to={[1.88, -0.13, 0.9]} width={0.045} depth={0.04} material={m.shellEdge} radius={0.01} />
      <FastenerRow points={mobile ? FASTENERS.filter((_, index) => index % 2 === 0) : FASTENERS} material={m.fastener} />
      <SerialMark text="MA / 07" position={[1.29, -1.69, 1.04]} rotation={[0, 0, -0.08]} />

      <mesh position={[-1.46, 1.98, -0.08]} material={m.bone} rotation={[0, 0, -0.19]}>
        <boxGeometry args={[0.24, 0.027, 0.01]} />
      </mesh>
      <mesh position={[-1.44, 1.9, -0.08]} material={m.bone} rotation={[0, 0, -0.19]}>
        <boxGeometry args={[0.13, 0.021, 0.01]} />
      </mesh>
    </group>
  );
}
