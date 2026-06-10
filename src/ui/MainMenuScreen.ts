import { SaveData } from '../progression/SaveManager';

export class MainMenuScreen {
  readonly element: HTMLDivElement;
  private readonly coinsValue: HTMLSpanElement;
  private readonly highScoreValue: HTMLSpanElement;
  private readonly bestHeightValue: HTMLSpanElement;
  private readonly bestComboValue: HTMLSpanElement;

  constructor(
    onStart: () => void,
    onShop: () => void,
    onSettings: () => void
  ) {
    this.element = document.createElement('div');
    this.element.className = 'screen main-menu-screen';
    this.element.innerHTML = `
      <div class="menu-brand">
        <span class="menu-kicker">Underjordens prov</span>
        <h1 class="screen-title">Afterlife Climber</h1>
      </div>
      <div class="menu-hub">
        <div class="menu-stats" aria-label="Sparad progression">
          <span>Coins <b data-menu-coins>0</b></span>
          <span>High score <b data-menu-high-score>0</b></span>
          <span>Best height <b data-menu-best-height>0 m</b></span>
          <span>Best combo <b data-menu-best-combo>x1</b></span>
        </div>
        <button class="primary-button menu-start-button" type="button" data-start>Starta prövningen</button>
        <div class="menu-actions">
          <button class="secondary-button" type="button" data-shop>Shop</button>
          <button class="secondary-button" type="button" data-settings>Settings</button>
        </div>
      </div>
      <div class="hub-ground" aria-hidden="true">
        <span class="hub-chain hub-chain--left"></span>
        <span class="hub-chain hub-chain--right"></span>
        <span class="hub-smoke hub-smoke--left"></span>
        <span class="hub-smoke hub-smoke--right"></span>
        <span class="hub-crack hub-crack--one"></span>
        <span class="hub-crack hub-crack--two"></span>
        <span class="hub-crack hub-crack--three"></span>
        <span class="hub-pad"></span>
      </div>
    `;

    const startButton = this.element.querySelector<HTMLButtonElement>('[data-start]');
    const shopButton = this.element.querySelector<HTMLButtonElement>('[data-shop]');
    const settingsButton = this.element.querySelector<HTMLButtonElement>('[data-settings]');
    const coinsValue = this.element.querySelector<HTMLSpanElement>('[data-menu-coins]');
    const highScoreValue = this.element.querySelector<HTMLSpanElement>('[data-menu-high-score]');
    const bestHeightValue = this.element.querySelector<HTMLSpanElement>('[data-menu-best-height]');
    const bestComboValue = this.element.querySelector<HTMLSpanElement>('[data-menu-best-combo]');

    if (!startButton || !shopButton || !settingsButton || !coinsValue || !highScoreValue || !bestHeightValue || !bestComboValue) {
      throw new Error('Main menu kunde inte initieras.');
    }

    this.coinsValue = coinsValue;
    this.highScoreValue = highScoreValue;
    this.bestHeightValue = bestHeightValue;
    this.bestComboValue = bestComboValue;

    startButton.addEventListener('click', onStart);
    shopButton.addEventListener('click', onShop);
    settingsButton.addEventListener('click', onSettings);
  }

  show(saveData: SaveData): void {
    this.coinsValue.textContent = `${Math.max(0, Math.floor(saveData.totalCoins))}`;
    this.highScoreValue.textContent = `${Math.max(0, Math.floor(saveData.highScore))}`;
    this.bestHeightValue.textContent = `${Math.max(0, Math.floor(saveData.bestHeight))} m`;
    this.bestComboValue.textContent = `x${Math.max(1, Math.floor(saveData.bestCombo))}`;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }
}
