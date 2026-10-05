import { useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils } from 'three';
import type { InspectionOffset } from '../../interaction/useInspectionControls';
import type { SimulationPointer } from '../../interaction/useSimulationPointer';
import {
  AtmosphericLayer,
  OrbitLines,
  OrbitalSphereA,
  OrbitalSphereB,
  PerspectiveGrid,
  StarLayer,
  TerrainFar,
  TerrainNear,
} from './SimulationLayers';
import { DataNetwork } from './DataNetwork';
import { FlightParticles } from './FlightParticles';
import { SignalMarkers } from './SignalMarkers';

export interface SimulationLayerProps {
  progress: RefObject<number>;
  pointer: RefObject<SimulationPointer>;
  mobile: boolean;
  reducedMotion: boolean;
}

interface SimulationEnvironmentProps extends SimulationLayerProps {
  inspection: RefObject<InspectionOffset>;
}

export function SimulationEnvironment({ progress, pointer, inspection, mobile, reducedMotion }: SimulationEnvironmentProps) {
  const environment = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!environment.current) return;
    const inspectShift = mobile || reducedMotion ? 0 : -inspection.current.yaw * 0.17;
    const pointerShift = mobile || reducedMotion || !pointer.current.present ? 0 : -pointer.current.x * 0.006;
    environment.current.rotation.y = MathUtils.damp(environment.current.rotation.y, inspectShift + pointerShift, 2.2, delta);
  });

  return (
    <>
      <AtmosphericLayer progress={progress} reducedMotion={reducedMotion} mobile={mobile} />
      <group ref={environment}>
        <PerspectiveGrid progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <TerrainNear progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <TerrainFar progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <OrbitalSphereA progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        {!mobile && <OrbitalSphereB progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />}
        <OrbitLines progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <DataNetwork progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <SignalMarkers progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <FlightParticles progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
        <StarLayer progress={progress} pointer={pointer} mobile={mobile} reducedMotion={reducedMotion} />
      </group>
    </>
  );
}
