export type BiomeId =
  | 'hell'
  | 'lava'
  | 'volcano'
  | 'fossils'
  | 'skeletons'
  | 'goldDiamonds'
  | 'roots'
  | 'surface'
  | 'skyscrapers'
  | 'sky'
  | 'upperAtmosphere'
  | 'space'
  | 'galaxy'
  | 'aliens'
  | 'void'
  | 'whiteEnd'
  | 'paradise';

export interface BiomeDefinition {
  id: BiomeId;
  name: string;
  startHeight: number;
  backgroundTop: number;
  backgroundBottom: number;
  fogColor: number;
  padColor: number;
  accentColor: number;
}

export const BIOMES: BiomeDefinition[] = [
  {
    id: 'hell',
    name: 'Helvetet',
    startHeight: 0,
    backgroundTop: 0x12060a,
    backgroundBottom: 0x5e0f0b,
    fogColor: 0x17070a,
    padColor: 0x2a1515,
    accentColor: 0xff7a1f
  },
  {
    id: 'lava',
    name: 'Magmakammare',
    startHeight: 500,
    backgroundTop: 0x1c0d0d,
    backgroundBottom: 0x9f2f10,
    fogColor: 0x2a0d0a,
    padColor: 0x5a2517,
    accentColor: 0xffc04a
  },
  {
    id: 'volcano',
    name: 'Vulkanlandskap',
    startHeight: 1000,
    backgroundTop: 0x1a1817,
    backgroundBottom: 0x77301b,
    fogColor: 0x241512,
    padColor: 0x433634,
    accentColor: 0xff7a2a
  },
  {
    id: 'fossils',
    name: 'Fossiler',
    startHeight: 1500,
    backgroundTop: 0x2f2119,
    backgroundBottom: 0x7a563d,
    fogColor: 0x2f2119,
    padColor: 0x6c4f37,
    accentColor: 0xf0d79f
  },
  { id: 'skeletons', name: 'Människoskelett', startHeight: 2000, backgroundTop: 0x1e1e27, backgroundBottom: 0x4d4a40, fogColor: 0x202027, padColor: 0x5e5a50, accentColor: 0xf3e8d0 },
  { id: 'goldDiamonds', name: 'Guld och diamanter', startHeight: 2500, backgroundTop: 0x163040, backgroundBottom: 0x8e6f1a, fogColor: 0x172831, padColor: 0x6b5520, accentColor: 0x95e8ff },
  { id: 'roots', name: 'Rötter', startHeight: 3000, backgroundTop: 0x12220e, backgroundBottom: 0x4b2816, fogColor: 0x14200f, padColor: 0x3b2418, accentColor: 0x8fd45a },
  { id: 'surface', name: 'Jordens yta', startHeight: 3500, backgroundTop: 0x5da7c9, backgroundBottom: 0x6b8f3a, fogColor: 0x7ab4cb, padColor: 0x526c35, accentColor: 0xffe48a },
  { id: 'skyscrapers', name: 'Skyskrapor', startHeight: 4000, backgroundTop: 0x4a617a, backgroundBottom: 0x202631, fogColor: 0x516272, padColor: 0x38414a, accentColor: 0xf8d46d },
  { id: 'sky', name: 'Himlen', startHeight: 4500, backgroundTop: 0x69bde8, backgroundBottom: 0xb6e7ff, fogColor: 0x91d4f3, padColor: 0xffffff, accentColor: 0xffd76e },
  { id: 'upperAtmosphere', name: 'Övre atmosfär', startHeight: 5000, backgroundTop: 0x203f7b, backgroundBottom: 0x8fc8ff, fogColor: 0x3f73aa, padColor: 0xdfefff, accentColor: 0xf0f5ff },
  { id: 'space', name: 'Rymden', startHeight: 5500, backgroundTop: 0x050814, backgroundBottom: 0x171b42, fogColor: 0x050814, padColor: 0x212853, accentColor: 0xffffff },
  { id: 'galaxy', name: 'Galaxen', startHeight: 6000, backgroundTop: 0x120520, backgroundBottom: 0x2f185f, fogColor: 0x120520, padColor: 0x302260, accentColor: 0xffa8f3 },
  { id: 'aliens', name: 'Utomjordingar', startHeight: 6500, backgroundTop: 0x081e1b, backgroundBottom: 0x234c3f, fogColor: 0x081e1b, padColor: 0x1f4f3f, accentColor: 0x8cffc2 },
  { id: 'void', name: 'Tomrum', startHeight: 7000, backgroundTop: 0x000000, backgroundBottom: 0x000000, fogColor: 0x000000, padColor: 0x070707, accentColor: 0x222222 },
  { id: 'whiteEnd', name: 'Vitt slut', startHeight: 7500, backgroundTop: 0xffffff, backgroundBottom: 0xf7f7ef, fogColor: 0xffffff, padColor: 0xf1efe5, accentColor: 0xd9d1b8 },
  { id: 'paradise', name: 'Paradiset', startHeight: 8000, backgroundTop: 0xfff5d2, backgroundBottom: 0xd8efff, fogColor: 0xfff5d2, padColor: 0xfff7d7, accentColor: 0xffd975 }
];
