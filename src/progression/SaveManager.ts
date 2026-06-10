import { DEFAULT_SKIN_ID, isSkinId } from '../config/SkinConfig';

export interface SaveData {
  saveVersion: 1;
  totalCoins: number;
  highScore: number;
  bestHeight: number;
  bestCombo: number;
  totalAttempts: number;
  totalPlayTimeSeconds: number;
  storyCompleted: boolean;
  bestVictoryTimeSeconds: number;
  unlockedSkins: string[];
  selectedSkin: string;
}

export interface RunRecordInput {
  score: number;
  height: number;
  maxCombo: number;
  totalCoinsEarned: number;
  playTimeSeconds?: number;
  storyCompleted?: boolean;
}

export interface RunRecordResult {
  saveData: SaveData;
  isNewHighScore: boolean;
  isNewBestHeight: boolean;
  isNewBestCombo: boolean;
}

const SAVE_KEY = 'afterlife-climber-save-v1';

const DEFAULT_SAVE: SaveData = {
  saveVersion: 1,
  totalCoins: 0,
  highScore: 0,
  bestHeight: 0,
  bestCombo: 0,
  totalAttempts: 0,
  totalPlayTimeSeconds: 0,
  storyCompleted: false,
  bestVictoryTimeSeconds: 0,
  unlockedSkins: [DEFAULT_SKIN_ID],
  selectedSkin: DEFAULT_SKIN_ID
};

export class SaveManager {
  private data: SaveData;

  constructor(private readonly storage: Storage | null = getLocalStorage()) {
    this.data = this.load();
  }

  get snapshot(): SaveData {
    return { ...this.data, unlockedSkins: [...this.data.unlockedSkins] };
  }

  recordAttempt(): SaveData {
    this.data = this.sanitize({
      ...this.data,
      totalAttempts: this.data.totalAttempts + 1
    });
    this.write();
    return this.snapshot;
  }

  recordRun(input: RunRecordInput): RunRecordResult {
    const score = safeInteger(input.score);
    const height = safeInteger(input.height);
    const maxCombo = safeInteger(input.maxCombo);
    const totalCoinsEarned = safeInteger(input.totalCoinsEarned);
    const playTimeSeconds = safeSeconds(input.playTimeSeconds);
    const completedStory = input.storyCompleted === true;
    const previousBestVictoryTime = safeSeconds(this.data.bestVictoryTimeSeconds);
    const bestVictoryTimeSeconds = completedStory
      ? (previousBestVictoryTime <= 0 ? playTimeSeconds : Math.min(previousBestVictoryTime, playTimeSeconds))
      : previousBestVictoryTime;

    const isNewHighScore = score > this.data.highScore;
    const isNewBestHeight = height > this.data.bestHeight;
    const isNewBestCombo = maxCombo > this.data.bestCombo;

    this.data = this.sanitize({
      ...this.data,
      totalCoins: this.data.totalCoins + totalCoinsEarned,
      highScore: Math.max(this.data.highScore, score),
      bestHeight: Math.max(this.data.bestHeight, height),
      bestCombo: Math.max(this.data.bestCombo, maxCombo),
      totalPlayTimeSeconds: this.data.totalPlayTimeSeconds + playTimeSeconds,
      storyCompleted: this.data.storyCompleted || completedStory,
      bestVictoryTimeSeconds
    });
    this.write();

    return {
      saveData: this.snapshot,
      isNewHighScore,
      isNewBestHeight,
      isNewBestCombo
    };
  }

  purchaseSkin(skinId: string, price: number): SaveData | null {
    if (!isSkinId(skinId) || this.data.unlockedSkins.includes(skinId)) {
      return this.snapshot;
    }

    const safePrice = safeInteger(price);
    if (this.data.totalCoins < safePrice) {
      return null;
    }

    this.data = this.sanitize({
      ...this.data,
      totalCoins: this.data.totalCoins - safePrice,
      unlockedSkins: [...this.data.unlockedSkins, skinId],
      selectedSkin: skinId
    });
    this.write();
    return this.snapshot;
  }

  selectSkin(skinId: string): SaveData | null {
    if (!isSkinId(skinId) || !this.data.unlockedSkins.includes(skinId)) {
      return null;
    }

    this.data = this.sanitize({
      ...this.data,
      selectedSkin: skinId
    });
    this.write();
    return this.snapshot;
  }

  private load(): SaveData {
    if (!this.storage) {
      return { ...DEFAULT_SAVE };
    }

    try {
      const raw = this.storage.getItem(SAVE_KEY);
      if (!raw) {
        return { ...DEFAULT_SAVE };
      }

      return this.sanitize(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SAVE };
    }
  }

  private write(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Saving is best-effort; the run should never crash because storage is unavailable.
    }
  }

  private sanitize(value: unknown): SaveData {
    const candidate = isPlainObject(value) ? value : {};
    const unlockedSkins = Array.isArray(candidate.unlockedSkins)
      ? candidate.unlockedSkins.filter(isSkinId)
      : DEFAULT_SAVE.unlockedSkins;
    const normalizedUnlockedSkins = Array.from(new Set([DEFAULT_SKIN_ID, ...unlockedSkins]));
    const selectedSkin = isSkinId(candidate.selectedSkin) && normalizedUnlockedSkins.includes(candidate.selectedSkin)
      ? candidate.selectedSkin
      : DEFAULT_SKIN_ID;

    return {
      saveVersion: 1,
      totalCoins: safeInteger(candidate.totalCoins),
      highScore: safeInteger(candidate.highScore),
      bestHeight: safeInteger(candidate.bestHeight),
      bestCombo: safeInteger(candidate.bestCombo),
      totalAttempts: safeInteger(candidate.totalAttempts),
      totalPlayTimeSeconds: safeSeconds(candidate.totalPlayTimeSeconds),
      storyCompleted: candidate.storyCompleted === true,
      bestVictoryTimeSeconds: safeSeconds(candidate.bestVictoryTimeSeconds),
      unlockedSkins: normalizedUnlockedSkins,
      selectedSkin
    };
  }
}

function safeInteger(value: unknown): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(Number(value))) : 0;
}

function safeSeconds(value: unknown): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
