import * as THREE from 'three';
import { TimelineState } from './timeline';

type CloudSeed = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
};

export class ProceduralClouds {
  group: THREE.Group;
  dummy: THREE.Object3D;
  count: number;
  geometry: THREE.BoxGeometry;
  material: THREE.MeshBasicMaterial;
  mesh: THREE.InstancedMesh;
  seeds: CloudSeed[];

  constructor(camera: THREE.Camera, mobile: boolean) {
    this.group = new THREE.Group();
    camera.add(this.group);
    this.dummy = new THREE.Object3D();
    this.count = mobile ? 36 : 64;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    const colors = new Float32Array(this.geometry.attributes.position.count * 3);
    const shades = [0.96, 0.98, 1, 0.95, 0.99, 0.97];
    for (let i = 0; i < colors.length / 3; i++) {
      colors.fill(shades[Math.floor(i / 4)], i * 3, i * 3 + 3);
    }
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.material = new THREE.MeshBasicMaterial({ color: '#eef2e9', vertexColors: true, toneMapped: false });
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.mesh);

    this.seeds = Array.from({ length: this.count }, (_, i) => {
      const cluster = Math.floor(i / 4);
      const block = i % 4;
      return {
        x: (cluster % 4 - 1.5) * 3.5 + (block % 2) * 1.3,
        y: (Math.floor(cluster / 4) - 1.5) * 2.6 + Math.floor(block / 2) * 0.9,
        z: -8 - (cluster % 3) * 2,
        sx: 2.3 + Math.sin(i * 13) * 0.45,
        sy: 1.3 + Math.cos(i * 7) * 0.3,
      };
    });
  }

  update(state: TimelineState, aspect: number) {
    const cloudProgress = state.cloud ?? 0;
    const reveal = state.reveal ?? 0;
    const progress = state.progress ?? 0;

    for (let i = 0; i < this.count; i++) {
      const seed = this.seeds[i];
      const side = seed.x < 0 ? -1 : 1;
      const drift = (1 - cloudProgress) * (3.6 + reveal * 3.4 + Math.abs(seed.x) * 0.4);
      const x = seed.x * Math.max(0.8, aspect / 1.5) + side * drift;
      this.dummy.position.set(x, seed.y + (progress - 0.22) * 5, seed.z);
      this.dummy.scale.set(
        seed.sx * (0.65 + cloudProgress * 1.15),
        seed.sy * (0.65 + cloudProgress * 1.35),
        0.7 + cloudProgress * 0.4
      );
      this.dummy.rotation.set(0.015, 0.025, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
