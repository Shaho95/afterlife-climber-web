import { Player } from '../player/Player';
import { DEFAULT_SKIN_ID, SKINS, SkinDefinition, getSkin } from '../config/SkinConfig';
import { SaveData, SaveManager } from './SaveManager';

export type SkinStatus = 'owned' | 'locked' | 'equipped';

export interface SkinShopItem {
  skin: SkinDefinition;
  status: SkinStatus;
  canBuy: boolean;
}

export interface SkinActionResult {
  ok: boolean;
  message: string;
  saveData: SaveData;
}

export class SkinManager {
  constructor(private readonly saveManager: SaveManager) {}

  get shopItems(): SkinShopItem[] {
    const save = this.saveManager.snapshot;
    return SKINS.map((skin) => {
      const owned = save.unlockedSkins.includes(skin.id);
      const equipped = save.selectedSkin === skin.id;
      return {
        skin,
        status: equipped ? 'equipped' : owned ? 'owned' : 'locked',
        canBuy: !owned && save.totalCoins >= skin.price
      };
    });
  }

  buyOrEquip(skinId: string): SkinActionResult {
    const skin = getSkin(skinId);
    const save = this.saveManager.snapshot;

    if (save.selectedSkin === skin.id) {
      return { ok: true, message: `${skin.name} är redan equipped.`, saveData: save };
    }

    if (save.unlockedSkins.includes(skin.id)) {
      const updated = this.saveManager.selectSkin(skin.id);
      return {
        ok: Boolean(updated),
        message: updated ? `${skin.name} equipped.` : 'Skin kunde inte väljas.',
        saveData: updated ?? this.saveManager.snapshot
      };
    }

    const purchased = this.saveManager.purchaseSkin(skin.id, skin.price);
    if (!purchased) {
      return {
        ok: false,
        message: 'Inte tillräckligt med coins.',
        saveData: this.saveManager.snapshot
      };
    }

    return {
      ok: true,
      message: `${skin.name} köpt och equipped.`,
      saveData: purchased
    };
  }

  applySelectedSkin(player: Player): void {
    const selectedSkin = getSkin(this.saveManager.snapshot.selectedSkin || DEFAULT_SKIN_ID);
    player.applySkinVisual(selectedSkin.visual);
  }
}
