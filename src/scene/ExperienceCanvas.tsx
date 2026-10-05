import { useRef } from 'react';
import type { RefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap, SRGBColorSpace } from 'three';
import { CAMERA } from '../config/experience';
import { CameraRig } from './CameraRig';
import { LightingRig } from './LightingRig';
import { FighterJet } from './objects/FighterJet';
import type { InspectionOffset } from '../interaction/useInspectionControls';
import { HeroParallax, SimulationPointerTracker } from '../interaction/useSimulationPointer';
import type { SimulationPointer } from '../interaction/useSimulationPointer';
import { SimulationEnvironment } from './simulation/SimulationEnvironment';

interface ExperienceCanvasProps {
  progress: RefObject<number>;
  mobile: boolean;
  reducedMotion: boolean;
}

export function ExperienceCanvas({ progress, mobile, reducedMotion }: ExperienceCanvasProps) {
  const camera = mobile ? CAMERA.mobile : CAMERA.desktop;
  const inspection = useRef<InspectionOffset>({ yaw: 0, elevation: 0, dragging: false });
  const pointer = useRef<SimulationPointer>({ x: 0, y: 0, present: false });

  return (
    <Canvas
      camera={{
        position: [Math.sin(camera.yaw) * camera.distance, camera.elevation, Math.cos(camera.yaw) * camera.distance],
        fov: camera.fov,
        near: 0.1,
        far: 90,
      }}
      dpr={mobile ? [1, 1.45] : [1.5, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      shadows={!mobile}
      frameloop={reducedMotion ? 'demand' : 'always'}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.37;
        gl.outputColorSpace = SRGBColorSpace;
        gl.shadowMap.type = PCFSoftShadowMap;
      }}
      fallback={<div className="canvas-fallback">3D view unavailable.</div>}
    >
      <LightingRig mobile={mobile} />
      <CameraRig progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} inspection={inspection} />
      <SimulationPointerTracker pointer={pointer} enabled={!mobile} />
      <SimulationEnvironment progress={progress} pointer={pointer} inspection={inspection} mobile={mobile} reducedMotion={reducedMotion} />
      <HeroParallax pointer={pointer} enabled={!mobile && !reducedMotion}>
        <FighterJet mobile={mobile} reducedMotion={reducedMotion} />
      </HeroParallax>
    </Canvas>
  );
}
