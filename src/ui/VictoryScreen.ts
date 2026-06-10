export interface VictoryStats {
  height: number;
  score: number;
  maxCombo: number;
  highScore: number;
  bestHeight: number;
  bestCombo: number;
  coinsCollected: number;
  scoreBonusCoins: number;
  totalCoinsEarned: number;
  totalCoins: number;
  runTimeSeconds: number;
  longestComboDurationSeconds: number;
  boostsUsed: number;
  bestBoostHeightGain: number;
  totalAttempts: number;
  totalPlayTimeSeconds: number;
  bestVictoryTimeSeconds: number;
  isNewHighScore: boolean;
  isNewBestHeight: boolean;
  isNewBestCombo: boolean;
}

export class VictoryScreen {
  readonly element: HTMLDivElement;
  private readonly copy: HTMLDivElement;

  constructor(onRestart: () => void, onMainMenu: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'victory-screen';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="victory-panel">
        <h2 class="victory-title">Grattis, du har vunnit.</h2>
        <p class="victory-intro">
          Pr&ouml;vningen &auml;r fullbordad.<br>
          Du tog dig fr&aring;n m&ouml;rkret, genom jordens lager, f&ouml;rbi himlen och bortom galaxens slut.
        </p>
        <div class="victory-copy" data-copy></div>
        <div class="victory-credits">
          <h3>Efter pr&ouml;vningen</h3>
          <p>Vid slutet av det som tros existera fann du ljuset.</p>
          <p>Resan &auml;r slut, men din b&auml;sta run kan alltid f&ouml;rb&auml;ttras.</p>
        </div>
        <div class="victory-actions">
          <button class="victory-button victory-button--primary" type="button" data-restart>Spela igen</button>
          <button class="victory-button" type="button" data-home>Hemmeny</button>
        </div>
      </div>
    `;

    const copy = this.element.querySelector<HTMLDivElement>('[data-copy]');
    const restartButton = this.element.querySelector<HTMLButtonElement>('[data-restart]');
    const homeButton = this.element.querySelector<HTMLButtonElement>('[data-home]');

    if (!copy || !restartButton || !homeButton) {
      throw new Error('Victory screen kunde inte initieras.');
    }

    this.copy = copy;
    restartButton.addEventListener('click', onRestart);
    homeButton.addEventListener('click', onMainMenu);
  }

  show(stats: VictoryStats): void {
    const records = [
      stats.isNewHighScore ? 'Nytt score-rekord' : '',
      stats.isNewBestHeight ? 'Nytt h&ouml;jdrekord' : '',
      stats.isNewBestCombo ? 'Nytt comborekord' : ''
    ].filter(Boolean);

    this.copy.innerHTML = `
      <section class="victory-stat-card">
        <h3>Run-statistik</h3>
        ${this.row('Final score', this.formatNumber(stats.score))}
        ${this.row('Height reached', `${this.formatNumber(stats.height)} m`)}
        ${this.row('Coins collected', this.formatNumber(stats.coinsCollected))}
        ${this.row('Score bonus coins', `+${this.formatNumber(stats.scoreBonusCoins)}`)}
        ${this.row('Total earned coins', `+${this.formatNumber(stats.totalCoinsEarned)}`)}
        ${this.row('Best combo this run', `x${Math.max(1, Math.floor(stats.maxCombo))}`)}
        ${this.row('L&auml;ngsta combo-period', this.formatDuration(stats.longestComboDurationSeconds))}
        ${this.row('Boost pads anv&auml;nda', this.formatNumber(stats.boostsUsed))}
        ${this.row('B&auml;sta boost', `+${Math.max(0, Math.floor(stats.bestBoostHeightGain))} m`)}
        ${this.row('Run time', this.formatClock(stats.runTimeSeconds))}
      </section>
      <section class="victory-stat-card">
        <h3>Total statistik</h3>
        ${this.row('Total attempts', this.formatNumber(stats.totalAttempts))}
        ${this.row('Total speltid', this.formatLongDuration(stats.totalPlayTimeSeconds))}
        ${this.row('Total coins saved', this.formatNumber(stats.totalCoins))}
        ${this.row('High score', this.formatNumber(stats.highScore))}
        ${this.row('Best height', `${this.formatNumber(stats.bestHeight)} m`)}
        ${this.row('Best combo', `x${Math.max(1, Math.floor(stats.bestCombo))}`)}
        ${stats.bestVictoryTimeSeconds > 0 ? this.row('B&auml;sta victory time', this.formatClock(stats.bestVictoryTimeSeconds)) : ''}
        ${records.length > 0 ? `<p class="victory-records">${records.join('<br>')}</p>` : ''}
      </section>
    `;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }

  private row(label: string, value: string): string {
    return `<div class="victory-stat-row"><span>${label}</span><strong>${value}</strong></div>`;
  }

  private formatNumber(value: number): string {
    return `${Math.max(0, Math.floor(value))}`;
  }

  private formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private formatDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    if (total < 60) {
      return `${total} sek`;
    }

    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${minutes} min ${secs} sek`;
  }

  private formatLongDuration(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hours > 0) {
      return `${hours} tim ${minutes} min ${secs} sek`;
    }

    return `${minutes} min ${secs} sek`;
  }
}
