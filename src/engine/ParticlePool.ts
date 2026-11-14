import * as THREE from 'three';

interface ParticleState {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

const _dummy = new THREE.Object3D();

export class ParticlePool {
  public readonly mesh: THREE.InstancedMesh;
  private readonly particles: ParticleState[] = [];
  private readonly capacity: number;
  private cursor = 0;
  private hasActive = false;
  private colorDirty = false;

  constructor(capacity = 480) {
    this.capacity = capacity;
    const geo = new THREE.OctahedronGeometry(0.18, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, capacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    for (let i = 0; i < capacity; i++) {
      this.particles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        size: 1,
        color: new THREE.Color(0xffffff),
      });
      _dummy.position.set(0, -9999, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      this.mesh.setColorAt(i, this.particles[i].color);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  public spawn(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    colorHex: number | string,
    size = 1,
    maxLife = 0.65
  ): void {
    const idx = this.cursor;
    const p = this.particles[idx];
    this.cursor = (idx + 1) % this.capacity;

    p.active = true;
    p.pos.set(x, y, z);
    p.vel.set(vx, vy, vz);
    p.life = maxLife;
    p.maxLife = maxLife;
    p.size = size;
    p.color.set(colorHex);
    this.mesh.setColorAt(idx, p.color);
    this.hasActive = true;
    this.colorDirty = true;
  }

  public burst(x: number, y: number, z: number, colorHex: number | string, count = 18, speed = 7): void {
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const s = speed * (0.4 + Math.random() * 0.8);
      this.spawn(
        x,
        y,
        z,
        Math.sin(phi) * Math.cos(theta) * s,
        Math.cos(phi) * s + 1.5,
        Math.sin(phi) * Math.sin(theta) * s,
        colorHex,
        0.7 + Math.random() * 0.9,
        0.45 + Math.random() * 0.45
      );
    }
  }

  public update(dt: number): void {
    if (!this.hasActive) return;

    let stillActive = false;
    let matrixUpdated = false;

    for (let i = 0; i < this.capacity; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _dummy.position.set(0, -9999, 0);
        _dummy.scale.setScalar(0.0001);
        _dummy.updateMatrix();
        this.mesh.setMatrixAt(i, _dummy.matrix);
        matrixUpdated = true;
        continue;
      }

      stillActive = true;
      p.pos.addScaledVector(p.vel, dt);
      p.vel.multiplyScalar(Math.max(0, 1 - 1.5 * dt));

      const t = p.life / p.maxLife;
      _dummy.position.copy(p.pos);
      _dummy.rotation.set(p.life * 6, p.life * 4, 0);
      _dummy.scale.setScalar(p.size * t);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
      matrixUpdated = true;
    }

    this.hasActive = stillActive;
    if (matrixUpdated) {
      this.mesh.instanceMatrix.needsUpdate = true;
    }
    if (this.colorDirty && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
      this.colorDirty = false;
    }
  }

  public clear(): void {
    if (!this.hasActive) return;
    for (let i = 0; i < this.capacity; i++) {
      this.particles[i].active = false;
      _dummy.position.set(0, -9999, 0);
      _dummy.scale.setScalar(0.0001);
      _dummy.updateMatrix();
      this.mesh.setMatrixAt(i, _dummy.matrix);
    }
    this.hasActive = false;
    this.colorDirty = false;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((m) => m.dispose());
    } else {
      this.mesh.material.dispose();
    }
  }
}
