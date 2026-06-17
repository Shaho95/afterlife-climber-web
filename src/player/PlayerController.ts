import { Player } from './Player';
import { PlayerStats } from './PlayerStats';
import { GAME_CONFIG } from '../config/GameConfig';
import { InputManager } from '../input/InputManager';
import { damp } from '../utils/math';

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
      this.player.velocity.x = damp(this.player.velocity.x, 0, GAME_CONFIG.hazards.hazardKnockbackDamping, scaledDeltaSeconds);
      this.player.integrate(scaledDeltaSeconds);
      return;
    }

    const horizontalInput = this.input.horizontal;
    const targetSpeed = this.input.isUsingTouch
      ? GAME_CONFIG.player.mobileHorizontalSpeed
      : this.stats.horizontalSpeed;
    const smoothing = this.input.isUsingTouch
      ? (Math.abs(horizontalInput) > 0 ? GAME_CONFIG.player.mobileAcceleration : GAME_CONFIG.player.mobileDeceleration)
      : this.stats.airControl;
    const desiredVelocityX = horizontalInput * targetSpeed;
    this.player.velocity.x = damp(this.player.velocity.x, desiredVelocityX, smoothing, scaledDeltaSeconds);
    this.player.integrate(scaledDeltaSeconds);
  }

  bounce(multiplier = 1): void {
    this.player.bounce(this.stats.bounceVelocity * multiplier);
  }

  startHazardStun(direction: number): void {
    const side = direction >= 0 ? 1 : -1;
    this.stunTimer = GAME_CONFIG.hazards.hazardStunDuration;
    this.player.velocity.x = side * (GAME_CONFIG.hazards.hazardKnockbackX / Math.max(0.01, this.stunTimer));
    this.player.velocity.y = Math.max(
      this.player.velocity.y,
      GAME_CONFIG.hazards.hazardKnockbackY / Math.max(0.01, this.stunTimer)
    );
  }

  resetStun(): void {
    this.stunTimer = 0;
  }
}
