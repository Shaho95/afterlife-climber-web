import * as THREE from 'three';
import { SceneManager } from '../game/SceneManager';
import { Player } from '../player/Player';
import { GAME_CONFIG } from '../config/GameConfig';
import { BiomeTheme, getBiomeTheme } from '../config/BiomeThemeConfig';
import { BackgroundMotifs } from './BackgroundMotifs';
import { BiomeManager } from './BiomeManager';
import { CoinSpawner } from './CoinSpawner';
import { DemonFireballSystem } from './DemonFireballSystem';
import { PadGenerator } from './PadGenerator';

export interface WorldUpdateResult {
  hitByHazard: boolean;
  coinsCollected: number;
}

export class WorldManager {
  readonly biomeManager = new BiomeManager();
  readonly padGenerator: PadGenerator;
  private readonly coinSpawner = new CoinSpawner();
  private readonly primaryBackgroundMotifs = new BackgroundMotifs();
  private readonly secondaryBackgroundMotifs = new BackgroundMotifs();
  private readonly demonFireballs = new DemonFireballSystem();
  private activePadThemeId: string | null = null;

  constructor(private readonly sceneManager: SceneManager) {
    this.padGenerator = new PadGenerator(sceneManager.worldRoot, this.coinSpawner);
    sceneManager.worldRoot.add(
      this.coinSpawner.group,
      this.primaryBackgroundMotifs.group,
      this.secondaryBackgroundMotifs.group,
      this.demonFireballs.group
    );
  }

  reset(spawnCoins = true): void {
    const visualState = this.biomeManager.getVisualState(0);
    const theme = getBiomeTheme(visualState.active.id);
    this.sceneManager.applyBiomeBlend(visualState.from, visualState.to, visualState.transition);
    this.padGenerator.applyPadTheme(theme.pad);
    this.activePadThemeId = theme.id;
    this.primaryBackgroundMotifs.setBiome(visualState.from);
    this.primaryBackgroundMotifs.setOpacity(1);
    this.secondaryBackgroundMotifs.setBiome(visualState.to);
    this.secondaryBackgroundMotifs.setOpacity(0);
    this.demonFireballs.reset();
    this.coinSpawner.reset();
    this.padGenerator.reset(spawnCoins);
  }

  update(deltaSeconds: number, height: number, player: Player, speedMultiplier = 1): WorldUpdateResult {
    const visualState = this.biomeManager.getVisualState(height);
    const theme = getBiomeTheme(visualState.active.id);
    this.sceneManager.applyBiomeBlend(visualState.from, visualState.to, visualState.transition);
    if (this.activePadThemeId !== theme.id) {
      this.padGenerator.applyPadTheme(theme.pad);
      this.activePadThemeId = theme.id;
    }
    this.primaryBackgroundMotifs.setBiome(visualState.from);
    this.primaryBackgroundMotifs.setOpacity(1 - visualState.transition);
    this.secondaryBackgroundMotifs.setBiome(visualState.to);
    this.secondaryBackgroundMotifs.setOpacity(visualState.transition);
    const storyEnding = height >= GAME_CONFIG.world.storyEndTriggerHeight;
    this.padGenerator.update(deltaSeconds, height, speedMultiplier, storyEnding);
    this.primaryBackgroundMotifs.update(deltaSeconds, height, speedMultiplier);
    this.secondaryBackgroundMotifs.update(deltaSeconds, height, speedMultiplier);
    const coinsCollected = this.coinSpawner.update(deltaSeconds, height, player);
    const hitByHazard = storyEnding
      ? (this.demonFireballs.suppress(), false)
      : this.demonFireballs.update(deltaSeconds, height, visualState.active, player, speedMultiplier);

    return { hitByHazard, coinsCollected };
  }

  get activeTheme(): BiomeTheme {
    return getBiomeTheme(this.biomeManager.activeBiome.id);
  }
}
