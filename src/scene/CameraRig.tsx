import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector3 } from 'three';
import { CAMERA, EXTERIOR_CAMERA_TRAVEL } from '../config/experience';
import { useInspectionControls } from '../interaction/useInspectionControls';
import type { InspectionOffset } from '../interaction/useInspectionControls';

interface CameraRigProps {
  progress: RefObject<number>;
  mobile: boolean;
  reducedMotion: boolean;
  inspection: RefObject<InspectionOffset>;
}

export function CameraRig({ progress, mobile, reducedMotion, inspection }: CameraRigProps) {
  const { camera, gl, invalidate } = useThree();
  useInspectionControls(gl.domElement, !mobile, invalidate, inspection);
  const destination = useRef(new Vector3());

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    camera.fov = mobile ? CAMERA.mobile.fov : CAMERA.desktop.fov;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, mobile]);

  useFrame(({ clock }, delta) => {
    const settings = mobile ? CAMERA.mobile : CAMERA.desktop;
    const travel = reducedMotion ? 0 : progress.current;
    const cameraOrbit = reducedMotion ? 0 : Math.sin(clock.elapsedTime * 0.2) * 0.18;
    const yaw = settings.yaw + inspection.current.yaw + cameraOrbit;
    const distance = settings.distance + travel * EXTERIOR_CAMERA_TRAVEL.distance;
    const elevation = settings.elevation + inspection.current.elevation + travel * EXTERIOR_CAMERA_TRAVEL.elevation;

    destination.current.set(Math.sin(yaw) * distance, elevation, Math.cos(yaw) * distance);
    camera.position.lerp(destination.current, reducedMotion ? 1 : 1 - Math.exp(-3.6 * delta));
    camera.lookAt(0, -0.08, 0);
  });

  return null;
}
