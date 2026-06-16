import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { BiomeDefinition } from '../config/BiomeConfig';
import { Player } from '../player/Player';
import { applyForegroundRenderProfile, RENDER_ORDER } from '../render/RenderLayers';

interface Fireball {
  mesh: THREE.Group;
  velocity: THREE.Vector3;
  baseScale: THREE.Vector3;
  active: boolean;
  hitCooldown: number;
  telegraphTimer: number;
}

export class DemonFireballSystem {
  readonly group = new THREE.Group();
  private readonly fireballs: Fireball[] = [];
  private readonly debugDirectHit = new URLSearchParams(window.location.search).has('debugHazardHit');
  private readonly debugNoHazards = new URLSearchParams(window.location.search).has('debugNoHazards');
  private spawnTimer = 0;
  private spawnCursor = 0;
  private debugHitTimer = 3.2;

  constructor() {
    this.group.renderOrder = RENDER_ORDER.HAZARD;
    for (let i = 0; i < GAME_CONFIG.hazards.fireballPoolSize; i += 1) {
      const fireball = this.createFireball();
      fireball.mesh.visible = false;
      this.fireballs.push(fireball);
      this.group.add(fireball.mesh);
    }
  }

  reset(): void {
    this.spawnTimer = 0;
    this.spawnCursor = 0;
    this.debugHitTimer = 3.2;
    for (const fireball of this.fireballs) {
      fireball.active = false;
      fireball.mesh.visible = false;
      fireball.hitCooldown = 0;
      fireball.telegraphTimer = 0;
      fireball.mesh.scale.copy(fireball.baseScale);
      applyForegroundRenderProfile(fireball.mesh, RENDER_ORDER.HAZARD);
    }
  }

  suppress(): void {
    this.group.visible = false;
    this.spawnTimer = GAME_CONFIG.hazards.fireballSpawnInterval;
    for (const fireball of this.fireballs) {
      this.deactivate(fireball);
    }
  }

  update(deltaSeconds: number, height: number, biome: BiomeDefinition, player: Player, gameSpeedMultiplier = 1): boolean {
    if (this.debugNoHazards) {
      this.group.visible = false;
      return false;
    }

    this.group.visible = true;
    let hitPlayer = false;
    this.debugHitTimer = Math.max(0, this.debugHitTimer - deltaSeconds);
    const hazardSpeedMultiplier = Math.min(
      GAME_CONFIG.scoring.maxHazardSpeedMultiplier,
      GAME_CONFIG.scoring.hazardBaseSpeedMultiplier + (Math.max(1, gameSpeedMultiplier) - 1) * GAME_CONFIG.scoring.hazardSpeedScale
    );
    const spawnSpeedMultiplier = Math.max(
      0.94,
      1 + (hazardSpeedMultiplier - 1) * GAME_CONFIG.scoring.hazardSpawnSpeedScale
    );

    this.spawnTimer -= deltaSeconds;
    if (this.spawnTimer <= 0) {
      const baseInterval = biome.id === 'volcano'
        ? GAME_CONFIG.hazards.fireballSpawnInterval * 0.82
        : GAME_CONFIG.hazards.fireballSpawnInterval;
      this.spawnTimer = baseInterval / spawnSpeedMultiplier;
      this.spawn(height, player.mesh.position.x, player.mesh.position.y, biome, hazardSpeedMultiplier);
    }

    for (const fireball of this.fireballs) {
      if (!fireball.active) {
        continue;
      }

      fireball.hitCooldown = Math.max(0, fireball.hitCooldown - deltaSeconds);
      fireball.telegraphTimer = Math.max(0, fireball.telegraphTimer - deltaSeconds);

      if (fireball.telegraphTimer > 0) {
        const pulse = 1 + Math.sin(fireball.telegraphTimer * 24) * 0.12;
        fireball.mesh.scale.copy(fireball.baseScale).multiplyScalar(pulse);
        continue;
      }

      fireball.mesh.scale.copy(fireball.baseScale);
      fireball.mesh.position.addScaledVector(fireball.velocity, deltaSeconds);
      fireball.mesh.rotation.z += deltaSeconds * 6;

      if (
        Math.abs(fireball.mesh.position.x) > 4.4 ||
        fireball.mesh.position.y < height - 10 ||
        fireball.mesh.position.y > height + 18
      ) {
        this.deactivate(fireball);
        continue;
      }

      const dx = player.mesh.position.x - fireball.mesh.position.x;
      const dy = player.mesh.position.y + 0.7 - fireball.mesh.position.y;
      const hitRadius = GAME_CONFIG.hazards.fireballHitRadius;

      if (fireball.hitCooldown <= 0 && dx * dx + dy * dy < hitRadius * hitRadius) {
        const side = fireball.velocity.x > 0 ? 1 : -1;
        player.velocity.x = side * GAME_CONFIG.hazards.hazardKnockbackX;
        player.velocity.y = Math.max(player.velocity.y, GAME_CONFIG.hazards.hazardKnockbackY);
        fireball.hitCooldown = 1.2;
        hitPlayer = true;
        this.deactivate(fireball);
      }
    }

    return hitPlayer;
  }

  private spawn(height: number, playerX: number, playerY: number, biome: BiomeDefinition, hazardSpeedMultiplier: number): void {
    const fireball = this.fireballs.find((candidate) => !candidate.active);
    if (!fireball) {
      return;
    }

    this.spawnCursor += 1;

    if (this.debugDirectHit && this.debugHitTimer <= 0) {
      fireball.mesh.position.set(playerX, playerY + 0.7, 0.72);
      fireball.velocity.set(0, 0, 0);
      fireball.mesh.scale.set(1, 1, 1);
      fireball.baseScale.copy(fireball.mesh.scale);
      this.applyBiomeVisual(fireball, biome);
      fireball.mesh.visible = true;
      fireball.active = true;
      fireball.hitCooldown = 0;
      fireball.telegraphTimer = 0;
      this.debugHitTimer = 999;
      return;
    }

    if (biome.id === 'volcano') {
      const x = -2.2 + (this.spawnCursor % 5) * 1.1;
      const y = Math.max(height - 2.8, playerY - 4.2);
      const sideDrift = this.spawnCursor % 2 === 0 ? 0.9 : -0.9;
      fireball.mesh.position.set(x, y, 0.72);
      fireball.velocity.set(sideDrift * hazardSpeedMultiplier, GAME_CONFIG.hazards.fireballSpeed * 1.05 * hazardSpeedMultiplier, 0);
      fireball.mesh.scale.set(0.85, 1.25, 1);
    } else {
      const side = this.spawnCursor % 2 === 0 ? -1 : 1;
      const yOffset = 1.8 + (this.spawnCursor % 5) * 1.05;
      const y = Math.max(height + yOffset, playerY + 1.2);
      fireball.mesh.position.set(side * 3.45, y, 0.72);
      fireball.velocity.set(-side * GAME_CONFIG.hazards.fireballSpeed * hazardSpeedMultiplier, (this.spawnCursor % 3 - 1) * 0.25 * hazardSpeedMultiplier, 0);
      fireball.mesh.scale.set(1, 1, 1);
    }

    this.applyBiomeVisual(fireball, biome);
    fireball.baseScale.copy(fireball.mesh.scale);
    fireball.mesh.visible = true;
    fireball.active = true;
    fireball.hitCooldown = 0;
    fireball.telegraphTimer = GAME_CONFIG.hazards.hazardTelegraphTime / hazardSpeedMultiplier;
  }

  private deactivate(fireball: Fireball): void {
    fireball.active = false;
    fireball.mesh.visible = false;
    fireball.telegraphTimer = 0;
    fireball.mesh.scale.copy(fireball.baseScale);
  }

  private createFireball(): Fireball {
    const mesh = new THREE.Group();
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x1b0704, side: THREE.DoubleSide, depthTest: false });
    const outerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3c1d, side: THREE.DoubleSide, depthTest: false });
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffea61, side: THREE.DoubleSide, depthTest: false });

    const outline = new THREE.Mesh(new THREE.CircleGeometry(GAME_CONFIG.hazards.fireballRadius + 0.08, 20), outlineMaterial);
    outline.userData.hazardPart = 'outline';
    const outer = new THREE.Mesh(new THREE.CircleGeometry(GAME_CONFIG.hazards.fireballRadius, 20), outerMaterial);
    outer.userData.hazardPart = 'outer';
    const core = new THREE.Mesh(new THREE.CircleGeometry(GAME_CONFIG.hazards.fireballRadius * 0.55, 16), coreMaterial);
    core.userData.hazardPart = 'core';
    core.position.set(0.06, 0.04, 0.02);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 3), outerMaterial);
    tail.userData.hazardPart = 'tail';
    tail.rotation.z = Math.PI * 0.5;
    tail.position.set(-0.28, 0, -0.01);

    mesh.add(outline, tail, outer, core);
    applyForegroundRenderProfile(mesh, RENDER_ORDER.HAZARD);

    return {
      mesh,
      velocity: new THREE.Vector3(),
      baseScale: new THREE.Vector3(1, 1, 1),
      active: false,
      hitCooldown: 0,
      telegraphTimer: 0
    };
  }

  private applyBiomeVisual(fireball: Fireball, biome: BiomeDefinition): void {
    const palette = this.hazardPalette(biome.id);
    fireball.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial)) {
        return;
      }

      const part = object.userData.hazardPart;
      if (part === 'outline') {
        object.material.color.setHex(palette.outline);
      } else if (part === 'core') {
        object.material.color.setHex(palette.core);
      } else {
        object.material.color.setHex(palette.outer);
      }
    });
    applyForegroundRenderProfile(fireball.mesh, RENDER_ORDER.HAZARD, true);
  }

  private hazardPalette(biomeId: BiomeDefinition['id']): { outline: number; outer: number; core: number } {
    switch (biomeId) {
      case 'lava':
        return { outline: 0x230904, outer: 0xff5a1f, core: 0xffe067 };
      case 'volcano':
        return { outline: 0x16110f, outer: 0xb43c24, core: 0xff9b42 };
      case 'fossils':
        return { outline: 0x2b1b12, outer: 0xd7bd82, core: 0xffefb5 };
      case 'skeletons':
        return { outline: 0x15151a, outer: 0xd9d0bd, core: 0xfff4dc };
      case 'goldDiamonds':
        return { outline: 0x1b1405, outer: 0xffd766, core: 0xa4f0ff };
      case 'roots':
        return { outline: 0x0d1208, outer: 0x7b4a28, core: 0xa6e36a };
      case 'surface':
        return { outline: 0x1d2a14, outer: 0x8c6a3b, core: 0xffe48a };
      case 'skyscrapers':
        return { outline: 0x11161d, outer: 0x687988, core: 0xf8d46d };
      case 'sky':
      case 'upperAtmosphere':
        return { outline: 0x245c84, outer: 0xffffff, core: 0xffd76e };
      case 'space':
      case 'galaxy':
        return { outline: 0x050814, outer: 0x8ea1ff, core: 0xffffff };
      case 'aliens':
        return { outline: 0x061613, outer: 0x5b49a1, core: 0x8cffc2 };
      case 'void':
        return { outline: 0x000000, outer: 0x242424, core: 0x777777 };
      case 'whiteEnd':
      case 'paradise':
        return { outline: 0xc9b980, outer: 0xffffff, core: 0xffd975 };
      default:
        return { outline: 0x1b0704, outer: 0xff3c1d, core: 0xffea61 };
    }
  }
}
