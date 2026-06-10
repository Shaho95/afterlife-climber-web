import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../player/Player';
import { RENDER_ORDER } from '../render/RenderLayers';
import { clamp } from '../utils/math';
import { PadState } from './Pad';
import { CoinCollectible } from './CoinCollectible';

export class CoinSpawner {
  readonly group = new THREE.Group();
  private readonly coins: CoinCollectible[] = [];

  constructor() {
    this.group.renderOrder = RENDER_ORDER.PICKUP;
    for (let i = 0; i < GAME_CONFIG.coins.poolSize; i += 1) {
      const coin = new CoinCollectible();
      this.coins.push(coin);
      this.group.add(coin.mesh);
    }
  }

  reset(): void {
    for (const coin of this.coins) {
      coin.deactivate();
    }
  }

  spawnForPad(pad: PadState): void {
    this.deactivateForPad(pad.index);

    if (pad.index < GAME_CONFIG.pads.firstChallengeIndex) {
      return;
    }

    const isIntroCoin = pad.index === GAME_CONFIG.pads.firstChallengeIndex;
    if (!isIntroCoin && this.random(pad.index) > GAME_CONFIG.coins.coinSpawnChance) {
      return;
    }

    const coin = this.coins.find((candidate) => !candidate.active);
    if (!coin) {
      return;
    }

    const towardCenter = pad.x > 0 ? -1 : 1;
    const routeOffset = towardCenter * (0.68 + this.random(pad.index + 13) * 0.52);
    const verticalOffset = 0.34 + this.random(pad.index + 29) * 0.24;
    const x = clamp(pad.x + routeOffset, GAME_CONFIG.world.minX + 0.45, GAME_CONFIG.world.maxX - 0.45);
    const y = pad.y + verticalOffset;
    coin.spawn(pad.index, x, y, GAME_CONFIG.coins.coinValue);
  }

  update(deltaSeconds: number, playerHeight: number, player: Player): number {
    let collected = 0;
    const pickupRadius = GAME_CONFIG.coins.coinPickupRadius;
    const pickupRadiusSquared = pickupRadius * pickupRadius;

    for (const coin of this.coins) {
      if (!coin.active) {
        continue;
      }

      coin.update(deltaSeconds);

      if (coin.mesh.position.y < playerHeight - 9) {
        coin.deactivate();
        continue;
      }

      const dx = player.mesh.position.x - coin.mesh.position.x;
      const dy = player.mesh.position.y + 0.65 - coin.mesh.position.y;
      if (dx * dx + dy * dy <= pickupRadiusSquared) {
        collected += coin.collect();
      }
    }

    return collected;
  }

  private deactivateForPad(padIndex: number): void {
    for (const coin of this.coins) {
      if (coin.padIndex === padIndex) {
        coin.deactivate();
      }
    }
  }

  private random(seed: number): number {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  }
}
