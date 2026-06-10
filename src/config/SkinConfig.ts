export type SkinId = 'default' | 'hellSurvivor' | 'boneWalker' | 'goldPilgrim' | 'angelic';

export interface SkinVisual {
  outline: number;
  body: number;
  bodyLight: number;
  head: number;
  face: number;
  scarf: number;
  visor: number;
  accent: number;
  shine: number;
}

export interface SkinDefinition {
  id: SkinId;
  name: string;
  price: number;
  theme: string;
  description: string;
  previewColors: string[];
  visual: SkinVisual;
}

export const DEFAULT_SKIN_ID: SkinId = 'default';

export const SKINS: SkinDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    price: 0,
    theme: 'Neutral',
    description: 'Den klassiska fyrkantiga klättraren.',
    previewColors: ['#ffe8bd', '#ffcf95', '#ffb238'],
    visual: {
      outline: 0x16080a,
      body: 0xffe8bd,
      bodyLight: 0xfff4d6,
      head: 0xffcf95,
      face: 0xffddb2,
      scarf: 0x4b1713,
      visor: 0x1d1014,
      accent: 0xffb238,
      shine: 0xfff0c6
    }
  },
  {
    id: 'hellSurvivor',
    name: 'Hell Survivor',
    price: 500,
    theme: 'Helvete',
    description: 'Sotig kropp med röd/orange glöd.',
    previewColors: ['#211012', '#ff5a1d', '#ffb238'],
    visual: {
      outline: 0x050203,
      body: 0x211012,
      bodyLight: 0x3a1812,
      head: 0x2b1514,
      face: 0x512016,
      scarf: 0xff5a1d,
      visor: 0xffb238,
      accent: 0xff7a1f,
      shine: 0xffe0a3
    }
  },
  {
    id: 'boneWalker',
    name: 'Bone Walker',
    price: 1200,
    theme: 'Fossil',
    description: 'Benvit kropp med mörka sprickor.',
    previewColors: ['#efe2bd', '#2b2118', '#c9b27f'],
    visual: {
      outline: 0x1d1510,
      body: 0xefe2bd,
      bodyLight: 0xfff4d0,
      head: 0xd8c49a,
      face: 0xf3e5bd,
      scarf: 0x2b2118,
      visor: 0x1c1511,
      accent: 0xc9b27f,
      shine: 0xffffff
    }
  },
  {
    id: 'goldPilgrim',
    name: 'Gold Pilgrim',
    price: 3000,
    theme: 'Guld',
    description: 'Gyllene kropp med kristallkänsla.',
    previewColors: ['#f3b51f', '#fff09a', '#8cecff'],
    visual: {
      outline: 0x241507,
      body: 0xf3b51f,
      bodyLight: 0xffe36f,
      head: 0xffcc3b,
      face: 0xfff09a,
      scarf: 0x7b4712,
      visor: 0x4a2b0c,
      accent: 0x8cecff,
      shine: 0xffffff
    }
  },
  {
    id: 'angelic',
    name: 'Angelic',
    price: 7500,
    theme: 'Paradis',
    description: 'Ljus prestige-skin med vit/guld glow.',
    previewColors: ['#fff7df', '#ffd975', '#bdefff'],
    visual: {
      outline: 0x7c693c,
      body: 0xfff7df,
      bodyLight: 0xffffff,
      head: 0xffefc6,
      face: 0xffffff,
      scarf: 0xffd975,
      visor: 0x7c693c,
      accent: 0xbdefff,
      shine: 0xffffff
    }
  }
];

export function isSkinId(value: unknown): value is SkinId {
  return typeof value === 'string' && SKINS.some((skin) => skin.id === value);
}

export function getSkin(id: string): SkinDefinition {
  return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
}
