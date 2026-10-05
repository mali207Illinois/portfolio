import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  MathUtils,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import type { SimulationLayerProps } from './SimulationEnvironment';
import { createSignalTexture } from './simulationGeometry';
import { simulationFade } from './simulationTimeline';

type Point3 = readonly [number, number, number];

interface NodeSpec {
  position: Point3;
  red?: boolean;
}

// Four deliberately placed constellations; these are not a particle field.
const NODES: readonly NodeSpec[] = [
  { position: [-7.3, 2.8, -8] }, { position: [-6.1, 3.4, -9.2] }, { position: [-5.7, 1.7, -7.4], red: true },
  { position: [-4.6, 2.6, -8.8] }, { position: [-6.8, 0.7, -9.1] }, { position: [-4.9, 0.9, -7.2] },
  { position: [5.0, 3.1, -8.4] }, { position: [6.2, 3.7, -10] }, { position: [7.0, 2.3, -9.1] },
  { position: [4.8, 1.4, -7.6], red: true }, { position: [6.6, 0.9, -8.8] }, { position: [7.8, 1.2, -10.1] },
  { position: [-6.4, -2.6, -7.5] }, { position: [-5.1, -1.7, -8.4] }, { position: [-4.3, -3.1, -9.2] },
  { position: [-3.2, -2.1, -7.7], red: true }, { position: [-5.7, -3.6, -10.2] }, { position: [-2.7, -3.2, -8.8] },
  { position: [4.6, -1.6, -7.4] }, { position: [5.9, -2.3, -8.1] }, { position: [7.1, -1.4, -9.5], red: true },
  { position: [4.1, -3.3, -8.8] }, { position: [6.0, -3.6, -10.2] }, { position: [7.7, -2.8, -8.7] },
];

const EDGES: readonly (readonly [number, number])[] = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 3], [2, 5], [3, 5], [4, 5],
  [6, 7], [6, 9], [7, 8], [7, 10], [8, 10], [8, 11], [9, 10], [10, 11],
  [12, 13], [12, 16], [13, 14], [13, 15], [14, 15], [14, 17], [15, 17], [16, 17],
  [18, 19], [18, 21], [19, 20], [19, 22], [20, 23], [21, 22], [21, 23], [22, 23],
];

const DESKTOP_NODE_INDICES = NODES.map((_, index) => index);
const MOBILE_NODE_INDICES = [0, 1, 3, 4, 6, 7, 8, 9, 12, 13, 15, 18];
const MOBILE_EDGES = EDGES.filter(([a, b]) => MOBILE_NODE_INDICES.includes(a) && MOBILE_NODE_INDICES.includes(b));
const RED_NODE_INDICES = NODES.flatMap((node, index) => node.red ? [index] : []);
const MOBILE_RED_NODE_INDICES = RED_NODE_INDICES.filter((index) => MOBILE_NODE_INDICES.includes(index));

const NEIGHBORS = NODES.map((_, index) => EDGES.flatMap(([a, b]) => a === index ? [b] : b === index ? [a] : []));
const GRAY = new Color('#9aa39e');
const RED = new Color('#e96b67');
const tempWorld = new Vector3();

interface NetworkState {
  positions: Float32Array;
  strengths: Float32Array;
  hovered: number;
}

function makeNetworkState(): NetworkState {
  return {
    positions: new Float32Array(NODES.flatMap((node) => node.position)),
    strengths: new Float32Array(NODES.length),
    hovered: -1,
  };
}

function DataNodes({ network, mobile, progress, pointer, reducedMotion }: SimulationLayerProps & { network: NetworkState }) {
  const points = useRef<Points>(null);
  const indices = mobile ? MOBILE_NODE_INDICES : DESKTOP_NODE_INDICES;
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(indices.flatMap((index) => NODES[index].position), 3).setUsage(DynamicDrawUsage));
    result.setAttribute('color', new Float32BufferAttribute(new Float32Array(indices.length * 3), 3).setUsage(DynamicDrawUsage));
    return result;
  }, [indices]);
  const material = useMemo(() => new PointsMaterial({ size: mobile ? 2.3 : 3.1, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.51, depthWrite: false, fog: false, toneMapped: false }), [mobile]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(({ camera }, delta) => {
    if (!points.current) return;
    const travel = reducedMotion ? 0 : progress.current;
    const separation = Math.min(travel / 0.55, 1) * 0.45;
    const positionAttribute = geometry.getAttribute('position');
    const colorAttribute = geometry.getAttribute('color');
    points.current.updateWorldMatrix(true, false);
    let nearest = -1;
    let nearestDistance = 0.075;

    indices.forEach((nodeIndex, visibleIndex) => {
      const source = NODES[nodeIndex].position;
      const multiplier = (nodeIndex % 3 + 1) / 3;
      const x = source[0] + Math.sign(source[0]) * separation * multiplier;
      const y = source[1] + Math.sign(source[1]) * separation * 0.24 * multiplier;
      const z = source[2] - separation * (nodeIndex % 4) * 0.22;
      network.positions[nodeIndex * 3] = x;
      network.positions[nodeIndex * 3 + 1] = y;
      network.positions[nodeIndex * 3 + 2] = z;
      positionAttribute.setXYZ(visibleIndex, x, y, z);

      if (pointer.current.present && !mobile) {
        tempWorld.set(x, y, z).applyMatrix4(points.current!.matrixWorld).project(camera);
        const dx = tempWorld.x - pointer.current.x;
        const dy = tempWorld.y - pointer.current.y;
        const distance = Math.hypot(dx, dy);
        if (tempWorld.z < 1 && distance < nearestDistance) {
          nearest = nodeIndex;
          nearestDistance = distance;
        }
      }
    });

    network.hovered = nearest;
    for (let index = 0; index < NODES.length; index += 1) {
      const related = nearest >= 0 && NEIGHBORS[nearest].includes(index);
      const target = index === nearest ? 1 : related ? 0.22 : 0;
      network.strengths[index] = MathUtils.damp(network.strengths[index], target, reducedMotion ? 100 : 4.2, delta);
    }

    indices.forEach((nodeIndex, visibleIndex) => {
      const color = NODES[nodeIndex].red ? RED : GRAY;
      const gain = 0.63 + network.strengths[nodeIndex] * 0.78;
      colorAttribute.setXYZ(visibleIndex, color.r * gain, color.g * gain, color.b * gain);
    });
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    material.opacity = 0.51 * simulationFade(travel);
  });

  return <points ref={points} geometry={geometry} material={material} />;
}

function ConnectionLines({ network, mobile, progress, reducedMotion }: SimulationLayerProps & { network: NetworkState }) {
  const edges = mobile ? MOBILE_EDGES : EDGES;
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(new Float32Array(edges.length * 6), 3).setUsage(DynamicDrawUsage));
    result.setAttribute('color', new Float32BufferAttribute(new Float32Array(edges.length * 6), 3).setUsage(DynamicDrawUsage));
    return result;
  }, [edges]);
  const material = useMemo(() => new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false, toneMapped: false }), []);

  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame(() => {
    const positions = geometry.getAttribute('position');
    const colors = geometry.getAttribute('color');
    const travel = reducedMotion ? 0 : progress.current;

    edges.forEach(([a, b], index) => {
      positions.setXYZ(index * 2, network.positions[a * 3], network.positions[a * 3 + 1], network.positions[a * 3 + 2]);
      positions.setXYZ(index * 2 + 1, network.positions[b * 3], network.positions[b * 3 + 1], network.positions[b * 3 + 2]);
      const response = Math.max(network.strengths[a], network.strengths[b]);
      const brightness = 0.006 + response * 0.3;
      colors.setXYZ(index * 2, brightness * 0.89, brightness, brightness * 0.94);
      colors.setXYZ(index * 2 + 1, brightness * 0.89, brightness, brightness * 0.94);
    });
    positions.needsUpdate = true;
    colors.needsUpdate = true;
    material.opacity = 0.9 * simulationFade(travel);
  });

  return <lineSegments geometry={geometry} material={material} />;
}

function SignalHalos({ network, mobile, progress, reducedMotion }: SimulationLayerProps & { network: NetworkState }) {
  const indices = mobile ? MOBILE_RED_NODE_INDICES : RED_NODE_INDICES;
  const texture = useMemo(createSignalTexture, []);
  const geometry = useMemo(() => {
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(new Float32Array(indices.length * 3), 3).setUsage(DynamicDrawUsage));
    return result;
  }, [indices]);
  const material = useMemo(() => new PointsMaterial({ color: '#ee454b', map: texture, size: mobile ? 15 : 23, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false, fog: false, toneMapped: false }), [mobile, texture]);

  useEffect(() => () => { geometry.dispose(); material.dispose(); texture.dispose(); }, [geometry, material, texture]);
  useFrame(() => {
    const positions = geometry.getAttribute('position');
    indices.forEach((index, visibleIndex) => {
      positions.setXYZ(visibleIndex, network.positions[index * 3], network.positions[index * 3 + 1], network.positions[index * 3 + 2]);
    });
    positions.needsUpdate = true;
    material.opacity = 0.85 * simulationFade(reducedMotion ? 0 : progress.current);
  });

  return <points geometry={geometry} material={material} renderOrder={-1} />;
}

export function DataNetwork(props: SimulationLayerProps) {
  const root = useRef<Group>(null);
  const network = useMemo(makeNetworkState, []);

  useFrame((_, delta) => {
    if (!root.current) return;
    const travel = props.reducedMotion ? 0 : props.progress.current;
    const pointerX = props.mobile || props.reducedMotion || !props.pointer.current.present ? 0 : props.pointer.current.x;
    root.current.position.x = MathUtils.damp(root.current.position.x, -pointerX * 0.12, 1.8, delta);
    root.current.position.z = MathUtils.damp(root.current.position.z, -Math.min(travel / 0.55, 1) * 0.8, 1.4, delta);
  });

  return (
    <group ref={root}>
      <DataNodes network={network} {...props} />
      <SignalHalos network={network} {...props} />
      <ConnectionLines network={network} {...props} />
    </group>
  );
}
