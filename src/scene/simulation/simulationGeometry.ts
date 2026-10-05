import {
  BufferGeometry,
  DataTexture,
  Euler,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LinearFilter,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
  WireframeGeometry,
} from 'three';

type Point3 = readonly [number, number, number];

function hash(x: number, y: number, seed: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function noise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function createTerrainGeometry(width: number, depth: number, segmentsX: number, segmentsY: number, amplitude: number, seed: number) {
  const geometry = new PlaneGeometry(width, depth, segmentsX, segmentsY);
  const positions = geometry.getAttribute('position');

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const broad = noise(x * 0.075, y * 0.075, seed);
    const detail = noise(x * 0.22, y * 0.22, seed + 11);
    const ridge = 1 - Math.abs(2 * broad - 1);
    const edge = Math.max(Math.abs(x / (width * 0.5)), Math.abs(y / (depth * 0.5)));
    const taper = Math.pow(Math.max(0, 1 - edge * edge), 1.7);
    positions.setZ(index, (ridge * 0.8 + detail * 0.2) * amplitude * taper);
  }

  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

export function createMountainTerrainGeometry(width: number, depth: number, segmentsX: number, segmentsY: number, amplitude: number, seed: number) {
  const geometry = new PlaneGeometry(width, depth, segmentsX, segmentsY);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const broad = noise(x * 0.052, y * 0.08, seed);
    const ridge = 1 - Math.abs(2 * noise(x * 0.17, y * 0.13, seed + 9) - 1);
    const detail = noise(x * 0.38, y * 0.31, seed + 23);
    const crest = Math.pow(broad, 2.3) * 0.8 + Math.pow(ridge, 3) * 0.62 + detail * 0.15;
    const depthEnvelope = Math.exp(-Math.pow(y / (depth * 0.31), 2));
    const sideEnvelope = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x / (width * 0.5)), 4)), 0.35);
    const height = amplitude * crest * depthEnvelope * sideEnvelope;
    positions.setZ(index, height);

    const light = 0.13 + Math.min(1, height / amplitude) * 0.38;
    colors.push(light * 0.76, light * 0.89, light);
  }

  positions.needsUpdate = true;
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createAtmosphereTexture(seed: number, halo = false) {
  const width = halo ? 128 : 256;
  const height = halo ? 64 : 96;
  const pixels = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const index = (y * width + x) * 4;
      const dx = (u - (halo ? 0.56 : 0.5)) / (halo ? 0.36 : 0.55);
      const dy = (v - 0.5) / (halo ? 0.34 : 0.38);
      const envelope = Math.exp(-(dx * dx + dy * dy) * (halo ? 1.4 : 1.1));
      const broad = noise(u * 5.7, v * 7.2, seed);
      const fine = noise(u * 20.5, v * 12.4, seed + 7);
      const wisps = Math.max(0, broad * 0.73 + fine * 0.27 - 0.22);
      const alpha = envelope * (halo ? 0.55 : wisps * 0.65);
      pixels[index] = halo ? 174 : 118;
      pixels[index + 1] = halo ? 190 : 134;
      pixels[index + 2] = halo ? 200 : 145;
      pixels[index + 3] = Math.round(alpha * 255);
    }
  }

  const texture = new DataTexture(pixels, width, height, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createSignalTexture() {
  const size = 48;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (x + 0.5 - size * 0.5) / (size * 0.5);
      const dy = (y + 0.5 - size * 0.5) / (size * 0.5);
      const radius = Math.sqrt(dx * dx + dy * dy);
      const halo = Math.exp(-radius * radius * 6.5) * 0.48;
      const core = Math.exp(-radius * radius * 90) * 0.52;
      const index = (y * size + x) * 4;
      pixels[index] = 255;
      pixels[index + 1] = 255;
      pixels[index + 2] = 255;
      pixels[index + 3] = Math.round(Math.min(1, halo + core) * 255);
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function createPerspectiveGridGeometry(mobile: boolean) {
  const positions: number[] = [];
  const colors: number[] = [];
  const lateral = mobile ? 12 : 21;
  const depth = mobile ? 37 : 58;
  const longitudinalStep = mobile ? 2.8 : 2.15;
  const crossStep = mobile ? 3.5 : 2.75;

  const point = (x: number, z: number): Point3 => [
    x + Math.sin(z * 0.18 + x * 0.37) * 0.085,
    -4.68 + Math.sin(x * 0.23 + z * 0.13) * 0.026,
    z,
  ];
  const add = (a: Point3, b: Point3) => {
    positions.push(...a, ...b);
    for (const [x, , z] of [a, b]) {
      const distanceFade = Math.pow(Math.max(0, 1 - Math.max(0, -z) / (depth + 4)), 1.65);
      const lateralFade = Math.max(0.22, 1 - Math.abs(x) / (lateral * 1.35));
      const glint = (Math.floor(Math.abs(x) * 9 + Math.abs(z) * 5) % 43 === 0) ? 2.2 : 1;
      const value = Math.min(0.47, 0.23 * distanceFade * lateralFade * glint);
      colors.push(value * 0.78, value * 0.9, value);
    }
  };

  for (let x = -lateral; x <= lateral; x += longitudinalStep) {
    for (let z = 4; z > -depth; z -= 1.25) add(point(x, z), point(x, Math.max(-depth, z - 1.25)));
  }
  for (let z = 3; z > -depth; z -= crossStep) {
    for (let x = -lateral; x < lateral; x += 1.25) add(point(x, z), point(Math.min(lateral, x + 1.25), z));
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geometry;
}

export function createReferenceSphereGeometry(radius: number, mobile: boolean) {
  const positions: number[] = [];
  const segments = mobile ? 34 : 64;
  const latitudes = mobile ? [-0.48, 0, 0.48] : [-0.84, -0.47, 0, 0.47, 0.84];
  const meridians = mobile ? 5 : 9;
  const push = (a: Vector3, b: Vector3) => positions.push(a.x, a.y, a.z, b.x, b.y, b.z);

  for (const latitude of latitudes) {
    for (let index = 0; index < segments; index += 1) {
      const a = index / segments * Math.PI * 2;
      const b = (index + 1) / segments * Math.PI * 2;
      push(
        new Vector3(radius * Math.cos(latitude) * Math.cos(a), radius * Math.sin(latitude), radius * Math.cos(latitude) * Math.sin(a)),
        new Vector3(radius * Math.cos(latitude) * Math.cos(b), radius * Math.sin(latitude), radius * Math.cos(latitude) * Math.sin(b)),
      );
    }
  }

  for (let meridian = 0; meridian < meridians; meridian += 1) {
    const angle = meridian / meridians * Math.PI * 2;
    for (let index = 0; index < segments; index += 1) {
      const a = -Math.PI / 2 + index / segments * Math.PI;
      const b = -Math.PI / 2 + (index + 1) / segments * Math.PI;
      push(
        new Vector3(radius * Math.cos(a) * Math.cos(angle), radius * Math.sin(a), radius * Math.cos(a) * Math.sin(angle)),
        new Vector3(radius * Math.cos(b) * Math.cos(angle), radius * Math.sin(b), radius * Math.cos(b) * Math.sin(angle)),
      );
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}

export function createGeodesicSphereGeometry(radius: number, mobile: boolean) {
  const source = new IcosahedronGeometry(radius, mobile ? 1 : 2);
  const wireframe = new WireframeGeometry(source);
  source.dispose();
  return wireframe;
}

export interface OrbitArcSpec {
  center: Point3;
  radii: readonly [number, number];
  start: number;
  end: number;
  tilt: Point3;
}

export function createOrbitArcGeometry(spec: OrbitArcSpec) {
  const positions: number[] = [];
  const rotation = new Euler(...spec.tilt);
  const segments = 90;
  const sample = (fraction: number) => {
    const angle = spec.start + (spec.end - spec.start) * fraction;
    return new Vector3(
      Math.cos(angle) * spec.radii[0],
      Math.sin(angle) * spec.radii[1],
      Math.sin(angle * 1.3) * 0.7,
    ).applyEuler(rotation).add(new Vector3(...spec.center));
  };

  for (let index = 0; index < segments; index += 1) {
    const a = sample(index / segments);
    const b = sample((index + 1) / segments);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  return geometry;
}
