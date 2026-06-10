import { Player } from './Player';
import { PlayerStats } from './PlayerStats';
import { InputManager } from '../input/InputManager';
import { damp } from '../utils/math';

export class PlayerController {
  constructor(
    private readonly player: Player,
    private readonly input: InputManager,
    private readonly stats: PlayerStats
  ) {}

  update(deltaSeconds: number, playerTimeScale = 1): void {
    const scaledDeltaSeconds = deltaSeconds * playerTimeScale;
    const desiredVelocityX = this.input.horizontal * this.stats.horizontalSpeed;
    this.player.velocity.x = damp(this.player.velocity.x, desiredVelocityX, this.stats.airControl, scaledDeltaSeconds);
    this.player.integrate(scaledDeltaSeconds);
  }

  bounce(multiplier = 1): void {
    this.player.bounce(this.stats.bounceVelocity * multiplier);
  }
}
