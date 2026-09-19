import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { CONFIG, TimelineState } from './timeline';

const loader = new GLTFLoader();
const edgeMaterial = new THREE.LineBasicMaterial({ color: '#263b36', transparent: true, opacity: 0.19 });

function collectSolids(gltf: { scene: THREE.Group; parser: any }) {
  const solids = new Map<number, THREE.BufferGeometry[]>();
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse((node: any) => {
    if (!node.isMesh) return;
    const index = gltf.parser.associations.get(node)?.meshes;
    if (index === undefined) return;
    const geometry = node.geometry.index ? node.geometry.toNonIndexed() : node.geometry.clone();
    geometry.applyMatrix4(node.matrixWorld);
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== 'position' && name !== 'normal') geometry.deleteAttribute(name);
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    const color = node.material.color || new THREE.Color('#ffffff');
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    if (!solids.has(index)) solids.set(index, []);
    solids.get(index)!.push(geometry);
  });
  const resources = new Set<any>();
  gltf.scene.traverse((n: any) => {
    if (n.isMesh) {
      resources.add(n.geometry);
      for (const m of Array.isArray(n.material) ? n.material : [n.material]) resources.add(m);
    }
  });
  for (const resource of resources) resource.dispose();
  return solids;
}

function makePart(solids: Map<number, THREE.BufferGeometry[]>, indices: number[], pivot: [number, number, number] = [0, 0, 0]) {
  const pieces = indices.flatMap((index) => solids.get(index) || []);
  if (!pieces.length) throw new Error('The model contains no renderable geometry.');
  const geometry = mergeGeometries(pieces);
  if (!geometry) throw new Error('Failed to merge geometries');
  geometry.translate(-pivot[0], -pivot[1], -pivot[2]);
  pieces.forEach((g) => g.dispose());
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), edgeMaterial));
  const group = new THREE.Group();
  group.position.set(...pivot);
  group.add(mesh);
  return group;
}

export type WorldCubeModel = {
  group: THREE.Group;
  sourceMeshes: number;
  center: number[];
  scale: number;
};

export async function WorldCube(): Promise<WorldCubeModel> {
  const gltf = await loader.loadAsync('/models/world/output.gltf');
  const solids = collectSolids(gltf);
  const core = new THREE.Box3();
  for (const geometry of solids.get(0) || []) {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) core.union(geometry.boundingBox);
  }
  if (core.isEmpty()) throw new Error('The world cube core could not be measured.');
  const center = core.getCenter(new THREE.Vector3());
  const group = new THREE.Group();
  const model = makePart(solids, [...solids.keys()]);
  model.position.copy(center).multiplyScalar(-1);
  const scale = CONFIG.cubeSize / 0.08;
  const normalized = new THREE.Group();
  normalized.scale.setScalar(scale);
  normalized.add(model);
  group.add(normalized);
  group.name = 'WorldCube';
  return { group, sourceMeshes: solids.size, center: center.toArray(), scale };
}

export type SteveModel = {
  group: THREE.Group;
  model: THREE.Group;
  sourceMeshes: number;
  articulated: boolean;
  parts: Record<string, THREE.Group>;
  pose: (state: TimelineState, reducedMotion: boolean) => void;
  walkIntoPortal: (progress: number) => void;
};

export async function Steve(): Promise<SteveModel> {
  const gltf = await loader.loadAsync('/models/steve/output.gltf');
  const solids = collectSolids(gltf);
  const group = new THREE.Group();
  const model = new THREE.Group();
  group.name = 'Steve';
  group.add(model);
  const bounds = new THREE.Box3();
  for (const pieces of solids.values()) {
    for (const g of pieces) {
      g.computeBoundingBox();
      if (g.boundingBox) bounds.union(g.boundingBox);
    }
  }
  const height = bounds.max.y - bounds.min.y;
  if (!height) throw new Error('Steve has no measurable geometry.');
  model.scale.setScalar(CONFIG.steveHeight / height);

  const parts: Record<string, THREE.Group> = {};
  if (solids.size === 21 && [...Array(21).keys()].every((i) => solids.has(i))) {
    const definitions: Record<string, [number[], [number, number, number]]> = {
      head: [[1, 5, 8, 9, 10, 11, 12, 13, 14, 15], [0, 0.0245, 0]],
      torso: [[3], [0, 0.0125, 0]],
      leftArm: [[0, 4, 7], [0.0045, 0.0238, 0]],
      rightArm: [[16, 17, 18], [-0.0045, 0.0238, 0]],
      leftLeg: [[2, 6], [0.002, 0.012, 0]],
      rightLeg: [[19, 20], [-0.002, 0.012, 0]],
    };
    for (const [name, [indices, pivot]] of Object.entries(definitions)) {
      parts[name] = makePart(solids, indices, pivot);
      model.add(parts[name]);
    }
  } else {
    model.add(makePart(solids, [...solids.keys()]));
  }
  const footBounds = new THREE.Box3();

  return {
    group,
    model,
    sourceMeshes: solids.size,
    articulated: !!parts.head,
    parts,
    pose(state: TimelineState, reducedMotion: boolean) {
      const fall = state.fall ?? 0;
      const air = state.air ?? 0;
      const crouch = state.crouch ?? 0;
      const progress = state.progress ?? 0;
      const y = state.y ?? 0;

      model.rotation.set(
        -0.13 * fall + 0.07 * air,
        0.1 + 0.12 * fall,
        reducedMotion ? 0 : 0.07 * Math.sin(progress * 32) * fall
      );
      model.scale.y = (CONFIG.steveHeight / height) * (1 - crouch);
      if (parts.head) {
        parts.head.rotation.x = -0.09 * fall + 0.12 * crouch;
        parts.leftArm.rotation.set(-0.38 * fall - 0.95 * air + 1.6 * crouch, 0, 0.15 * fall + 0.1 * air);
        parts.rightArm.rotation.set(-0.3 * fall - 0.85 * air + 1.6 * crouch, 0, -0.15 * fall - 0.1 * air);
        parts.leftLeg.rotation.set(0.13 * fall + 0.27 * air + crouch, 0, 0.045 * fall);
        parts.rightLeg.rotation.set(-0.1 * fall + 0.19 * air + crouch, 0, -0.045 * fall);
      }
      group.position.set(0, 0, 0);
      group.updateMatrixWorld(true);
      footBounds.setFromObject(group);
      group.position.y = y - footBounds.min.y;
    },
    walkIntoPortal(t: number) {
      // Turn around toward the portal behind Steve (facing -Z)
      const turnAngle = Math.min(Math.PI, t * 2.5 * Math.PI);
      model.rotation.set(0, turnAngle, 0);

      // Walk toward the portal (z: 0 -> -1.0)
      const walkZ = -Math.min(1.0, t * 1.1);
      group.position.z = walkZ;

      // Authentic walking leg and arm swing
      if (parts.leftLeg && parts.rightLeg && parts.leftArm && parts.rightArm) {
        const stride = Math.sin(t * Math.PI * 8) * 0.6;
        parts.leftLeg.rotation.x = stride;
        parts.rightLeg.rotation.x = -stride;
        parts.leftArm.rotation.x = -stride * 0.8;
        parts.rightArm.rotation.x = stride * 0.8;
      }

      // Slightly dissolve as entering event horizon
      if (t > 0.65) {
        const fade = 1 - (t - 0.65) / 0.35;
        model.scale.setScalar((CONFIG.steveHeight / height) * Math.max(0.01, fade));
      }
    },
  };
}
