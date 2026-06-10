import { SaveData } from '../progression/SaveManager';
import { SkinShopItem } from '../progression/SkinManager';

export class ShopScreen {
  readonly element: HTMLDivElement;
  private readonly coinsValue: HTMLSpanElement;
  private readonly grid: HTMLDivElement;
  private readonly feedback: HTMLParagraphElement;

  constructor(onBack: () => void, onSkinAction: (skinId: string) => void) {
    this.element = document.createElement('div');
    this.element.className = 'screen menu-subscreen shop-screen';
    this.element.hidden = true;
    this.element.innerHTML = `
      <div class="screen-panel shop-panel">
        <h2 class="screen-title">Shop</h2>
        <p class="shop-coins">Coins: <span data-shop-coins>0</span></p>
        <div class="skin-grid" data-skin-grid></div>
        <p class="shop-feedback" data-shop-feedback></p>
        <button class="primary-button" type="button" data-back>Tillbaka</button>
      </div>
    `;

    const coinsValue = this.element.querySelector<HTMLSpanElement>('[data-shop-coins]');
    const grid = this.element.querySelector<HTMLDivElement>('[data-skin-grid]');
    const feedback = this.element.querySelector<HTMLParagraphElement>('[data-shop-feedback]');
    const backButton = this.element.querySelector<HTMLButtonElement>('[data-back]');

    if (!coinsValue || !grid || !feedback || !backButton) {
      throw new Error('Shop kunde inte initieras.');
    }

    this.coinsValue = coinsValue;
    this.grid = grid;
    this.feedback = feedback;
    backButton.addEventListener('click', onBack);
    this.grid.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-skin-action]');
      if (button) {
        onSkinAction(button.dataset.skinAction ?? '');
      }
    });
  }

  show(saveData: SaveData, items: SkinShopItem[], message = ''): void {
    this.update(saveData, items, message);
    this.element.hidden = false;
  }

  update(saveData: SaveData, items: SkinShopItem[], message = ''): void {
    this.coinsValue.textContent = `${Math.max(0, Math.floor(saveData.totalCoins))}`;
    this.feedback.textContent = message;
    this.feedback.dataset.tone = message.includes('Inte') ? 'bad' : message ? 'good' : 'idle';
    this.grid.innerHTML = items.map((item) => this.cardMarkup(item)).join('');
  }

  hide(): void {
    this.element.hidden = true;
  }

  private cardMarkup(item: SkinShopItem): string {
    const { skin, status, canBuy } = item;
    const buttonLabel = status === 'equipped'
      ? 'Equipped'
      : status === 'owned'
        ? 'Equip'
        : canBuy
          ? 'Buy'
          : 'Not enough';
    const disabled = status === 'equipped';
    const price = skin.price === 0 ? 'Free' : `${skin.price} coins`;
    const swatches = skin.previewColors
      .map((color) => `<span style="--swatch:${color}"></span>`)
      .join('');

    return `
      <article class="skin-card" data-status="${status}">
        <div class="skin-preview" aria-hidden="true">
          <span class="skin-preview-body" style="--skin-a:${skin.previewColors[0]}; --skin-b:${skin.previewColors[1]}; --skin-c:${skin.previewColors[2]}"></span>
          <span class="skin-swatches">${swatches}</span>
        </div>
        <div class="skin-card-copy">
          <h3>${skin.name}</h3>
          <p>${skin.theme}</p>
          <small>${skin.description}</small>
        </div>
        <div class="skin-card-footer">
          <span>${status === 'equipped' ? 'Equipped' : status === 'owned' ? 'Owned' : price}</span>
          <button class="secondary-button skin-action-button" type="button" data-skin-action="${skin.id}" ${disabled ? 'disabled' : ''}>${buttonLabel}</button>
        </div>
      </article>
    `;
  }
}
