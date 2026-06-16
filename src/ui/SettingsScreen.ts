import { LANGUAGE_OPTIONS, LanguageCode, getLanguageLabel, isLanguageCode } from '../config/LanguageConfig';
import { SettingsData } from '../settings/SettingsManager';

export class SettingsScreen {
  readonly element: HTMLDivElement;
  private readonly languageSelect: HTMLSelectElement;
  private readonly selectedLanguageValue: HTMLSpanElement;

  constructor(onBack: () => void, onLanguageChange: (language: LanguageCode) => void) {
    this.element = document.createElement('div');
    this.element.className = 'screen menu-subscreen';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="screen-panel menu-panel settings-panel">
        <h2 class="screen-title">Inst&auml;llningar</h2>
        <div class="settings-list" aria-label="Inst&auml;llningar">
          <span>Ljud <b>P&aring;</b></span>
          <span>Kvalitet <b>Medium</b></span>
          <label class="language-setting">
            Spr&aring;k
            <b data-selected-language>Svenska</b>
            <select data-language-select aria-label="Spr&aring;k">
              ${LANGUAGE_OPTIONS.map((language) => `<option value="${language.code}">${language.label}</option>`).join('')}
            </select>
          </label>
        </div>
        <p class="screen-copy">Spr&aring;kvalet sparas nu. Full &ouml;vers&auml;ttning kommer senare.</p>
        <button class="primary-button" type="button" data-back>Tillbaka</button>
      </div>
    `;

    const languageSelect = this.element.querySelector<HTMLSelectElement>('[data-language-select]');
    const selectedLanguageValue = this.element.querySelector<HTMLSpanElement>('[data-selected-language]');
    const backButton = this.element.querySelector<HTMLButtonElement>('[data-back]');
    if (!languageSelect || !selectedLanguageValue || !backButton) {
      throw new Error('Settings placeholder kunde inte initieras.');
    }

    this.languageSelect = languageSelect;
    this.selectedLanguageValue = selectedLanguageValue;
    this.languageSelect.addEventListener('change', () => {
      const language = this.languageSelect.value;
      if (isLanguageCode(language)) {
        onLanguageChange(language);
      }
    });
    backButton.addEventListener('click', onBack);
  }

  show(settings: SettingsData): void {
    this.update(settings);
    this.element.hidden = false;
  }

  update(settings: SettingsData): void {
    this.languageSelect.value = settings.language;
    this.selectedLanguageValue.textContent = getLanguageLabel(settings.language);
  }

  hide(): void {
    this.element.hidden = true;
  }
}
