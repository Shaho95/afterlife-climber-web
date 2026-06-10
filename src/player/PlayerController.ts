import { Player } from './Player';
import { PlayerStats } from './PlayerStats';
import { GAME_CONFIG } from '../config/GameConfig';
import { InputManager } from '../input/InputManager';
import { damp, lerp } from '../utils/math';

export class PlayerController {
  constructor(
    private readonly player: Player,
    private readonly input: InputManager,
    private readonly stats: PlayerStats
  ) {}

  update(deltaSeconds: number, playerTimeScale = 1): void {
    const scaledDeltaSeconds = deltaSeconds * playerTimeScale;
    if (this.input.hasDirectTouchX) {
      const normalizedX = this.input.directTouchX ?? 0.5;
      this.player.mesh.position.x = lerp(GAME_CONFIG.world.minX, GAME_CONFIG.world.maxX, normalizedX);
      this.player.velocity.x = 0;
      this.player.integrateVertical(scaledDeltaSeconds);
      return;
    }

    const desiredVelocityX = this.input.horizontal * this.stats.horizontalSpeed;
    this.player.velocity.x = damp(this.player.velocity.x, desiredVelocityX, this.stats.airControl, scaledDeltaSeconds);
    this.player.integrate(scaledDeltaSeconds);
  }

  bounce(multiplier = 1): void {
    this.player.bounce(this.stats.bounceVelocity * multiplier);
  }
}
