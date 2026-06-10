import { GAME_CONFIG } from '../config/GameConfig';

export class CoinManager {
  private coinsCollectedThisRun = 0;

  resetRun(): void {
    this.coinsCollectedThisRun = 0;
  }

  collect(value: number): number {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    this.coinsCollectedThisRun += safeValue;
    return safeValue;
  }

  get currentRunCoins(): number {
    return this.coinsCollectedThisRun;
  }

  calculateScoreBonusCoins(score: number): number {
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
    return Math.floor(safeScore * GAME_CONFIG.scoring.scoreToCoinBonusRate);
  }

  calculateTotalEarned(score: number): { collectedCoins: number; scoreBonusCoins: number; totalCoinsEarned: number } {
    const collectedCoins = this.coinsCollectedThisRun;
    const scoreBonusCoins = this.calculateScoreBonusCoins(score);
    return {
      collectedCoins,
      scoreBonusCoins,
      totalCoinsEarned: collectedCoins + scoreBonusCoins
    };
  }
}
