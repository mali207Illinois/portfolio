interface LightingRigProps {
  mobile: boolean;
}

export function LightingRig({ mobile }: LightingRigProps) {
  return (
    <>
      <ambientLight color="#aab5b1" intensity={0.15} />
      <directionalLight
        color="#d9dfda"
        intensity={3.85}
        position={[1.8, 7.2, 6.3]}
        castShadow={!mobile}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0002}
        shadow-normalBias={0.018}
      />
      <directionalLight color="#9aa9a7" intensity={1.5} position={[5.4, 1.7, -5.2]} />
      <directionalLight color="#6c7774" intensity={0.3} position={[-5, -1.3, 1.8]} />
      <spotLight color="#c9d1c9" intensity={17} angle={0.38} penumbra={0.08} position={[-3.1, 3.4, 4.8]} distance={13} />
    </>
  );
}
