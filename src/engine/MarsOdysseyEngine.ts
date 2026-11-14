import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
  ABILITY_CATALOG,
  CHALLENGE_CATALOG,
  CONSUMABLE_CATALOG,
  PET_CATALOG,
  PLANET_QUIZZES,
  SCIENCE_FACTS,
  SOLAR_BODIES,
  SUIT_CATALOG,
} from '../data/catalog';
import {
  AbilityId,
  ChallengeId,
  ConsumableId,
  GameProgress,
  GraphicsQuality,
  Language,
  PetId,
  RealmId,
  SpaceVehicleMode,
  SpaceWeatherAlert,
  SuitId,
  ToastPayload,
} from '../types/game';
import { AudioSynth } from './AudioSynth';
import {
  AstronautRig,
  ModelFactory,
  MothershipRig,
  PetRig,
  SolarStationRig,
  StarfighterRig,
} from './ModelFactory';
import { ParticlePool } from './ParticlePool';
import { TextureFactory } from './TextureFactory';

export interface EngineCallbacks {
  onProgress: (progress: GameProgress) => void;
  onFactUnlock: (factId: string) => void;
  onToast: (toast: ToastPayload) => void;
}

interface CollectibleNode {
  id: string;
  kind: 'crystal' | 'ice' | 'o2';
  mesh: THREE.Group;
  collected: boolean;
  basePos: THREE.Vector3;
  phase: number;
}

interface StrandedAstronautNode {
  id: string;
  rig: AstronautRig;
  pos: THREE.Vector3;
  sosRing: THREE.Mesh;
  state: 'stranded' | 'carrying' | 'rescued';
}

interface AsteroidBody {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  radius: number;
  rotSpeed: THREE.Vector3;
}

interface SolarBodyNode {
  id: string;
  group: THREE.Group;
  mesh: THREE.Mesh;
  clouds?: THREE.Mesh;
  moon?: THREE.Mesh;
  pos: THREE.Vector3;
  discoverRadius: number;
  discovered: boolean;
}

interface ColliderCircle {
  x: number;
  z: number;
  r: number;
}

interface MarkedDuneNode {
  x: number;
  z: number;
  r: number;
  mesh: THREE.Group;
}

const COMPLETED_CHALLENGES_STORAGE_KEY = 'mars_odyssey_completed_challenges_v1';
const GRAND_TOUR_ORDER = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
const STAR_IDS = ['proxima', 'sirius', 'vega', 'polaris'];

// Module-level zero-GC math scratchpads
const _vecA = new THREE.Vector3();
const _vecB = new THREE.Vector3();
const _vecC = new THREE.Vector3();
const _vecD = new THREE.Vector3();
const _vecE = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _camGoal = new THREE.Vector3();
const _lookGoal = new THREE.Vector3();
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

export class MarsOdysseyEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;

  private renderer!: THREE.WebGLRenderer;
  private composer: EffectComposer | null = null;
  private bloomPass: UnrealBloomPass | null = null;
  private composerFailed = false;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private textures = new TextureFactory();
  private models = new ModelFactory(this.textures);
  private particles = new ParticlePool(480);
  public audio = new AudioSynth();

  private isSoftwareGl = false;
  private quality: GraphicsQuality = 'ultra';
  private contextLost = false;
  private paused = false;
  private disposed = false;

  private frameId = 0;
  private lastTime = 0;
  private elapsed = 0;
  private smoothedFps = 60;
  private progressEmitTimer = 0;
  private toastCounter = 0;

  // Lights
  private hemiLight!: THREE.HemisphereLight;
  private dirLight!: THREE.DirectionalLight;
  private rimLight!: THREE.DirectionalLight;
  private sunPointLight!: THREE.PointLight;

  // Realm Scene Roots (3 Realms)
  private showcaseGroup = new THREE.Group();
  private realmGroups: Record<RealmId, THREE.Group> = {
    space: new THREE.Group(),
    mars: new THREE.Group(),
    solar: new THREE.Group(),
  };

  // Player & Pet Rigs
  private playerAstro!: AstronautRig;
  private playerFighter!: StarfighterRig;
  private petRig: PetRig | null = null;
  private petPos = new THREE.Vector3(2, 2, 2);
  private playerPos = new THREE.Vector3(0, 2, 18);
  private prevPlayerPos = new THREE.Vector3(0, 2, 18);
  private playerVel = new THREE.Vector3();
  private playerYaw = 0;
  private grounded = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private prevTouchUp = false;
  private stepTimer = 0;
  private bumpCooldown = 0;

  // Camera
  private camYaw = 0;
  private camPitch = 0.28;
  private camSmoothPos = new THREE.Vector3(0, 6, 30);
  private camSmoothLook = new THREE.Vector3(0, 2, 18);
  private pointerDragging = false;
  private activeCamPointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Scanner Visuals
  private scannerRing!: THREE.Mesh;
  private scannerActiveTimer = 0;
  private guideBeacon!: THREE.Group;
  private guideBeaconTimer = 0;
  private guideTargetPos = new THREE.Vector3();

  // Input state
  private keys = new Set<string>();
  private touchMoveX = 0;
  private touchMoveY = 0;
  private touchUp = false;
  private touchDown = false;
  private touchBoost = false;

  // Showcase animated elements
  private showcaseFighter!: StarfighterRig;
  private showcaseAstro!: AstronautRig;
  private showcasePlanets: THREE.Object3D[] = [];
  private shootingStars: Array<{ mesh: THREE.Mesh; vel: THREE.Vector3; life: number }> = [];

  // Space Rescue entities
  private mothership!: MothershipRig;
  private spaceCollectibles: CollectibleNode[] = [];
  private strandedAstronauts: StrandedAstronautNode[] = [];
  private asteroids: AsteroidBody[] = [];
  private spaceStarMaterials: THREE.PointsMaterial[] = [];

  // Mars Base entities
  private marsCollectibles: CollectibleNode[] = [];
  private solarStations: SolarStationRig[] = [];
  private marsColliders: ColliderCircle[] = [];
  private markedDunes: MarkedDuneNode[] = [];
  private marsDustPoints!: THREE.Points;

  // Solar Map entities
  private solarBodies: SolarBodyNode[] = [];
  private solarBelt!: THREE.InstancedMesh;
  private dismissedInfoBodyId: string | null = null;

  // Challenge tracking helpers
  private asteroidDodgerDist = 0;
  private duneLastIndex = -1;
  private starHopperVisited = new Set<string>();
  private quizAttemptedBodies = new Set<string>();

  // Warp Speed-Lines
  private speedStreaks!: THREE.InstancedMesh;
  private speedStreakMat!: THREE.MeshBasicMaterial;
  private streakOffsets: Array<{ x: number; y: number; z: number; speed: number }> = [];

  // Game State
  private language: Language = 'en';
  private state: GameProgress;

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = this.detectSoftwareGl();
    this.quality = this.isSoftwareGl ? 'balanced' : 'ultra';
    this.state = this.createInitialState();

    this.initRendererAndScene();
    this.buildShowcase();
    this.buildSpaceRealm();
    this.buildMarsRealm();
    this.buildSolarRealm();
    this.initPlayerAndPet();
    this.initScannerVisuals();
    this.initSpeedStreaks();

    this.scene.add(this.particles.mesh);
    this.applyRealmVisibility();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.lastTime = performance.now();
    this.emitProgress();
    this.scheduleNextTick();
  }

  private loadCompletedChallenges(): ChallengeId[] {
    try {
      const raw = localStorage.getItem(COMPLETED_CHALLENGES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const validIds = new Set(CHALLENGE_CATALOG.map((c) => c.id));
      return parsed.filter((id): id is ChallengeId => typeof id === 'string' && validIds.has(id as ChallengeId));
    } catch {
      return [];
    }
  }

  private saveCompletedChallenges(ids: ChallengeId[]): void {
    try {
      localStorage.setItem(COMPLETED_CHALLENGES_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage quota errors
    }
  }

  private createInitialState(): GameProgress {
    return {
      screen: 'home',
      realm: 'space',
      oxygen: 100,
      shield: 100,
      fuel: 100,
      score: 0,
      credits: 400,
      speed: 0,
      scannerCooldown: 0,
      scannerMaxCooldown: 5,
      amplifierCharges: 0,
      equippedSuit: 'vanguard',
      ownedSuits: ['vanguard'],
      ownedAbilities: [],
      consumables: {
        cryo_cell: 1,
        hydrazine_pack: 1,
        telemetry_amp: 0,
      },
      equippedPet: 'scout_drone',
      ownedPets: ['scout_drone'],
      unlockedFactIds: [],
      completedChallengeIds: this.loadCompletedChallenges(),
      activeChallenge: null,
      pendingQuizBodyId: null,
      space: {
        crystals: 0,
        totalCrystals: 12,
        rescued: 0,
        totalAstronauts: 5,
        carryingCount: 0,
        nearAstronaut: false,
        nearDock: false,
        vehicleMode: 'jetpack',
        completed: false,
      },
      mars: {
        ice: 0,
        totalIce: 12,
        oxygenTanks: 0,
        totalOxygenTanks: 8,
        stationsRepaired: 0,
        totalStations: 5,
        nearStation: false,
        completed: false,
      },
      solar: {
        discoveredIds: [],
        totalBodies: SOLAR_BODIES.length,
        nearestBodyId: null,
        activeInfoBodyId: null,
        completed: false,
      },
      spaceWeather: {
        alertLevel: 'calm',
        synced: false,
        issDoseRate: 0.31,
        deepSpaceDoseRate: 0.64,
        latestFlare: 'C1.2',
      },
      pipHintKey: 'space_default',
      quality: this.quality,
      fps: this.isSoftwareGl ? 30 : 165,
      isSoftwareGl: this.isSoftwareGl,
      contextLost: false,
      allRealmsComplete: false,
      victoryShown: false,
    };
  }

  private detectSoftwareGl(): boolean {
    try {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      return true;
    }
  }

  private initRendererAndScene(): void {
    const w = Math.max(320, this.container.clientWidth || window.innerWidth);
    const h = Math.max(240, this.container.clientHeight || window.innerHeight);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.92;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.textures.setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0624);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.42;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(62, w / h, 0.2, 950);
    this.camera.position.set(0, 6, 22);

    // Balanced 3-Point Lighting (less washed-out, rich contrast)
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x3b1f4c, 0.48);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 1.18);
    this.dirLight.position.set(35, 55, 25);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.set(2048, 2048);
    this.dirLight.shadow.camera.near = 5;
    this.dirLight.shadow.camera.far = 170;
    const d = 42;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.44);
    this.rimLight.position.set(-40, 20, -35);
    this.scene.add(this.rimLight);

    this.sunPointLight = new THREE.PointLight(0xfef08a, 0, 500, 0.4);
    this.scene.add(this.sunPointLight);

    this.scene.add(this.showcaseGroup);
    this.scene.add(this.realmGroups.space);
    this.scene.add(this.realmGroups.mars);
    this.scene.add(this.realmGroups.solar);

    // Hardware-GPU Selective HDR Bloom with safe MSAA clamping & fallback
    if (!this.isSoftwareGl) {
      try {
        const maxSamples = this.renderer.capabilities.isWebGL2
          ? this.renderer.capabilities.maxSamples || 0
          : 0;
        const renderTarget = new THREE.WebGLRenderTarget(w, h, {
          type: THREE.HalfFloatType,
          samples: Math.min(4, maxSamples),
        });
        this.composer = new EffectComposer(this.renderer, renderTarget);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 0.28, 0.45, 0.90);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(new OutputPass());
      } catch {
        this.composer = null;
        this.bloomPass = null;
      }
    }

    this.applyQualitySettings();
  }

  private applyQualitySettings(): void {
    if (!this.renderer) return;
    const w = Math.max(320, this.container.clientWidth || window.innerWidth);
    const h = Math.max(240, this.container.clientHeight || window.innerHeight);

    if (this.isSoftwareGl) {
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    let targetPr = 1;
    let shadowRes = 1024;

    if (this.quality === 'ultra') {
      targetPr = Math.min(dpr, 2);
      this.renderer.shadowMap.enabled = true;
      shadowRes = 2048;
      if (this.bloomPass) this.bloomPass.enabled = true;
    } else if (this.quality === 'high') {
      targetPr = Math.min(dpr, 1.5);
      this.renderer.shadowMap.enabled = true;
      shadowRes = 1024;
      if (this.bloomPass) this.bloomPass.enabled = true;
    } else {
      targetPr = 1;
      this.renderer.shadowMap.enabled = false;
      if (this.bloomPass) this.bloomPass.enabled = false;
    }

    this.renderer.setPixelRatio(targetPr);
    if (this.composer && !this.composerFailed) {
      this.composer.setPixelRatio(targetPr);
      this.composer.setSize(w, h);
    }
    if (this.dirLight && this.dirLight.shadow.mapSize.x !== shadowRes) {
      this.dirLight.shadow.mapSize.set(shadowRes, shadowRes);
      if (this.dirLight.shadow.map) {
        this.dirLight.shadow.map.dispose();
        this.dirLight.shadow.map = null;
      }
    }
  }

  // ==================== HEIGHTMAPS ====================

  private marsHeightAt(x: number, z: number): number {
    const distCenter = Math.hypot(x, z);
    const padFlatten = THREE.MathUtils.smoothstep(distCenter, 12, 30);
    const wave =
      Math.sin(x * 0.055) * Math.cos(z * 0.055) * 2.1 +
      Math.sin(x * 0.12 + 1.2) * 0.65 +
      Math.cos(z * 0.11 - 0.5) * 0.65;
    const rim = Math.max(0, distCenter - 110) * 0.38;
    return wave * padFlatten + rim;
  }

  // ==================== BUILD SCENES ====================

  private createStarfieldLayer(count: number, spread: number, minDist: number, size: number, opacity: number): THREE.Points {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [0xffffff, 0x67e8f9, 0xfde047, 0xf472b6, 0xa5b4fc];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = minDist + Math.random() * spread;
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      pos[i * 3 + 1] = Math.cos(phi) * r;
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r;

      _color.setHex(palette[i % palette.length]);
      col[i * 3] = _color.r;
      col[i * 3 + 1] = _color.g;
      col[i * 3 + 2] = _color.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({
      size,
      map: this.textures.getGlowSprite(),
      transparent: true,
      opacity,
      vertexColors: true,
      depthWrite: false,
    });
    this.spaceStarMaterials.push(mat);
    return new THREE.Points(geo, mat);
  }

  private buildShowcase(): void {
    this.showcaseGroup.add(this.createStarfieldLayer(450, 140, 50, 0.9, 0.8));
    this.showcaseGroup.add(this.createStarfieldLayer(220, 100, 45, 2.0, 0.92));

    const suit = SUIT_CATALOG[0];
    this.showcaseFighter = this.models.createStarfighter(suit);
    this.showcaseFighter.root.position.set(-2.6, 1.8, 0);
    this.showcaseFighter.root.rotation.set(0.08, 0.55, -0.18);
    this.showcaseGroup.add(this.showcaseFighter.root);

    this.showcaseAstro = this.models.createAstronaut(suit);
    this.showcaseAstro.shadowPlane.visible = false;
    this.showcaseAstro.flameLeft.visible = true;
    this.showcaseAstro.flameRight.visible = true;
    this.showcaseAstro.root.position.set(2.8, 0.8, 1.8);
    this.showcaseAstro.root.rotation.y = -0.5;
    this.showcaseGroup.add(this.showcaseAstro.root);

    // Orbiting planets in backdrop
    const marsMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.2, 24, 18),
      new THREE.MeshStandardMaterial({
        map: this.textures.getPlanetTexture('mars', '#ef4444', '#fb923c'),
        roughness: 0.75,
      })
    );
    marsMesh.position.set(-14, 5, -18);
    this.showcaseGroup.add(marsMesh);
    this.showcasePlanets.push(marsMesh);

    const saturnGroup = new THREE.Group();
    const saturnSphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 24, 18),
      new THREE.MeshStandardMaterial({
        map: this.textures.getPlanetTexture('saturn', '#eab308', '#fef08a'),
        roughness: 0.5,
      })
    );
    saturnGroup.add(saturnSphere);
    const ringGeo = new THREE.RingGeometry(3.3, 5.5, 40);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMesh = new THREE.Mesh(
      ringGeo,
      new THREE.MeshBasicMaterial({
        map: this.textures.getSaturnRingTexture(),
        transparent: true,
        side: THREE.DoubleSide,
      })
    );
    ringMesh.rotation.z = 0.32;
    saturnGroup.add(ringMesh);
    saturnGroup.position.set(15, 6.5, -22);
    this.showcaseGroup.add(saturnGroup);
    this.showcasePlanets.push(saturnGroup);

    // Nebula glow sprites
    const glowTex = this.textures.getGlowSprite();
    const nebColors = [0xa855f7, 0x06b6d4, 0xec4899];
    nebColors.forEach((hex, idx) => {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: hex,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sp.position.set((idx - 1) * 18, 4 + idx * 2, -28);
      sp.scale.set(36, 24, 1);
      this.showcaseGroup.add(sp);
    });

    // Shooting stars
    for (let i = 0; i < 6; i++) {
      const star = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.12, 3.2),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      star.position.set(-40 + Math.random() * 80, 12 + Math.random() * 14, -25 - Math.random() * 15);
      star.rotation.z = -0.35;
      star.rotation.y = 0.4;
      this.showcaseGroup.add(star);
      this.shootingStars.push({
        mesh: star,
        vel: new THREE.Vector3(24 + Math.random() * 12, -8 - Math.random() * 5, 4),
        life: Math.random() * 3,
      });
    }
  }

  private buildSpaceRealm(): void {
    const g = this.realmGroups.space;
    g.add(this.createStarfieldLayer(750, 220, 95, 0.95, 0.78));
    g.add(this.createStarfieldLayer(280, 160, 75, 2.1, 0.95));

    // Colorful Nebula Clouds
    const glowTex = this.textures.getGlowSprite();
    const nebConfigs = [
      { pos: [-55, 18, -70], col: 0xec4899, scale: 65 },
      { pos: [65, -12, -80], col: 0x22d3ee, scale: 72 },
      { pos: [10, 38, -110], col: 0xa855f7, scale: 85 },
      { pos: [-70, -18, 45], col: 0x38bdf8, scale: 60 },
      { pos: [75, 25, 50], col: 0xf472b6, scale: 58 },
    ];
    for (const n of nebConfigs) {
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: n.col,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      sp.position.set(n.pos[0], n.pos[1], n.pos[2]);
      sp.scale.set(n.scale, n.scale * 0.72, 1);
      g.add(sp);
    }

    // Instanced decorative background asteroid belt
    const beltCount = 160;
    const rockGeo = new THREE.DodecahedronGeometry(1.4, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, metalness: 0.15 });
    const beltMesh = new THREE.InstancedMesh(rockGeo, rockMat, beltCount);
    for (let i = 0; i < beltCount; i++) {
      const a = (i / beltCount) * Math.PI * 2;
      const r = 92 + (Math.random() - 0.5) * 26;
      _dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 26, Math.sin(a) * r);
      _dummy.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      _dummy.scale.setScalar(0.6 + Math.random() * 1.4);
      _dummy.updateMatrix();
      beltMesh.setMatrixAt(i, _dummy.matrix);
      _color.setHex(i % 2 === 0 ? 0x64748b : 0x7c3aed).lerp(new THREE.Color(0x94a3b8), 0.5);
      beltMesh.setColorAt(i, _color);
    }
    beltMesh.computeBoundingSphere();
    g.add(beltMesh);

    // Mothership at (0, 2, -46)
    this.mothership = this.models.createMothership();
    this.mothership.root.position.set(0, 2, -46);
    this.mothership.root.rotation.y = -Math.PI / 2;
    g.add(this.mothership.root);

    // 12 Glowing Space Crystals
    this.spaceCollectibles = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.25;
      const r = 24 + (i % 3) * 18;
      const y = ((i % 4) - 1.5) * 4.5;
      const pos = new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r - 10);
      const mesh = this.models.createCrystal(i % 2 === 0 ? 0x22d3ee : 0xf472b6, 1.15);
      mesh.position.copy(pos);
      g.add(mesh);
      this.spaceCollectibles.push({
        id: `sp_cry_${i}`,
        kind: 'crystal',
        mesh,
        collected: false,
        basePos: pos.clone(),
        phase: i * 0.8,
      });
    }

    // 5 Stranded Waving Astronauts
    const astroCoords = [
      new THREE.Vector3(-34, 4, 14),
      new THREE.Vector3(38, -3, 18),
      new THREE.Vector3(-48, 8, -28),
      new THREE.Vector3(46, 7, -26),
      new THREE.Vector3(4, -6, 48),
    ];
    this.strandedAstronauts = astroCoords.map((pos, idx) => {
      const rig = this.models.createAstronaut(SUIT_CATALOG[(idx + 1) % SUIT_CATALOG.length]);
      rig.shadowPlane.visible = false;
      rig.root.position.copy(pos);
      g.add(rig.root);

      const sosRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.08, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85 })
      );
      sosRing.rotation.x = Math.PI / 2;
      sosRing.position.set(pos.x, pos.y + 1.1, pos.z);
      g.add(sosRing);

      return { id: `astro_${idx}`, rig, pos: pos.clone(), sosRing, state: 'stranded' };
    });

    // 14 Drifting Collision Asteroids
    this.asteroids = [];
    const astMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9, metalness: 0.1 });
    for (let i = 0; i < 14; i++) {
      const radius = 1.6 + (i % 3) * 0.7;
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(radius, 0), astMat);
      const angle = (i / 14) * Math.PI * 2;
      const dist = 22 + (i % 4) * 14;
      const pos = new THREE.Vector3(Math.cos(angle) * dist, ((i % 3) - 1) * 5, Math.sin(angle) * dist - 5);
      mesh.position.copy(pos);
      g.add(mesh);
      this.asteroids.push({
        mesh,
        pos,
        vel: new THREE.Vector3((Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 4.2),
        radius,
        rotSpeed: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
      });
    }
  }

  private buildMarsRealm(): void {
    const g = this.realmGroups.mars;

    // Terrain Plane displaced by marsHeightAt
    const geo = new THREE.PlaneGeometry(340, 340, 112, 112);
    geo.rotateX(-Math.PI / 2);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      posAttr.setY(i, this.marsHeightAt(x, z));
    }
    geo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.getMarsGround('base'),
      bumpMap: this.textures.getMarsGroundBump('base'),
      bumpScale: 0.42,
      roughness: 0.88,
      metalness: 0.04,
    });
    const ground = new THREE.Mesh(geo, groundMat);
    ground.receiveShadow = true;
    g.add(ground);

    // Atmospheric Mars Dust Particles floating softly
    const dustCount = 160;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 180;
      dustPos[i * 3 + 1] = 1 + Math.random() * 14;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    this.marsDustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        size: 0.45,
        color: 0xfdba74,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      })
    );
    g.add(this.marsDustPoints);

    // Bio-Dome Habitat
    this.marsColliders = [];
    const dome = this.models.createBioDome();
    const domeY = this.marsHeightAt(0, -18);
    dome.position.set(0, domeY, -18);
    g.add(dome);
    this.marsColliders.push({ x: 0, z: -18, r: 9.2 });

    // Comms Tower
    const towerGroup = new THREE.Group();
    const towerY = this.marsHeightAt(-20, -14);
    towerGroup.position.set(-20, towerY, -14);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.55 });
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 11, 8), towerMat);
    mast.position.y = 5.5;
    mast.castShadow = true;
    towerGroup.add(mast);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(2.0, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.4),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.6 })
    );
    dish.position.y = 11.2;
    dish.rotation.x = 0.7;
    towerGroup.add(dish);
    g.add(towerGroup);
    this.marsColliders.push({ x: -20, z: -14, r: 1.5 });

    // Instanced Mars Rocks + Colliders
    const rockCount = 46;
    const rockMesh = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1.3, 0),
      new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.9, metalness: 0.05 }),
      rockCount
    );
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    for (let i = 0; i < rockCount; i++) {
      const a = (i / rockCount) * Math.PI * 2 + (i % 3) * 0.14;
      const dist = 24 + ((i * 19) % 72);
      const rx = Math.cos(a) * dist;
      const rz = Math.sin(a) * dist;
      const ry = this.marsHeightAt(rx, rz);
      const sc = 0.8 + (i % 4) * 0.45;
      _dummy.position.set(rx, ry + sc * 0.45, rz);
      _dummy.rotation.set(i * 0.4, i * 0.8, 0);
      _dummy.scale.set(sc * 1.2, sc * 0.85, sc);
      _dummy.updateMatrix();
      rockMesh.setMatrixAt(i, _dummy.matrix);
      _color.setHex(i % 2 === 0 ? 0x9a3412 : 0xb45309);
      rockMesh.setColorAt(i, _color);
      this.marsColliders.push({ x: rx, z: rz, r: sc * 1.15 });
    }
    rockMesh.computeBoundingSphere();
    g.add(rockMesh);

    // 6 Marked Dune Jump Rings for Dune Jumper Challenge
    const duneCoords: Array<[number, number]> = [
      [-14, 18],
      [-4, 30],
      [12, 34],
      [24, 22],
      [22, 4],
      [10, -6],
    ];
    this.markedDunes = duneCoords.map(([dx, dz]) => {
      const ring = this.models.createMarkedDuneRing();
      ring.position.set(dx, this.marsHeightAt(dx, dz), dz);
      g.add(ring);
      return { x: dx, z: dz, r: 3.3, mesh: ring };
    });

    // 5 Repairable Solar Stations
    const stationCoords: Array<[number, number]> = [
      [-32, 16],
      [30, 12],
      [26, -34],
      [-28, -42],
      [4, 48],
    ];
    this.solarStations = stationCoords.map(([sx, sz]) => {
      const st = this.models.createSolarStation();
      st.root.position.set(sx, this.marsHeightAt(sx, sz), sz);
      g.add(st.root);
      this.marsColliders.push({ x: sx, z: sz, r: 1.4 });
      return st;
    });

    // 12 Blue Water-Ice Crystals + 8 Oxygen Tanks
    this.marsCollectibles = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.15;
      const dist = 16 + (i % 3) * 20;
      const cx = Math.cos(a) * dist;
      const cz = Math.sin(a) * dist;
      const cy = this.marsHeightAt(cx, cz);
      const mesh = this.models.createCrystal(0x38bdf8, 1.0);
      mesh.position.set(cx, cy, cz);
      g.add(mesh);
      this.marsCollectibles.push({
        id: `mars_ice_${i}`,
        kind: 'ice',
        mesh,
        collected: false,
        basePos: new THREE.Vector3(cx, cy, cz),
        phase: i * 0.6,
      });
    }

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const dist = 20 + (i % 2) * 26;
      const ox = Math.cos(a) * dist;
      const oz = Math.sin(a) * dist;
      const oy = this.marsHeightAt(ox, oz);
      const mesh = this.models.createOxygenTank();
      mesh.position.set(ox, oy, oz);
      g.add(mesh);
      this.marsCollectibles.push({
        id: `mars_o2_${i}`,
        kind: 'o2',
        mesh,
        collected: false,
        basePos: new THREE.Vector3(ox, oy, oz),
        phase: i * 0.9,
      });
    }
  }

  private buildSolarRealm(): void {
    const g = this.realmGroups.solar;
    g.add(this.createStarfieldLayer(950, 420, 340, 1.1, 0.8));
    g.add(this.createStarfieldLayer(450, 360, 310, 2.3, 0.95));

    const glowTex = this.textures.getGlowSprite();
    this.solarBodies = [];

    for (const spec of SOLAR_BODIES) {
      const bodyGroup = new THREE.Group();
      const bx = Math.cos(spec.angle) * spec.distance;
      const bz = Math.sin(spec.angle) * spec.distance;
      const by = spec.elevation;
      bodyGroup.position.set(bx, by, bz);

      const tex = this.textures.getPlanetTexture(spec.id, spec.color, spec.accentColor);
      const isEmissive = spec.kind === 'sun' || spec.kind === 'star';

      const mat = isEmissive
        ? new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff })
        : new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.65,
            metalness: 0.08,
          });

      const mesh = new THREE.Mesh(new THREE.SphereGeometry(spec.radius, 32, 24), mat);
      bodyGroup.add(mesh);

      // Subtle rotating cloud shell for Earth and Venus
      let clouds: THREE.Mesh | undefined;
      if (spec.id === 'earth' || spec.id === 'venus') {
        clouds = new THREE.Mesh(
          new THREE.SphereGeometry(spec.radius * 1.03, 24, 18),
          new THREE.MeshStandardMaterial({
            color: spec.id === 'earth' ? 0xffffff : 0xfef3c7,
            transparent: true,
            opacity: spec.id === 'earth' ? 0.25 : 0.35,
            roughness: 0.9,
          })
        );
        bodyGroup.add(clouds);
      }

      // Thin atmosphere rim shell for planets
      if (spec.kind === 'planet') {
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(spec.radius * 1.09, 24, 18),
          new THREE.MeshBasicMaterial({
            color: spec.color,
            transparent: true,
            opacity: 0.14,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false,
          })
        );
        bodyGroup.add(atmo);
      }

      // Corona / atmospheric halo sprite
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: spec.color,
          transparent: true,
          opacity: isEmissive ? 0.65 : 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.scale.setScalar(spec.radius * (isEmissive ? 4.1 : 2.6));
      bodyGroup.add(halo);

      // Orbit ring guide around Sun for planets
      if (spec.kind === 'planet') {
        const orbitGeo = new THREE.RingGeometry(spec.distance - 0.18, spec.distance + 0.18, 96);
        orbitGeo.rotateX(-Math.PI / 2);
        const orbitLine = new THREE.Mesh(
          orbitGeo,
          new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.16,
            side: THREE.DoubleSide,
            depthWrite: false,
          })
        );
        g.add(orbitLine);
      }

      // Saturn's icy rings
      if (spec.hasRings) {
        const rGeo = new THREE.RingGeometry(spec.radius * 1.35, spec.radius * 2.35, 48);
        rGeo.rotateX(-Math.PI / 2);
        const rMesh = new THREE.Mesh(
          rGeo,
          new THREE.MeshBasicMaterial({
            map: this.textures.getSaturnRingTexture(),
            transparent: true,
            side: THREE.DoubleSide,
          })
        );
        rMesh.rotation.z = 0.35;
        bodyGroup.add(rMesh);
      }

      // Earth's Moon
      let moon: THREE.Mesh | undefined;
      if (spec.hasMoon) {
        moon = new THREE.Mesh(
          new THREE.SphereGeometry(1.05, 16, 12),
          new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.85 })
        );
        moon.position.set(7.5, 0.8, 0);
        bodyGroup.add(moon);
      }

      g.add(bodyGroup);
      this.solarBodies.push({
        id: spec.id,
        group: bodyGroup,
        mesh,
        clouds,
        moon,
        pos: new THREE.Vector3(bx, by, bz),
        discoverRadius: spec.radius + 14,
        discovered: false,
      });
    }

    // Instanced Asteroid Belt between Mars (76) and Jupiter (112)
    const astCount = 260;
    this.solarBelt = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.95, 0),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 }),
      astCount
    );
    for (let i = 0; i < astCount; i++) {
      const a = (i / astCount) * Math.PI * 2;
      const r = 90 + (Math.random() - 0.5) * 10;
      _dummy.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 6, Math.sin(a) * r);
      _dummy.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      _dummy.scale.setScalar(0.5 + Math.random() * 1.1);
      _dummy.updateMatrix();
      this.solarBelt.setMatrixAt(i, _dummy.matrix);
    }
    this.solarBelt.computeBoundingSphere();
    g.add(this.solarBelt);
  }

  private initPlayerAndPet(): void {
    const suit = SUIT_CATALOG[0];
    this.playerAstro = this.models.createAstronaut(suit);
    this.playerFighter = this.models.createStarfighter(suit);
    this.scene.add(this.playerAstro.root);
    this.scene.add(this.playerFighter.root);

    this.rebuildPetMesh('scout_drone');
  }

  private rebuildPetMesh(petId: PetId): void {
    if (this.petRig) {
      this.scene.remove(this.petRig.root);
    }
    const spec = PET_CATALOG.find((p) => p.id === petId) || PET_CATALOG[0];
    this.petRig = this.models.createPet(petId, spec.primaryHex, spec.accentHex);
    this.petRig.root.position.copy(this.petPos);
    this.scene.add(this.petRig.root);
  }

  private initScannerVisuals(): void {
    this.scannerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.14, 10, 48),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 })
    );
    this.scannerRing.rotation.x = Math.PI / 2;
    this.scannerRing.visible = false;
    this.scene.add(this.scannerRing);

    this.guideBeacon = new THREE.Group();
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 10), arrowMat);
    cone.rotation.x = Math.PI / 2;
    this.guideBeacon.add(cone);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 8), arrowMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = -0.8;
    this.guideBeacon.add(tail);
    this.guideBeacon.visible = false;
    this.scene.add(this.guideBeacon);
  }

  private initSpeedStreaks(): void {
    const count = 84;
    const geo = new THREE.BoxGeometry(0.035, 0.035, 2.6);
    this.speedStreakMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.speedStreaks = new THREE.InstancedMesh(geo, this.speedStreakMat, count);
    this.speedStreaks.frustumCulled = false;
    this.speedStreaks.visible = false;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const rad = 5.5 + Math.random() * 14;
      this.streakOffsets.push({
        x: Math.cos(a) * rad,
        y: Math.sin(a) * rad * 0.65,
        z: (Math.random() - 0.5) * 32,
        speed: 28 + Math.random() * 24,
      });
    }
    this.scene.add(this.speedStreaks);
  }

  // ==================== REALM SWITCHING & VISIBILITY ====================

  private applyRealmVisibility(): void {
    const isHome = this.state.screen === 'home';
    this.showcaseGroup.visible = isHome;
    (Object.keys(this.realmGroups) as RealmId[]).forEach((r) => {
      this.realmGroups[r].visible = !isHome && this.state.realm === r;
    });

    if (isHome) {
      this.playerAstro.root.visible = false;
      this.playerFighter.root.visible = false;
      if (this.petRig) this.petRig.root.visible = false;
      if (this.speedStreaks) this.speedStreaks.visible = false;
      this.scene.background = new THREE.Color(0x0b0624);
      this.scene.fog = new THREE.FogExp2(0x0b0624, 0.004);
      this.sunPointLight.intensity = 0;
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 1.18;
      this.hemiLight.intensity = 0.48;
      this.dirLight.position.set(35, 55, 25);
      this.dirLight.target.position.set(0, 0, 0);
      return;
    }

    if (this.petRig) this.petRig.root.visible = true;

    const r = this.state.realm;
    if (r === 'space') {
      this.scene.background = new THREE.Color(0x0b0624);
      this.scene.fog = new THREE.FogExp2(0x0b0624, 0.0028);
      this.sunPointLight.intensity = 0;
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 1.18;
      this.hemiLight.intensity = 0.46;
      const isFighter = this.state.space.vehicleMode === 'starfighter';
      this.playerAstro.root.visible = !isFighter;
      this.playerAstro.shadowPlane.visible = false;
      this.playerFighter.root.visible = isFighter;
    } else if (r === 'mars') {
      // Warm Martian sunset atmosphere
      this.scene.background = new THREE.Color(0x4a1d1f);
      this.scene.fog = new THREE.FogExp2(0x4a1d1f, 0.0062);
      this.sunPointLight.intensity = 0;
      this.dirLight.color.setHex(0xffcfa3);
      this.dirLight.intensity = 1.24;
      this.hemiLight.intensity = 0.48;
      this.playerAstro.root.visible = true;
      this.playerAstro.shadowPlane.visible = true;
      this.playerFighter.root.visible = false;
    } else {
      // Solar Map
      this.scene.background = new THREE.Color(0x07041a);
      this.scene.fog = new THREE.FogExp2(0x07041a, 0.0012);
      this.sunPointLight.intensity = 2.6;
      this.dirLight.color.setHex(0xfffbeb);
      this.dirLight.intensity = 0.68;
      this.hemiLight.intensity = 0.42;
      this.playerAstro.root.visible = false;
      this.playerFighter.root.visible = true;
    }
  }

  private spawnPlayerAtRealmStart(realm: RealmId): void {
    this.playerVel.set(0, 0, 0);
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.particles.clear();

    if (realm === 'space') {
      this.playerPos.set(0, 2, 16);
      this.playerYaw = Math.PI;
      this.camYaw = Math.PI;
      this.camPitch = 0.18;
      this.unlockFact('microgravity');
    } else if (realm === 'mars') {
      this.playerPos.set(0, this.marsHeightAt(0, 6), 6);
      this.playerYaw = 0;
      this.camYaw = 0;
      this.camPitch = 0.28;
      this.grounded = true;
      this.coyoteTimer = 0.14;
      this.unlockFact('mars_gravity');
    } else if (realm === 'solar') {
      this.playerPos.set(0, 8, 52);
      this.playerYaw = Math.PI;
      this.camYaw = Math.PI;
      this.camPitch = 0.22;
    }

    this.prevPlayerPos.copy(this.playerPos);
    this.petPos.copy(this.playerPos).add(new THREE.Vector3(1.8, 1.2, 1.5));
    this.camSmoothPos.copy(this.playerPos).add(new THREE.Vector3(0, 5, 12));
    this.camSmoothLook.copy(this.playerPos);
    this.applyRealmVisibility();
    this.updatePipHint();
  }

  // ==================== PUBLIC API FOR REACT ====================

  public startGame(realm: RealmId = 'space'): void {
    this.paused = false;
    this.audio.setPaused(false);
    this.audio.unlock();
    this.audio.playClick();
    this.state.screen = 'playing';
    this.state.realm = realm;
    this.state.solar.activeInfoBodyId = null;
    this.dismissedInfoBodyId = null;
    this.audio.setRealm(realm);
    this.spawnPlayerAtRealmStart(realm);
    this.emitProgress();
  }

  public switchRealm(realm: RealmId): void {
    this.paused = false;
    this.audio.setPaused(false);
    this.audio.unlock();
    this.audio.playClick();

    // Switching away cancels any active realm challenge cleanly
    if (this.state.activeChallenge && this.state.activeChallenge.realm !== realm) {
      this.state.activeChallenge = null;
      this.state.pendingQuizBodyId = null;
    }

    if (this.state.screen === 'home') {
      this.startGame(realm);
      return;
    }
    this.state.screen = 'playing';
    this.state.realm = realm;
    if (realm !== 'solar') {
      this.state.solar.activeInfoBodyId = null;
      this.dismissedInfoBodyId = null;
    }
    this.audio.setRealm(realm);
    this.spawnPlayerAtRealmStart(realm);
    this.emitProgress();
  }

  public goHome(): void {
    this.paused = false;
    this.audio.setPaused(false);
    this.audio.playClick();
    this.state.screen = 'home';
    this.state.activeChallenge = null;
    this.state.pendingQuizBodyId = null;
    this.state.solar.activeInfoBodyId = null;
    this.applyRealmVisibility();
    this.emitProgress();
  }

  public restartGame(): void {
    this.paused = false;
    this.audio.setPaused(false);
    this.audio.playClick();
    const keepQuality = this.quality;
    this.state = this.createInitialState();
    this.quality = keepQuality;
    this.state.quality = keepQuality;
    this.state.screen = 'playing';

    this.spaceCollectibles.forEach((c) => {
      c.collected = false;
      c.mesh.visible = true;
      c.mesh.position.copy(c.basePos);
    });
    this.strandedAstronauts.forEach((a) => {
      a.state = 'stranded';
      a.rig.root.visible = true;
      a.rig.root.position.copy(a.pos);
      a.sosRing.visible = true;
    });
    this.marsCollectibles.forEach((c) => {
      c.collected = false;
      c.mesh.visible = true;
      c.mesh.position.copy(c.basePos);
    });
    this.solarStations.forEach((st) => {
      st.repaired = false;
      st.panelGroup.children[0].rotation.x = 0.55;
      st.beaconMat.color.setHex(0xef4444);
      st.beaconMat.emissive.setHex(0xef4444);
    });
    this.solarBodies.forEach((b) => {
      b.discovered = false;
    });
    this.dismissedInfoBodyId = null;

    this.applySuitAppearance('vanguard');
    this.rebuildPetMesh('scout_drone');
    this.spawnPlayerAtRealmStart('space');
    this.emitProgress();
  }

  public setPaused(paused: boolean): void {
    if (this.state.screen === 'playing' && paused) {
      this.state.screen = 'paused';
    } else if (this.state.screen === 'paused' && !paused) {
      this.state.screen = 'playing';
    }
    this.paused = paused;
    this.audio.setPaused(paused);
    this.emitProgress();
  }

  public keepExploringAfterVictory(): void {
    this.audio.playClick();
    this.state.screen = 'playing';
    this.emitProgress();
  }

  public setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
    if (!muted) this.audio.playClick();
  }

  public setLanguage(lang: Language): void {
    this.language = lang;
    this.audio.playClick();
  }

  public setQuality(q: GraphicsQuality): void {
    this.quality = q;
    this.state.quality = q;
    this.applyQualitySettings();
    this.audio.playClick();
    this.emitProgress();
  }

  public setTouchInput(moveX: number, moveY: number, up: boolean, down: boolean, boost: boolean): void {
    this.touchMoveX = moveX;
    this.touchMoveY = moveY;
    if (up && !this.prevTouchUp) {
      this.jumpBufferTimer = 0.12;
    }
    this.prevTouchUp = up;
    this.touchUp = up;
    this.touchDown = down;
    this.touchBoost = boost;
  }

  public toggleVehicleMode(): void {
    if (this.state.realm !== 'space') return;
    this.audio.playClick();
    const next: SpaceVehicleMode = this.state.space.vehicleMode === 'jetpack' ? 'starfighter' : 'jetpack';
    this.state.space.vehicleMode = next;
    this.applyRealmVisibility();
    this.sendToast('vehicle_swap', { mode: next === 'starfighter' ? 'Starfighter' : 'Jetpack' }, 'info');
    this.emitProgress();
  }

  public dismissPlanetInfo(): void {
    this.dismissedInfoBodyId = this.state.solar.activeInfoBodyId;
    this.state.solar.activeInfoBodyId = null;
    this.audio.playClick();
    this.emitProgress();
  }

  // ==================== CHALLENGES API ====================

  public startChallenge(id: ChallengeId): void {
    this.audio.unlock();
    const spec = CHALLENGE_CATALOG.find((c) => c.id === id);
    if (!spec) return;

    if (spec.realm !== this.state.realm) {
      this.switchRealm(spec.realm);
    }

    this.state.pendingQuizBodyId = null;
    this.asteroidDodgerDist = 0;
    this.duneLastIndex = -1;
    this.starHopperVisited.clear();
    this.quizAttemptedBodies.clear();

    let initProgress = 0;
    let nextPlanetId: string | undefined;

    if (id === 'space_speed_rescue') {
      if (this.state.space.rescued >= 5) {
        this.strandedAstronauts.forEach((a) => {
          a.state = 'stranded';
          a.rig.root.visible = true;
          a.rig.root.position.copy(a.pos);
          a.sosRing.visible = true;
        });
        this.state.space.rescued = 0;
        this.state.space.carryingCount = 0;
        this.state.space.completed = false;
      }
      initProgress = this.state.space.rescued;
    } else if (id === 'space_crystal_chain') {
      const remaining = this.spaceCollectibles.filter((c) => !c.collected).length;
      if (remaining < 5) {
        this.spaceCollectibles.forEach((c) => {
          c.collected = false;
          c.mesh.visible = true;
          c.mesh.position.copy(c.basePos);
        });
        this.state.space.crystals = 0;
      }
    } else if (id === 'mars_oxygen_sprint') {
      const o2TanksLeft = this.marsCollectibles.filter((c) => c.kind === 'o2' && !c.collected).length;
      if (o2TanksLeft < 4) {
        this.marsCollectibles.forEach((c) => {
          if (c.kind === 'o2') {
            c.collected = false;
            c.mesh.visible = true;
            c.mesh.position.copy(c.basePos);
          }
        });
        this.state.mars.oxygenTanks = 0;
      }
      if (this.state.oxygen < 45) {
        this.state.oxygen = 70;
      }
    } else if (id === 'mars_solar_rush') {
      const brokenLeft = this.solarStations.filter((st) => !st.repaired).length;
      if (brokenLeft < 3) {
        let resetCount = 0;
        for (const st of this.solarStations) {
          if (st.repaired && resetCount < 3) {
            st.repaired = false;
            st.panelGroup.children[0].rotation.x = 0.55;
            st.beaconMat.color.setHex(0xef4444);
            st.beaconMat.emissive.setHex(0xef4444);
            resetCount++;
          }
        }
        this.state.mars.stationsRepaired = this.solarStations.filter((s) => s.repaired).length;
        this.state.mars.completed = false;
      }
    } else if (id === 'solar_grand_tour') {
      nextPlanetId = GRAND_TOUR_ORDER[0];
    }

    this.state.activeChallenge = {
      id,
      realm: spec.realm,
      progress: initProgress,
      target: spec.targetCount,
      timeRemaining: spec.timeLimitSec,
      auxTimer: 0,
      nextPlanetId,
    };

    this.audio.playRadar();
    this.sendToast(
      'challenge_started',
      { title: this.language === 'ar' ? spec.titleAr : spec.titleEn },
      'info'
    );
    this.emitProgress();
  }

  public cancelChallenge(): void {
    if (!this.state.activeChallenge) return;
    this.state.activeChallenge = null;
    this.state.pendingQuizBodyId = null;
    this.audio.playClick();
    this.emitProgress();
  }

  public submitQuizAnswer(bodyId: string, optionIndex: number): void {
    this.state.pendingQuizBodyId = null;
    const quiz = PLANET_QUIZZES.find((q) => q.bodyId === bodyId);
    if (!quiz) {
      this.emitProgress();
      return;
    }

    if (optionIndex === quiz.correctIndex) {
      if (this.state.activeChallenge?.id === 'solar_quiz_pilot') {
        this.state.activeChallenge.progress = 1;
        this.completeActiveChallenge();
      } else {
        this.awardPoints(150, 80);
        this.audio.playFanfare();
        this.emitProgress();
      }
    } else {
      if (this.state.activeChallenge?.id === 'solar_quiz_pilot') {
        this.failActiveChallenge();
      } else {
        this.emitProgress();
      }
    }
  }

  private completeActiveChallenge(): void {
    const ch = this.state.activeChallenge;
    if (!ch) return;
    const spec = CHALLENGE_CATALOG.find((c) => c.id === ch.id);
    this.state.activeChallenge = null;
    this.state.pendingQuizBodyId = null;

    if (spec) {
      if (!this.state.completedChallengeIds.includes(spec.id)) {
        this.state.completedChallengeIds.push(spec.id);
        this.saveCompletedChallenges(this.state.completedChallengeIds);
      }
      this.awardPoints(spec.rewardScore, spec.rewardCredits);
      this.audio.playFanfare();
      this.particles.burst(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, 0xfacc15, 32, 10);
      this.sendToast(
        'challenge_complete',
        {
          title: this.language === 'ar' ? spec.titleAr : spec.titleEn,
          pts: spec.rewardScore,
          credits: spec.rewardCredits,
        },
        'success'
      );
    }
    this.emitProgress();
  }

  private failActiveChallenge(): void {
    const ch = this.state.activeChallenge;
    if (!ch) return;
    const spec = CHALLENGE_CATALOG.find((c) => c.id === ch.id);
    this.state.activeChallenge = null;
    this.state.pendingQuizBodyId = null;
    this.audio.playBump();
    if (spec) {
      this.sendToast(
        'challenge_failed',
        { title: this.language === 'ar' ? spec.titleAr : spec.titleEn },
        'warning'
      );
    }
    this.emitProgress();
  }

  // ==================== ACTIONS & SCANNER ====================

  public triggerScanner(): void {
    this.audio.unlock();
    if (this.state.screen !== 'playing') return;
    if (this.state.scannerCooldown > 0) return;

    this.audio.playRadar();
    const baseCd = 5;
    let mult = 1;
    if (this.state.ownedAbilities.includes('radar')) mult *= 0.5;
    if (this.state.equippedPet === 'scout_drone') mult *= 0.85;
    this.state.scannerMaxCooldown = baseCd * mult;
    this.state.scannerCooldown = this.state.scannerMaxCooldown;

    this.scannerActiveTimer = 1.3;
    this.scannerRing.visible = true;
    this.scannerRing.position.copy(this.playerPos);
    this.scannerRing.scale.setScalar(1);

    const target = this.findNearestObjective();
    if (target) {
      this.guideTargetPos.copy(target);
      this.guideBeaconTimer = 5.5;
      this.guideBeacon.visible = true;
      this.sendToast('radar_pulse', undefined, 'info');
    }
    this.emitProgress();
  }

  public triggerAction(): void {
    this.audio.unlock();
    if (this.state.screen !== 'playing') return;

    if (this.state.realm === 'space') {
      if (this.state.space.nearDock && this.state.space.carryingCount > 0) {
        let delivered = 0;
        this.strandedAstronauts.forEach((a) => {
          if (a.state === 'carrying') {
            a.state = 'rescued';
            a.rig.root.visible = false;
            delivered++;
          }
        });
        if (delivered > 0) {
          this.state.space.rescued += delivered;
          this.state.space.carryingCount = 0;
          this.awardPoints(250 * delivered, 120 * delivered);
          this.audio.playFanfare();
          this.particles.burst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0x34d399, 28, 9);
          this.sendToast('astro_delivered', undefined, 'success');
          this.unlockFact('docking');
          this.checkRealmCompletion('space');

          if (this.state.activeChallenge?.id === 'space_speed_rescue') {
            this.state.activeChallenge.progress = this.state.space.rescued;
            if (this.state.space.rescued >= this.state.activeChallenge.target) {
              this.completeActiveChallenge();
            }
          }
        }
        this.emitProgress();
        return;
      }

      if (this.state.space.nearAstronaut) {
        const nearest = this.strandedAstronauts.find(
          (a) => a.state === 'stranded' && a.pos.distanceTo(this.playerPos) < 6.5
        );
        if (nearest) {
          nearest.state = 'carrying';
          nearest.sosRing.visible = false;
          this.state.space.carryingCount++;
          this.audio.playPickup(2);
          this.particles.burst(nearest.pos.x, nearest.pos.y, nearest.pos.z, 0xfacc15, 22, 8);
          this.sendToast('astro_pickup', undefined, 'info');
          this.emitProgress();
          return;
        }
      }
    } else if (this.state.realm === 'mars') {
      const station = this.solarStations.find(
        (st) => !st.repaired && st.root.position.distanceTo(this.playerPos) < 6.5
      );
      if (station) {
        station.repaired = true;
        station.panelGroup.children[0].rotation.x = 0.08;
        station.beaconMat.color.setHex(0x10b981);
        station.beaconMat.emissive.setHex(0x10b981);
        this.state.mars.stationsRepaired++;
        this.awardPoints(200, 100);
        this.audio.playFanfare();
        this.particles.burst(
          station.root.position.x,
          station.root.position.y + 2.5,
          station.root.position.z,
          0xfacc15,
          24,
          8
        );
        this.sendToast('station_fixed', undefined, 'success');
        this.unlockFact('solar_power');
        if (this.state.mars.stationsRepaired >= 3) {
          this.unlockFact('red_dust');
        }
        this.checkRealmCompletion('mars');

        if (this.state.activeChallenge?.id === 'mars_solar_rush') {
          this.state.activeChallenge.progress++;
          if (this.state.activeChallenge.progress >= this.state.activeChallenge.target) {
            this.completeActiveChallenge();
          }
        }
        this.emitProgress();
      }
    }
  }

  public warpToSolarBody(bodyId: string): void {
    this.audio.unlock();
    const body = this.solarBodies.find((b) => b.id === bodyId);
    const spec = SOLAR_BODIES.find((s) => s.id === bodyId);
    if (!body || !spec) return;

    if (this.state.realm !== 'solar' || this.state.screen !== 'playing') {
      this.state.screen = 'playing';
      this.state.realm = 'solar';
      this.audio.setRealm('solar');
      this.applyRealmVisibility();
    }

    // Star Hopper forbids using Warp!
    if (this.state.activeChallenge?.id === 'solar_star_hopper') {
      this.failActiveChallenge();
    }

    const offset = new THREE.Vector3(0, spec.radius * 0.45 + 2, spec.radius + 9);
    this.playerPos.copy(body.pos).add(offset);
    this.prevPlayerPos.copy(this.playerPos);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = Math.PI;
    this.camYaw = Math.PI;
    this.camSmoothPos.copy(this.playerPos).add(new THREE.Vector3(0, 5, 14));

    this.dismissedInfoBodyId = null;
    this.state.solar.activeInfoBodyId = spec.id;

    this.audio.playFanfare();
    this.particles.burst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0x38bdf8, 24, 8);
    this.sendToast('warped', { name: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'info');
    this.discoverSolarBody(body, spec);
    this.handleSolarBodyProximityChallenge(spec.id);
    this.emitProgress();
  }

  public setSpaceWeather(
    alertLevel: SpaceWeatherAlert,
    issDoseRate: number,
    deepSpaceDoseRate: number,
    latestFlare: string,
    announce = false
  ): void {
    this.state.spaceWeather = {
      alertLevel,
      synced: true,
      issDoseRate,
      deepSpaceDoseRate,
      latestFlare,
    };
    if (announce) {
      this.audio.playRadar();
      this.sendToast('weather_synced', { level: alertLevel.toUpperCase() }, 'info');
    }
    this.updatePipHint();
    this.emitProgress();
  }

  // ==================== SHOP & CONSUMABLES ====================

  public buyOrEquipSuit(suitId: SuitId): void {
    this.audio.unlock();
    const spec = SUIT_CATALOG.find((s) => s.id === suitId);
    if (!spec) return;

    if (this.state.ownedSuits.includes(suitId)) {
      this.state.equippedSuit = suitId;
      this.applySuitAppearance(suitId);
      this.audio.playClick();
      this.sendToast('equipped', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'info');
      this.emitProgress();
      return;
    }

    if (this.state.credits < spec.cost) return;
    this.state.credits -= spec.cost;
    this.state.ownedSuits.push(suitId);
    this.state.equippedSuit = suitId;
    this.applySuitAppearance(suitId);
    this.audio.playFanfare();
    this.sendToast('purchased', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');
    this.emitProgress();
  }

  private applySuitAppearance(suitId: SuitId): void {
    const spec = SUIT_CATALOG.find((s) => s.id === suitId) || SUIT_CATALOG[0];
    this.playerAstro.primaryMat.color.set(spec.primaryHex);
    this.playerAstro.accentMat.color.set(spec.accentHex);
    this.playerAstro.visorMat.color.set(spec.visorHex);
    this.playerFighter.primaryMat.color.set(spec.primaryHex);
    this.playerFighter.accentMat.color.set(spec.accentHex);
  }

  public buyAbility(abilityId: AbilityId): void {
    this.audio.unlock();
    if (this.state.ownedAbilities.includes(abilityId)) return;
    const spec = ABILITY_CATALOG.find((a) => a.id === abilityId);
    if (!spec || this.state.credits < spec.cost) return;

    this.state.credits -= spec.cost;
    this.state.ownedAbilities.push(abilityId);
    this.audio.playFanfare();
    this.sendToast('purchased', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');
    this.emitProgress();
  }

  public buyConsumable(id: ConsumableId): void {
    this.audio.unlock();
    const spec = CONSUMABLE_CATALOG.find((c) => c.id === id);
    if (!spec || this.state.credits < spec.cost) return;
    this.state.credits -= spec.cost;
    this.state.consumables[id] = (this.state.consumables[id] || 0) + 1;
    this.audio.playPickup(1);
    this.sendToast('purchased', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');
    this.emitProgress();
  }

  public useConsumable(id: ConsumableId): void {
    this.audio.unlock();
    if ((this.state.consumables[id] || 0) <= 0) return;
    const spec = CONSUMABLE_CATALOG.find((c) => c.id === id);
    if (!spec) return;

    this.state.consumables[id]--;
    if (id === 'cryo_cell') {
      this.state.oxygen = 100;
      this.state.shield = 100;
    } else if (id === 'hydrazine_pack') {
      this.state.fuel = 100;
    } else if (id === 'telemetry_amp') {
      this.state.amplifierCharges += 8;
    }

    this.audio.playFanfare();
    this.particles.burst(this.playerPos.x, this.playerPos.y + 1, this.playerPos.z, spec.accentColor, 20, 7);
    this.sendToast('consumable_used', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');
    this.emitProgress();
  }

  public buyOrEquipPet(petId: PetId): void {
    this.audio.unlock();
    const spec = PET_CATALOG.find((p) => p.id === petId);
    if (!spec) return;

    if (this.state.ownedPets.includes(petId)) {
      this.state.equippedPet = petId;
      this.rebuildPetMesh(petId);
      this.applyRealmVisibility();
      this.audio.playClick();
      this.sendToast('equipped', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'info');
      this.emitProgress();
      return;
    }

    if (this.state.credits < spec.cost) return;
    this.state.credits -= spec.cost;
    this.state.ownedPets.push(petId);
    this.state.equippedPet = petId;
    this.rebuildPetMesh(petId);
    this.applyRealmVisibility();
    this.audio.playFanfare();
    this.sendToast('purchased', { item: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');
    this.emitProgress();
  }

  // ==================== INPUT & WINDOW EVENTS ====================

  private handleKeyDown = (e: KeyboardEvent): void => {
    const code = e.code;
    this.keys.add(code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
      e.preventDefault();
    }
    this.audio.unlock();

    if (this.state.screen !== 'playing' || this.state.pendingQuizBodyId) return;
    if (code === 'Space' && !e.repeat) {
      this.jumpBufferTimer = 0.12;
    }
    if (code === 'KeyE' || code === 'Enter') this.triggerAction();
    else if (code === 'KeyF') this.triggerScanner();
    else if (code === 'KeyV') this.toggleVehicleMode();
    else if (code === 'Digit1') this.useConsumable('cryo_cell');
    else if (code === 'Digit2') this.useConsumable('hydrazine_pack');
    else if (code === 'Digit3') this.useConsumable('telemetry_amp');
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.activeCamPointerId !== null) return;
    this.activeCamPointerId = e.pointerId;
    this.pointerDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.audio.unlock();
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (!this.pointerDragging || e.pointerId !== this.activeCamPointerId || this.state.screen !== 'playing') return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.camYaw -= dx * 0.0055;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.0045, -0.35, 1.05);
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.activeCamPointerId) return;
    this.pointerDragging = false;
    this.activeCamPointerId = null;
  };

  private handleResize = (): void => {
    if (!this.container || !this.renderer) return;
    const w = Math.max(280, this.container.clientWidth || window.innerWidth);
    const h = Math.max(240, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer && !this.isSoftwareGl && !this.composerFailed) {
      this.composer.setSize(w, h);
    }
  };

  private handleContextLost = (e: Event): void => {
    e.preventDefault();
    this.contextLost = true;
    this.state.contextLost = true;
    this.emitProgress();
  };

  private handleContextRestored = (): void => {
    this.contextLost = false;
    this.state.contextLost = false;
    this.emitProgress();
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);
    window.visualViewport?.addEventListener('resize', this.handleResize);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    dom.addEventListener('webglcontextlost', this.handleContextLost);
    dom.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  // ==================== GAMEPLAY LOOP & UPDATE ====================

  private scheduleNextTick(): void {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      this.afterDraw(() => {
        if (!this.disposed) this.tick();
      });
    } else {
      this.frameId = requestAnimationFrame(() => this.tick());
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || !gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick(): void {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(0.05, Math.max(0.0002, rawDt));

    if (rawDt > 0.0002 && rawDt < 0.2) {
      const instantFps = 1 / rawDt;
      this.smoothedFps = this.smoothedFps * 0.92 + instantFps * 0.08;
      this.state.fps = Math.round(this.smoothedFps);
    }

    if (!this.paused && !this.contextLost) {
      this.elapsed += dt;
      // Gentle background star twinkle
      for (let i = 0; i < this.spaceStarMaterials.length; i++) {
        this.spaceStarMaterials[i].opacity = 0.78 + Math.sin(this.elapsed * 2.1 + i * 1.4) * 0.14;
      }

      if (this.state.screen === 'home') {
        this.updateShowcase(dt);
      } else if (this.state.screen === 'playing' && !this.state.pendingQuizBodyId) {
        this.updateGameplay(dt);
      } else if (this.state.screen === 'playing' && this.state.pendingQuizBodyId) {
        this.audio.updateLoops(0, false);
      }
      this.particles.update(dt);

      if (!this.isSoftwareGl && this.composer && !this.composerFailed && this.quality !== 'balanced') {
        try {
          this.composer.render();
        } catch {
          this.composerFailed = true;
          this.renderer.render(this.scene, this.camera);
        }
      } else {
        this.renderer.render(this.scene, this.camera);
      }
    }

    this.scheduleNextTick();
  }

  private updateShowcase(dt: number): void {
    this.audio.updateLoops(0, false);

    this.showcaseFighter.root.position.y = 1.8 + Math.sin(this.elapsed * 1.6) * 0.45;
    this.showcaseFighter.root.rotation.z = -0.16 + Math.sin(this.elapsed * 0.9) * 0.08;
    this.showcaseAstro.root.position.y = 0.8 + Math.cos(this.elapsed * 1.4) * 0.35;
    this.showcaseAstro.rightArm.rotation.z = -0.7 + Math.sin(this.elapsed * 4.0) * 0.45;

    this.showcasePlanets.forEach((p, idx) => {
      p.rotation.y += dt * (0.18 + idx * 0.06);
    });

    this.shootingStars.forEach((s) => {
      s.life -= dt;
      s.mesh.position.addScaledVector(s.vel, dt);
      if (s.life <= 0 || s.mesh.position.x > 48) {
        s.mesh.position.set(-46 + Math.random() * 20, 14 + Math.random() * 16, -24 - Math.random() * 14);
        s.life = 2.5 + Math.random() * 2.5;
      }
    });

    const camAngle = Math.sin(this.elapsed * 0.22) * 0.32;
    this.camera.position.set(Math.sin(camAngle) * 13, 3.2 + Math.sin(this.elapsed * 0.4) * 0.5, 13.5);
    this.camera.lookAt(0, 1.4, -2);
    if (Math.abs(this.camera.fov - 55) > 0.05) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, 55, 6, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  private updateGameplay(dt: number): void {
    this.prevPlayerPos.copy(this.playerPos);

    if (this.keys.has('KeyQ')) this.camYaw += 1.9 * dt;
    if (this.keys.has('KeyE') && !this.isActionContextNear()) {
      this.camYaw -= 1.9 * dt;
    }

    if (this.state.scannerCooldown > 0) {
      this.state.scannerCooldown = Math.max(0, this.state.scannerCooldown - dt);
    }
    if (this.bumpCooldown > 0) this.bumpCooldown -= dt;

    const hasRecycler = this.state.ownedAbilities.includes('recycler');
    const hasOverdrive = this.state.ownedAbilities.includes('overdrive');
    const hasMagnet = this.state.ownedAbilities.includes('magnet');
    const hasValkyrie = this.state.equippedPet === 'valkyrie_probe';
    const hasK9 = this.state.equippedPet === 'ares_k9';

    let magnetRadius = 3.6;
    if (hasMagnet) magnetRadius *= 2.2;
    if (hasK9) magnetRadius *= 1.25;

    const speedMult = hasOverdrive ? 1.25 : 1.0;
    const fuelBurnMult = hasOverdrive ? 0.72 : 1.0;

    const o2Drain = hasRecycler ? 0.32 : 0.65;
    this.state.oxygen = Math.max(0, this.state.oxygen - o2Drain * dt + (hasValkyrie ? 0.55 * dt : 0));
    const isExposedSpace = this.state.realm === 'space' || this.state.realm === 'solar';
    const stormActive = this.state.spaceWeather.synced && this.state.spaceWeather.alertLevel === 'storm' && isExposedSpace;
    if (this.state.oxygen <= 15) {
      this.state.shield = Math.max(0, this.state.shield - 4 * dt);
    } else if (stormActive) {
      const stormDrain = hasRecycler ? 0.45 : 1.1;
      this.state.shield = Math.max(0, this.state.shield - stormDrain * dt);
    } else {
      const shieldRegen = hasRecycler ? 3.5 : 1.5;
      this.state.shield = Math.min(100, this.state.shield + shieldRegen * dt);
    }

    if (this.state.shield <= 0) {
      this.state.shield = 60;
      this.state.oxygen = Math.max(55, this.state.oxygen);
      this.sendToast('great_job', undefined, 'warning');
    }

    // Identical normalized input range for keyboard and virtual joystick (no faster diagonals)
    let inX =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.touchMoveX;
    let inZ =
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) -
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) +
      this.touchMoveY;
    const len = Math.hypot(inX, inZ);
    if (len > 1) {
      inX /= len;
      inZ /= len;
    }

    const wantUp = this.keys.has('Space') || this.touchUp;
    const wantDown = this.keys.has('KeyC') || this.touchDown;
    const wantBoost = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touchBoost;

    let isThrusting = false;

    if (this.state.realm === 'space' || this.state.realm === 'solar') {
      const result = this.updateFlightPhysics(dt, inX, inZ, wantUp, wantDown, wantBoost, speedMult, fuelBurnMult, hasValkyrie);
      isThrusting = result.thrusting;
    } else if (this.state.realm === 'mars') {
      const result = this.updateMarsWalker(dt, inX, inZ, wantUp, wantBoost, speedMult, fuelBurnMult, hasValkyrie);
      isThrusting = result.thrusting;
    }

    if (this.state.realm === 'space') this.updateSpaceRealm(dt, magnetRadius);
    else if (this.state.realm === 'mars') this.updateMarsRealm(dt, magnetRadius);
    else if (this.state.realm === 'solar') this.updateSolarRealm(dt);

    // Challenge tick timers & conditions
    this.updateActiveChallenge(dt);

    this.updatePet(dt);
    this.updateScanner(dt);
    this.updateChaseCamera(dt, wantBoost && this.state.fuel > 3 && (len > 0.1 || this.state.realm === 'solar' || this.state.realm === 'space'));

    this.audio.updateLoops(isThrusting ? 1 : 0, true);
    this.updatePipHint();

    this.progressEmitTimer += dt;
    if (this.progressEmitTimer >= 0.08) {
      this.progressEmitTimer = 0;
      this.emitProgress();
    }
  }

  private updateActiveChallenge(dt: number): void {
    const ch = this.state.activeChallenge;
    if (!ch) return;

    const spec = CHALLENGE_CATALOG.find((c) => c.id === ch.id);
    if (!spec) return;

    if (spec.timeLimitSec > 0) {
      ch.timeRemaining -= dt;
      if (ch.timeRemaining <= 0) {
        this.failActiveChallenge();
        return;
      }
    }

    if (ch.id === 'space_crystal_chain' && ch.progress >= 1) {
      ch.auxTimer -= dt;
      if (ch.auxTimer <= 0) {
        this.failActiveChallenge();
        return;
      }
    } else if (ch.id === 'space_asteroid_dodger') {
      const distCenter = Math.hypot(this.playerPos.x, this.playerPos.z);
      if (distCenter > 15 && distCenter < 82) {
        const stepDist = this.playerPos.distanceTo(this.prevPlayerPos);
        this.asteroidDodgerDist += stepDist;
        ch.progress = Math.min(ch.target, Math.floor(this.asteroidDodgerDist));
        if (ch.progress >= ch.target) {
          this.completeActiveChallenge();
          return;
        }
      }
    } else if (ch.id === 'mars_oxygen_sprint') {
      if (this.state.oxygen < 30) {
        this.failActiveChallenge();
        return;
      }
    }
  }

  private isActionContextNear(): boolean {
    if (this.state.realm === 'space') {
      return this.state.space.nearAstronaut || (this.state.space.nearDock && this.state.space.carryingCount > 0);
    }
    if (this.state.realm === 'mars') {
      return this.state.mars.nearStation;
    }
    return false;
  }

  private updateFlightPhysics(
    dt: number,
    inX: number,
    inZ: number,
    wantUp: boolean,
    wantDown: boolean,
    wantBoost: boolean,
    speedMult: number,
    fuelBurnMult: number,
    hasValkyrie: boolean
  ): { thrusting: boolean } {
    const isSolar = this.state.realm === 'solar';
    const isFighter = isSolar || this.state.space.vehicleMode === 'starfighter';
    const baseSpeed = (isSolar ? 42 : isFighter ? 28 : 20) * speedMult;
    const canBoost = wantBoost && this.state.fuel > 2;
    const boostMult = canBoost ? 1.65 : 1.0;

    _forward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw)).normalize();
    _right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw)).normalize();

    _vecA.set(0, 0, 0);
    _vecA.addScaledVector(_forward, -inZ);
    _vecA.addScaledVector(_right, inX);
    if (wantUp) _vecA.y += 0.9;
    if (wantDown) _vecA.y -= 0.9;

    const inputMag = Math.min(1, _vecA.length());
    const moving = inputMag > 0.02;
    if (moving) {
      _vecA.normalize();
      const targetSpeed = baseSpeed * boostMult * inputMag;
      const accelLerp = 1 - Math.exp(-6.5 * dt);
      this.playerVel.lerp(_vecA.multiplyScalar(targetSpeed), accelLerp);
      if (Math.hypot(this.playerVel.x, this.playerVel.z) > 0.5) {
        const targetYaw = Math.atan2(this.playerVel.x, this.playerVel.z);
        this.playerYaw = this.lerpAngle(this.playerYaw, targetYaw, 1 - Math.exp(-9 * dt));
      }
      if (canBoost) {
        this.state.fuel = Math.max(0, this.state.fuel - 16 * fuelBurnMult * dt);
      } else {
        this.state.fuel = Math.min(100, this.state.fuel + (hasValkyrie ? 14 : 9) * dt);
      }
    } else {
      this.playerVel.multiplyScalar(Math.exp(-3.4 * dt));
      this.state.fuel = Math.min(100, this.state.fuel + (hasValkyrie ? 18 : 13) * dt);
    }

    this.playerPos.addScaledVector(this.playerVel, dt);
    const maxRange = isSolar ? 310 : 88;
    const maxY = isSolar ? 95 : 42;
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -maxRange, maxRange);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -maxRange, maxRange);
    this.playerPos.y = THREE.MathUtils.clamp(this.playerPos.y, -maxY, maxY);

    // Space Rescue Mothership smooth sliding collision (core hull at (0, 2, -46))
    if (!isSolar) {
      const mx = 0;
      const my = 2;
      const mz = -46;
      const dx = this.playerPos.x - mx;
      const dy = this.playerPos.y - my;
      const dz = this.playerPos.z - mz;
      const d = Math.hypot(dx, dy, dz);
      const minShipD = 6.2;
      if (d < minShipD && d > 0.001) {
        const nx = dx / d;
        const ny = dy / d;
        const nz = dz / d;
        this.playerPos.set(mx + nx * minShipD, my + ny * minShipD, mz + nz * minShipD);
        const vn = this.playerVel.x * nx + this.playerVel.y * ny + this.playerVel.z * nz;
        if (vn < 0) {
          this.playerVel.x -= vn * nx;
          this.playerVel.y -= vn * ny;
          this.playerVel.z -= vn * nz;
        }
      }
    }

    this.state.speed = Math.round(this.playerVel.length() * 3.6);

    if (isFighter) {
      this.playerFighter.root.position.copy(this.playerPos);
      this.playerFighter.root.rotation.set(
        THREE.MathUtils.clamp(-this.playerVel.y * 0.025, -0.45, 0.45),
        this.playerYaw,
        THREE.MathUtils.clamp(-inX * 0.4, -0.5, 0.5)
      );
      const flameScale = moving ? (canBoost ? 1.7 : 1.0) : 0.45;
      this.playerFighter.flameLeft.scale.set(1, flameScale, 1);
      this.playerFighter.flameRight.scale.set(1, flameScale, 1);
    } else {
      this.playerAstro.root.position.copy(this.playerPos);
      this.playerAstro.root.rotation.y = this.playerYaw;
      this.playerAstro.bodyGroup.rotation.x = moving ? 0.28 : 0.05;
      this.playerAstro.flameLeft.visible = moving;
      this.playerAstro.flameRight.visible = moving;
      this.playerAstro.leftArm.rotation.x = -0.3 + Math.sin(this.elapsed * 3) * 0.1;
      this.playerAstro.rightArm.rotation.x = -0.3 - Math.sin(this.elapsed * 3) * 0.1;
    }

    if (moving && Math.random() < (canBoost ? 0.85 : 0.35)) {
      this.particles.spawn(
        this.playerPos.x,
        this.playerPos.y + 0.5,
        this.playerPos.z,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        canBoost ? 0xf472b6 : 0x38bdf8,
        canBoost ? 1.1 : 0.75,
        0.35
      );
    }

    return { thrusting: moving };
  }

  private updateMarsWalker(
    dt: number,
    inX: number,
    inZ: number,
    wantUp: boolean,
    wantBoost: boolean,
    speedMult: number,
    fuelBurnMult: number,
    hasValkyrie: boolean
  ): { thrusting: boolean } {
    const moveSpeed = 13.5 * speedMult * (wantBoost && this.state.fuel > 2 ? 1.45 : 1.0);
    _forward.set(-Math.sin(this.camYaw), 0, -Math.cos(this.camYaw)).normalize();
    _right.set(Math.cos(this.camYaw), 0, -Math.sin(this.camYaw)).normalize();

    _vecA.set(0, 0, 0);
    _vecA.addScaledVector(_forward, -inZ);
    _vecA.addScaledVector(_right, inX);
    const inputMag = Math.min(1, _vecA.length());
    const moving = inputMag > 0.02;

    if (moving) {
      _vecA.normalize();
      const targetVx = _vecA.x * moveSpeed * inputMag;
      const targetVz = _vecA.z * moveSpeed * inputMag;
      const accelLerp = 1 - Math.exp(-9.5 * dt);
      this.playerVel.x = THREE.MathUtils.lerp(this.playerVel.x, targetVx, accelLerp);
      this.playerVel.z = THREE.MathUtils.lerp(this.playerVel.z, targetVz, accelLerp);
      const targetYaw = Math.atan2(_vecA.x, _vecA.z);
      this.playerYaw = this.lerpAngle(this.playerYaw, targetYaw, 1 - Math.exp(-12 * dt));
    } else {
      const decelLerp = 1 - Math.exp(-11.5 * dt);
      this.playerVel.x = THREE.MathUtils.lerp(this.playerVel.x, 0, decelLerp);
      this.playerVel.z = THREE.MathUtils.lerp(this.playerVel.z, 0, decelLerp);
    }

    // Coyote time & Jump buffering for crisp 0.38g Mars hops
    if (this.grounded) {
      this.coyoteTimer = 0.14;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    let thrusting = false;
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.playerVel.y = 9.8;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.audio.playFootstep();
      this.particles.burst(this.playerPos.x, this.playerPos.y + 0.15, this.playerPos.z, 0xfb923c, 8, 3.5);
    } else if (wantUp && !this.grounded && this.state.fuel > 2 && this.playerVel.y < 6.5) {
      this.playerVel.y += 17.5 * dt;
      this.playerVel.y = Math.min(this.playerVel.y, 10.5);
      this.state.fuel = Math.max(0, this.state.fuel - 20 * fuelBurnMult * dt);
      thrusting = true;
    }

    if (!thrusting) {
      this.state.fuel = Math.min(100, this.state.fuel + (hasValkyrie ? 18 : 14) * dt);
    }

    // 0.38g Mars gravity
    this.playerVel.y -= 10.6 * dt;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.z += this.playerVel.z * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Boundary sliding
    const dist = Math.hypot(this.playerPos.x, this.playerPos.z);
    if (dist > 115) {
      const nx = this.playerPos.x / dist;
      const nz = this.playerPos.z / dist;
      this.playerPos.x = nx * 115;
      this.playerPos.z = nz * 115;
      const vn = this.playerVel.x * nx + this.playerVel.z * nz;
      if (vn > 0) {
        this.playerVel.x -= vn * nx;
        this.playerVel.z -= vn * nz;
      }
    }

    // 2-pass sliding collisions against rocks, Bio-Dome, Comms tower & Solar stations
    for (let pass = 0; pass < 2; pass++) {
      for (const c of this.marsColliders) {
        const dx = this.playerPos.x - c.x;
        const dz = this.playerPos.z - c.z;
        const d = Math.hypot(dx, dz);
        const minD = c.r + 0.65;
        if (d < minD && d > 0.001) {
          const nx = dx / d;
          const nz = dz / d;
          this.playerPos.x = c.x + nx * minD;
          this.playerPos.z = c.z + nz * minD;
          const vn = this.playerVel.x * nx + this.playerVel.z * nz;
          if (vn < 0) {
            this.playerVel.x -= vn * nx;
            this.playerVel.z -= vn * nz;
          }
        }
      }
    }

    const groundY = this.marsHeightAt(this.playerPos.x, this.playerPos.z);
    const wasGrounded = this.grounded;
    if (this.playerPos.y <= groundY) {
      const impactVy = this.playerVel.y;
      this.playerPos.y = groundY;
      this.playerVel.y = 0;
      this.grounded = true;
      if (!wasGrounded) {
        if (impactVy < -4.5) {
          this.particles.burst(this.playerPos.x, groundY + 0.15, this.playerPos.z, 0xfb923c, 10, 3.8);
          this.audio.playFootstep();
        }
        this.checkDuneJumperLanding();
      }
    } else {
      this.grounded = false;
    }

    const horizSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    this.state.speed = Math.round(horizSpeed * 3.6);

    this.playerAstro.root.position.copy(this.playerPos);
    this.playerAstro.root.rotation.y = this.playerYaw;
    this.playerAstro.flameLeft.visible = thrusting;
    this.playerAstro.flameRight.visible = thrusting;

    if (this.grounded && horizSpeed > 1.2) {
      const walkPhase = this.elapsed * 11;
      this.playerAstro.leftLeg.rotation.x = Math.sin(walkPhase) * 0.6;
      this.playerAstro.rightLeg.rotation.x = -Math.sin(walkPhase) * 0.6;
      this.playerAstro.leftArm.rotation.x = -Math.sin(walkPhase) * 0.45;
      this.playerAstro.rightArm.rotation.x = Math.sin(walkPhase) * 0.45;
      this.playerAstro.bodyGroup.position.y = Math.abs(Math.sin(walkPhase)) * 0.08;

      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.3;
        this.audio.playFootstep();
        this.particles.spawn(
          this.playerPos.x,
          groundY + 0.15,
          this.playerPos.z,
          (Math.random() - 0.5) * 1.5,
          1.2,
          (Math.random() - 0.5) * 1.5,
          0xfb923c,
          0.9,
          0.45
        );
      }
    } else {
      this.playerAstro.leftLeg.rotation.x = THREE.MathUtils.damp(this.playerAstro.leftLeg.rotation.x, 0, 10, dt);
      this.playerAstro.rightLeg.rotation.x = THREE.MathUtils.damp(this.playerAstro.rightLeg.rotation.x, 0, 10, dt);
      this.playerAstro.leftArm.rotation.x = THREE.MathUtils.damp(this.playerAstro.leftArm.rotation.x, 0, 10, dt);
      this.playerAstro.rightArm.rotation.x = THREE.MathUtils.damp(this.playerAstro.rightArm.rotation.x, 0, 10, dt);
      this.playerAstro.bodyGroup.position.y = THREE.MathUtils.damp(this.playerAstro.bodyGroup.position.y, 0, 10, dt);
    }

    return { thrusting };
  }

  private checkDuneJumperLanding(): void {
    const ch = this.state.activeChallenge;
    if (!ch || ch.id !== 'mars_dune_jumper') return;

    let hitIdx = -1;
    for (let i = 0; i < this.markedDunes.length; i++) {
      const d = this.markedDunes[i];
      if (Math.hypot(this.playerPos.x - d.x, this.playerPos.z - d.z) <= d.r) {
        hitIdx = i;
        break;
      }
    }

    if (hitIdx !== -1) {
      if (hitIdx !== this.duneLastIndex) {
        this.duneLastIndex = hitIdx;
        ch.progress++;
        this.audio.playPickup(ch.progress);
        this.particles.burst(this.playerPos.x, this.playerPos.y + 0.4, this.playerPos.z, 0xfacc15, 16, 6);
        if (ch.progress >= ch.target) {
          this.completeActiveChallenge();
        }
      }
    } else if (ch.progress >= 1) {
      this.failActiveChallenge();
    }
  }

  // ==================== REALM SPECIFIC UPDATES ====================

  private updateSpaceRealm(dt: number, magnetRadius: number): void {
    this.mothership.radarDish.rotation.y += dt * 1.6;
    this.mothership.dockRing.rotation.z += dt * 0.8;

    for (const c of this.spaceCollectibles) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 2.1;
      c.mesh.position.y = c.basePos.y + Math.sin(this.elapsed * 2.5 + c.phase) * 0.45;
      const d = c.mesh.position.distanceTo(this.playerPos);
      if (d < magnetRadius) {
        c.mesh.position.lerp(this.playerPos, 1 - Math.exp(-10 * dt));
      }
      if (d < 2.1) {
        c.collected = true;
        c.mesh.visible = false;
        this.state.space.crystals++;
        const pts = this.awardPoints(100, 60);
        this.audio.playPickup(this.state.space.crystals);
        this.particles.burst(c.mesh.position.x, c.mesh.position.y, c.mesh.position.z, 0x22d3ee, 18, 7);
        this.sendToast('crystal_get', { pts }, 'success');
        if (this.state.space.crystals >= 4) this.unlockFact('nebulae');

        if (this.state.activeChallenge?.id === 'space_crystal_chain') {
          this.state.activeChallenge.progress++;
          this.state.activeChallenge.auxTimer = 3.0;
          if (this.state.activeChallenge.progress >= this.state.activeChallenge.target) {
            this.completeActiveChallenge();
          }
        }
      }
    }

    let nearAnyAstro = false;
    let carryIndex = 0;
    for (const a of this.strandedAstronauts) {
      if (a.state === 'stranded') {
        a.rig.root.position.y = a.pos.y + Math.sin(this.elapsed * 2 + a.pos.x) * 0.35;
        a.rig.rightArm.rotation.z = -1.9 + Math.sin(this.elapsed * 7) * 0.45;
        a.sosRing.scale.setScalar(1 + Math.sin(this.elapsed * 4) * 0.14);
        if (a.pos.distanceTo(this.playerPos) < 6.5) {
          nearAnyAstro = true;
        }
      } else if (a.state === 'carrying') {
        carryIndex++;
        _vecB.set(
          Math.sin(this.playerYaw + Math.PI) * (2.4 + carryIndex * 1.4),
          0.6,
          Math.cos(this.playerYaw + Math.PI) * (2.4 + carryIndex * 1.4)
        );
        a.rig.root.position.lerp(_vecC.copy(this.playerPos).add(_vecB), 1 - Math.exp(-7 * dt));
        a.rig.root.rotation.y = this.playerYaw;
      }
    }
    this.state.space.nearAstronaut = nearAnyAstro;

    _vecB.set(0, 2, -35.5);
    this.state.space.nearDock = this.playerPos.distanceTo(_vecB) < 8.5;

    // Drifting Asteroids + smooth sliding pushout so player never gets stuck inside
    for (const ast of this.asteroids) {
      ast.pos.addScaledVector(ast.vel, dt);
      if (Math.abs(ast.pos.x) > 78) ast.vel.x *= -1;
      if (Math.abs(ast.pos.y) > 28) ast.vel.y *= -1;
      if (Math.abs(ast.pos.z) > 78) ast.vel.z *= -1;
      ast.mesh.position.copy(ast.pos);
      ast.mesh.rotation.x += ast.rotSpeed.x * dt;
      ast.mesh.rotation.y += ast.rotSpeed.y * dt;

      const minAstD = ast.radius + 1.35;
      const d = ast.pos.distanceTo(this.playerPos);
      if (d < minAstD && d > 0.001) {
        _vecC.copy(this.playerPos).sub(ast.pos).divideScalar(d);
        this.playerPos.copy(ast.pos).addScaledVector(_vecC, minAstD);

        const vn = this.playerVel.dot(_vecC);
        if (vn < 0) {
          this.playerVel.addScaledVector(_vecC, -vn);
        }

        if (this.bumpCooldown <= 0) {
          this.bumpCooldown = 1.1;
          this.state.shield = Math.max(0, this.state.shield - 12);
          this.audio.playBump();
          this.particles.burst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0xf97316, 16, 7);
          this.playerVel.addScaledVector(_vecC, 12);
          this.sendToast('asteroid_bump', undefined, 'warning');
          if (this.state.activeChallenge?.id === 'space_asteroid_dodger') {
            this.failActiveChallenge();
          }
        }
      }
    }
  }

  private updateMarsRealm(dt: number, magnetRadius: number): void {
    // Animate subtle dust drift
    if (this.marsDustPoints) {
      this.marsDustPoints.rotation.y += dt * 0.015;
    }

    // Pulse marked dune rings brighter when Dune Jumper is active
    const duneActive = this.state.activeChallenge?.id === 'mars_dune_jumper';
    const duneScale = duneActive ? 1 + Math.sin(this.elapsed * 5) * 0.07 : 0.92;
    for (const d of this.markedDunes) {
      d.mesh.scale.setScalar(duneScale);
    }

    let nearStation = false;
    for (const st of this.solarStations) {
      if (!st.repaired && st.root.position.distanceTo(this.playerPos) < 6.5) {
        nearStation = true;
      }
    }
    this.state.mars.nearStation = nearStation;

    for (const c of this.marsCollectibles) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 1.9;
      const d = c.mesh.position.distanceTo(this.playerPos);
      if (d < magnetRadius) {
        c.mesh.position.lerp(this.playerPos, 1 - Math.exp(-10 * dt));
      }
      if (d < 2.2) {
        c.collected = true;
        c.mesh.visible = false;
        if (c.kind === 'ice') {
          this.state.mars.ice++;
          const pts = this.awardPoints(110, 65);
          this.audio.playPickup(this.state.mars.ice);
          this.particles.burst(c.mesh.position.x, c.mesh.position.y + 0.8, c.mesh.position.z, 0x38bdf8, 18, 7);
          this.sendToast('ice_get', { pts }, 'success');
          this.unlockFact('mars_water_ice');
          if (this.state.mars.ice >= 6) this.unlockFact('hydroponics');
        } else {
          this.state.mars.oxygenTanks++;
          this.state.oxygen = Math.min(100, this.state.oxygen + 35);
          this.awardPoints(80, 45);
          this.audio.playPickup(3);
          this.particles.burst(c.mesh.position.x, c.mesh.position.y + 0.8, c.mesh.position.z, 0x34d399, 16, 6);
          this.sendToast('o2_get', undefined, 'info');
          this.unlockFact('mars_atmosphere');

          if (this.state.activeChallenge?.id === 'mars_oxygen_sprint') {
            this.state.activeChallenge.progress++;
            if (this.state.activeChallenge.progress >= this.state.activeChallenge.target) {
              this.completeActiveChallenge();
            }
          }
        }
        this.checkRealmCompletion('mars');
      }
    }
  }

  private updateSolarRealm(dt: number): void {
    this.solarBelt.rotation.y += dt * 0.03;

    let nearestId: string | null = null;
    let nearestDist = Infinity;
    let nearestSpec: (typeof SOLAR_BODIES)[number] | null = null;

    for (let i = 0; i < this.solarBodies.length; i++) {
      const node = this.solarBodies[i];
      const spec = SOLAR_BODIES[i];
      node.mesh.rotation.y += dt * 0.25;
      if (node.clouds) node.clouds.rotation.y += dt * 0.34;
      if (node.moon) {
        const ma = this.elapsed * 0.9;
        node.moon.position.set(Math.cos(ma) * 7.5, 0.8, Math.sin(ma) * 7.5);
      }

      const d = node.pos.distanceTo(this.playerPos);
      if (d < nearestDist) {
        nearestDist = d;
        nearestId = node.id;
        nearestSpec = spec;
      }

      if (!node.discovered && d < node.discoverRadius) {
        this.discoverSolarBody(node, spec);
      }
      if (d < node.discoverRadius + 6) {
        this.handleSolarBodyProximityChallenge(node.id);
      }
    }

    this.state.solar.nearestBodyId = nearestId;

    // Planet Info Card proximity tracking
    if (nearestSpec && nearestId && nearestDist <= nearestSpec.radius + 18) {
      if (this.dismissedInfoBodyId !== nearestId) {
        this.state.solar.activeInfoBodyId = nearestId;
      }
    } else if (nearestSpec && nearestDist > nearestSpec.radius + 24) {
      this.state.solar.activeInfoBodyId = null;
      this.dismissedInfoBodyId = null;
    }
  }

  private handleSolarBodyProximityChallenge(bodyId: string): void {
    const ch = this.state.activeChallenge;
    if (!ch) return;

    if (ch.id === 'solar_grand_tour') {
      if (ch.nextPlanetId === bodyId) {
        ch.progress++;
        this.audio.playPickup(ch.progress);
        if (ch.progress >= GRAND_TOUR_ORDER.length) {
          this.completeActiveChallenge();
        } else {
          ch.nextPlanetId = GRAND_TOUR_ORDER[ch.progress];
        }
      }
    } else if (ch.id === 'solar_star_hopper') {
      if (STAR_IDS.includes(bodyId) && !this.starHopperVisited.has(bodyId)) {
        this.starHopperVisited.add(bodyId);
        ch.progress = this.starHopperVisited.size;
        this.audio.playPickup(ch.progress);
        if (ch.progress >= 4) {
          this.completeActiveChallenge();
        }
      }
    } else if (ch.id === 'solar_quiz_pilot') {
      if (!this.state.pendingQuizBodyId && !this.quizAttemptedBodies.has(bodyId)) {
        const hasQuiz = PLANET_QUIZZES.some((q) => q.bodyId === bodyId);
        if (hasQuiz) {
          this.quizAttemptedBodies.add(bodyId);
          this.state.pendingQuizBodyId = bodyId;
          this.emitProgress();
        }
      }
    }
  }

  private discoverSolarBody(node: SolarBodyNode, spec: (typeof SOLAR_BODIES)[number]): void {
    if (node.discovered) return;
    node.discovered = true;
    if (!this.state.solar.discoveredIds.includes(node.id)) {
      this.state.solar.discoveredIds.push(node.id);
    }
    this.awardPoints(200, 110);
    this.audio.playFanfare();
    this.particles.burst(node.pos.x, node.pos.y, node.pos.z, spec.color, 26, 10);
    this.sendToast('body_discovered', { name: this.language === 'ar' ? spec.nameAr : spec.nameEn }, 'success');

    if (spec.id === 'sun') this.unlockFact('the_sun');
    if (spec.id === 'saturn' || spec.id === 'jupiter') this.unlockFact('planetary_rings');
    if (spec.kind === 'star' || spec.id === 'mercury' || spec.id === 'earth') {
      this.unlockFact('stars_and_planets');
    }

    this.checkRealmCompletion('solar');
  }

  private updatePet(dt: number): void {
    if (!this.petRig) return;
    this.petRig.root.visible = this.state.screen === 'playing';
    if (!this.petRig.root.visible) return;

    _vecD.set(Math.cos(this.playerYaw) * 1.9, 0.9, -Math.sin(this.playerYaw) * 1.9);
    _vecE.set(-Math.sin(this.playerYaw) * 1.5, 0, -Math.cos(this.playerYaw) * 1.5);
    const desired = _vecA.copy(this.playerPos).add(_vecD).add(_vecE);

    if (this.petRig.petId === 'ares_k9' && this.state.realm === 'mars') {
      desired.y = this.marsHeightAt(desired.x, desired.z);
    } else {
      desired.y += Math.sin(this.elapsed * 3.5) * 0.28;
    }

    const prevX = this.petPos.x;
    const prevZ = this.petPos.z;
    this.petPos.lerp(desired, 1 - Math.exp(-6.5 * dt));
    this.petRig.root.position.copy(this.petPos);
    this.petRig.root.rotation.y = this.lerpAngle(this.petRig.root.rotation.y, this.playerYaw, 1 - Math.exp(-8 * dt));

    if (this.petRig.petId === 'ares_k9' && this.petRig.legs.length === 4) {
      const moved = Math.hypot(this.petPos.x - prevX, this.petPos.z - prevZ) / Math.max(0.001, dt);
      const stride = moved > 0.6 ? Math.sin(this.elapsed * 14) * 0.55 : 0;
      this.petRig.legs[0].rotation.x = stride;
      this.petRig.legs[1].rotation.x = -stride;
      this.petRig.legs[2].rotation.x = -stride;
      this.petRig.legs[3].rotation.x = stride;
    } else if (this.petRig.halo) {
      this.petRig.halo.rotation.z += dt * 2.5;
    } else if (this.petRig.wings) {
      this.petRig.wings.rotation.z = Math.sin(this.elapsed * 5) * 0.12;
    }
  }

  private updateScanner(dt: number): void {
    if (this.scannerActiveTimer > 0) {
      this.scannerActiveTimer -= dt;
      const progress = 1 - this.scannerActiveTimer / 1.3;
      this.scannerRing.scale.setScalar(1 + progress * 34);
      (this.scannerRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - progress));
      if (this.scannerActiveTimer <= 0) this.scannerRing.visible = false;
    }

    if (this.guideBeaconTimer > 0) {
      this.guideBeaconTimer -= dt;
      this.guideBeacon.position.set(this.playerPos.x, this.playerPos.y + 3.3, this.playerPos.z);
      this.guideBeacon.lookAt(this.guideTargetPos);
      if (this.guideBeaconTimer <= 0) this.guideBeacon.visible = false;
    }
  }

  private updateChaseCamera(dt: number, isBoosting: boolean): void {
    const isSolar = this.state.realm === 'solar';
    const dist = isSolar ? 15 : 9.2;
    const height = isSolar ? 4.8 : 3.4;

    const horiz = Math.cos(this.camPitch) * dist;
    const vert = Math.sin(this.camPitch) * dist + height * 0.35;

    _camGoal.set(
      this.playerPos.x + Math.sin(this.camYaw) * horiz,
      this.playerPos.y + vert,
      this.playerPos.z + Math.cos(this.camYaw) * horiz
    );

    // Multi-sample terrain & structure collision avoidance so camera never clips
    if (this.state.realm === 'mars') {
      for (const t of [0.3, 0.6, 0.85, 1.0]) {
        const sx = THREE.MathUtils.lerp(this.playerPos.x, _camGoal.x, t);
        const sz = THREE.MathUtils.lerp(this.playerPos.z, _camGoal.z, t);
        const sy = THREE.MathUtils.lerp(this.playerPos.y + 1.4, _camGoal.y, t);
        const minCamY = this.marsHeightAt(sx, sz) + 1.35;
        if (sy < minCamY) {
          _camGoal.y += minCamY - sy;
        }
      }
      // Keep camera outside Bio-Dome shell (0, -18, r=10.2)
      const dx = _camGoal.x;
      const dz = _camGoal.z + 18;
      const d = Math.hypot(dx, dz);
      if (d < 10.2 && d > 0.001 && _camGoal.y < this.marsHeightAt(0, -18) + 9.5) {
        _camGoal.x = (dx / d) * 10.2;
        _camGoal.z = -18 + (dz / d) * 10.2;
      }
    } else if (this.state.realm === 'space') {
      const dx = _camGoal.x;
      const dy = _camGoal.y - 2;
      const dz = _camGoal.z + 46;
      const d = Math.hypot(dx, dy, dz);
      if (d < 6.8 && d > 0.001) {
        _camGoal.set((dx / d) * 6.8, 2 + (dy / d) * 6.8, -46 + (dz / d) * 6.8);
      }
    }

    _lookGoal.set(this.playerPos.x, this.playerPos.y + 1.4, this.playerPos.z);

    this.camSmoothPos.lerp(_camGoal, 1 - Math.exp(-9.0 * dt));
    this.camSmoothLook.lerp(_lookGoal, 1 - Math.exp(-12.0 * dt));

    this.camera.position.copy(this.camSmoothPos);
    this.camera.lookAt(this.camSmoothLook);

    if (this.state.realm === 'mars') {
      this.dirLight.position.set(this.playerPos.x + 32, this.playerPos.y + 52, this.playerPos.z + 24);
      this.dirLight.target.position.copy(this.playerPos);
    }

    const targetFov = isBoosting ? 74 : 62;
    if (Math.abs(this.camera.fov - targetFov) > 0.08) {
      this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 7, dt);
      this.camera.updateProjectionMatrix();
    }

    this.updateSpeedStreaks(dt, isBoosting);
  }

  private updateSpeedStreaks(dt: number, isBoosting: boolean): void {
    if (!this.speedStreaks) return;
    const speedNorm = THREE.MathUtils.clamp((this.state.speed - 45) / 100, 0, 1);
    const targetOpacity = isBoosting ? 0.58 : speedNorm * 0.28;
    this.speedStreakMat.opacity = THREE.MathUtils.damp(this.speedStreakMat.opacity, targetOpacity, 8, dt);

    if (this.speedStreakMat.opacity < 0.02) {
      this.speedStreaks.visible = false;
      return;
    }
    this.speedStreaks.visible = true;

    const camDirX = Math.sin(this.camYaw);
    const camDirZ = Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    for (let i = 0; i < this.streakOffsets.length; i++) {
      const s = this.streakOffsets[i];
      s.z += s.speed * (isBoosting ? 1.85 : 1.0) * dt;
      if (s.z > 14) s.z = -24;

      _dummy.position.set(
        this.camera.position.x + rightX * s.x - camDirX * (-s.z + 10),
        this.camera.position.y + s.y,
        this.camera.position.z + rightZ * s.x - camDirZ * (-s.z + 10)
      );
      _dummy.rotation.set(0, this.camYaw, 0);
      _dummy.scale.set(1, 1, isBoosting ? 1.65 : 1.0);
      _dummy.updateMatrix();
      this.speedStreaks.setMatrixAt(i, _dummy.matrix);
    }
    this.speedStreaks.instanceMatrix.needsUpdate = true;
  }

  // ==================== HELPERS & PROGRESSION ====================

  private findNearestObjective(): THREE.Vector3 | null {
    let best: THREE.Vector3 | null = null;
    let bestDist = Infinity;

    if (this.state.realm === 'space') {
      if (this.state.space.carryingCount > 0) {
        return _vecD.set(0, 2, -35.5);
      }
      for (const a of this.strandedAstronauts) {
        if (a.state === 'stranded') {
          const d = a.pos.distanceTo(this.playerPos);
          if (d < bestDist) {
            bestDist = d;
            best = a.pos;
          }
        }
      }
      if (!best) {
        for (const c of this.spaceCollectibles) {
          if (!c.collected) {
            const d = c.basePos.distanceTo(this.playerPos);
            if (d < bestDist) {
              bestDist = d;
              best = c.basePos;
            }
          }
        }
      }
    } else if (this.state.realm === 'mars') {
      for (const st of this.solarStations) {
        if (!st.repaired) {
          const d = st.root.position.distanceTo(this.playerPos);
          if (d < bestDist) {
            bestDist = d;
            best = st.root.position;
          }
        }
      }
      if (!best) {
        for (const c of this.marsCollectibles) {
          if (!c.collected) {
            const d = c.basePos.distanceTo(this.playerPos);
            if (d < bestDist) {
              bestDist = d;
              best = c.basePos;
            }
          }
        }
      }
    } else if (this.state.realm === 'solar') {
      for (const b of this.solarBodies) {
        if (!b.discovered) {
          const d = b.pos.distanceTo(this.playerPos);
          if (d < bestDist) {
            bestDist = d;
            best = b.pos;
          }
        }
      }
    }

    return best;
  }

  private awardPoints(basePts: number, baseCredits: number): number {
    let mult = 1;
    if (this.state.amplifierCharges > 0) {
      mult = 2;
      this.state.amplifierCharges--;
    }
    const pts = basePts * mult;
    const creds = baseCredits * mult;
    this.state.score += pts;
    this.state.credits += creds;
    return pts;
  }

  private unlockFact(factId: string): void {
    if (this.state.unlockedFactIds.includes(factId)) return;
    const fact = SCIENCE_FACTS.find((f) => f.id === factId);
    if (!fact) return;

    this.state.unlockedFactIds.push(factId);
    this.callbacks.onFactUnlock(factId);
    this.sendToast(
      'fact_unlocked',
      { title: this.language === 'ar' ? fact.titleAr : fact.titleEn },
      'fact',
      factId
    );
  }

  private checkRealmCompletion(realm: RealmId): void {
    if (realm === 'space' && !this.state.space.completed && this.state.space.rescued >= this.state.space.totalAstronauts) {
      this.state.space.completed = true;
      this.awardPoints(500, 250);
      this.audio.playFanfare();
      this.sendToast('realm_complete', undefined, 'success');
    } else if (
      realm === 'mars' &&
      !this.state.mars.completed &&
      this.state.mars.ice >= this.state.mars.totalIce &&
      this.state.mars.oxygenTanks >= this.state.mars.totalOxygenTanks &&
      this.state.mars.stationsRepaired >= this.state.mars.totalStations
    ) {
      this.state.mars.completed = true;
      this.awardPoints(500, 250);
      this.audio.playFanfare();
      this.sendToast('realm_complete', undefined, 'success');
    } else if (
      realm === 'solar' &&
      !this.state.solar.completed &&
      this.state.solar.discoveredIds.length >= this.state.solar.totalBodies
    ) {
      this.state.solar.completed = true;
      this.awardPoints(600, 300);
      this.audio.playFanfare();
      this.sendToast('realm_complete', undefined, 'success');
    }

    if (
      !this.state.allRealmsComplete &&
      this.state.space.completed &&
      this.state.mars.completed &&
      this.state.solar.completed
    ) {
      this.state.allRealmsComplete = true;
      if (!this.state.victoryShown) {
        this.state.victoryShown = true;
        this.state.screen = 'victory';
      }
    }
  }

  private updatePipHint(): void {
    if (this.state.oxygen < 22) {
      this.state.pipHintKey = 'low_oxygen';
      return;
    }
    if (
      this.state.spaceWeather.synced &&
      this.state.spaceWeather.alertLevel === 'storm' &&
      (this.state.realm === 'space' || this.state.realm === 'solar')
    ) {
      this.state.pipHintKey = 'solar_storm';
      return;
    }
    if (this.state.fuel < 15) {
      this.state.pipHintKey = 'low_fuel';
      return;
    }

    const r = this.state.realm;
    if (r === 'space') {
      if (this.state.space.completed) this.state.pipHintKey = 'space_complete';
      else if (this.state.space.nearAstronaut) this.state.pipHintKey = 'space_near_astro';
      else if (this.state.space.carryingCount > 0) this.state.pipHintKey = 'space_carry_dock';
      else this.state.pipHintKey = 'space_default';
    } else if (r === 'mars') {
      if (this.state.mars.completed) this.state.pipHintKey = 'mars_complete';
      else if (this.state.mars.nearStation) this.state.pipHintKey = 'mars_near_station';
      else this.state.pipHintKey = 'mars_default';
    } else {
      this.state.pipHintKey = this.state.solar.completed ? 'solar_complete' : 'solar_default';
    }
  }

  private sendToast(
    textKey: string,
    params?: Record<string, string | number>,
    tone: ToastPayload['tone'] = 'info',
    factId?: string
  ): void {
    this.callbacks.onToast({
      id: ++this.toastCounter,
      textKey,
      params,
      tone,
      factId,
    });
  }

  private emitProgress(): void {
    this.callbacks.onProgress({
      ...this.state,
      ownedSuits: [...this.state.ownedSuits],
      ownedAbilities: [...this.state.ownedAbilities],
      ownedPets: [...this.state.ownedPets],
      unlockedFactIds: [...this.state.unlockedFactIds],
      completedChallengeIds: [...this.state.completedChallengeIds],
      activeChallenge: this.state.activeChallenge ? { ...this.state.activeChallenge } : null,
      consumables: { ...this.state.consumables },
      space: { ...this.state.space },
      mars: { ...this.state.mars },
      solar: { ...this.state.solar, discoveredIds: [...this.state.solar.discoveredIds] },
      spaceWeather: { ...this.state.spaceWeather },
    });
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    window.visualViewport?.removeEventListener('resize', this.handleResize);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);

    const dom = this.renderer?.domElement;
    if (dom) {
      dom.removeEventListener('pointerdown', this.handlePointerDown);
      dom.removeEventListener('webglcontextlost', this.handleContextLost);
      dom.removeEventListener('webglcontextrestored', this.handleContextRestored);
      if (dom.parentElement) dom.parentElement.removeChild(dom);
    }

    this.scene?.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });

    this.composer?.dispose();
    this.particles.dispose();
    this.textures.dispose();
    this.audio.dispose();
    this.renderer?.dispose();
  }
}
