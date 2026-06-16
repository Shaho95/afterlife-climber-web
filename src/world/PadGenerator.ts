import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { PadTheme } from '../config/BiomeThemeConfig';
import { clamp } from '../utils/math';
import { Pad, PadState, PadType } from './Pad';
import { CoinSpawner } from './CoinSpawner';

export class PadGenerator {
  private readonly pads: Pad[] = [];
  private readonly material = new THREE.MeshBasicMaterial({
    color: 0x2c1715
  });
  private readonly debugPadType = this.readDebugPadType();
  private highestIndex = -1;
  private reachableX = 0;
  private speedMultiplier = 1;
  private padMotionPhase = 0;

  constructor(private readonly root: THREE.Group, private readonly coinSpawner?: CoinSpawner) {
    for (let i = 0; i < GAME_CONFIG.pads.poolSize; i += 1) {
      const pad = new Pad(this.material);
      this.pads.push(pad);
      this.root.add(pad.mesh);
    }
  }

  reset(spawnCoins = true): void {
    this.highestIndex = -1;
    this.reachableX = 0;
    this.padMotionPhase = 0;

    for (let i = 0; i < this.pads.length; i += 1) {
      this.spawnNext(i, spawnCoins);
    }
  }

  update(deltaSeconds: number, playerHeight: number, speedMultiplier = 1, storyEnding = false): void {
    this.speedMultiplier = speedMultiplier;
    const effectiveSpeedMultiplier = storyEnding ? 1 : speedMultiplier;
    const difficulty = storyEnding ? 0 : this.speedDifficulty(effectiveSpeedMultiplier);
    this.padMotionPhase += deltaSeconds * this.padMovementMultiplier(effectiveSpeedMultiplier);
    const recycleBelow = playerHeight - GAME_CONFIG.pads.visibleBehind * GAME_CONFIG.pads.verticalSpacing;

    for (const pad of this.pads) {
      pad.update(deltaSeconds);
      if (pad.state.y < recycleBelow) {
        this.spawnNext(this.highestIndex + 1);
      }
    }

    this.applyPadMotion(difficulty);
  }

  findLandingPad(playerX: number, playerHalfWidth: number, currentFeetY: number, previousFeetY: number, speedMultiplier = 1): Pad | null {
    const difficulty = this.speedDifficulty(speedMultiplier);
    const landingHalfWidth = playerHalfWidth * (1 - difficulty * 0.08);

    for (const pad of this.pads) {
      const topY = pad.topY;
      const crossedTop = previousFeetY >= topY && currentFeetY <= topY;

      if (crossedTop && pad.containsX(playerX, landingHalfWidth, difficulty)) {
        return pad;
      }
    }

    return null;
  }

  applyPadColor(color: number): void {
    this.material.color.setHex(color);
  }

  applyPadTheme(theme: PadTheme): void {
    this.material.color.setHex(theme.topColor);
    for (const pad of this.pads) {
      pad.applyTheme(theme);
    }
  }

  private spawnNext(index: number, spawnCoins = true): void {
    this.highestIndex = Math.max(this.highestIndex, index);

    if (index < GAME_CONFIG.pads.firstChallengeIndex) {
      this.reachableX = 0;
    } else {
      const wave = Math.sin(index * 2.17) * 0.62 + Math.sin(index * 0.71) * 0.38;
      const direction = wave >= 0 ? 1 : -1;
      const step = direction * (1.15 + Math.abs(wave) * GAME_CONFIG.pads.maxReachableStep * 0.55);
      this.reachableX = this.clampPadCenter(this.reachableX + step, false);

      if (Math.abs(this.reachableX) < GAME_CONFIG.pads.minimumCenterOffset) {
        this.reachableX = GAME_CONFIG.pads.minimumCenterOffset * direction;
      }
    }

    const y = GAME_CONFIG.pads.startY + index * GAME_CONFIG.pads.verticalSpacing;
    const pad = this.pads[index % this.pads.length];
    pad.setState(this.createPadState(index, this.reachableX, y));
    if (spawnCoins) {
      this.coinSpawner?.spawnForPad(pad.state);
    }
  }

  private createPadState(index: number, x: number, y: number): PadState {
    const type = this.pickPadType(index, y);
    const safeX = this.clampPadCenter(x, type === PadType.MOVING);
    const fragile = type === PadType.FRAGILE;
    return {
      x: safeX,
      y,
      width: GAME_CONFIG.pads.width,
      height: GAME_CONFIG.pads.height,
      depth: GAME_CONFIG.pads.depth,
      index,
      fragile,
      maxTouches: fragile ? GAME_CONFIG.padDurability.fragilePadTouches : GAME_CONFIG.padDurability.normalPadTouches,
      type
    };
  }

  private pickPadType(index: number, y: number): PadType {
    if (this.debugPadType) {
      return this.debugPadType;
    }

    if (y >= GAME_CONFIG.world.storyEndTriggerHeight) {
      return PadType.NORMAL;
    }

    const safeIntroHeight = Math.max(50, GAME_CONFIG.pads.firstChallengeIndex * GAME_CONFIG.pads.verticalSpacing);
    if (y < safeIntroHeight) {
      return PadType.NORMAL;
    }

    if (y >= GAME_CONFIG.padTypes.cursedPadStartHeight && this.random(index + 211) < GAME_CONFIG.padTypes.cursedPadChance) {
      return PadType.CURSED;
    }

    if (y >= GAME_CONFIG.padTypes.boostPadStartHeight && this.random(index + 173) < GAME_CONFIG.padTypes.boostPadChance) {
      return PadType.BOOST;
    }

    if (y >= GAME_CONFIG.padTypes.movingPadStartHeight && this.random(index + 137) < GAME_CONFIG.padTypes.movingPadChance) {
      return PadType.MOVING;
    }

    if (index > GAME_CONFIG.pads.firstChallengeIndex + 5 && this.random(index + 97) < GAME_CONFIG.padDurability.fragilePadChance) {
      return PadType.FRAGILE;
    }

    return PadType.NORMAL;
  }

  private random(seed: number): number {
    const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  private readDebugPadType(): PadType | null {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('debugPadType');
    if (value === PadType.FRAGILE || value === PadType.MOVING || value === PadType.BOOST || value === PadType.CURSED) {
      return value;
    }

    return null;
  }

  private speedDifficulty(speedMultiplier: number): number {
    const speedRange = Math.max(0.01, GAME_CONFIG.scoring.maxSpeedMultiplier - 1);
    return clamp(
      ((Math.max(1, speedMultiplier) - 1) / speedRange) * GAME_CONFIG.scoring.padDifficultySpeedScale,
      0,
      1
    );
  }

  private padMovementMultiplier(speedMultiplier: number): number {
    const speedRange = Math.max(0.01, GAME_CONFIG.scoring.maxSpeedMultiplier - 1);
    const speedRatio = clamp((Math.max(1, speedMultiplier) - 1) / speedRange, 0, 1);
    return 1 + (GAME_CONFIG.scoring.maxPadMovementMultiplier - 1) * speedRatio;
  }

  private applyPadMotion(difficulty: number): void {
    for (const pad of this.pads) {
      if (pad.state.type !== PadType.MOVING) {
        pad.setVisualOffset(0);
        continue;
      }

      const amplitude = GAME_CONFIG.padTypes.movingPadAmplitude * (0.86 + difficulty * 0.14);
      const phase = this.padMotionPhase * GAME_CONFIG.padTypes.movingPadSpeed + pad.state.index * 0.83;
      const offset = Math.sin(phase) * amplitude;
      const minOffset = this.safePadMinX(false) - pad.state.x;
      const maxOffset = this.safePadMaxX(false) - pad.state.x;
      pad.setVisualOffset(clamp(offset, minOffset, maxOffset));
    }
  }

  private clampPadCenter(x: number, moving: boolean): number {
    return clamp(x, this.safePadMinX(moving), this.safePadMaxX(moving));
  }

  private safePadMinX(moving: boolean): number {
    const movementReserve = moving
      ? GAME_CONFIG.padTypes.movingPadAmplitude + GAME_CONFIG.pads.movingPadEdgeSafetyMargin
      : 0;
    return GAME_CONFIG.world.minX + this.visualHalfPadWidth() + GAME_CONFIG.pads.padScreenMargin + GAME_CONFIG.pads.padEdgeSafetyMargin + movementReserve;
  }

  private safePadMaxX(moving: boolean): number {
    const movementReserve = moving
      ? GAME_CONFIG.padTypes.movingPadAmplitude + GAME_CONFIG.pads.movingPadEdgeSafetyMargin
      : 0;
    return GAME_CONFIG.world.maxX - this.visualHalfPadWidth() - GAME_CONFIG.pads.padScreenMargin - GAME_CONFIG.pads.padEdgeSafetyMargin - movementReserve;
  }

  private visualHalfPadWidth(): number {
    return GAME_CONFIG.pads.width * GAME_CONFIG.pads.landingWidthMultiplier * 0.5;
  }
}
