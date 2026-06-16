export class HUD {
  readonly element: HTMLDivElement;
  private readonly heightValue: HTMLSpanElement;
  private readonly coinsValue: HTMLSpanElement;
  private readonly scoreValue: HTMLSpanElement;
  private readonly comboValue: HTMLSpanElement;
  private readonly speedValue: HTMLSpanElement;
  private readonly timeScaleValue: HTMLSpanElement;
  private readonly runCoinsValue: HTMLSpanElement;
  private readonly biomeValue: HTMLSpanElement;
  private readonly popup: HTMLDivElement;
  private readonly coinPopup: HTMLDivElement;
  private popupTimer = 0;
  private coinPopupTimer = 0;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'hud';
    this.element.innerHTML = `
      <div class="hud-chip">
        <span class="hud-label">H&ouml;jd</span>
        <span class="hud-value" data-height>0 m</span>
        <span class="hud-coins" data-total-coins>Mynt: 0</span>
      </div>
      <div class="hud-chip hud-chip--score">
        <span class="hud-label">Score</span>
        <span class="hud-value" data-score>0</span>
        <span class="hud-combo" data-combo>x1</span>
        <span class="hud-speed" data-speed>Speed x1.00</span>
        <span class="hud-timescale" data-timescale>PlayerTS x1.00</span>
        <span class="hud-run-coins" data-run-coins>Run-mynt: 0</span>
      </div>
      <div class="hud-chip">
        <span class="hud-label">Biome</span>
        <span class="hud-value" data-biome>Helvetet</span>
      </div>
      <div class="score-popup" data-popup hidden>+100</div>
      <div class="coin-popup" data-coin-popup hidden>+1</div>
    `;

    const heightValue = this.element.querySelector<HTMLSpanElement>('[data-height]');
    const coinsValue = this.element.querySelector<HTMLSpanElement>('[data-total-coins]');
    const scoreValue = this.element.querySelector<HTMLSpanElement>('[data-score]');
    const comboValue = this.element.querySelector<HTMLSpanElement>('[data-combo]');
    const speedValue = this.element.querySelector<HTMLSpanElement>('[data-speed]');
    const timeScaleValue = this.element.querySelector<HTMLSpanElement>('[data-timescale]');
    const runCoinsValue = this.element.querySelector<HTMLSpanElement>('[data-run-coins]');
    const biomeValue = this.element.querySelector<HTMLSpanElement>('[data-biome]');
    const popup = this.element.querySelector<HTMLDivElement>('[data-popup]');
    const coinPopup = this.element.querySelector<HTMLDivElement>('[data-coin-popup]');

    if (!heightValue || !coinsValue || !scoreValue || !comboValue || !speedValue || !timeScaleValue || !runCoinsValue || !biomeValue || !popup || !coinPopup) {
      throw new Error('HUD kunde inte initieras.');
    }

    this.heightValue = heightValue;
    this.coinsValue = coinsValue;
    this.scoreValue = scoreValue;
    this.comboValue = comboValue;
    this.speedValue = speedValue;
    this.timeScaleValue = timeScaleValue;
    this.runCoinsValue = runCoinsValue;
    this.biomeValue = biomeValue;
    this.popup = popup;
    this.coinPopup = coinPopup;
  }

  update(deltaSeconds: number, height: number, biomeName: string, score: number, combo: number, speedMultiplier: number, playerTimeScale = 1, totalCoins = 0, runCoins = 0): void {
    this.heightValue.textContent = `${Math.max(0, Math.floor(height))} m`;
    this.coinsValue.textContent = `Mynt: ${Math.max(0, Math.floor(totalCoins))}`;
    this.scoreValue.textContent = `${Math.max(0, Math.floor(score))}`;
    this.comboValue.textContent = `x${this.formatCompactNumber(Math.max(1, combo))}`;
    this.biomeValue.textContent = biomeName;
    this.speedValue.textContent = `Speed x${speedMultiplier.toFixed(2)}`;
    this.timeScaleValue.textContent = `PlayerTS x${playerTimeScale.toFixed(2)}`;
    this.runCoinsValue.textContent = `Run-mynt: ${Math.max(0, Math.floor(runCoins))}`;
    this.element.dataset.comboTier = combo >= 15 ? 'high' : combo >= 6 ? 'mid' : 'low';
    this.element.dataset.speedTier = speedMultiplier >= 2.65 ? 'redline' : speedMultiplier >= 1.9 ? 'fast' : speedMultiplier >= 1.2 ? 'quick' : 'base';

    if (this.popupTimer > 0) {
      this.popupTimer = Math.max(0, this.popupTimer - deltaSeconds);
      this.popup.hidden = false;
      this.popup.style.opacity = `${Math.min(1, this.popupTimer * 2.4)}`;
      this.popup.style.transform = `translate(-50%, ${-12 - (1 - this.popupTimer) * 12}px) rotate(-2deg)`;
    } else {
      this.popup.hidden = true;
    }

    if (this.coinPopupTimer > 0) {
      this.coinPopupTimer = Math.max(0, this.coinPopupTimer - deltaSeconds);
      this.coinPopup.hidden = false;
      this.coinPopup.style.opacity = `${Math.min(1, this.coinPopupTimer * 3)}`;
      this.coinPopup.style.transform = `translate(-50%, ${-8 - (1 - this.coinPopupTimer) * 10}px) rotate(2deg)`;
    } else {
      this.coinPopup.hidden = true;
    }
  }

  showLandingFeedback(scoreGained: number, combo: number): void {
    this.popup.textContent = `+${scoreGained} x${this.formatCompactNumber(Math.max(1, combo))}`;
    this.popupTimer = 0.56;
  }

  showPadFeedback(message: string): void {
    this.popup.textContent = message;
    this.popupTimer = 0.68;
  }

  showCoinFeedback(coins: number): void {
    this.coinPopup.textContent = `+${Math.max(0, Math.floor(coins))}`;
    this.coinPopupTimer = 0.5;
  }

  resetFeedback(): void {
    this.popupTimer = 0;
    this.coinPopupTimer = 0;
    this.popup.hidden = true;
    this.coinPopup.hidden = true;
    this.popup.textContent = '';
    this.coinPopup.textContent = '';
    this.popup.style.opacity = '0';
    this.coinPopup.style.opacity = '0';
  }

  show(): void {
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }

  private formatCompactNumber(value: number): string {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
    }

    if (value >= 1000) {
      return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
    }

    return `${value}`;
  }
}
