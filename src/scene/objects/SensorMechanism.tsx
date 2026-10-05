import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, MathUtils, MeshStandardMaterial, PointLight, Vector2, Vector3 } from 'three';
import { aerospaceMaterials as m } from './AerospaceMaterials';

interface SensorMechanismProps {
  mobile: boolean;
  reducedMotion: boolean;
}

export function SensorMechanism({ mobile, reducedMotion }: SensorMechanismProps) {
  const { camera, gl, invalidate } = useThree();
  const sensor = useRef<Group>(null);
  const lamp = useRef<PointLight>(null);
  const pointer = useRef(new Vector2(9, 9));
  const pointerPresent = useRef(false);
  const awakened = useRef(false);
  const worldPosition = useRef(new Vector3());
  const projectedPosition = useRef(new Vector3());
  const warmElement = useMemo(() => new MeshStandardMaterial({
    color: '#2a1a11',
    emissive: '#bd7945',
    emissiveIntensity: 0,
    metalness: 0.15,
    roughness: 0.7,
  }), []);

  useEffect(() => {
    if (mobile) return;
    const canvas = gl.domElement;

    const onMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      pointer.current.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        1 - ((event.clientY - bounds.top) / bounds.height) * 2,
      );
      pointerPresent.current = true;
      invalidate();
    };
    const onLeave = () => { pointerPresent.current = false; invalidate(); };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [gl, invalidate, mobile]);

  useFrame((_, delta) => {
    if (!sensor.current) return;
    sensor.current.getWorldPosition(worldPosition.current);
    projectedPosition.current.copy(worldPosition.current).project(camera);
    const dx = pointer.current.x - projectedPosition.current.x;
    const dy = pointer.current.y - projectedPosition.current.y;
    const near = !mobile && pointerPresent.current && projectedPosition.current.z < 1 && Math.hypot(dx, dy) < 0.19;

    if (near && !awakened.current) {
      awakened.current = true;
      gl.domElement.dataset.sensorAwake = 'true';
    }

    const targetYaw = near ? MathUtils.clamp(dx * 0.55 + 0.07, -0.1, 0.13) : 0;
    const targetPitch = near ? MathUtils.clamp(-dy * 0.32, -0.06, 0.06) : 0;
    const responsiveness = reducedMotion ? 100 : 1.45;
    sensor.current.rotation.y = MathUtils.damp(sensor.current.rotation.y, targetYaw, responsiveness, delta);
    sensor.current.rotation.x = MathUtils.damp(sensor.current.rotation.x, targetPitch, responsiveness, delta);

    const targetLight = awakened.current ? 0.42 : 0;
    if (lamp.current) lamp.current.intensity = MathUtils.damp(lamp.current.intensity, targetLight, reducedMotion ? 100 : 0.85, delta);
    warmElement.emissiveIntensity = MathUtils.damp(warmElement.emissiveIntensity, awakened.current ? 0.6 : 0, reducedMotion ? 100 : 0.85, delta);
  });

  return (
    <>
      <group position={[-0.84, 0.45, 0.74]}>
        <mesh material={m.frame} position={[-0.21, 0, 0]} castShadow>
          <boxGeometry args={[0.075, 0.37, 0.23]} />
        </mesh>
        <mesh material={m.frame} position={[0.21, 0, 0]} castShadow>
          <boxGeometry args={[0.075, 0.37, 0.23]} />
        </mesh>
        <group ref={sensor} name="sensor-mechanism">
          <mesh material={m.mechanism} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.25, 20]} />
          </mesh>
          <mesh material={m.cavity} position={[0, 0, 0.145]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.103, 0.103, 0.027, 20]} />
          </mesh>
          <mesh material={m.fastener} position={[0.074, -0.067, 0.162]}>
            <sphereGeometry args={[0.016, 8, 6]} />
          </mesh>
        </group>
      </group>
      <pointLight ref={lamp} color="#b87342" position={[-0.56, -0.86, 0.1]} intensity={0} distance={2.25} decay={2} />
      <mesh material={warmElement} position={[-0.57, -0.85, 0.19]}>
        <boxGeometry args={[0.12, 0.035, 0.04]} />
      </mesh>
    </>
  );
}
