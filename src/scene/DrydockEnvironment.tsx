import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial } from 'three';
import { StructuralRail } from './objects/AerospaceKit';

const dockSteel = new MeshStandardMaterial({ color: '#262b29', metalness: 0.68, roughness: 0.7 });
const dockShadow = new MeshStandardMaterial({ color: '#121716', metalness: 0.45, roughness: 0.86 });
const platform = new MeshStandardMaterial({ color: '#0f1311', metalness: 0.22, roughness: 0.98 });

function DockingArm({ reducedMotion }: { reducedMotion: boolean }) {
  const arm = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (arm.current) arm.current.rotation.z = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.1) * 0.012;
  });

  return (
    <group ref={arm} position={[3.8, 1.75, -3.3]} dispose={null}>
      <mesh material={dockSteel} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.34, 18]} />
      </mesh>
      <StructuralRail from={[0, 0, 0]} to={[-1.4, -0.55, 1.15]} width={0.36} depth={0.43} material={dockSteel} radius={0.035} />
      <StructuralRail from={[-1.4, -0.55, 1.15]} to={[-1.96, -0.49, 1.9]} width={0.27} depth={0.35} material={dockShadow} radius={0.025} />
      <StructuralRail from={[-1.92, -0.67, 1.86]} to={[-2.05, -1.03, 1.88]} width={0.12} depth={0.18} material={dockSteel} radius={0.018} />
      <StructuralRail from={[-1.92, -0.29, 1.86]} to={[-2.03, 0.07, 1.88]} width={0.12} depth={0.18} material={dockSteel} radius={0.018} />
    </group>
  );
}

interface DrydockEnvironmentProps {
  mobile: boolean;
  reducedMotion: boolean;
}

export function DrydockEnvironment({ mobile, reducedMotion }: DrydockEnvironmentProps) {
  return (
    <group dispose={null}>
      <mesh material={platform} rotation={[-Math.PI / 2, 0, 0]} position={[0, -4.63, -4]} receiveShadow>
        <planeGeometry args={[26, 22]} />
      </mesh>
      <mesh material={dockSteel} position={[-0.7, -4.59, -4.4]} receiveShadow>
        <boxGeometry args={[17, 0.09, 0.13]} />
      </mesh>
      <StructuralRail from={[-4.58, -4.56, -7]} to={[-4.58, 5.1, -7]} width={0.66} depth={0.78} material={dockShadow} radius={0.045} />
      <StructuralRail from={[-4.58, 3.65, -7]} to={[3.9, 3.65, -7]} width={0.58} depth={0.7} material={dockShadow} radius={0.04} />
      <StructuralRail from={[-4.13, -2.88, -6.83]} to={[-2.97, 2.7, -6.83]} width={0.22} depth={0.35} material={dockSteel} radius={0.02} />
      {!mobile && <DockingArm reducedMotion={reducedMotion} />}
      <mesh position={[-4.2, 1.8, -6.51]}>
        <planeGeometry args={[0.055, 0.46]} />
        <meshBasicMaterial color="#7c827e" toneMapped={false} />
      </mesh>
      <pointLight color="#b4bab4" intensity={0.6} distance={7} decay={2} position={[-4.15, 1.8, -6.3]} />
    </group>
  );
}
