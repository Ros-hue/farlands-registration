"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";

type Position = [number, number, number];

type MinecraftFarlandsCanvasProps = {
  progress: MotionValue<number>;
  /** Problems are supplied only by the protected participant dashboard API. */
  problems?: FarlandsProblemSign[];
  problemsReleased?: boolean;
  onProblemSelect?: (problemId: string) => void;
  showFinaleCtas?: boolean;
};

export type FarlandsProblemSign = { id: string; title: string; category?: string | null };

const cube = (x: number, y: number, z: number): Position => [x, y, z];

const PATH_Y = 4;
const WALK_START = 0.12;
const WALK_END = 1;
const PROBLEM_CENTERS = [0.14, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78];
const PROBLEM_HALF_WINDOW = 0.036;
const FINALE_CENTER: Position = [0, PATH_Y, -118];

function travelFromProgress(p: number) {
  return THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(p, 0, 1), WALK_START, WALK_END);
}

function createFarlandsPath() {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, PATH_Y, 48),
    new THREE.Vector3(0, PATH_Y, 32),
    new THREE.Vector3(1, PATH_Y, 16),
    new THREE.Vector3(-1, PATH_Y, 0),
    new THREE.Vector3(0, PATH_Y, -16),
    new THREE.Vector3(1, PATH_Y, -32),
    new THREE.Vector3(-1, PATH_Y, -48),
    new THREE.Vector3(0, PATH_Y, -64),
    new THREE.Vector3(0, PATH_Y, -80),
    new THREE.Vector3(0, PATH_Y, -96),
    new THREE.Vector3(0, PATH_Y, -110),
  ]);
}

function samplePath(path: THREE.CatmullRomCurve3, step = 0.03) {
  const samples: THREE.Vector3[] = [];
  for (let t = 0; t <= 1; t += step) samples.push(path.getPoint(t));
  return samples;
}

function distToSamples(x: number, z: number, samples: THREE.Vector3[]) {
  let min = 999;
  for (let i = 0; i < samples.length; i += 1) {
    const d = Math.hypot(x - samples[i].x, z - samples[i].z);
    if (d < min) min = d;
  }
  return min;
}

function pixelTexture(base: string, accent: string, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 16;
  canvas.height = 16;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to create voxel texture");
  context.fillStyle = base;
  context.fillRect(0, 0, 16, 16);
  for (let index = 0; index < 28; index += 1) {
    const x = (index * 7 + seed * 3) % 16;
    const y = (index * 11 + seed * 5) % 16;
    context.fillStyle = index % 3 === 0 ? accent : `${accent}aa`;
    context.fillRect(x, y, index % 5 === 0 ? 2 : 1, index % 5 === 0 ? 2 : 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function useVoxelTextures() {
  return useMemo(
    () => ({
      grass: pixelTexture("#2f6b55", "#4aa882", 2),
      grassLit: pixelTexture("#3d8a68", "#6ec99a", 3),
      dirt: pixelTexture("#5a4030", "#3d2a1e", 5),
      stone: pixelTexture("#5a6270", "#3e4450", 8),
      brick: pixelTexture("#6a7382", "#4e5664", 45),
      moss: pixelTexture("#3d6b4a", "#2a4a34", 46),
      spruce: pixelTexture("#2a2218", "#1a140e", 11),
      birch: pixelTexture("#d8d2c4", "#b8b0a0", 12),
      spruceLeaf: pixelTexture("#1a2e1c", "#0f1c12", 14),
      birchLeaf: pixelTexture("#2a4a30", "#1a3220", 15),
      lantern: pixelTexture("#e07820", "#ffb24a", 34),
      cloud: pixelTexture("#c8d4e8", "#a8b8d0", 32),
      star: pixelTexture("#ffffff", "#e8f0ff", 60),
      shirt: pixelTexture("#19aeb0", "#128082", 26),
      pants: pixelTexture("#3159a8", "#203d78", 28),
      skin: pixelTexture("#c98e68", "#a86d48", 24),
    }),
    []
  );
}

function useGuyTextures() {
  const [textures, setTextures] = useState<{
    head?: THREE.CanvasTexture;
    torso?: THREE.CanvasTexture;
    leftArm?: THREE.CanvasTexture;
    rightArm?: THREE.CanvasTexture;
    leftLeg?: THREE.CanvasTexture;
    rightLeg?: THREE.CanvasTexture;
  }>({});

  useEffect(() => {
    let isMounted = true;
    const img = new Image();
    img.src = "/minecraft-guy.png";
    img.onload = () => {
      if (!isMounted) return;
      const createSubTexture = (sx: number, sy: number, sw: number, sh: number) => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(sw));
        canvas.height = Math.max(1, Math.floor(sh));
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
      };
      const w = img.width;
      const h = img.height;
      setTextures({
        head: createSubTexture(w * 0.28, 0, w * 0.44, h * 0.24),
        torso: createSubTexture(w * 0.32, h * 0.24, w * 0.36, h * 0.33),
        leftArm: createSubTexture(w * 0.18, h * 0.24, w * 0.14, h * 0.33),
        rightArm: createSubTexture(w * 0.68, h * 0.24, w * 0.14, h * 0.33),
        leftLeg: createSubTexture(w * 0.32, h * 0.57, w * 0.18, h * 0.43),
        rightLeg: createSubTexture(w * 0.5, h * 0.57, w * 0.18, h * 0.43),
      });
    };
    return () => {
      isMounted = false;
    };
  }, []);

  return textures;
}

type ClearingSpec = {
  index: number;
  centerT: number;
  origin: THREE.Vector3;
};

function makeClearingSpecs(path: THREE.CatmullRomCurve3): ClearingSpec[] {
  return PROBLEM_CENTERS.map((centerT, index) => {
    const point = path.getPoint(centerT);
    const tangent = path.getTangent(centerT).normalize();
    const sideDir = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = index % 2 === 0 ? 1 : -1;
    const origin = point.clone().addScaledVector(sideDir, side * 9);
    origin.y = PATH_Y;
    return { index, centerT, origin };
  });
}

function isNearClearing(x: number, z: number, clearings: ClearingSpec[], radius = 5.2) {
  return clearings.some((c) => Math.hypot(x - c.origin.x, z - c.origin.z) < radius);
}

function isNearFinale(x: number, z: number) {
  return Math.hypot(x - FINALE_CENTER[0], z - FINALE_CENTER[2]) < 11;
}

function makeTerrain(samples: THREE.Vector3[], clearings: ClearingSpec[], lowDetail: boolean) {
  const grass: Position[] = [];
  const grassLit: Position[] = [];
  const dirt: Position[] = [];
  const stone: Position[] = [];
  const step = lowDetail ? 2 : 1;
  const xMin = lowDetail ? -28 : -32;
  const xMax = lowDetail ? 28 : 32;
  const zMin = -118;
  const zMax = 52;

  for (let x = xMin; x <= xMax; x += step) {
    for (let z = zMin; z <= zMax; z += step) {
      if (isNearClearing(x, z, clearings, 5.2)) continue;
      if (isNearFinale(x, z)) continue;
      const distPath = distToSamples(x, z, samples);
      if (distPath < 2.5) continue;

      const hill = Math.sin(x * 0.14) * 1.4 + Math.cos(z * 0.09) * 1.2;
      let height = Math.max(2, Math.floor(3 + hill));
      if (distPath > 8) height = Math.max(height, 4 + Math.floor((distPath - 8) * 0.16));
      if (distPath > 16) height = Math.max(height, 5 + Math.floor((distPath - 16) * 0.2));

      if ((x + z * 0.3) % 7 > 3) grassLit.push(cube(x, height, z));
      else grass.push(cube(x, height, z));

      dirt.push(cube(x, height - 1, z));
      if (!lowDetail && height > 3) dirt.push(cube(x, height - 2, z));
    }
  }

  for (let x = -34; x <= 34; x += lowDetail ? 2 : 1) {
    for (let z = -126; z <= -116; z += lowDetail ? 2 : 1) {
      const ridge = Math.max(
        6,
        Math.floor(13 + Math.sin(x * 0.18) * 4.5 + Math.cos(x * 0.07) * 2.5 - Math.abs(z + 121) * 1.1)
      );
      for (let y = 4; y < ridge; y += lowDetail ? 2 : 1) stone.push(cube(x, y, z));
    }
  }

  return { grass, grassLit, dirt, stone };
}

function makePath(path: THREE.CatmullRomCurve3) {
  const bricks: Position[] = [];
  const moss: Position[] = [];
  const torches: Position[] = [];
  const posts: Position[] = [];
  const steps = 110;

  for (let step = 0; step <= steps; step += 1) {
    const t = step / steps;
    const point = path.getPoint(t);
    const tangent = path.getTangent(t).normalize();
    const side = new THREE.Vector3(-tangent.z, 0, tangent.x);

    for (let width = -1; width <= 1; width += 1) {
      const bx = Math.round(point.x + side.x * width);
      const bz = Math.round(point.z + side.z * width);
      bricks.push(cube(bx, PATH_Y, bz));
      if (Math.abs(width) === 1 && step % 3 === 0) moss.push(cube(bx, PATH_Y + 0.05, bz));
    }

    if (step % 2 === 0) {
      const s = step % 4 === 0 ? -1 : 1;
      const tx = Math.round(point.x + side.x * s * 2.4);
      const tz = Math.round(point.z + side.z * s * 2.4);
      posts.push(cube(tx, PATH_Y, tz));
      torches.push(cube(tx, PATH_Y + 1, tz));
    }
  }

  return { bricks, moss, torches, posts };
}

function makeClearingGeometry(clearings: ClearingSpec[]) {
  const platforms: Position[] = [];
  const ringTorches: Position[] = [];
  const posts: Position[] = [];
  const signs: { position: Position; label: string; index: number }[] = [];

  clearings.forEach((c) => {
    const ox = Math.round(c.origin.x);
    const oz = Math.round(c.origin.z);
    for (let dx = -3; dx <= 3; dx += 1) {
      for (let dz = -3; dz <= 3; dz += 1) platforms.push(cube(ox + dx, PATH_Y, oz + dz));
    }
    [
      [-3, -3],
      [0, -3],
      [3, -3],
      [-3, 0],
      [3, 0],
      [-3, 3],
      [0, 3],
      [3, 3],
    ].forEach(([dx, dz]) => {
      posts.push(cube(ox + dx, PATH_Y, oz + dz));
      ringTorches.push(cube(ox + dx, PATH_Y + 1, oz + dz));
    });
    signs.push({ position: [ox, PATH_Y + 2.2, oz], label: String(c.index + 1), index: c.index });
  });

  return { platforms, ringTorches, posts, signs };
}

function makeTrees(samples: THREE.Vector3[], clearings: ClearingSpec[], lowDetail: boolean) {
  const spruceTrunks: Position[] = [];
  const spruceLeaves: Position[] = [];
  const birchTrunks: Position[] = [];
  const birchLeaves: Position[] = [];
  const count = lowDetail ? 28 : 40;

  for (let i = 0; i < count; i += 1) {
    const x = ((i * 19) % 52) - 26;
    const z = 46 - ((i * 23) % 150);
    if (distToSamples(x, z, samples) < 5.5) continue;
    if (isNearClearing(x, z, clearings, 8)) continue;
    if (isNearFinale(x, z)) continue;
    if (z < -108) continue;

    const isBirch = i % 3 === 0;
    const base = PATH_Y;
    if (isBirch) {
      const height = 5 + (i % 2);
      for (let y = base; y < base + height; y += 1) birchTrunks.push(cube(x, y, z));
      for (let layer = 0; layer < 3; layer += 1) {
        const radius = layer === 0 ? 2 : 1;
        const cy = base + height - 1 + layer;
        for (let dx = -radius; dx <= radius; dx += 1) {
          for (let dz = -radius; dz <= radius; dz += 1) {
            if (Math.abs(dx) + Math.abs(dz) <= radius + 1) birchLeaves.push(cube(x + dx, cy, z + dz));
          }
        }
      }
    } else {
      const height = 6 + (i % 3);
      for (let y = base; y < base + height; y += 1) spruceTrunks.push(cube(x, y, z));
      for (let layer = 0; layer < (lowDetail ? 3 : 4); layer += 1) {
        const radius = Math.max(1, 3 - layer);
        const cy = base + height - 3 + layer;
        for (let dx = -radius; dx <= radius; dx += 1) {
          for (let dz = -radius; dz <= radius; dz += 1) {
            if (Math.abs(dx) + Math.abs(dz) <= radius + 1) spruceLeaves.push(cube(x + dx, cy, z + dz));
          }
        }
      }
    }
  }

  return { spruceTrunks, spruceLeaves, birchTrunks, birchLeaves };
}

function makeSkyDressing(lowDetail: boolean) {
  const stars: Position[] = [];
  const clouds: Position[] = [];
  const starCount = lowDetail ? 50 : 80;
  for (let i = 0; i < starCount; i += 1) {
    stars.push(cube(((i * 17) % 70) - 35, 22 + ((i * 7) % 12), -35 - ((i * 11) % 85)));
  }
  [
    [-16, 20, -28],
    [10, 21, -52],
    [20, 19, -78],
  ].forEach(([x, y, z]) => {
    for (let dx = -2; dx <= 2; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) clouds.push(cube(x + dx, y, z + dz));
    }
  });
  return { stars, clouds };
}

function makeFinale() {
  const [cx, , cz] = FINALE_CENTER;
  const plaza: Position[] = [];
  const bonfires: Position[] = [];
  const dais: Position[] = [];

  for (let dx = -7; dx <= 7; dx += 1) {
    for (let dz = -7; dz <= 7; dz += 1) plaza.push(cube(cx + dx, PATH_Y, cz + dz));
  }

  [
    [-5, -5],
    [0, -6],
    [5, -5],
    [-6, 0],
    [6, 0],
    [-5, 5],
    [0, 6],
    [5, 5],
  ].forEach(([dx, dz]) => {
    bonfires.push(cube(cx + dx, PATH_Y + 1, cz + dz));
  });

  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dz = -1; dz <= 1; dz += 1) {
      dais.push(cube(cx - 4 + dx, PATH_Y + 1, cz + 1 + dz));
      dais.push(cube(cx + 4 + dx, PATH_Y + 1, cz + 1 + dz));
    }
  }

  return {
    plaza,
    bonfires,
    dais,
    registerPos: [cx - 4, PATH_Y + 3.2, cz + 1] as Position,
    rulesPos: [cx + 4, PATH_Y + 3.2, cz + 1] as Position,
  };
}

function useInstances(ref: React.RefObject<THREE.InstancedMesh | null>, positions: Position[], size: number) {
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh || positions.length === 0) return;
    const matrix = new THREE.Matrix4();
    positions.forEach(([x, y, z], index) => {
      matrix.compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(size, size, size));
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [positions, ref, size]);
}

function Voxels({
  positions,
  texture,
  color = "#ffffff",
  size = 1,
  emissive,
  emissiveIntensity = 0,
}: {
  positions: Position[];
  texture: THREE.Texture;
  color?: string;
  size?: number;
  emissive?: string;
  emissiveIntensity?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useInstances(ref, positions, size);
  if (positions.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]} frustumCulled>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial
        map={texture}
        color={color}
        emissive={emissive ?? "#000000"}
        emissiveIntensity={emissiveIntensity}
      />
    </instancedMesh>
  );
}

function Moon() {
  return (
    <group position={[-26, 34, -68]}>
      <mesh>
        <sphereGeometry args={[7, 16, 12]} />
        <meshBasicMaterial color="#d8e6ff" />
      </mesh>
      <pointLight color="#c8daf8" intensity={3.4} distance={150} decay={1.35} />
      <directionalLight color="#b8cff0" intensity={1.4} position={[8, 4, 10]} />
    </group>
  );
}

function PathLights({ positions, lowDetail }: { positions: Position[]; lowDetail: boolean }) {
  const stride = lowDetail ? 5 : 4;
  const samples = useMemo(() => positions.filter((_, i) => i % stride === 0).slice(0, lowDetail ? 12 : 18), [positions, stride, lowDetail]);
  const lights = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(({ clock }) => {
    const flicker = 0.92 + Math.sin(clock.elapsedTime * 7) * 0.06;
    for (let i = 0; i < lights.current.length; i += 1) {
      const light = lights.current[i];
      if (light) light.intensity = 2.4 * flicker;
    }
  });

  return (
    <>
      {samples.map(([x, y, z], index) => (
        <pointLight
          key={`pl-${index}`}
          ref={(node) => {
            lights.current[index] = node;
          }}
          position={[x, y + 0.7, z]}
          color="#ff9a3c"
          intensity={2.4}
          distance={lowDetail ? 18 : 16}
          decay={1.7}
        />
      ))}
    </>
  );
}

function BonfireLights({ positions, lowDetail }: { positions: Position[]; lowDetail: boolean }) {
  const samples = useMemo(() => (lowDetail ? positions.filter((_, i) => i % 2 === 0) : positions), [positions, lowDetail]);
  const lights = useRef<(THREE.PointLight | null)[]>([]);
  useFrame(({ clock }) => {
    const flicker = 0.94 + Math.sin(clock.elapsedTime * 5.5) * 0.08;
    lights.current.forEach((light) => {
      if (light) light.intensity = 4 * flicker;
    });
  });
  return (
    <>
      {samples.map(([x, y, z], index) => (
        <pointLight
          key={`bf-${index}`}
          ref={(node) => {
            lights.current[index] = node;
          }}
          position={[x, y + 1.1, z]}
          color="#ff8a2a"
          intensity={4}
          distance={20}
          decay={1.55}
        />
      ))}
    </>
  );
}

function Fireflies({ seeds }: { seeds: Position[] }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(seeds.length * 3);
    seeds.forEach(([x, y, z], i) => {
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    });
    return arr;
  }, [seeds]);

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const attr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < seeds.length; i += 1) {
      const [bx, by, bz] = seeds[i];
      const phase = i * 1.7;
      attr.setXYZ(
        i,
        bx + Math.sin(t * 0.7 + phase) * 1.3,
        by + Math.sin(t * 1.1 + phase) * 0.8,
        bz + Math.cos(t * 0.55 + phase) * 1.1
      );
    }
    attr.needsUpdate = true;
  });

  if (seeds.length === 0) return null;

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d8f28a" size={0.26} sizeAttenuation transparent opacity={0.88} depthWrite={false} />
    </points>
  );
}

function CameraRig({ progress }: MinecraftFarlandsCanvasProps) {
  const path = useMemo(() => createFarlandsPath(), []);
  const camPos = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());
  const walker = useRef(new THREE.Vector3());
  const tangent = useRef(new THREE.Vector3());
  const { size } = useThree();

  useFrame(({ camera }, delta) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = size.width / Math.max(size.height, 1);
      const targetFov = aspect < 0.7 ? 64 : aspect < 1 ? 56 : aspect < 1.4 ? 50 : 46;
      if (Math.abs(camera.fov - targetFov) > 0.35) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    const travel = travelFromProgress(progress.get());
    const approach = THREE.MathUtils.smoothstep(progress.get(), 0, WALK_START);
    const t = THREE.MathUtils.clamp(travel, 0, 0.985);
    path.getPointAt(t, walker.current);
    path.getTangentAt(t, tangent.current).normalize();

    const isPortrait = size.width < size.height;
    const back = (isPortrait ? 6.2 : 7) - approach * 1.1;
    const up = isPortrait ? 5.2 : 4.6;

    camPos.current
      .copy(walker.current)
      .addScaledVector(tangent.current, -back)
      .add(new THREE.Vector3(0, up, 0));
    lookAt.current
      .copy(walker.current)
      .addScaledVector(tangent.current, 3.8)
      .add(new THREE.Vector3(0, 1.4, 0));

    // Fast, smooth follow â€” sticks tightly to scroll without mush
    const alpha = 1 - Math.exp(-delta * 12);
    camera.position.lerp(camPos.current, alpha);
    camera.lookAt(lookAt.current);
  });

  return null;
}

function SteveWalker({ progress }: MinecraftFarlandsCanvasProps) {
  const group = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const path = useMemo(() => createFarlandsPath(), []);
  const point = useRef(new THREE.Vector3());
  const tangent = useRef(new THREE.Vector3());
  const guyTex = useGuyTextures();
  const voxels = useVoxelTextures();

  useFrame(() => {
    if (!group.current) return;
    const travel = travelFromProgress(progress.get());
    const t = THREE.MathUtils.clamp(travel, 0, 0.985);
    path.getPointAt(t, point.current);
    path.getTangentAt(t, tangent.current).normalize();
    const bob = Math.abs(Math.sin(t * Math.PI * 42)) * 0.05;
    group.current.position.set(point.current.x, PATH_Y + 0.5 + bob, point.current.z);
    group.current.rotation.y = Math.atan2(tangent.current.x, tangent.current.z);
    const stride = Math.sin(t * Math.PI * 42) * 0.55;
    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -stride * 0.85;
    if (rightArmRef.current) rightArmRef.current.rotation.x = stride * 0.85;
  });

  if (!guyTex.head) return null;

  return (
    <group ref={group}>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshLambertMaterial attach="material-0" map={voxels.skin} />
        <meshLambertMaterial attach="material-1" map={voxels.skin} />
        <meshLambertMaterial attach="material-2" map={voxels.spruce} color="#4a2b25" />
        <meshLambertMaterial attach="material-3" map={voxels.skin} />
        <meshLambertMaterial attach="material-4" map={voxels.skin} />
        <meshLambertMaterial attach="material-5" map={guyTex.head} />
      </mesh>
      <mesh position={[0, 1.175, 0]}>
        <boxGeometry args={[0.5, 0.75, 0.25]} />
        <meshLambertMaterial map={voxels.shirt} />
      </mesh>
      <group ref={leftArmRef} position={[-0.375, 1.55, 0]}>
        <mesh position={[0, -0.375, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshLambertMaterial map={guyTex.leftArm} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.375, 1.55, 0]}>
        <mesh position={[0, -0.375, 0]}>
          <boxGeometry args={[0.25, 0.75, 0.25]} />
          <meshLambertMaterial map={guyTex.rightArm} />
        </mesh>
      </group>
      <group ref={leftLegRef} position={[-0.125, 0.8, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshLambertMaterial map={guyTex.leftLeg} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.125, 0.8, 0]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.8, 0.25]} />
          <meshLambertMaterial map={guyTex.rightLeg} />
        </mesh>
      </group>
    </group>
  );
}

function ProblemSigns({
  signs,
  progress,
  problems = [],
  problemsReleased = false,
  onProblemSelect,
}: {
  signs: { position: Position; label: string; index: number }[];
  progress: MotionValue<number>;
  problems?: FarlandsProblemSign[];
  problemsReleased?: boolean;
  onProblemSelect?: (problemId: string) => void;
}) {
  const [travel, setTravel] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setTravel(travelFromProgress(v)));

  return (
    <>
      {signs.map((sign) => {
        const problem = problems[sign.index];
        const available = Boolean(problemsReleased && problem && onProblemSelect);
        const center = PROBLEM_CENTERS[sign.index];
        const dist = Math.abs(travel - center);
        if (dist >= PROBLEM_HALF_WINDOW) return null;
        const opacity = THREE.MathUtils.clamp(1 - dist / PROBLEM_HALF_WINDOW, 0, 1);
        const scale = 0.8 + opacity * 0.2;
        return (
          <Html
            key={sign.label}
            position={sign.position}
            center
            distanceFactor={11}
            style={{ opacity, transform: `scale(${scale})`, pointerEvents: available ? "auto" : "none" }}
            zIndexRange={[20, 0]}
          >
            <div className={`farlands-sign-card${available ? " farlands-sign-card-active" : ""}`}>
              {available && problem ? (
                <button type="button" onClick={() => { if (onProblemSelect) onProblemSelect(problem.id); }} aria-label={`Open ${problem.title}`}>
                  <span>MISSION {sign.index + 1}</span>
                  <strong>{problem.title}</strong>
                  <small>{problem.category ?? "General"}</small>
                </button>
              ) : <span>{problemsReleased ? `STATION ${sign.label}` : "LOCKED"}</span>}
            </div>
          </Html>
        );
      })}
    </>
  );
}

function FinaleCTAs({
  registerPos,
  rulesPos,
  progress,
}: {
  registerPos: Position;
  rulesPos: Position;
  progress: MotionValue<number>;
}) {
  const [travel, setTravel] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setTravel(travelFromProgress(v)));
  const opacity = THREE.MathUtils.clamp((travel - 0.86) / 0.07, 0, 1);
  if (opacity < 0.02) return null;

  return (
    <>
      <Html
        position={registerPos}
        center
        distanceFactor={13}
        style={{ opacity, pointerEvents: "auto" }}
        zIndexRange={[30, 0]}
      >
        <a className="farlands-cta" href="/register">
          REGISTER FOR FARLANDS
        </a>
      </Html>
      <Html
        position={rulesPos}
        center
        distanceFactor={13}
        style={{ opacity, pointerEvents: "auto" }}
        zIndexRange={[30, 0]}
      >
        <a className="farlands-cta" href="/rules">
          READ THE RULES
        </a>
      </Html>
    </>
  );
}

function WorldContents({ progress, lowDetail, problems, problemsReleased, onProblemSelect, showFinaleCtas = true }: MinecraftFarlandsCanvasProps & { lowDetail: boolean }) {
  const textures = useVoxelTextures();
  const path = useMemo(() => createFarlandsPath(), []);
  const samples = useMemo(() => samplePath(path), [path]);
  const clearings = useMemo(() => makeClearingSpecs(path), [path]);
  const terrain = useMemo(() => makeTerrain(samples, clearings, lowDetail), [samples, clearings, lowDetail]);
  const pathData = useMemo(() => makePath(path), [path]);
  const clearingGeo = useMemo(() => makeClearingGeometry(clearings), [clearings]);
  const forest = useMemo(() => makeTrees(samples, clearings, lowDetail), [samples, clearings, lowDetail]);
  const sky = useMemo(() => makeSkyDressing(lowDetail), [lowDetail]);
  const finale = useMemo(() => makeFinale(), []);

  const fireflySeeds = useMemo(() => {
    const seeds: Position[] = [];
    forest.spruceTrunks.forEach(([x, , z], i) => {
      if (i % 5 === 0) seeds.push([x + 1.4, PATH_Y + 2.4, z + 1]);
    });
    return seeds.slice(0, lowDetail ? 16 : 28);
  }, [forest, lowDetail]);

  return (
    <>
      <color attach="background" args={["#141c38"]} />
      <fog attach="fog" args={["#1a2748", 40, 115]} />
      <hemisphereLight intensity={0.58} color="#6a88c8" groundColor="#1e3a32" />
      <ambientLight intensity={0.45} color="#4a6088" />
      <Moon />
      <PathLights positions={[...pathData.torches, ...clearingGeo.ringTorches]} lowDetail={lowDetail} />
      <BonfireLights positions={finale.bonfires} lowDetail={lowDetail} />
      <Fireflies seeds={fireflySeeds} />
      <CameraRig progress={progress} />
      <SteveWalker progress={progress} />

      <Voxels positions={terrain.grass} texture={textures.grass} />
      <Voxels positions={terrain.grassLit} texture={textures.grassLit} />
      <Voxels positions={terrain.dirt} texture={textures.dirt} />
      <Voxels positions={terrain.stone} texture={textures.stone} color="#7a8498" />
      <Voxels positions={pathData.bricks} texture={textures.brick} />
      <Voxels positions={pathData.moss} texture={textures.moss} size={0.95} />
      <Voxels positions={pathData.posts} texture={textures.spruce} size={0.35} />
      <Voxels positions={pathData.torches} texture={textures.lantern} size={0.4} emissive="#ff8a2a" emissiveIntensity={1.35} />
      <Voxels positions={clearingGeo.platforms} texture={textures.brick} />
      <Voxels positions={clearingGeo.posts} texture={textures.spruce} size={0.35} />
      <Voxels positions={clearingGeo.ringTorches} texture={textures.lantern} size={0.4} emissive="#ff8a2a" emissiveIntensity={1.45} />
      <Voxels positions={forest.spruceTrunks} texture={textures.spruce} />
      <Voxels positions={forest.spruceLeaves} texture={textures.spruceLeaf} />
      <Voxels positions={forest.birchTrunks} texture={textures.birch} />
      <Voxels positions={forest.birchLeaves} texture={textures.birchLeaf} />
      <Voxels positions={sky.stars} texture={textures.star} size={0.2} color="#ffffff" />
      <Voxels positions={sky.clouds} texture={textures.cloud} size={1.45} color="#c8d8f0" />
      <Voxels positions={finale.plaza} texture={textures.brick} />
      <Voxels positions={finale.dais} texture={textures.stone} color="#8a94a8" />
      <Voxels positions={finale.bonfires} texture={textures.lantern} size={0.7} emissive="#ff6a18" emissiveIntensity={2} />

      <ProblemSigns signs={clearingGeo.signs} progress={progress} problems={problems} problemsReleased={problemsReleased} onProblemSelect={onProblemSelect} />
      {showFinaleCtas && <FinaleCTAs registerPos={finale.registerPos} rulesPos={finale.rulesPos} progress={progress} />}
    </>
  );
}

function FarlandsHud({ progress }: MinecraftFarlandsCanvasProps) {
  const [state, setState] = useState({ percent: 0, chapter: "ENTERING FARLAND" });
  const fill = useTransform(progress, [WALK_START, 1], ["0%", "100%"]);

  useMotionValueEvent(progress, "change", (value) => {
    const travel = travelFromProgress(value);
    let chapter = "ENTERING FARLAND";
    if (travel >= 0.86) chapter = "REGISTRATION CLEARING";
    else if (travel > 0.02) {
      const nearest = PROBLEM_CENTERS.reduce(
        (best, c, i) => (Math.abs(travel - c) < Math.abs(travel - PROBLEM_CENTERS[best]) ? i : best),
        0
      );
      chapter =
        Math.abs(travel - PROBLEM_CENTERS[nearest]) < PROBLEM_HALF_WINDOW
          ? `PROBLEM ${nearest + 1}`
          : "FARLAND VALLEY WALK";
    }
    setState({ percent: Math.round(travel * 100), chapter });
  });

  return (
    <div className="farlands-hud" aria-label="Farland navigation">
      <div className="farlands-coordinates">
        <span>FARLAND // NIGHT PROTOCOL</span>
        <strong>{state.chapter}</strong>
      </div>
      <div className="farlands-path">
        <span>PATH</span>
        <strong>{state.percent}%</strong>
        <div className="farlands-path-track">
          <motion.div style={{ width: fill }} />
        </div>
      </div>
      <style jsx>{`
        .farlands-hud {
          position: absolute;
          inset: 0;
          z-index: 7;
          pointer-events: none;
          color: #e8f0ff;
          font: 10px/1.4 ui-monospace, SFMono-Regular, Consolas, monospace;
          text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
        }
        .farlands-coordinates,
        .farlands-path {
          background: rgba(10, 18, 36, 0.78);
          border: 1px solid rgba(140, 180, 255, 0.55);
          box-shadow: 0 5px 0 rgba(0, 0, 0, 0.2);
        }
        .farlands-coordinates {
          position: absolute;
          left: max(10px, env(safe-area-inset-left));
          top: max(10px, env(safe-area-inset-top));
          padding: 8px 10px;
          display: grid;
          gap: 4px;
          letter-spacing: 0.08em;
          max-width: min(70vw, 280px);
        }
        .farlands-coordinates span {
          color: #9bb8e8;
          font-size: 9px;
        }
        .farlands-coordinates strong {
          color: #ffe9a8;
          font-weight: 500;
        }
        .farlands-path {
          position: absolute;
          left: max(10px, env(safe-area-inset-left));
          bottom: max(10px, env(safe-area-inset-bottom));
          width: min(240px, 52vw);
          padding: 7px 9px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 5px 10px;
        }
        .farlands-path span {
          color: #9bb8e8;
          letter-spacing: 0.12em;
        }
        .farlands-path strong {
          color: #ffe9a8;
        }
        .farlands-path-track {
          grid-column: 1 / -1;
          height: 6px;
          background: #121a2c;
          border: 1px solid rgba(255, 255, 255, 0.18);
          overflow: hidden;
        }
        .farlands-path-track div {
          height: 100%;
          background: linear-gradient(90deg, #3d6b9a, #e07820 55%, #63bb54);
        }
        @media (max-width: 640px) {
          .farlands-coordinates {
            padding: 6px 8px;
            font-size: 8px;
          }
          .farlands-coordinates span {
            font-size: 8px;
          }
          .farlands-path {
            width: min(180px, 58vw);
            padding: 5px 7px;
            font-size: 8px;
          }
        }
      `}</style>
    </div>
  );
}

export default function MinecraftFarlandsCanvas({ progress, problems, problemsReleased, onProblemSelect, showFinaleCtas }: MinecraftFarlandsCanvasProps) {
  const [lowDetail] = useState(() => {
    if (typeof window === "undefined") return false;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const saveData = "connection" in navigator && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    return narrow || coarse || Boolean(saveData);
  });

  return (
    <>
      <Canvas
        className="farlands-canvas"
        dpr={lowDetail ? [1, 1.1] : [1, 1.4]}
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 48, near: 0.1, far: 160, position: [0, 9, 54] }}
        performance={{ min: 0.5 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.28;
          scene.background = new THREE.Color("#141c38");
        }}
      >
      <WorldContents progress={progress} lowDetail={lowDetail} problems={problems} problemsReleased={problemsReleased} onProblemSelect={onProblemSelect} showFinaleCtas={showFinaleCtas} />
      </Canvas>
      <FarlandsHud progress={progress} />
    </>
  );
}


