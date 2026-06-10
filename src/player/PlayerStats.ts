import { GAME_CONFIG } from '../config/GameConfig';

export interface PlayerStats {
  bounceVelocity: number;
  horizontalSpeed: number;
  airControl: number;
}

export function createBasePlayerStats(): PlayerStats {
  return {
    bounceVelocity: GAME_CONFIG.player.bounceVelocity,
    horizontalSpeed: GAME_CONFIG.player.horizontalSpeed,
    airControl: GAME_CONFIG.player.airControl
  };
}
