export interface GameOverStats {
  mode?: 'failed' | 'complete';
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
  isNewHighScore: boolean;
  isNewBestHeight: boolean;
  isNewBestCombo: boolean;
}

export class GameOverScreen {
  readonly element: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly copy: HTMLParagraphElement;
  private readonly restartButton: HTMLButtonElement;

  constructor(onRestart: () => void, onMainMenu: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'screen';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="screen-panel">
        <h2 class="screen-title">Du f&ouml;ll</h2>
        <p class="screen-copy" data-copy>H&ouml;jd: 0 m<br>Score: 0<br>B&auml;sta combo: x1</p>
        <div class="screen-actions">
          <button class="primary-button" type="button" data-restart>F&ouml;rs&ouml;k igen</button>
          <button class="secondary-button" type="button" data-home>Hemmeny</button>
        </div>
      </div>
    `;

    const title = this.element.querySelector<HTMLHeadingElement>('h2');
    const copy = this.element.querySelector<HTMLParagraphElement>('[data-copy]');
    const restartButton = this.element.querySelector<HTMLButtonElement>('[data-restart]');
    const homeButton = this.element.querySelector<HTMLButtonElement>('[data-home]');

    if (!title || !copy || !restartButton || !homeButton) {
      throw new Error('Game over screen kunde inte initieras.');
    }

    this.title = title;
    this.copy = copy;
    this.restartButton = restartButton;
    restartButton.addEventListener('click', onRestart);
    homeButton.addEventListener('click', onMainMenu);
  }

  show(stats: GameOverStats): void {
    const complete = stats.mode === 'complete';
    this.title.innerHTML = complete ? 'Journey Complete' : 'Du f&ouml;ll';
    this.restartButton.innerHTML = complete ? 'Spela igen' : 'F&ouml;rs&ouml;k igen';
    const records = [
      stats.isNewHighScore ? 'NYTT SCORE-REKORD!' : '',
      stats.isNewBestHeight ? 'NY HOJDREKORD!' : '',
      stats.isNewBestCombo ? 'NY COMBOREKORD!' : ''
    ].filter(Boolean);

    this.copy.innerHTML = `
      ${complete ? 'Du har n&aring;tt slutet.<br>Pr&ouml;vningen &auml;r fullbordad.<br><br>' : ''}
      H&ouml;jd: ${Math.max(0, Math.floor(stats.height))} m<br>
      B&auml;sta h&ouml;jd: ${Math.max(0, Math.floor(stats.bestHeight))} m<br>
      Score: ${Math.max(0, Math.floor(stats.score))}<br>
      High score: ${Math.max(0, Math.floor(stats.highScore))}<br>
      Run combo: x${Math.max(1, stats.maxCombo)}<br>
      B&auml;sta combo: x${Math.max(1, stats.bestCombo)}<br>
      Coins collected: ${Math.max(0, Math.floor(stats.coinsCollected))}<br>
      Score bonus coins: +${Math.max(0, Math.floor(stats.scoreBonusCoins))}<br>
      Total earned coins: +${Math.max(0, Math.floor(stats.totalCoinsEarned))}<br>
      Total coins: ${Math.max(0, Math.floor(stats.totalCoins))}
      ${records.length > 0 ? `<br><span class="record-list">${records.join('<br>')}</span>` : ''}
    `;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }
}
