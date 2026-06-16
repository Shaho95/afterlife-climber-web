import { Player } from './Player';
import { PlayerStats } from './PlayerStats';
import { GAME_CONFIG } from '../config/GameConfig';
import { InputManager } from '../input/InputManager';
import { damp, lerp } from '../utils/math';

export class PlayerController {
  private stunTimer = 0;

  constructor(
    private readonly player: Player,
    private readonly input: InputManager,
    private readonly stats: PlayerStats
  ) {}

  update(deltaSeconds: number, playerTimeScale = 1): void {
    const scaledDeltaSeconds = deltaSeconds * playerTimeScale;
    if (this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - deltaSeconds);
      this.player.integrate(scaledDeltaSeconds);
      return;
    }

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

  startHazardStun(direction: number): void {
    const side = direction >= 0 ? 1 : -1;
    this.stunTimer = GAME_CONFIG.hazards.hazardStunDuration;
    this.player.velocity.x = side * GAME_CONFIG.hazards.hazardKnockbackX;
    this.player.velocity.y = Math.max(this.player.velocity.y, GAME_CONFIG.hazards.hazardKnockbackY);
  }

  resetStun(): void {
    this.stunTimer = 0;
  }
}
