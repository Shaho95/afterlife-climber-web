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
  checkpointHeight?: number;
}

export class GameOverScreen {
  readonly element: HTMLDivElement;
  private readonly title: HTMLHeadingElement;
  private readonly copy: HTMLParagraphElement;
  private readonly restartButton: HTMLButtonElement;
  private readonly continueButton: HTMLButtonElement;

  constructor(onRestart: () => void, onMainMenu: () => void, onContinueFromCheckpoint: () => void) {
    this.element = document.createElement('div');
    this.element.className = 'screen';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="screen-panel">
        <h2 class="screen-title">Du f&ouml;ll</h2>
        <p class="screen-copy" data-copy>H&ouml;jd: 0 m<br>Score: 0<br>B&auml;sta combo: x1</p>
        <div class="screen-actions">
          <button class="primary-button" type="button" data-continue hidden>Forts&auml;tt fr&aring;n checkpoint</button>
          <button class="primary-button" type="button" data-restart>F&ouml;rs&ouml;k igen</button>
          <button class="secondary-button" type="button" data-home>Hemmeny</button>
        </div>
      </div>
    `;

    const title = this.element.querySelector<HTMLHeadingElement>('h2');
    const copy = this.element.querySelector<HTMLParagraphElement>('[data-copy]');
    const continueButton = this.element.querySelector<HTMLButtonElement>('[data-continue]');
    const restartButton = this.element.querySelector<HTMLButtonElement>('[data-restart]');
    const homeButton = this.element.querySelector<HTMLButtonElement>('[data-home]');

    if (!title || !copy || !continueButton || !restartButton || !homeButton) {
      throw new Error('Game over screen kunde inte initieras.');
    }

    this.title = title;
    this.copy = copy;
    this.continueButton = continueButton;
    this.restartButton = restartButton;
    continueButton.addEventListener('click', onContinueFromCheckpoint);
    restartButton.addEventListener('click', onRestart);
    homeButton.addEventListener('click', onMainMenu);
  }

  show(stats: GameOverStats): void {
    const complete = stats.mode === 'complete';
    this.title.innerHTML = complete ? 'Journey Complete' : 'Du f&ouml;ll';
    this.restartButton.innerHTML = complete ? 'Spela igen' : 'F&ouml;rs&ouml;k igen';
    const records = [
      stats.isNewHighScore ? 'NYTT SCORE-REKORD!' : '',
      stats.isNewBestHeight ? 'NYTT HÖJDREKORD!' : '',
      stats.isNewBestCombo ? 'NYTT COMBOREKORD!' : ''
    ].filter(Boolean);
    const checkpointHeight = Math.max(0, Math.floor(stats.checkpointHeight ?? 0));
    this.continueButton.hidden = checkpointHeight <= 0 || complete;
    this.continueButton.innerHTML = `Forts&auml;tt fr&aring;n ${checkpointHeight}m`;

    this.copy.innerHTML = `
      ${complete ? 'Du har n&aring;tt slutet.<br>Pr&ouml;vningen &auml;r fullbordad.<br><br>' : ''}
      H&ouml;jd: ${Math.max(0, Math.floor(stats.height))} m<br>
      B&auml;sta h&ouml;jd: ${Math.max(0, Math.floor(stats.bestHeight))} m<br>
      Score: ${Math.max(0, Math.floor(stats.score))}<br>
      High score: ${Math.max(0, Math.floor(stats.highScore))}<br>
      Run combo: x${Math.max(1, stats.maxCombo)}<br>
      B&auml;sta combo: x${Math.max(1, stats.bestCombo)}<br>
      Mynt plockade: ${Math.max(0, Math.floor(stats.coinsCollected))}<br>
      Score-bonusmynt: +${Math.max(0, Math.floor(stats.scoreBonusCoins))}<br>
      Totalt intj&auml;nade mynt: +${Math.max(0, Math.floor(stats.totalCoinsEarned))}<br>
      Totala mynt: ${Math.max(0, Math.floor(stats.totalCoins))}
      ${checkpointHeight > 0 && !complete ? `<br>Senaste checkpoint: ${checkpointHeight}m` : ''}
      ${records.length > 0 ? `<br><span class="record-list">${records.join('<br>')}</span>` : ''}
    `;
    this.element.hidden = false;
  }

  hide(): void {
    this.element.hidden = true;
  }
}
