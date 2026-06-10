import { GAME_CONFIG } from '../config/GameConfig';

export class ScoreManager {
  private currentScore = 0;

  reset(): void {
    this.currentScore = 0;
  }

  recordPadLanding(comboMultiplier: number, scoreMultiplier = 1): number {
    const scoreGained = Math.floor(GAME_CONFIG.scoring.basePadScore * comboMultiplier * scoreMultiplier);
    this.currentScore += scoreGained;
    return scoreGained;
  }

  get score(): number {
    return this.currentScore;
  }
}
