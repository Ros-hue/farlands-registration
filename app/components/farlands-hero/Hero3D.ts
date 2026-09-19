import * as THREE from 'three';
import { Steve, WorldCube, SteveModel, WorldCubeModel } from './models';
import { ProceduralClouds } from './clouds';
import { CONFIG, sampleTimeline, mix, TimelineState } from './timeline';

export class Hero3D {
  container: HTMLElement;
  onUpdate: (state: TimelineState) => void;
  onError: (error: Error) => void;
  disposed: boolean = false;
  progress: number = 0;
  target: number = 0;
  state: TimelineState = {};
  motionPreference: MediaQueryList;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  shadowTexture: THREE.CanvasTexture;
  contactShadow: THREE.Mesh;
  renderer: THREE.WebGLRenderer;
  clouds: ProceduralClouds;
  lookAt: THREE.Vector3;
  axisZ: THREE.Vector3;
  axisX: THREE.Vector3;
  turn: THREE.Quaternion;
  compensation: THREE.Quaternion;
  orientations: THREE.Quaternion[];
  onResize: () => void;
  contextLost: (event: Event) => void;
  resizeObserver: ResizeObserver;
  visibility: () => void;
  steve?: SteveModel;
  world?: WorldCubeModel;
  ready: boolean = false;
  frame: number = 0;
  previousTime: number = 0;

  // === VOXEL SUN ===
  voxelSunGroup!: THREE.Group;

  // === ENVIRONMENT ===
  environmentGroup!: THREE.Group;
  waterPlane!: THREE.Mesh;
  floatingIslandsGroup!: THREE.Group;
  waterfallParticles: THREE.Points[] = [];

  // === VISHVAKARMA 2.0 Sky Cloud Inscription (3D Voxel Blocks) ===
  skyInscriptionGroup!: THREE.Group;
  skyCloudBlocks!: THREE.InstancedMesh;
  skyCloudCount: number = 40;
  skyCloudSeeds: Array<{ x: number; y: number; z: number }> = [];

  // === LANDING PUFF ===
  landingPuffMesh!: THREE.InstancedMesh;
  landingPuffCount: number = 20;
  landingTriggered: boolean = false;
  landingPuffStartTime: number = 0;

  // === HEROBRINE EASTER EGG ===
  herobrineGroup!: THREE.Group;

  // === PORTAL ===
  portalGroup: THREE.Group;
  portalVortexMesh!: THREE.Mesh;
  portalFrameMesh!: THREE.InstancedMesh;
  portalLight!: THREE.PointLight;
  portalScale: number = 0;
  portalCanvas!: HTMLCanvasElement;
  portalTexture!: THREE.CanvasTexture;
  portalParticles!: THREE.Points;
  portalPillars!: THREE.Group;

  // === SCENE FOG ===
  sceneFog!: THREE.FogExp2;

  // === PORTAL ENTRY ===
  isEnteringPortal: boolean = false;
  portalEntryStartTime: number = 0;
  portalEntryDuration: number = 1200;
  onPortalEntryComplete?: () => void;

  constructor(
    container: HTMLElement,
    onUpdate: (state: TimelineState) => void,
    onError: (error: Error) => void
  ) {
    this.container = container;
    this.onUpdate = onUpdate;
    this.onError = onError;
    this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.scene = new THREE.Scene();

    // Atmospheric lush Minecraft canyon emerald mist
    this.sceneFog = new THREE.FogExp2(0x234a35, 0.012);
    this.scene.fog = this.sceneFog;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    this.scene.add(this.camera);

    // Contact shadow for Steve landing
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 64;
    const ctx = shadowCanvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 3, 32, 32, 31);
      grad.addColorStop(0, 'rgba(25, 45, 32, 0.38)');
      grad.addColorStop(1, 'rgba(25, 45, 32, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    this.shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    this.contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.2),
      new THREE.MeshBasicMaterial({
        map: this.shadowTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    );
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = CONFIG.landingY + 0.012;
    this.scene.add(this.contactShadow);

    // === RENDERER ===
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35; // Brighter, richer saturation
    container.appendChild(this.renderer.domElement);

    // === CINEMATIC MINECRAFT CANYON LIGHTING ===
    // Warm golden sky + lush grass canopy bounce
    this.scene.add(new THREE.HemisphereLight('#cffafe', '#15803d', 2.8));

    // Main sun — warm Minecraft golden sunlight
    const sun = new THREE.DirectionalLight('#fff7ed', 3.4);
    sun.position.set(-14, 28, 12);
    this.scene.add(sun);

    // Lush green foliage bounce light from canyon floor
    const foliageBounce = new THREE.DirectionalLight('#4ade80', 1.2);
    foliageBounce.position.set(0, -6, 6);
    this.scene.add(foliageBounce);

    // Warm side fill for sunset warmth on Steve & world cube
    const sunsetFill = new THREE.DirectionalLight('#fef08a', 0.9);
    sunsetFill.position.set(6, 12, 14);
    this.scene.add(sunsetFill);

    // Clouds
    this.clouds = new ProceduralClouds(this.camera, window.innerWidth < 700);

    this.lookAt = new THREE.Vector3();
    this.axisZ = new THREE.Vector3(0, 0, 1);
    this.axisX = new THREE.Vector3(1, 0, 0);
    this.turn = new THREE.Quaternion();
    this.compensation = new THREE.Quaternion();

    this.orientations = [new THREE.Quaternion()];
    for (let i = 0; i < CONFIG.transitionCount; i++) {
      this.turn.setFromAxisAngle(i % 2 ? this.axisX : this.axisZ, CONFIG.quarterTurn);
      this.orientations.push(this.orientations[i].clone().premultiply(this.turn));
    }

    // Build scene elements
    this.initVoxelSun();
    this.initEnvironment();
    this.initSkyInscription();
    this.initLandingPuff();
    this.initHerobrineEasterEgg();

    this.portalGroup = new THREE.Group();
    this.initNetherPortal();
    this.scene.add(this.portalGroup);

    this.onResize = () => {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      this.camera.aspect = width / Math.max(height, 1);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      this.requestFrame();
    };

    this.contextLost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(this.frame);
      this.onError(new Error('The graphics connection was interrupted.'));
    };

    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
    this.resizeObserver = new ResizeObserver(this.onResize);
    this.resizeObserver.observe(container);

    this.visibility = () => {
      if (!document.hidden) {
        this.previousTime = 0;
        this.requestFrame();
      }
    };
    document.addEventListener('visibilitychange', this.visibility);
    this.onResize();
  }

  // ============================================================
  // VOXEL SUN — 3×3 pixel-art grid of BoxGeometry blocks
  // ============================================================
  private initVoxelSun() {
    this.voxelSunGroup = new THREE.Group();
    this.voxelSunGroup.position.set(-18, 28, -35);

    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfff3a8, toneMapped: false });
    const blockSize = 1.05;
    const gap = 1.18;

    for (let row = -1; row <= 1; row++) {
      for (let col = -1; col <= 1; col++) {
        const geo = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        const mesh = new THREE.Mesh(geo, sunMat);
        mesh.position.set(col * gap, row * gap, 0);
        this.voxelSunGroup.add(mesh);
      }
    }

    // Halo glow behind the blocks
    const haloCanvas = document.createElement('canvas');
    haloCanvas.width = haloCanvas.height = 256;
    const hCtx = haloCanvas.getContext('2d');
    if (hCtx) {
      const grd = hCtx.createRadialGradient(128, 128, 10, 128, 128, 128);
      grd.addColorStop(0, 'rgba(255, 220, 80, 0.55)');
      grd.addColorStop(0.45, 'rgba(255, 180, 50, 0.22)');
      grd.addColorStop(0.75, 'rgba(255, 140, 30, 0.08)');
      grd.addColorStop(1, 'rgba(255, 120, 20, 0)');
      hCtx.fillStyle = grd;
      hCtx.fillRect(0, 0, 256, 256);
    }
    const haloTex = new THREE.CanvasTexture(haloCanvas);
    const haloMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      new THREE.MeshBasicMaterial({
        map: haloTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    );
    haloMesh.position.z = -0.5;
    this.voxelSunGroup.add(haloMesh);
    this.scene.add(this.voxelSunGroup);
  }

  // ============================================================
  // ENVIRONMENT — Lush Towering Minecraft Canyon (Y = -2 to Y = 34)
  // Ensures vibrant green Minecraft terrain is visible at EVERY scroll position
  // ============================================================
  private initEnvironment() {
    this.environmentGroup = new THREE.Group();

    // --- Vibrant Minecraft Materials ---
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x55aa33, roughness: 0.75 });
    const dirtMat = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.95 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x626e7a, roughness: 0.95 });
    const oakLeafMat = new THREE.MeshStandardMaterial({ color: 0x347d34, roughness: 0.75 });
    const birchLeafMat = new THREE.MeshStandardMaterial({ color: 0x48a648, roughness: 0.75 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4624, roughness: 0.9 });
    const birchWoodMat = new THREE.MeshStandardMaterial({ color: 0xd6d3cb, roughness: 0.85 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xb89260, roughness: 0.85 });
    const torchWoodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa22, toneMapped: false });

    const blockSz = 1.0;
    const boxGeo = new THREE.BoxGeometry(blockSz, blockSz, blockSz);

    // Helper: Add a tree
    const addTree = (x: number, y: number, z: number, isBirch = false) => {
      const treeGrp = new THREE.Group();
      const trunkMaterial = isBirch ? birchWoodMat : woodMat;
      const foliageMat = isBirch ? birchLeafMat : oakLeafMat;

      // Trunk (4 blocks high)
      for (let ty = 0; ty < 4; ty++) {
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.0, 0.35), trunkMaterial);
        trunk.position.set(x, y + ty * 1.0 + 0.5, z);
        treeGrp.add(trunk);
      }

      // Dense 3-tier leaf canopy
      const leafSizes = [2.6, 2.0, 1.4];
      for (let ly = 0; ly < 3; ly++) {
        const sz = leafSizes[ly];
        const leafBox = new THREE.Mesh(new THREE.BoxGeometry(sz, 0.9, sz), foliageMat);
        leafBox.position.set(x, y + 3.0 + ly * 0.85, z);
        treeGrp.add(leafBox);
      }
      return treeGrp;
    };

    // ===== 1. TOWERING LEFT CANYON WALL (Y = -2 to Y = 32) =====
    const leftCliffGrp = new THREE.Group();
    // Terraces spanning up the left side
    const yTiers = [0, 4, 8, 12, 16, 20, 24, 28, 32];
    for (let z = -18; z <= 18; z += 2.2) {
      for (const y of yTiers) {
        // Curve of canyon rim
        const edgeX = -4.5 - (32 - y) * 0.16 + Math.sin(z * 0.35 + y * 0.2) * 1.4;
        for (let step = 0; step < 4; step++) {
          const bx = edgeX - step * 1.1;
          // Top grass block
          const g = new THREE.Mesh(boxGeo, grassMat);
          g.position.set(bx, y, z);
          leftCliffGrp.add(g);

          // Underneath dirt and stone
          if (step > 0) {
            const d = new THREE.Mesh(boxGeo, dirtMat);
            d.position.set(bx, y - 1.0, z);
            leftCliffGrp.add(d);
          }
          if (step > 1) {
            const s = new THREE.Mesh(boxGeo, stoneMat);
            s.position.set(bx, y - 2.0, z);
            leftCliffGrp.add(s);
          }
        }

        // Add oak trees on shelves (especially at high elevations Y = 20, 24, 28)
        if ((y === 20 || y === 24 || y === 28 || y === 8) && Math.abs(z % 6) < 1.5) {
          leftCliffGrp.add(addTree(edgeX - 1.5, y + 0.5, z, false));
        }

        // Hanging leaf vines along cliff faces
        if ((y === 24 || y === 28) && Math.abs(z % 4) < 1.2) {
          const vine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), oakLeafMat);
          vine.position.set(edgeX + 0.2, y - 1.2, z);
          leftCliffGrp.add(vine);
        }
      }
    }
    this.environmentGroup.add(leftCliffGrp);

    // ===== 2. TOWERING RIGHT CANYON WALL (Y = -2 to Y = 32) =====
    const rightCliffGrp = new THREE.Group();
    for (let z = -18; z <= 18; z += 2.2) {
      for (const y of yTiers) {
        const edgeX = 4.5 + (32 - y) * 0.16 + Math.cos(z * 0.32 + y * 0.18) * 1.4;
        for (let step = 0; step < 4; step++) {
          const bx = edgeX + step * 1.1;
          const g = new THREE.Mesh(boxGeo, grassMat);
          g.position.set(bx, y, z);
          rightCliffGrp.add(g);

          if (step > 0) {
            const d = new THREE.Mesh(boxGeo, dirtMat);
            d.position.set(bx, y - 1.0, z);
            rightCliffGrp.add(d);
          }
          if (step > 1) {
            const s = new THREE.Mesh(boxGeo, stoneMat);
            s.position.set(bx, y - 2.0, z);
            rightCliffGrp.add(s);
          }
        }

        // Birch trees on right ledges
        if ((y === 20 || y === 24 || y === 28 || y === 12) && Math.abs(z % 6) < 1.5) {
          rightCliffGrp.add(addTree(edgeX + 1.5, y + 0.5, z, true));
        }

        // Hanging birch leaves
        if ((y === 24 || y === 28) && Math.abs(z % 5) < 1.2) {
          const vine = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.4), birchLeafMat);
          vine.position.set(edgeX - 0.2, y - 1.2, z);
          rightCliffGrp.add(vine);
        }
      }
    }
    this.environmentGroup.add(rightCliffGrp);

    // ===== 3. CENTER RAVINE FLOOR & WOODEN PLANK PATH =====
    const floorY = CONFIG.landingY - 2.45;
    const pathGrp = new THREE.Group();

    // Canyon floor grass bed
    for (let z = -20; z <= 20; z += 1.2) {
      for (let x = -4; x <= 4; x += 1.2) {
        const fGrass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), grassMat);
        fGrass.position.set(x, floorY, z);
        pathGrp.add(fGrass);
      }
    }

    // Wooden plank walkway down center
    for (let z = -20; z <= 20; z += 1.0) {
      const pathCurve = Math.sin(z * 0.16) * 0.8;
      for (let px = -1; px <= 1; px++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.12, 0.95), plankMat);
        plank.position.set(pathCurve + px * 0.95, floorY + 0.26, z);
        pathGrp.add(plank);
      }
    }

    // Glowing Minecraft torches on fence posts along the path
    const torchZCoords = [-14, -8, -2, 4, 10, 16];
    for (let i = 0; i < torchZCoords.length; i++) {
      const tz = torchZCoords[i];
      const tx = Math.sin(tz * 0.16) * 0.8 + (i % 2 === 0 ? -1.8 : 1.8);

      // Fence post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.85, 0.16), torchWoodMat);
      post.position.set(tx, floorY + 0.65, tz);
      pathGrp.add(post);

      // Torch flame block
      const flame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.18), flameMat);
      flame.position.set(tx, floorY + 1.15, tz);
      pathGrp.add(flame);

      // Warm torch light
      const torchLight = new THREE.PointLight(0xffaa33, 2.4, 7.5, 1.5);
      torchLight.position.set(tx, floorY + 1.25, tz);
      pathGrp.add(torchLight);
    }

    this.environmentGroup.add(pathGrp);

    // ===== 4. WATER STREAM (along ravine floor) =====
    const waterGeo = new THREE.PlaneGeometry(3.5, 42, 4, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x1e88e5,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.82,
    });
    this.waterPlane = new THREE.Mesh(waterGeo, waterMat);
    this.waterPlane.rotation.x = -Math.PI / 2;
    this.waterPlane.position.set(2.2, floorY + 0.28, 0);
    this.environmentGroup.add(this.waterPlane);

    // ===== 5. HIGH SKY ARCH & UPPER FLOATING ISLANDS (Y = 22 to 26) =====
    // Visible immediately when Steve starts at Y = 22!
    const skyArchGrp = new THREE.Group();

    // High natural stone bridge across the canyon behind Steve
    for (let ax = -5; ax <= 5; ax += 1.0) {
      const archY = 24.5 - Math.abs(ax) * 0.15;
      const archBlock = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.8), stoneMat);
      archBlock.position.set(ax, archY, -7);
      skyArchGrp.add(archBlock);

      // Grass & planks across the bridge
      const archTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.15, 1.8), plankMat);
      archTop.position.set(ax, archY + 0.45, -7);
      skyArchGrp.add(archTop);
    }

    // High floating island on the left
    const highIslandLeft = new THREE.Group();
    highIslandLeft.position.set(-8, 23.5, 1);
    const islBelly = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.0, 3.5), dirtMat);
    islBelly.position.y = -1.0;
    highIslandLeft.add(islBelly);
    const islTop = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.4, 3.7), grassMat);
    highIslandLeft.add(islTop);
    highIslandLeft.add(addTree(-0.5, 0.2, 0, false));
    skyArchGrp.add(highIslandLeft);

    // High floating island on the right
    const highIslandRight = new THREE.Group();
    highIslandRight.position.set(8.5, 22.0, -1);
    const islBellyR = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 3.2), dirtMat);
    islBellyR.position.y = -0.9;
    highIslandRight.add(islBellyR);
    const islTopR = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.4, 3.4), grassMat);
    highIslandRight.add(islTopR);
    highIslandRight.add(addTree(0.4, 0.2, 0, true));
    skyArchGrp.add(highIslandRight);

    this.environmentGroup.add(skyArchGrp);
    this.scene.add(this.environmentGroup);

    // Waterfall particles cascading down the canyon cliff faces
    this.initWaterfalls();
  }

  private initWaterfalls() {
    this.waterfallParticles = [];
    const fallColors = [0x38bdf8, 0x0284c7, 0x60a5fa];
    const cascadeOrigins = [
      { x: -5.2, startY: 26, endY: 2, z: -3 },
      { x: 5.6, startY: 24, endY: 2, z: 2 },
    ];

    for (const cascade of cascadeOrigins) {
      const pCount = 28;
      const positions = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        positions[i * 3] = cascade.x + (Math.random() - 0.5) * 0.6;
        positions[i * 3 + 1] = cascade.startY - (i / pCount) * (cascade.startY - cascade.endY);
        positions[i * 3 + 2] = cascade.z + (Math.random() - 0.5) * 0.4;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const pMat = new THREE.PointsMaterial({
        color: fallColors[Math.floor(Math.random() * fallColors.length)],
        size: 0.22,
        transparent: true,
        opacity: 0.75,
      });
      const pts = new THREE.Points(pGeo, pMat);
      this.waterfallParticles.push(pts);
      this.scene.add(pts);
    }
  }

  // ============================================================
  // SKY INSCRIPTION — Cloud voxel blocks spelling VISHVAKARMA 2.0
  // Disperses outward as Steve falls through
  // ============================================================
  private initSkyInscription() {
    this.skyInscriptionGroup = new THREE.Group();
    this.skyInscriptionGroup.position.set(0, 19, -2);

    const cloudGeo = new THREE.BoxGeometry(0.65, 0.35, 0.45);
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.78,
      toneMapped: false,
    });
    this.skyCloudBlocks = new THREE.InstancedMesh(cloudGeo, cloudMat, this.skyCloudCount);

    const matrix = new THREE.Matrix4();
    const rng = (seed: number, scale: number) => (Math.sin(seed * 127.1) * 43758.5453 % 1) * scale;

    for (let i = 0; i < this.skyCloudCount; i++) {
      const angle = (i / this.skyCloudCount) * Math.PI * 2;
      const radius = 2.5 + rng(i, 2.5);
      const seed = { x: Math.cos(angle) * radius, y: rng(i + 10, 1.2) - 0.6, z: rng(i + 20, 1.2) - 0.6 };
      this.skyCloudSeeds.push(seed);
      matrix.setPosition(seed.x, seed.y, seed.z);
      this.skyCloudBlocks.setMatrixAt(i, matrix);
    }
    this.skyCloudBlocks.instanceMatrix.needsUpdate = true;
    this.skyInscriptionGroup.add(this.skyCloudBlocks);
    this.scene.add(this.skyInscriptionGroup);
  }

  private initLandingPuff() {
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color: '#fef6e4', transparent: true, opacity: 0 });
    this.landingPuffMesh = new THREE.InstancedMesh(geo, mat, this.landingPuffCount);
    this.scene.add(this.landingPuffMesh);
  }

  private triggerLandingDust() {
    this.landingTriggered = true;
    this.landingPuffStartTime = performance.now();
  }

  private initHerobrineEasterEgg() {
    this.herobrineGroup = new THREE.Group();
    this.herobrineGroup.position.set(-13, CONFIG.landingY + 5.5, -18); // Far on distant mountain
    this.herobrineGroup.scale.setScalar(0.3);

    const bodyMat = new THREE.MeshBasicMaterial({ color: '#0a0f18' });
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), bodyMat);
    head.position.y = 1.8;
    this.herobrineGroup.add(head);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.75, 0.25), bodyMat);
    torso.position.y = 1.2;
    this.herobrineGroup.add(torso);

    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeMat);
    eyeL.position.set(-0.12, 1.86, 0.26);
    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), eyeMat);
    eyeR.position.set(0.12, 1.86, 0.26);
    this.herobrineGroup.add(eyeL, eyeR);

    this.scene.add(this.herobrineGroup);
  }

  // ============================================================
  // NETHER PORTAL — Rectangular obsidian frame + plasma vortex
  // ============================================================
  private initNetherPortal() {
    this.portalGroup.position.set(0, CONFIG.landingY + 1.9, -1.0);
    this.portalGroup.scale.setScalar(0);

    const frameW = 2.0;  // Portal width
    const frameH = 2.8;  // Portal height
    const blockSz = 0.18;
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x100828,
      emissive: 0x7c3cff,
      emissiveIntensity: 0.85,
      roughness: 0.4,
      metalness: 0.3,
    });
    const blockGeo = new THREE.BoxGeometry(blockSz, blockSz, blockSz);

    // Build rectangular frame blocks
    const frameBlocks: Array<[number, number]> = [];
    const stepsW = Math.ceil(frameW / blockSz);
    const stepsH = Math.ceil(frameH / blockSz);

    // Top and bottom edges
    for (let s = 0; s <= stepsW; s++) {
      const x = -frameW / 2 + (s / stepsW) * frameW;
      frameBlocks.push([x, frameH / 2]);   // top
      frameBlocks.push([x, -frameH / 2]);  // bottom
    }
    // Left and right edges (skip corners)
    for (let s = 1; s < stepsH; s++) {
      const y = -frameH / 2 + (s / stepsH) * frameH;
      frameBlocks.push([-frameW / 2, y]);  // left
      frameBlocks.push([frameW / 2, y]);   // right
    }

    this.portalFrameMesh = new THREE.InstancedMesh(blockGeo, obsidianMat, frameBlocks.length);
    const matrix = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const sc = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < frameBlocks.length; i++) {
      pos.set(frameBlocks[i][0], frameBlocks[i][1], 0);
      matrix.compose(pos, q, sc);
      this.portalFrameMesh.setMatrixAt(i, matrix);
    }
    this.portalFrameMesh.instanceMatrix.needsUpdate = true;
    this.portalGroup.add(this.portalFrameMesh);

    // Inner vortex
    this.portalCanvas = document.createElement('canvas');
    this.portalCanvas.width = 128;
    this.portalCanvas.height = 192; // Taller to match frame ratio
    this.updateVortexCanvas(0);
    this.portalTexture = new THREE.CanvasTexture(this.portalCanvas);
    this.portalTexture.colorSpace = THREE.SRGBColorSpace;

    const vortexGeo = new THREE.PlaneGeometry(frameW - blockSz, frameH - blockSz);
    const vortexMat = new THREE.MeshBasicMaterial({
      map: this.portalTexture,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    this.portalVortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
    this.portalGroup.add(this.portalVortexMesh);

    // Point light — portal glow
    this.portalLight = new THREE.PointLight(0xff2daa, 0, 10, 2.0);
    this.portalLight.position.set(0, 0, 0.3);
    this.portalGroup.add(this.portalLight);

    // Orbiting energy particles
    const pCount = 32;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const angle = (i / pCount) * Math.PI * 2;
      const rMix = 0.7 + Math.random() * 0.4;
      pPos[i * 3] = Math.cos(angle) * (frameW / 2) * rMix;
      pPos[i * 3 + 1] = Math.sin(angle) * (frameH / 2) * rMix;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x00e5e5, size: 0.07, transparent: true, opacity: 0.88 });
    this.portalParticles = new THREE.Points(pGeo, pMat);
    this.portalGroup.add(this.portalParticles);

    // Stone portal pillars flanking portal
    this.portalPillars = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.9 });
    const pillarGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const pillarH = 16;
    const pillarXs = [-frameW / 2 - 0.42, frameW / 2 + 0.42];
    for (const px of pillarXs) {
      for (let ph = 0; ph < pillarH; ph++) {
        const block = new THREE.Mesh(pillarGeo, pillarMat);
        block.position.set(px, -frameH / 2 + ph * 0.3 + 0.15, 0);
        this.portalPillars.add(block);
      }
    }
    this.portalGroup.add(this.portalPillars);
  }

  private updateVortexCanvas(phase: number) {
    const ctx = this.portalCanvas.getContext('2d');
    if (!ctx) return;
    const w = 128;
    const h = 192;
    const cx = 64;
    const cy = 96;

    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 72);
    grad.addColorStop(0, '#00e5e5');
    grad.addColorStop(0.25, '#8b5cf6');
    grad.addColorStop(0.55, '#7c3aed');
    grad.addColorStop(0.78, '#4c1d95');
    grad.addColorStop(1, '#08111f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Swirl arms
    ctx.strokeStyle = 'rgba(255, 45, 170, 0.48)';
    ctx.lineWidth = 3;
    for (let arm = 0; arm < 3; arm++) {
      ctx.beginPath();
      for (let r = 6; r < 64; r += 3) {
        const a = phase * 2.5 + (arm * Math.PI * 2) / 3 + r * 0.095;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r * 1.3;
        if (r === 6) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Bright core
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
    core.addColorStop(0, 'rgba(200, 255, 255, 0.9)');
    core.addColorStop(1, 'rgba(0, 229, 229, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  async load() {
    const results = await Promise.allSettled([Steve(), WorldCube()]);
    if (results[0].status === 'fulfilled') {
      this.steve = results[0].value;
      this.scene.add(this.steve.group);
    }
    if (results[1].status === 'fulfilled') {
      this.world = results[1].value;
      this.scene.add(this.world.group);
    }
    const failure = results.find((r) => r.status === 'rejected');
    if (failure && 'reason' in failure) throw failure.reason;
    if (this.disposed) {
      this.disposeResources();
      return;
    }
    this.ready = true;
    this.requestFrame();
  }

  setProgress(progress: number) {
    if (this.isEnteringPortal) return;
    this.target = progress;
    this.requestFrame();
  }

  enterPortal(onComplete: () => void) {
    if (this.isEnteringPortal) return;
    this.isEnteringPortal = true;
    this.portalEntryStartTime = performance.now();
    this.onPortalEntryComplete = onComplete;
    this.requestFrame();
  }

  requestFrame() {
    if (this.disposed || this.frame || document.hidden) return;
    this.frame = requestAnimationFrame((time) => this.render(time));
  }

  render(time: number) {
    this.frame = 0;
    if (this.disposed) return;
    const dt = this.previousTime ? Math.min((time - this.previousTime) / 1000, 0.05) : 1 / 60;
    this.previousTime = time;

    // ── PORTAL ENTRY SEQUENCE ──
    if (this.isEnteringPortal) {
      const elapsed = time - this.portalEntryStartTime;
      const t = Math.min(1, elapsed / this.portalEntryDuration);
      const easeT = t * t * (3 - 2 * t);

      if (this.steve) this.steve.walkIntoPortal(easeT);

      this.portalGroup.scale.setScalar(1 + easeT * 4.5);
      this.portalLight.intensity = 3.5 + easeT * 12.0;

      const portalTargetPos = new THREE.Vector3(0, CONFIG.landingY + 1.9, -1.0);
      this.camera.position.lerp(
        new THREE.Vector3(0, CONFIG.landingY + 1.9, 0.5 - easeT * 1.5),
        0.12
      );
      this.camera.lookAt(portalTargetPos);

      this.portalVortexMesh.rotation.z += 0.1;
      this.portalParticles.rotation.z -= 0.07;
      this.updateVortexCanvas(time * 0.007);
      this.portalTexture.needsUpdate = true;

      this.renderer.render(this.scene, this.camera);
      if (t >= 1) {
        if (this.onPortalEntryComplete) this.onPortalEntryComplete();
        return;
      }
      this.requestFrame();
      return;
    }

    // ── TIMELINE PROGRESSION ──
    this.progress += (this.target - this.progress) * (this.motionPreference.matches ? 1 : 1 - Math.exp(-dt * 13));
    if (Math.abs(this.target - this.progress) < 0.00001) this.progress = this.target;

    const state = sampleTimeline(this.progress, this.state);
    const mobile = this.camera.aspect < 0.85;
    const reveal = state.reveal ?? 0;
    const dive = state.diveProgress ?? 0;
    const diveFactor = 1 - dive * 0.45;
    const baseDistance = mix(mobile ? 1.65 : 1, mobile ? CONFIG.cameraMobileDistance : CONFIG.cameraDesktopDistance, reveal);
    const finalDistance = baseDistance * diveFactor;
    const followY = mix((state.y ?? 0) + (mobile ? 2.05 : 2.55), 1.5, reveal) - dive * 0.65;

    this.lookAt.set(0, followY, 0);
    this.camera.position.set(
      mix(CONFIG.cameraFallX, CONFIG.cameraWorldX, reveal) * finalDistance,
      followY + mix(1.2, 4.5, reveal) * finalDistance,
      mix(CONFIG.cameraFallZ, CONFIG.cameraWorldZ, reveal) * finalDistance
    );

    // Camera micro-shake on Steve's landing impact
    if (this.landingTriggered) {
      const shakeElapsed = time - this.landingPuffStartTime;
      if (shakeElapsed < 280) {
        const shake = (1 - shakeElapsed / 280) * 0.04;
        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
      }
    }
    this.camera.lookAt(this.lookAt);

    // Live world coordinates for HUD
    state.coordinates = {
      x: Math.round(this.camera.position.x * 6),
      y: Math.round((state.y ?? 2.2) * 12 + 64),
      z: Math.round(this.camera.position.z * 6),
    };

    // ── ENVIRONMENT ANIMATIONS ──

    // Voxel sun always faces camera
    if (this.voxelSunGroup) {
      this.voxelSunGroup.lookAt(this.camera.position);
    }

    // Floating islands gentle bob
    if (this.floatingIslandsGroup) {
      this.floatingIslandsGroup.position.y = Math.sin(time * 0.00065) * 0.25;
    }

    // Waterfall particles animate downward (Y offset cycling)
    for (const pts of this.waterfallParticles) {
      (pts.material as THREE.PointsMaterial).opacity = 0.55 + Math.sin(time * 0.002) * 0.1;
      pts.position.y = -((time * 0.0008) % 1) * 1.5;
    }

    // Water plane subtle ripple via opacity/slight offset
    if (this.waterPlane) {
      (this.waterPlane.material as THREE.MeshStandardMaterial).opacity =
        0.68 + Math.sin(time * 0.0014) * 0.08;
    }

    // Fog color shifts from emerald green toward portal purple near the end
    if (this.sceneFog) {
      const portalProg = state.portalProgress ?? 0;
      const fogR = mix(0x23 / 255, 0x4a / 255, portalProg);
      const fogG = mix(0x4a / 255, 0x1a / 255, portalProg);
      const fogB = mix(0x35 / 255, 0x6e / 255, portalProg);
      this.sceneFog.color.setRGB(fogR, fogG, fogB);
      this.sceneFog.density = mix(0.012, 0.016, portalProg);
    }

    // ── SKY INSCRIPTION DISPERSION ──
    if (this.skyInscriptionGroup) {
      if (this.progress < 0.15) {
        this.skyInscriptionGroup.visible = true;
        const disperseT = Math.max(0, this.progress / 0.13);
        const cloudMatrix = new THREE.Matrix4();
        for (let i = 0; i < this.skyCloudCount; i++) {
          const seed = this.skyCloudSeeds[i];
          const spread = disperseT * 7.5;
          const dir = (i % 2 === 0 ? 1 : -1);
          cloudMatrix.setPosition(
            seed.x * (1 + spread * 0.5) + dir * spread * 0.6,
            seed.y + spread * 0.25,
            seed.z + (i % 3 - 1) * spread * 0.35
          );
          this.skyCloudBlocks.setMatrixAt(i, cloudMatrix);
        }
        this.skyCloudBlocks.instanceMatrix.needsUpdate = true;
        const cloudOpacity = Math.max(0, (1 - disperseT) * 0.78);
        (this.skyCloudBlocks.material as THREE.MeshBasicMaterial).opacity = cloudOpacity;
      } else {
        this.skyInscriptionGroup.visible = false;
      }
    }

    // ── STEVE & WORLD CUBE ──
    if (this.ready && this.world && this.steve) {
      const worldTurn = state.worldTurn ?? 0;
      const index = Math.min(CONFIG.transitionCount - 1, Math.floor(worldTurn));
      const fraction = worldTurn - index;
      this.world.group.quaternion.slerpQuaternions(
        this.orientations[index],
        this.orientations[index + 1],
        fraction
      );

      this.compensation.copy(this.world.group.quaternion).invert();
      this.steve.group.quaternion.copy(this.world.group.quaternion).multiply(this.compensation);
      this.steve.pose(state, this.motionPreference.matches);
      this.steve.group.visible = true;
      const fall = state.fall ?? 0;
      const air = state.air ?? 0;
      (this.contactShadow.material as THREE.MeshBasicMaterial).opacity =
        (1 - fall) * Math.pow(1 - air, 4);

      if (state.hasLanded && !this.landingTriggered) {
        this.triggerLandingDust();
      }

      // Landing dust puff animation
      if (this.landingTriggered && this.landingPuffMesh) {
        const puffElapsed = time - this.landingPuffStartTime;
        if (puffElapsed < 700) {
          const pt = puffElapsed / 700;
          const pMatrix = new THREE.Matrix4();
          const pPos = new THREE.Vector3();
          const pScale = new THREE.Vector3();
          for (let i = 0; i < this.landingPuffCount; i++) {
            const angle = (i / this.landingPuffCount) * Math.PI * 2;
            const r = 0.4 + pt * 0.95;
            pPos.set(Math.cos(angle) * r, CONFIG.landingY + 0.05 + Math.sin(pt * Math.PI) * 0.3, Math.sin(angle) * r);
            const s = (1 - pt) * 0.08;
            pScale.set(s, s, s);
            pMatrix.compose(pPos, new THREE.Quaternion(), pScale);
            this.landingPuffMesh.setMatrixAt(i, pMatrix);
          }
          this.landingPuffMesh.instanceMatrix.needsUpdate = true;
          (this.landingPuffMesh.material as THREE.MeshBasicMaterial).opacity = (1 - pt) * 0.8;
        } else {
          (this.landingPuffMesh.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Portal scale animation
      const targetPortalScale = state.portalActive ? 1 : 0;
      this.portalScale += (targetPortalScale - this.portalScale) * 0.10;
      this.portalGroup.scale.setScalar(Math.max(0.001, this.portalScale));
      this.portalLight.intensity = this.portalScale * 3.2;

      if (this.portalScale > 0.05) {
        this.portalVortexMesh.rotation.z += 0.022;
        this.portalParticles.rotation.z -= 0.014;
        if (Math.round(time * 60) % 2 === 0) {
          this.updateVortexCanvas(time * 0.0018);
          this.portalTexture.needsUpdate = true;
        }
      }
    }

    this.clouds.update(state, this.camera.aspect);
    this.renderer.render(this.scene, this.camera);
    this.onUpdate(state);

    const needsLoop =
      this.progress !== this.target ||
      this.portalScale > 0.01 ||
      this.landingTriggered ||
      this.progress < 0.15 ||
      this.waterfallParticles.length > 0;

    if (needsLoop) this.requestFrame();
  }

  disposeResources() {
    const resources = new Set<any>();
    this.scene.traverse((node: any) => {
      if (node.geometry) resources.add(node.geometry);
      if (node.material) {
        for (const m of Array.isArray(node.material) ? node.material : [node.material]) {
          resources.add(m);
        }
      }
      if (node.isInstancedMesh) node.dispose();
    });
    resources.forEach((r) => r.dispose());
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    document.removeEventListener('visibilitychange', this.visibility);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost);
    this.disposeResources();
    this.shadowTexture.dispose();
    this.portalTexture?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
