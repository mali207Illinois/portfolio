import {
  DataTexture,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
} from 'three';

function makeRoughnessGrain() {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 2077;

  for (let index = 0; index < size * size; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = 195 + (seed % 48);
    pixels[index * 4] = value;
    pixels[index * 4 + 1] = value;
    pixels[index * 4 + 2] = value;
    pixels[index * 4 + 3] = 255;
  }

  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 5);
  texture.needsUpdate = true;
  return texture;
}

const roughnessGrain = makeRoughnessGrain();

export const aerospaceMaterials = {
  shell: new MeshStandardMaterial({ color: '#4b5450', metalness: 0.36, roughness: 0.72, roughnessMap: roughnessGrain }),
  shellDark: new MeshStandardMaterial({ color: '#39423f', metalness: 0.42, roughness: 0.77, roughnessMap: roughnessGrain }),
  shellEdge: new MeshStandardMaterial({ color: '#69736d', metalness: 0.66, roughness: 0.48 }),
  frame: new MeshStandardMaterial({ color: '#707a74', metalness: 0.75, roughness: 0.42 }),
  innerFrame: new MeshStandardMaterial({ color: '#4b5651', metalness: 0.68, roughness: 0.5 }),
  mechanism: new MeshStandardMaterial({ color: '#939b93', metalness: 0.82, roughness: 0.34 }),
  heat: new MeshStandardMaterial({ color: '#343936', metalness: 0.38, roughness: 0.87, roughnessMap: roughnessGrain }),
  cavity: new MeshStandardMaterial({ color: '#090d0d', metalness: 0.08, roughness: 1 }),
  cable: new MeshStandardMaterial({ color: '#48504b', metalness: 0.13, roughness: 0.85 }),
  fastener: new MeshStandardMaterial({ color: '#a9aea8', metalness: 0.9, roughness: 0.3 }),
  bone: new MeshStandardMaterial({ color: '#d5d0c4', metalness: 0.12, roughness: 0.7 }),
  smokedGlass: new MeshPhysicalMaterial({
    color: '#111a1b',
    metalness: 0.22,
    roughness: 0.17,
    clearcoat: 0.85,
    clearcoatRoughness: 0.13,
    transparent: true,
    opacity: 0.91,
    depthWrite: false,
    side: 2,
  }),
};
