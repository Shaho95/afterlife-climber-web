import { PlayerStats } from '../player/PlayerStats';

export class UpgradeSystem {
  applyBaseStats(stats: PlayerStats): PlayerStats {
    return { ...stats };
  }
}
