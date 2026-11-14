import * as THREE from 'three';

export class TextureFactory {
  private cache = new Map<string, THREE.Texture>();
  private maxAnisotropy = 8;

  public setMaxAnisotropy(val: number): void {
    this.maxAnisotropy = Math.max(1, Math.min(16, val));
  }

  private register(key: string, canvas: HTMLCanvasElement, isColor = true, repeat = 1): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    if (repeat > 1) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat, repeat);
    }
    tex.needsUpdate = true;
    this.cache.set(key, tex);
    return tex;
  }

  public getGlowSprite(): THREE.Texture {
    const key = 'glow_sprite';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(128, 128, 3, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.22, 'rgba(255,255,255,0.82)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.24)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return this.register(key, canvas, true);
  }

  public getContactShadow(): THREE.Texture {
    const key = 'contact_shadow';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(10,4,28,0.88)');
    grad.addColorStop(0.55, 'rgba(10,4,28,0.42)');
    grad.addColorStop(1, 'rgba(10,4,28,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    return this.register(key, canvas, true);
  }

  public getMarsGround(variant: 'base' | 'canyon'): THREE.Texture {
    const key = `mars_ground_${variant}`;
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = variant === 'base' ? '#c95a38' : '#b84c2b';
    ctx.fillRect(0, 0, 1024, 1024);

    // Wind-swept sand dunes & iron-oxide streaks
    for (let i = 0; i < 110; i++) {
      const y = (i / 110) * 1024;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(244, 138, 82, 0.16)' : 'rgba(118, 36, 18, 0.14)';
      ctx.beginPath();
      ctx.ellipse(512 + Math.sin(i * 0.65) * 120, y, 560, 22 + (i % 6) * 5, 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    let seed = variant === 'base' ? 17 : 89;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    // Impact craters with bright sunlit rim
    for (let i = 0; i < 65; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const r = 10 + rand() * 36;
      ctx.fillStyle = 'rgba(102, 30, 14, 0.28)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 190, 134, 0.24)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x - 2, y - 2, r, 0.25, 3.15);
      ctx.stroke();
    }

    // Regolith gravel & mineral flecks
    for (let i = 0; i < 1600; i++) {
      const x = rand() * 1024;
      const y = rand() * 1024;
      const sz = 1.5 + rand() * 4.5;
      ctx.fillStyle = rand() > 0.48 ? 'rgba(255, 206, 160, 0.22)' : 'rgba(78, 22, 10, 0.24)';
      ctx.fillRect(x, y, sz, sz);
    }

    return this.register(key, canvas, true, 12);
  }

  public getMarsGroundBump(variant: 'base' | 'canyon'): THREE.Texture {
    const key = `mars_ground_bump_${variant}`;
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Dune ripples
    for (let i = 0; i < 60; i++) {
      const y = (i / 60) * 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(215, 215, 215, 0.16)' : 'rgba(55, 55, 55, 0.16)';
      ctx.beginPath();
      ctx.ellipse(256 + Math.sin(i * 0.65) * 60, y, 280, 12 + (i % 5) * 2, 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    let seed = variant === 'base' ? 17 : 89;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < 65; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const r = 5 + rand() * 18;
      ctx.fillStyle = 'rgba(35, 35, 35, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(230, 230, 230, 0.32)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let i = 0; i < 1200; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      const sz = 1 + rand() * 2.5;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(235, 235, 235, 0.25)' : 'rgba(35, 35, 35, 0.25)';
      ctx.fillRect(x, y, sz, sz);
    }

    return this.register(key, canvas, false, 12);
  }

  public getSolarPanelTexture(): THREE.Texture {
    const key = 'solar_panel';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0c2357';
    ctx.fillRect(0, 0, 512, 512);

    // Individual photovoltaic wafer grid
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Fine silver busbars
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.lineWidth = 1;
    for (let i = 16; i < 512; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, 'rgba(125, 211, 252, 0.28)');
    grad.addColorStop(0.5, 'rgba(125, 211, 252, 0.0)');
    grad.addColorStop(1, 'rgba(125, 211, 252, 0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    return this.register(key, canvas, true);
  }

  public getHullTexture(): THREE.Texture {
    const key = 'hull_panels';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    for (let x = 0; x < 512; x += 128) {
      for (let y = 0; y < 512; y += 128) {
        ctx.strokeRect(x + 4, y + 4, 120, 120);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(x + 14, y + 14, 10, 10);
        ctx.fillRect(x + 104, y + 14, 10, 10);
        ctx.fillRect(x + 14, y + 104, 10, 10);
        ctx.fillRect(x + 104, y + 104, 10, 10);
      }
    }
    return this.register(key, canvas, true, 2);
  }

  public getHullBumpTexture(): THREE.Texture {
    const key = 'hull_panels_bump';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 3;
    for (let x = 0; x < 256; x += 64) {
      for (let y = 0; y < 256; y += 64) {
        ctx.strokeRect(x + 2, y + 2, 60, 60);
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(x + 7, y + 7, 5, 5);
        ctx.fillRect(x + 52, y + 7, 5, 5);
        ctx.fillRect(x + 7, y + 52, 5, 5);
        ctx.fillRect(x + 52, y + 52, 5, 5);
      }
    }
    return this.register(key, canvas, false, 2);
  }

  public getSaturnRingTexture(): THREE.Texture {
    const key = 'saturn_ring';
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;

    const bands = [
      { stop: 0.0, col: 'rgba(254, 240, 138, 0.0)' },
      { stop: 0.14, col: 'rgba(253, 224, 71, 0.68)' },
      { stop: 0.34, col: 'rgba(254, 249, 195, 0.95)' },
      { stop: 0.46, col: 'rgba(234, 179, 8, 0.14)' }, // Cassini division
      { stop: 0.56, col: 'rgba(254, 240, 138, 0.88)' },
      { stop: 0.74, col: 'rgba(253, 230, 138, 0.72)' },
      { stop: 0.9, col: 'rgba(253, 224, 71, 0.32)' },
      { stop: 1.0, col: 'rgba(254, 240, 138, 0.0)' },
    ];
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    bands.forEach((b) => grad.addColorStop(b.stop, b.col));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 32);

    return this.register(key, canvas, true);
  }

  public getPlanetTexture(bodyId: string, baseHex: string, accentHex: string): THREE.Texture {
    const key = `planet_${bodyId}`;
    const existing = this.cache.get(key);
    if (existing) return existing;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 1024, 512);

    let seed = bodyId.split('').reduce((a, c) => a + c.charCodeAt(0) * 13, 7);
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    if (bodyId === 'jupiter' || bodyId === 'saturn' || bodyId === 'uranus' || bodyId === 'neptune') {
      for (let y = 0; y < 512; y += 18) {
        ctx.fillStyle = y % 36 === 0 ? accentHex : 'rgba(255,255,255,0.18)';
        ctx.globalAlpha = 0.22 + rand() * 0.36;
        ctx.fillRect(0, y, 1024, 10 + rand() * 14);
      }
      ctx.globalAlpha = 1;
      if (bodyId === 'jupiter') {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.ellipse(580, 304, 68, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    } else if (bodyId === 'earth') {
      ctx.fillStyle = '#22c55e';
      for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * 1024, 80 + rand() * 352, 44 + rand() * 96, 28 + rand() * 60, rand() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.ellipse(rand() * 1024, rand() * 512, 55 + rand() * 110, 12 + rand() * 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 1024, 34);
      ctx.fillRect(0, 478, 1024, 34);
    } else if (bodyId === 'sun' || bodyId === 'proxima' || bodyId === 'sirius' || bodyId === 'vega' || bodyId === 'polaris') {
      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = i % 2 === 0 ? accentHex : '#ffffff';
        ctx.globalAlpha = 0.18 + rand() * 0.36;
        ctx.beginPath();
        ctx.arc(rand() * 1024, rand() * 512, 14 + rand() * 48, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = i % 3 === 0 ? accentHex : 'rgba(0,0,0,0.22)';
        ctx.globalAlpha = 0.22 + rand() * 0.36;
        ctx.beginPath();
        ctx.arc(rand() * 1024, rand() * 512, 10 + rand() * 42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    return this.register(key, canvas, true);
  }

  public dispose(): void {
    this.cache.forEach((tex) => tex.dispose());
    this.cache.clear();
  }
}
