import { GAME_CONFIG } from '../config/GameConfig';
import { lerp } from '../utils/math';

export class ComboManager {
  private currentCombo = 0;
  private bestCombo = 0;
  private speed = 1;

  reset(): void {
    this.currentCombo = 0;
    this.bestCombo = 0;
    this.speed = 1;
  }

  recordPadLanding(): number {
    this.currentCombo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.currentCombo);
    return this.multiplier;
  }

  recordHazardHit(): void {
    if (GAME_CONFIG.scoring.comboResetOnHit) {
      this.currentCombo = 0;
    }
  }

  recordCursedPad(): number {
    this.currentCombo = Math.floor(this.currentCombo * GAME_CONFIG.padTypes.cursedComboKeepRatio);
    return this.multiplier;
  }

  update(deltaSeconds: number): void {
    const smoothing = 1 - Math.pow(1 - GAME_CONFIG.scoring.speedSmoothing, deltaSeconds * 60);
    this.speed = lerp(this.speed, this.targetSpeedMultiplier, smoothing);
  }

  get multiplier(): number {
    return Math.max(1, this.currentCombo);
  }

  get combo(): number {
    return this.currentCombo;
  }

  get maxCombo(): number {
    return this.bestCombo;
  }

  get speedMultiplier(): number {
    return this.speed;
  }

  private get targetSpeedMultiplier(): number {
    let speed = 1;

    for (const tier of GAME_CONFIG.scoring.comboSpeedTiers) {
      if (this.multiplier >= tier.minCombo) {
        speed = tier.speed;
      }
    }

    return Math.min(
      GAME_CONFIG.scoring.maxSpeedMultiplier,
      speed
    );
  }
}
