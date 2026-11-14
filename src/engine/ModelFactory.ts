import * as THREE from 'three';
import { PetId, SuitItem } from '../types/game';
import { TextureFactory } from './TextureFactory';

export interface AstronautRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  flameLeft: THREE.Mesh;
  flameRight: THREE.Mesh;
  primaryMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
  visorMat: THREE.MeshPhysicalMaterial;
  shadowPlane: THREE.Mesh;
}

export interface StarfighterRig {
  root: THREE.Group;
  hullGroup: THREE.Group;
  flameLeft: THREE.Mesh;
  flameRight: THREE.Mesh;
  primaryMat: THREE.MeshStandardMaterial;
  accentMat: THREE.MeshStandardMaterial;
}

export interface PetRig {
  root: THREE.Group;
  petId: PetId;
  legs: THREE.Group[];
  halo?: THREE.Mesh;
  wings?: THREE.Group;
}

export interface MothershipRig {
  root: THREE.Group;
  radarDish: THREE.Group;
  dockRing: THREE.Mesh;
  dockBeacon: THREE.Mesh;
}

export interface SolarStationRig {
  root: THREE.Group;
  panelGroup: THREE.Group;
  beaconMesh: THREE.Mesh;
  beaconMat: THREE.MeshStandardMaterial;
  repaired: boolean;
}

export class ModelFactory {
  constructor(private textures: TextureFactory) {}

  public createAstronaut(suit: SuitItem): AstronautRig {
    const root = new THREE.Group();
    const bodyGroup = new THREE.Group();
    root.add(bodyGroup);

    const primaryMat = new THREE.MeshStandardMaterial({
      color: suit.primaryHex,
      roughness: 0.38,
      metalness: 0.18,
      bumpMap: this.textures.getHullBumpTexture(),
      bumpScale: 0.018,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: suit.accentHex,
      roughness: 0.24,
      metalness: 0.72,
      envMapIntensity: 1.4,
    });
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: suit.visorHex,
      roughness: 0.06,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.9,
    });
    const bootMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65,
      metalness: 0.3,
    });

    // Legs (pivot at hip y = 0.85)
    const makeLeg = (xOff: number) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(xOff, 0.85, 0);
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 4, 8), primaryMat);
      thigh.position.y = -0.32;
      thigh.castShadow = true;
      legPivot.add(thigh);

      const kneeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 12), accentMat);
      kneeRing.position.y = -0.38;
      legPivot.add(kneeRing);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.22, 0.42), bootMat);
      boot.position.set(0, -0.74, 0.06);
      boot.castShadow = true;
      legPivot.add(boot);

      bodyGroup.add(legPivot);
      return legPivot;
    };

    const leftLeg = makeLeg(-0.22);
    const rightLeg = makeLeg(0.22);

    // Torso
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.46, 6, 12), primaryMat);
    torso.position.y = 1.25;
    torso.scale.set(1.05, 1, 0.85);
    torso.castShadow = true;
    bodyGroup.add(torso);

    // Chest control plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.16), accentMat);
    chestPlate.position.set(0, 1.32, 0.28);
    bodyGroup.add(chestPlate);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.12, 16), accentMat);
    belt.position.y = 0.96;
    belt.scale.set(1.04, 1, 0.86);
    bodyGroup.add(belt);

    // Backpack + thrusters
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.66, 0.32), primaryMat);
    pack.position.set(0, 1.3, -0.34);
    pack.castShadow = true;
    bodyGroup.add(pack);

    const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.35), accentMat);
    packStripe.position.set(0, 1.46, -0.34);
    bodyGroup.add(packStripe);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const makeNozzle = (xOff: number) => {
      const noz = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.18, 12), bootMat);
      noz.position.set(xOff, 0.92, -0.38);
      bodyGroup.add(noz);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.62, 10), flameMat);
      flame.rotation.x = Math.PI;
      flame.position.set(xOff, 0.56, -0.38);
      flame.visible = false;
      bodyGroup.add(flame);
      return flame;
    };

    const flameLeft = makeNozzle(-0.18);
    const flameRight = makeNozzle(0.18);

    // Arms (pivot at shoulder y = 1.54)
    const makeArm = (xOff: number) => {
      const armPivot = new THREE.Group();
      armPivot.position.set(xOff, 1.54, 0);
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), accentMat);
      armPivot.add(shoulder);

      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.38, 4, 8), primaryMat);
      arm.position.y = -0.28;
      arm.castShadow = true;
      armPivot.add(arm);

      const glove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), accentMat);
      glove.position.y = -0.54;
      armPivot.add(glove);

      bodyGroup.add(armPivot);
      return armPivot;
    };

    const leftArm = makeArm(-0.48);
    const rightArm = makeArm(0.48);

    // Helmet & Visor
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 16), primaryMat);
    helmet.position.set(0, 1.96, 0.02);
    helmet.castShadow = true;
    bodyGroup.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.33, 18, 14, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.2, Math.PI * 0.58),
      visorMat
    );
    visor.position.set(0, 1.96, 0.14);
    bodyGroup.add(visor);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 6), accentMat);
    antenna.position.set(0.32, 2.25, -0.08);
    bodyGroup.add(antenna);

    // Ground contact shadow
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 1.4),
      new THREE.MeshBasicMaterial({
        map: this.textures.getContactShadow(),
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.03;
    root.add(shadowPlane);

    return {
      root,
      bodyGroup,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      flameLeft,
      flameRight,
      primaryMat,
      accentMat,
      visorMat,
      shadowPlane,
    };
  }

  public createStarfighter(suit: SuitItem): StarfighterRig {
    const root = new THREE.Group();
    const hullGroup = new THREE.Group();
    root.add(hullGroup);

    const primaryMat = new THREE.MeshStandardMaterial({
      color: suit.primaryHex,
      roughness: 0.28,
      metalness: 0.62,
      map: this.textures.getHullTexture(),
      bumpMap: this.textures.getHullBumpTexture(),
      bumpScale: 0.03,
      envMapIntensity: 1.4,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: suit.accentHex,
      roughness: 0.22,
      metalness: 0.8,
      envMapIntensity: 1.5,
    });
    const canopyMat = new THREE.MeshPhysicalMaterial({
      color: suit.visorHex,
      roughness: 0.06,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.8,
      transparent: true,
      opacity: 0.9,
    });

    // Fuselage nose & core
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.6, 12), primaryMat);
    fuselage.rotation.x = Math.PI / 2;
    fuselage.position.z = 0.3;
    fuselage.castShadow = true;
    hullGroup.add(fuselage);

    const coreBody = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.65, 2.0), primaryMat);
    coreBody.position.set(0, 0, -0.7);
    hullGroup.add(coreBody);

    // Cockpit canopy
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), canopyMat);
    canopy.scale.set(0.82, 0.62, 1.45);
    canopy.position.set(0, 0.38, 0.0);
    hullGroup.add(canopy);

    // Swept wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.4);
    wingShape.lineTo(2.4, -0.9);
    wingShape.lineTo(2.4, -1.4);
    wingShape.lineTo(0, -1.0);
    wingShape.closePath();

    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.03,
      bevelThickness: 0.03,
      bevelSegments: 2,
    });
    wingGeo.rotateX(-Math.PI / 2);

    const rightWing = new THREE.Mesh(wingGeo, accentMat);
    rightWing.position.set(0.45, -0.05, -0.2);
    hullGroup.add(rightWing);

    const leftWing = rightWing.clone();
    leftWing.scale.x = -1;
    leftWing.position.set(-0.45, -0.05, -0.2);
    hullGroup.add(leftWing);

    // Tail fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.9), accentMat);
    fin.position.set(0, 0.55, -1.3);
    fin.rotation.x = -0.3;
    hullGroup.add(fin);

    // Twin engine pods & luminous ion flames
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.88 });
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const navTipMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.1,
    });

    const tipL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), navTipMat);
    tipL.position.set(-2.75, -0.04, -1.25);
    hullGroup.add(tipL);
    const tipR = tipL.clone();
    tipR.position.x = 2.75;
    hullGroup.add(tipR);

    const makeEngine = (xOff: number) => {
      const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.2, 14), engineMat);
      pod.rotation.x = Math.PI / 2;
      pod.position.set(xOff, -0.05, -1.4);
      hullGroup.add(pod);

      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.26, 1.45, 12), flameMat);
      flame.rotation.x = -Math.PI / 2;
      flame.position.set(xOff, -0.05, -2.58);
      hullGroup.add(flame);
      return flame;
    };

    const flameLeft = makeEngine(-0.55);
    const flameRight = makeEngine(0.55);

    return {
      root,
      hullGroup,
      flameLeft,
      flameRight,
      primaryMat,
      accentMat,
    };
  }

  public createMothership(): MothershipRig {
    const root = new THREE.Group();
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.32,
      metalness: 0.68,
      map: this.textures.getHullTexture(),
      bumpMap: this.textures.getHullBumpTexture(),
      bumpScale: 0.04,
      envMapIntensity: 1.35,
    });
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.78,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: this.textures.getSolarPanelTexture(),
      roughness: 0.16,
      metalness: 0.65,
      envMapIntensity: 1.5,
    });

    // Main cylinder hull
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4.2, 16, 16), hullMat);
    hull.rotation.z = Math.PI / 2;
    root.add(hull);

    // Command bridge dome
    const bridge = new THREE.Mesh(new THREE.SphereGeometry(2.8, 18, 12), trimMat);
    bridge.scale.set(1.2, 0.7, 1.0);
    bridge.position.set(2.5, 3.2, 0);
    root.add(bridge);

    // Habitation ring
    const habRing = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.85, 12, 32), hullMat);
    habRing.position.set(-2.5, 0, 0);
    habRing.rotation.y = Math.PI / 2;
    root.add(habRing);

    // Solar wings
    const wingGeo = new THREE.BoxGeometry(4.5, 0.18, 11);
    const wingL = new THREE.Mesh(wingGeo, solarMat);
    wingL.position.set(-2.5, 0, 12);
    root.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, solarMat);
    wingR.position.set(-2.5, 0, -12);
    root.add(wingR);

    // Spinning Radar Dish
    const radarDish = new THREE.Group();
    radarDish.position.set(2.5, 5.2, 0);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 1.6, 8), trimMat);
    radarDish.add(mast);
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      hullMat
    );
    dish.rotation.x = Math.PI * 0.72;
    dish.position.y = 0.9;
    radarDish.add(dish);
    root.add(radarDish);

    // Big Green Docking Ring at front (+X side)
    const dockMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.1,
      roughness: 0.2,
      metalness: 0.45,
    });
    const dockRing = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.52, 16, 44), dockMat);
    dockRing.rotation.y = Math.PI / 2;
    dockRing.position.set(10.5, 0, 0);
    root.add(dockRing);

    const dockBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(3.8, 3.8, 0.25, 28),
      new THREE.MeshBasicMaterial({
        color: 0x6ee7b7,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    dockBeacon.rotation.z = Math.PI / 2;
    dockBeacon.position.set(10.5, 0, 0);
    root.add(dockBeacon);

    return { root, radarDish, dockRing, dockBeacon };
  }

  public createPet(petId: PetId, primaryHex: string, accentHex: string): PetRig {
    const root = new THREE.Group();
    const pMat = new THREE.MeshStandardMaterial({ color: primaryHex, roughness: 0.3, metalness: 0.55 });
    const aMat = new THREE.MeshStandardMaterial({
      color: accentHex,
      emissive: accentHex,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.6,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.5 });

    const legs: THREE.Group[] = [];

    if (petId === 'scout_drone') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 14), pMat);
      body.position.y = 0.4;
      root.add(body);

      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), aMat);
      eye.position.set(0, 0.42, 0.3);
      root.add(eye);

      const finL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.22), darkMat);
      finL.position.set(-0.42, 0.4, 0);
      root.add(finL);
      const finR = finL.clone();
      finR.position.x = 0.42;
      root.add(finR);

      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 8, 24), aMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.4;
      root.add(halo);
      return { root, petId, legs, halo };
    }

    if (petId === 'ares_k9') {
      // 4-legged animated mechanical rover-hound!
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.72), pMat);
      torso.position.y = 0.45;
      torso.castShadow = true;
      root.add(torso);

      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.34), aMat);
      pack.position.set(0, 0.64, -0.08);
      root.add(pack);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.32), pMat);
      head.position.set(0, 0.68, 0.38);
      root.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.08), aMat);
      visor.position.set(0, 0.7, 0.53);
      root.add(visor);

      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), darkMat);
      earL.position.set(-0.1, 0.88, 0.36);
      root.add(earL);
      const earR = earL.clone();
      earR.position.x = 0.1;
      root.add(earR);

      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.28, 6), aMat);
      tail.position.set(0, 0.62, -0.44);
      tail.rotation.x = -0.6;
      root.add(tail);

      const legCoords = [
        [-0.18, 0.35, 0.24],
        [0.18, 0.35, 0.24],
        [-0.18, 0.35, -0.24],
        [0.18, 0.35, -0.24],
      ];
      for (const [lx, ly, lz] of legCoords) {
        const legPivot = new THREE.Group();
        legPivot.position.set(lx, ly, lz);
        const legMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.11), darkMat);
        legMesh.position.y = -0.16;
        legPivot.add(legMesh);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), aMat);
        paw.position.y = -0.32;
        legPivot.add(paw);
        root.add(legPivot);
        legs.push(legPivot);
      }

      return { root, petId, legs };
    }

    // Valkyrie Escort Probe
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 1), pMat);
    core.position.y = 0.45;
    root.add(core);

    const wings = new THREE.Group();
    wings.position.y = 0.45;
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.26), aMat);
    wingL.position.set(-0.46, 0.08, -0.05);
    wingL.rotation.z = 0.32;
    wings.add(wingL);
    const wingR = wingL.clone();
    wingR.position.x = 0.46;
    wingR.rotation.z = -0.32;
    wings.add(wingR);
    root.add(wings);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), aMat);
    eye.position.set(0, 0.45, 0.28);
    root.add(eye);

    return { root, petId, legs, wings };
  }

  public createBioDome(): THREE.Group {
    const root = new THREE.Group();
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.4,
      map: this.textures.getHullTexture(),
    });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.5 });

    const ring = new THREE.Mesh(new THREE.CylinderGeometry(8.4, 9.0, 1.6, 28), baseMat);
    ring.position.y = 0.8;
    ring.receiveShadow = true;
    root.add(ring);

    const glass = new THREE.Mesh(
      new THREE.SphereGeometry(7.8, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshPhysicalMaterial({
        color: 0xa7f3d0,
        roughness: 0.1,
        metalness: 0.05,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      })
    );
    glass.position.y = 1.4;
    glass.renderOrder = 3;
    root.add(glass);

    // Interior hydroponics greenery
    const planter = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.6, 0.4, 20), accentMat);
    planter.position.y = 1.65;
    root.add(planter);

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x15803d,
      emissiveIntensity: 0.35,
      roughness: 0.6,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1), leafMat);
      bush.position.set(Math.cos(a) * 3.4, 2.5, Math.sin(a) * 3.4);
      root.add(bush);
    }

    // Airlock tunnel
    const tunnel = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 4.5), baseMat);
    tunnel.position.set(0, 1.4, 9.2);
    tunnel.castShadow = true;
    root.add(tunnel);

    const doorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.2, 0.2),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    doorGlow.position.set(0, 1.35, 11.45);
    root.add(doorGlow);

    return root;
  }

  public createSolarStation(): SolarStationRig {
    const root = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.45, metalness: 0.6 });

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.25, 0.6, 12), metalMat);
    base.position.y = 0.3;
    base.castShadow = true;
    root.add(base);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 2.2, 10), metalMat);
    pole.position.y = 1.4;
    pole.castShadow = true;
    root.add(pole);

    const panelGroup = new THREE.Group();
    panelGroup.position.y = 2.5;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.12, 2.1),
      new THREE.MeshStandardMaterial({
        map: this.textures.getSolarPanelTexture(),
        roughness: 0.24,
        metalness: 0.55,
      })
    );
    panel.rotation.x = 0.55; // starts tilted off-axis until repaired
    panel.castShadow = true;
    panelGroup.add(panel);
    root.add(panelGroup);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.9,
      roughness: 0.3,
    });
    const beaconMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), beaconMat);
    beaconMesh.position.set(0, 3.25, 0);
    root.add(beaconMesh);

    return { root, panelGroup, beaconMesh, beaconMat, repaired: false };
  }

  public createCrystal(colorHex: number, scale = 1): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      emissive: colorHex,
      emissiveIntensity: 0.78,
      roughness: 0.1,
      metalness: 0.15,
      clearcoat: 1.0,
      envMapIntensity: 1.4,
    });
    const main = new THREE.Mesh(new THREE.OctahedronGeometry(0.65 * scale, 0), mat);
    main.scale.set(0.75, 1.55, 0.75);
    main.position.y = 0.9 * scale;
    g.add(main);

    const side1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.36 * scale, 0), mat);
    side1.scale.set(0.7, 1.3, 0.7);
    side1.position.set(0.36 * scale, 0.58 * scale, 0.15 * scale);
    side1.rotation.z = -0.45;
    g.add(side1);

    const side2 = side1.clone();
    side2.position.set(-0.34 * scale, 0.52 * scale, -0.18 * scale);
    side2.rotation.z = 0.42;
    g.add(side2);

    return g;
  }

  public createOxygenTank(): THREE.Group {
    const g = new THREE.Group();
    const tankMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.25,
      metalness: 0.55,
    });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4, metalness: 0.3 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.05, 14), tankMat);
    body.position.y = 0.65;
    g.add(body);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 8), capMat);
    cap.position.y = 1.18;
    g.add(cap);

    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 8), capMat);
    valve.position.y = 1.56;
    g.add(valve);

    return g;
  }

  public createMarkedDuneRing(): THREE.Group {
    const g = new THREE.Group();
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 1.05,
      roughness: 0.2,
      metalness: 0.4,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.22, 10, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.25;
    g.add(ring);

    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(2.9, 28),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.18;
    g.add(pad);

    return g;
  }
}
