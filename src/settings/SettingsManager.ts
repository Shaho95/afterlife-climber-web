import { DEFAULT_LANGUAGE, LanguageCode, isLanguageCode } from '../config/LanguageConfig';

export interface SettingsData {
  settingsVersion: 1;
  language: LanguageCode;
}

const SETTINGS_KEY = 'afterlife-climber-settings-v1';

const DEFAULT_SETTINGS: SettingsData = {
  settingsVersion: 1,
  language: DEFAULT_LANGUAGE
};

export class SettingsManager {
  private data: SettingsData;

  constructor(private readonly storage: Storage | null = getLocalStorage()) {
    this.data = this.load();
  }

  get snapshot(): SettingsData {
    return { ...this.data };
  }

  setLanguage(language: LanguageCode): SettingsData {
    this.data = { ...this.data, language };
    this.write();
    return this.snapshot;
  }

  private load(): SettingsData {
    if (!this.storage) {
      return { ...DEFAULT_SETTINGS };
    }

    try {
      const raw = this.storage.getItem(SETTINGS_KEY);
      if (!raw) {
        return { ...DEFAULT_SETTINGS };
      }

      return sanitize(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  private write(): void {
    if (!this.storage) {
      return;
    }

    try {
      this.storage.setItem(SETTINGS_KEY, JSON.stringify(this.data));
    } catch {
      // Settings persistence is best-effort so menus never crash in private modes.
    }
  }
}

function sanitize(value: unknown): SettingsData {
  const candidate = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    settingsVersion: 1,
    language: isLanguageCode(candidate.language) ? candidate.language : DEFAULT_SETTINGS.language
  };
}

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
