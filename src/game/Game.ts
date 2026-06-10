import { AssetManager } from './AssetManager';
import { GameLoop } from './GameLoop';
import { SceneManager } from './SceneManager';
import { CameraController } from '../camera/CameraController';
import { GAME_CONFIG } from '../config/GameConfig';
import { InputManager } from '../input/InputManager';
import { Player } from '../player/Player';
import { PlayerController } from '../player/PlayerController';
import { createBasePlayerStats } from '../player/PlayerStats';
import { CoinManager } from '../progression/CoinManager';
import { ComboManager } from '../progression/ComboManager';
import { SaveManager } from '../progression/SaveManager';
import { ScoreManager } from '../progression/ScoreManager';
import { SkinManager } from '../progression/SkinManager';
import { UpgradeSystem } from '../progression/UpgradeSystem';
import { GameOverScreen } from '../ui/GameOverScreen';
import { HUD } from '../ui/HUD';
import { MainMenuScreen } from '../ui/MainMenuScreen';
import { SettingsScreen } from '../ui/SettingsScreen';
import { ShopScreen } from '../ui/ShopScreen';
import { VictoryScreen } from '../ui/VictoryScreen';
import { WorldManager } from '../world/WorldManager';
import { SettingsManager } from '../settings/SettingsManager';
import { PadType } from '../world/Pad';

type GameState = 'mainMenu' | 'playing' | 'gameOver' | 'victoryFade' | 'victoryScreen' | 'shopMenu' | 'settingsMenu';

export class Game {
  private readonly shell = document.createElement('div');
  private readonly canvas = document.createElement('canvas');
  private readonly sceneManager: SceneManager;
  private readonly assetManager = new AssetManager();
  private readonly input: InputManager;
  private readonly player = new Player();
  private readonly playerController: PlayerController;
  private readonly cameraController: CameraController;
  private readonly worldManager: WorldManager;
  private readonly hud = new HUD();
  private readonly mainMenuScreen: MainMenuScreen;
  private readonly shopScreen: ShopScreen;
  private readonly settingsScreen: SettingsScreen;
  private readonly gameOverScreen: GameOverScreen;
  private readonly victoryScreen: VictoryScreen;
  private readonly hintElement: HTMLDivElement;
  private readonly victoryFadeOverlay = document.createElement('div');
  private readonly saveManager = new SaveManager();
  private readonly skinManager = new SkinManager(this.saveManager);
  private readonly settingsManager = new SettingsManager();
  private readonly coinManager = new CoinManager();
  private readonly scoreManager = new ScoreManager();
  private readonly comboManager = new ComboManager();
  private readonly loop: GameLoop;
  private readonly debugStartHeight = this.readDebugStartHeight();
  private readonly debugComboLandings = this.readDebugComboLandings();
  private readonly debugEndRunAfterSeconds = this.readDebugEndRunAfterSeconds();
  private state: GameState = 'mainMenu';
  private height = 0;
  private runElapsedSeconds = 0;
  private activeThemeId: string | null = null;
  private runRewardClaimed = false;
  private storyNoticeShown = false;
  private victoryFadeElapsed = 0;
  private readonly victoryFadeDuration = 1.65;
  private comboStartTime: number | null = null;
  private longestComboDurationThisRun = 0;
  private boostsUsedThisRun = 0;
  private bestBoostHeightGain = 0;
  private activeBoostStartHeight: number | null = null;

  constructor(private readonly root: HTMLElement) {
    this.shell.className = 'game-shell';
    this.canvas.className = 'game-canvas';
    this.shell.append(this.canvas);
    this.root.append(this.shell);

    this.sceneManager = new SceneManager(this.canvas);
    this.input = new InputManager(this.canvas);
    const stats = new UpgradeSystem().applyBaseStats(createBasePlayerStats());
    this.playerController = new PlayerController(this.player, this.input, stats);
    this.cameraController = new CameraController(this.sceneManager.camera, this.player);
    this.worldManager = new WorldManager(this.sceneManager);

    this.sceneManager.worldRoot.add(this.player.mesh);
    this.skinManager.applySelectedSkin(this.player);
    this.ensurePlayerRenderable();

    this.mainMenuScreen = new MainMenuScreen(
      () => this.play(),
      () => this.openShop(),
      () => this.openSettings()
    );
    this.shopScreen = new ShopScreen(
      () => this.showMainMenu(),
      (skinId) => this.handleSkinAction(skinId)
    );
    this.settingsScreen = new SettingsScreen(
      () => this.showMainMenu(),
      (language) => this.settingsScreen.update(this.settingsManager.setLanguage(language))
    );
    this.gameOverScreen = new GameOverScreen(() => this.restartRun(), () => this.showMainMenu());
    this.victoryScreen = new VictoryScreen(() => this.restartRun(), () => this.showMainMenu());
    this.victoryFadeOverlay.className = 'victory-fade-overlay';
    this.victoryFadeOverlay.hidden = true;
    this.hintElement = this.createHint();
    this.shell.append(
      this.hud.element,
      this.mainMenuScreen.element,
      this.shopScreen.element,
      this.settingsScreen.element,
      this.gameOverScreen.element,
      this.victoryScreen.element,
      this.victoryFadeOverlay,
      this.hintElement
    );

    this.loop = new GameLoop((deltaSeconds) => this.update(deltaSeconds));
    window.addEventListener('resize', this.resize);
    this.resize();
    this.showMainMenu();
  }

  async start(): Promise<void> {
    await this.assetManager.loadCore();
    this.loop.start();
  }

  private play(ignoreDebugStartHeight = false): void {
    this.state = 'playing';
    this.saveManager.recordAttempt();
    this.mainMenuScreen.hide();
    this.shopScreen.hide();
    this.settingsScreen.hide();
    this.gameOverScreen.hide();
    this.victoryScreen.hide();
    this.victoryFadeOverlay.hidden = true;
    this.victoryFadeOverlay.style.opacity = '0';
    this.hud.show();
    this.hintElement.hidden = false;
    this.resetWorld(true, ignoreDebugStartHeight);
  }

  private restartRun(): void {
    this.play(this.state === 'victoryScreen');
  }

  private showMainMenu(): void {
    this.state = 'mainMenu';
    this.gameOverScreen.hide();
    this.victoryScreen.hide();
    this.victoryFadeOverlay.hidden = true;
    this.victoryFadeOverlay.style.opacity = '0';
    this.shopScreen.hide();
    this.settingsScreen.hide();
    this.hud.hide();
    this.hintElement.hidden = true;
    this.resetMenuWorld();
    this.skinManager.applySelectedSkin(this.player);
    this.ensurePlayerRenderable();
    this.mainMenuScreen.show(this.saveManager.snapshot);
  }

  private openShop(): void {
    this.state = 'shopMenu';
    this.mainMenuScreen.hide();
    this.settingsScreen.hide();
    this.hud.hide();
    this.hintElement.hidden = true;
    this.shopScreen.show(this.saveManager.snapshot, this.skinManager.shopItems);
  }

  private handleSkinAction(skinId: string): void {
    const result = this.skinManager.buyOrEquip(skinId);
    this.skinManager.applySelectedSkin(this.player);
    this.ensurePlayerRenderable();
    this.shopScreen.update(result.saveData, this.skinManager.shopItems, result.message);
  }

  private openSettings(): void {
    this.state = 'settingsMenu';
    this.mainMenuScreen.hide();
    this.shopScreen.hide();
    this.hud.hide();
    this.hintElement.hidden = true;
    this.settingsScreen.show(this.settingsManager.snapshot);
  }

  private resetMenuWorld(): void {
    this.height = 0;
    this.runElapsedSeconds = 0;
    this.runRewardClaimed = false;
    this.storyNoticeShown = false;
    this.resetRunStats();
    this.scoreManager.reset();
    this.coinManager.resetRun();
    this.comboManager.reset();
    this.hud.resetFeedback();
    this.skinManager.applySelectedSkin(this.player);
    this.player.reset();
    this.ensurePlayerRenderable();
    this.player.velocity.set(0, 0, 0);
    this.player.mesh.position.set(0, 0.55, 0.45);
    this.worldManager.reset(false);
    this.cameraController.reset(0);
    this.applyThemeToShell();
  }

  private resetWorld(spawnCoins = true, ignoreDebugStartHeight = false): void {
    const startHeight = ignoreDebugStartHeight ? 0 : this.debugStartHeight;
    this.height = startHeight;
    this.runElapsedSeconds = 0;
    this.runRewardClaimed = false;
    this.storyNoticeShown = false;
    this.victoryFadeElapsed = 0;
    this.resetRunStats();
    this.scoreManager.reset();
    this.coinManager.resetRun();
    this.comboManager.reset();
    this.hud.resetFeedback();
    this.applyDebugComboLandings();
    this.skinManager.applySelectedSkin(this.player);
    this.player.reset();
    this.ensurePlayerRenderable();
    this.player.mesh.position.y = startHeight;
    this.worldManager.reset(spawnCoins);
    if (startHeight > 0) {
      this.worldManager.update(0, startHeight, this.player, this.comboManager.speedMultiplier);
    }
    this.cameraController.reset(startHeight);
    this.applyThemeToShell();
    this.hud.update(
      0,
      this.height,
      this.worldManager.biomeManager.activeBiome.name,
      this.scoreManager.score,
      this.comboManager.combo,
      this.comboManager.speedMultiplier,
      this.playerTimeScale(this.comboManager.speedMultiplier),
      this.saveManager.snapshot.totalCoins,
      this.coinManager.currentRunCoins
    );
  }

  private update(deltaSeconds: number): void {
    if (this.state === 'playing') {
      this.runElapsedSeconds += deltaSeconds;
      this.updateRunStats(deltaSeconds);
      const previousFeetY = this.player.feetY;
      const speedMultiplier = this.comboManager.speedMultiplier;
      const playerTimeScale = this.playerTimeScale(speedMultiplier);
      this.playerController.update(deltaSeconds, playerTimeScale);

      if (this.player.velocity.y <= 0) {
        const pad = this.worldManager.padGenerator.findLandingPad(
          this.player.mesh.position.x,
          this.player.halfWidth,
          this.player.feetY,
          previousFeetY,
          speedMultiplier
        );

        if (pad) {
          this.player.mesh.position.y = pad.topY;
          this.playerController.bounce(this.bounceMultiplierForPad(pad.state.type));
          if (pad.consumeTouch()) {
            this.applyPadLandingEffects(pad.state.type);
          }
        }
      }

      this.height = Math.max(this.height, this.player.mesh.position.y);
      const storyEnding = this.height >= GAME_CONFIG.world.storyEndTriggerHeight;
      this.comboManager.update(deltaSeconds);
      const updatedSpeedMultiplier = this.comboManager.speedMultiplier;
      const updatedPlayerTimeScale = this.playerTimeScale(updatedSpeedMultiplier);
      const worldResult = this.worldManager.update(deltaSeconds, this.height, this.player, updatedSpeedMultiplier);
      if (worldResult.coinsCollected > 0) {
        const collected = this.coinManager.collect(worldResult.coinsCollected);
        this.hud.showCoinFeedback(collected);
      }

      if (worldResult.hitByHazard) {
        this.finishCurrentComboDuration();
        this.comboManager.recordHazardHit();
      }

      this.ensurePlayerRenderable();
      this.applyThemeToShell();
      this.cameraController.update(deltaSeconds, updatedSpeedMultiplier);
      this.hud.update(
        deltaSeconds,
        this.height,
        this.displayBiomeName(),
        this.scoreManager.score,
        this.comboManager.combo,
        updatedSpeedMultiplier,
        updatedPlayerTimeScale,
        this.saveManager.snapshot.totalCoins,
        this.coinManager.currentRunCoins
      );

      if (storyEnding && !this.storyNoticeShown) {
        this.storyNoticeShown = true;
        this.hud.showPadFeedback('Slutet narmar sig');
      }

      if (this.height >= GAME_CONFIG.world.storyCompleteHeight) {
        this.startVictoryFade();
        return;
      }

      if (this.player.mesh.position.y < this.cameraController.failY) {
        this.endRun();
        return;
      }

      if (this.debugEndRunAfterSeconds !== null && this.runElapsedSeconds >= this.debugEndRunAfterSeconds) {
        this.endRun();
      }
    } else if (this.state === 'victoryFade') {
      this.victoryFadeElapsed = Math.min(this.victoryFadeDuration, this.victoryFadeElapsed + deltaSeconds);
      this.victoryFadeOverlay.style.opacity = `${this.victoryFadeElapsed / this.victoryFadeDuration}`;
      this.sceneManager.camera.position.y += deltaSeconds * 0.28;
      if (this.victoryFadeElapsed >= this.victoryFadeDuration) {
        this.completeStoryRun();
      }
    }

    this.sceneManager.render();
  }

  private endRun(): void {
    this.finishCurrentComboDuration();
    this.finishRun('failed');
  }

  private completeStoryRun(): void {
    this.finishCurrentComboDuration();
    this.finishRun('complete');
  }

  private startVictoryFade(): void {
    if (this.runRewardClaimed || this.state === 'victoryFade' || this.state === 'victoryScreen') {
      return;
    }

    this.state = 'victoryFade';
    this.victoryFadeElapsed = 0;
    this.player.velocity.set(0, 0, 0);
    this.hud.hide();
    this.hintElement.hidden = true;
    this.victoryFadeOverlay.hidden = false;
    this.victoryFadeOverlay.style.opacity = '0';
  }

  private finishRun(mode: 'failed' | 'complete'): void {
    if (this.runRewardClaimed) {
      return;
    }

    this.state = mode === 'complete' ? 'victoryScreen' : 'gameOver';
    this.runRewardClaimed = true;
    this.hud.hide();
    this.hintElement.hidden = true;
    const coinReward = this.coinManager.calculateTotalEarned(this.scoreManager.score);
    const runRecord = this.saveManager.recordRun({
      height: this.height,
      score: this.scoreManager.score,
      maxCombo: this.comboManager.maxCombo,
      totalCoinsEarned: coinReward.totalCoinsEarned,
      playTimeSeconds: this.runElapsedSeconds,
      storyCompleted: mode === 'complete'
    });
    const saved = runRecord.saveData;
    const resultStats = {
      height: this.height,
      score: this.scoreManager.score,
      maxCombo: this.comboManager.maxCombo,
      highScore: saved.highScore,
      bestHeight: saved.bestHeight,
      bestCombo: saved.bestCombo,
      coinsCollected: coinReward.collectedCoins,
      scoreBonusCoins: coinReward.scoreBonusCoins,
      totalCoinsEarned: coinReward.totalCoinsEarned,
      totalCoins: saved.totalCoins,
      isNewHighScore: runRecord.isNewHighScore,
      isNewBestHeight: runRecord.isNewBestHeight,
      isNewBestCombo: runRecord.isNewBestCombo
    };

    if (mode === 'complete') {
      this.victoryFadeOverlay.style.opacity = '1';
      this.victoryScreen.show({
        ...resultStats,
        runTimeSeconds: this.runElapsedSeconds,
        longestComboDurationSeconds: this.longestComboDurationThisRun,
        boostsUsed: this.boostsUsedThisRun,
        bestBoostHeightGain: this.bestBoostHeightGain,
        totalAttempts: saved.totalAttempts,
        totalPlayTimeSeconds: saved.totalPlayTimeSeconds,
        bestVictoryTimeSeconds: saved.bestVictoryTimeSeconds
      });
    } else {
      this.victoryFadeOverlay.hidden = true;
      this.victoryFadeOverlay.style.opacity = '0';
      this.gameOverScreen.show({ mode, ...resultStats });
    }
    this.hud.update(
      0,
      this.height,
      this.displayBiomeName(),
      this.scoreManager.score,
      this.comboManager.combo,
      this.comboManager.speedMultiplier,
      this.playerTimeScale(this.comboManager.speedMultiplier),
      saved.totalCoins,
      this.coinManager.currentRunCoins
    );
  }

  private displayBiomeName(): string {
    const biomeName = this.worldManager.biomeManager.activeBiome.name;
    if (this.height >= GAME_CONFIG.world.storyEndTriggerHeight && this.height < GAME_CONFIG.world.storyCompleteHeight) {
      return `${biomeName} - Slutet narmar sig`;
    }

    return biomeName;
  }

  private resetRunStats(): void {
    this.comboStartTime = null;
    this.longestComboDurationThisRun = 0;
    this.boostsUsedThisRun = 0;
    this.bestBoostHeightGain = 0;
    this.activeBoostStartHeight = null;
  }

  private updateRunStats(_deltaSeconds: number): void {
    if (this.comboManager.combo > 0) {
      if (this.comboStartTime === null) {
        this.comboStartTime = this.runElapsedSeconds;
      }
      this.longestComboDurationThisRun = Math.max(
        this.longestComboDurationThisRun,
        this.runElapsedSeconds - this.comboStartTime
      );
    } else {
      this.finishCurrentComboDuration();
    }

    if (this.activeBoostStartHeight !== null) {
      const gain = Math.max(0, this.player.mesh.position.y - this.activeBoostStartHeight);
      this.bestBoostHeightGain = Math.max(this.bestBoostHeightGain, gain);
      if (this.player.velocity.y <= 0 && gain > 0.4) {
        this.activeBoostStartHeight = null;
      }
    }
  }

  private finishCurrentComboDuration(): void {
    if (this.comboStartTime === null) {
      return;
    }

    this.longestComboDurationThisRun = Math.max(
      this.longestComboDurationThisRun,
      this.runElapsedSeconds - this.comboStartTime
    );
    this.comboStartTime = null;
  }

  private readonly resize = (): void => {
    const width = this.shell.clientWidth || window.innerWidth;
    const height = this.shell.clientHeight || window.innerHeight;
    this.sceneManager.resize(width, height);
  };

  private createHint(): HTMLDivElement {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Dra i sidled på mobil. A/D eller piltangenter på desktop.';
    return hint;
  }

  private applyThemeToShell(): void {
    const theme = this.worldManager.activeTheme;
    if (this.activeThemeId === theme.id) {
      return;
    }

    this.activeThemeId = theme.id;
    this.shell.dataset.theme = theme.ui.cssClass;
    this.shell.style.setProperty('--theme-panel-top', theme.ui.panelTop);
    this.shell.style.setProperty('--theme-panel-bottom', theme.ui.panelBottom);
    this.shell.style.setProperty('--theme-trim', theme.ui.trim);
    this.shell.style.setProperty('--theme-accent', theme.ui.accent);
    this.shell.style.setProperty('--theme-text', theme.ui.text);
    this.shell.style.setProperty('--theme-shadow', theme.ui.shadow);
  }

  private ensurePlayerRenderable(): void {
    if (this.player.mesh.parent !== this.sceneManager.worldRoot) {
      this.sceneManager.worldRoot.add(this.player.mesh);
    }
    this.player.ensureVisible();
  }

  private readDebugStartHeight(): number {
    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get('debugHeight') ?? 0);
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(value, 8500));
  }

  private readDebugComboLandings(): number {
    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get('debugComboLandings') ?? 0);
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(Math.floor(value), 500));
  }

  private readDebugEndRunAfterSeconds(): number | null {
    const params = new URLSearchParams(window.location.search);
    const value = Number(params.get('debugEndRunAfter') ?? NaN);
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(0.1, Math.min(value, 60));
  }

  private applyDebugComboLandings(): void {
    for (let i = 0; i < this.debugComboLandings; i += 1) {
      const comboMultiplier = this.comboManager.recordPadLanding();
      this.scoreManager.recordPadLanding(comboMultiplier);
    }
  }

  private playerTimeScale(speedMultiplier: number): number {
    const scaledTime = 1 + (Math.max(1, speedMultiplier) - 1) * GAME_CONFIG.scoring.playerTimeScaleScale;
    return Math.max(1, Math.min(GAME_CONFIG.scoring.maxPlayerTimeScale, scaledTime));
  }

  private applyPadLandingEffects(type: PadType): void {
    if (type === PadType.CURSED) {
      const scoreGained = this.scoreManager.recordPadLanding(this.comboManager.multiplier, GAME_CONFIG.padTypes.cursedScoreMultiplier);
      this.finishCurrentComboDuration();
      this.comboManager.recordCursedPad();
      this.hud.showPadFeedback(`CURSED! +${scoreGained}`);
      return;
    }

    const comboMultiplier = this.comboManager.recordPadLanding();
    const scoreMultiplier = this.scoreMultiplierForPad(type);
    const scoreGained = this.scoreManager.recordPadLanding(comboMultiplier, scoreMultiplier);

    if (type === PadType.BOOST) {
      this.boostsUsedThisRun += 1;
      this.activeBoostStartHeight = this.player.mesh.position.y;
      this.cameraController.triggerBoostAssist();
      this.hud.showPadFeedback(`BOOST! +${scoreGained}`);
      return;
    }

    this.hud.showLandingFeedback(scoreGained, comboMultiplier);
  }

  private scoreMultiplierForPad(type: PadType): number {
    switch (type) {
      case PadType.FRAGILE:
        return GAME_CONFIG.padTypes.fragileScoreMultiplier;
      case PadType.MOVING:
        return GAME_CONFIG.padTypes.movingScoreMultiplier;
      case PadType.BOOST:
        return GAME_CONFIG.padTypes.boostScoreMultiplier;
      default:
        return 1;
    }
  }

  private bounceMultiplierForPad(type: PadType): number {
    return type === PadType.BOOST ? GAME_CONFIG.padTypes.boostBounceMultiplier : 1;
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.sceneManager.dispose();
    window.removeEventListener('resize', this.resize);
  }
}
