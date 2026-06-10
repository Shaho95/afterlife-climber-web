import { BiomeId } from './BiomeConfig';

export interface PadTheme {
  plateColor: number;
  topColor: number;
  lipColor: number;
  rustColor: number;
  boltColor: number;
  highlightColor: number;
  crackColor?: number;
  movingMarkColor?: number;
  boostMarkColor?: number;
  cursedAuraColor?: number;
  cursedEyeColor?: number;
}

export interface UiTheme {
  cssClass: string;
  panelTop: string;
  panelBottom: string;
  trim: string;
  accent: string;
  text: string;
  shadow: string;
}

export interface BackgroundTheme {
  coverageColors: [number, number, number];
  midgroundColor: number;
  detailColor: number;
  glowColor: number;
}

export interface BiomeTheme {
  id: BiomeId;
  pad: PadTheme;
  ui: UiTheme;
  background: BackgroundTheme;
}

const DEFAULT_THEME: BiomeTheme = {
  id: 'hell',
  pad: {
    plateColor: 0x2a1412,
    topColor: 0x4b2b21,
    lipColor: 0x160809,
    rustColor: 0x8f4a2b,
    boltColor: 0xa56b3b,
    highlightColor: 0x74432d,
    crackColor: 0x050203,
    movingMarkColor: 0xb66b3c,
    boostMarkColor: 0xffb545,
    cursedAuraColor: 0x7a174f,
    cursedEyeColor: 0xff336f
  },
  ui: {
    cssClass: 'theme-hell',
    panelTop: '#4b2b21',
    panelBottom: '#171214',
    trim: '#7d4b2f',
    accent: '#f2a13a',
    text: '#fff1c7',
    shadow: '#120708'
  },
  background: {
    coverageColors: [0x14070b, 0x211014, 0x2b1214],
    midgroundColor: 0x100609,
    detailColor: 0x7d3122,
    glowColor: 0xff6d22
  }
};

export const BIOME_THEMES: Record<BiomeId, BiomeTheme> = {
  hell: DEFAULT_THEME,
  lava: {
    id: 'lava',
    pad: {
      plateColor: 0x251212,
      topColor: 0x5a2517,
      lipColor: 0x120707,
      rustColor: 0xe35b22,
      boltColor: 0xffb34a,
      highlightColor: 0xff7a24,
      crackColor: 0x2b0704,
      movingMarkColor: 0xff7a24,
      boostMarkColor: 0xffd45a,
      cursedAuraColor: 0x8d1238,
      cursedEyeColor: 0xff4427
    },
    ui: {
      cssClass: 'theme-lava',
      panelTop: '#5a2517',
      panelBottom: '#150808',
      trim: '#d95022',
      accent: '#ffc04a',
      text: '#fff0bd',
      shadow: '#120504'
    },
    background: {
      coverageColors: [0x1c0d0d, 0x341414, 0x551f13],
      midgroundColor: 0x17100f,
      detailColor: 0xff5a20,
      glowColor: 0xffc04a
    }
  },
  volcano: {
    id: 'volcano',
    pad: {
      plateColor: 0x24201f,
      topColor: 0x433634,
      lipColor: 0x11100f,
      rustColor: 0x9c3421,
      boltColor: 0xd16a32,
      highlightColor: 0x6a5048,
      crackColor: 0x0b0908,
      movingMarkColor: 0xff7a2a,
      boostMarkColor: 0xff9b3d,
      cursedAuraColor: 0x5c1633,
      cursedEyeColor: 0xff5630
    },
    ui: {
      cssClass: 'theme-volcano',
      panelTop: '#433634',
      panelBottom: '#151312',
      trim: '#6f4b3e',
      accent: '#ff7a2a',
      text: '#f7dfbd',
      shadow: '#090706'
    },
    background: {
      coverageColors: [0x171514, 0x252120, 0x3b2520],
      midgroundColor: 0x0f0e0e,
      detailColor: 0xd45224,
      glowColor: 0xff8a2a
    }
  },
  fossils: {
    id: 'fossils',
    pad: {
      plateColor: 0x4a3326,
      topColor: 0x6c4f37,
      lipColor: 0x21150f,
      rustColor: 0x8a6648,
      boltColor: 0xf0d79f,
      highlightColor: 0xc09868,
      crackColor: 0x2f1c12,
      movingMarkColor: 0xf0d79f,
      boostMarkColor: 0xffe6a8,
      cursedAuraColor: 0x4b2540,
      cursedEyeColor: 0xb94755
    },
    ui: {
      cssClass: 'theme-fossils',
      panelTop: '#6b4b34',
      panelBottom: '#2a1b13',
      trim: '#c09868',
      accent: '#f0d79f',
      text: '#fff0c4',
      shadow: '#21140e'
    },
    background: {
      coverageColors: [0x463223, 0x60462f, 0x73543a],
      midgroundColor: 0x2a1c15,
      detailColor: 0xf0d79f,
      glowColor: 0xe7bd72
    }
  },
  goldDiamonds: {
    ...DEFAULT_THEME,
    id: 'goldDiamonds',
    pad: { plateColor: 0x5f4719, topColor: 0xb98b2e, lipColor: 0x211507, rustColor: 0x95e8ff, boltColor: 0xffd766, highlightColor: 0xffed9a },
    ui: { cssClass: 'theme-gold', panelTop: '#71551d', panelBottom: '#152833', trim: '#d9a635', accent: '#95e8ff', text: '#fff3b0', shadow: '#120d04' },
    background: { coverageColors: [0x142b38, 0x263c43, 0x6b5520], midgroundColor: 0x0d1b24, detailColor: 0x95e8ff, glowColor: 0xffd766 }
  },
  skeletons: {
    ...DEFAULT_THEME,
    id: 'skeletons',
    pad: { plateColor: 0x34323a, topColor: 0x5e5a50, lipColor: 0x15151a, rustColor: 0x8a8172, boltColor: 0xf3e8d0, highlightColor: 0xb6aa96 },
    ui: { cssClass: 'theme-skeletons', panelTop: '#4a4642', panelBottom: '#181820', trim: '#8a8172', accent: '#f3e8d0', text: '#fff7e5', shadow: '#111116' },
    background: { coverageColors: [0x1e1e27, 0x2f2f36, 0x4d4a40], midgroundColor: 0x111116, detailColor: 0xf3e8d0, glowColor: 0xcfc4ae }
  },
  roots: {
    ...DEFAULT_THEME,
    id: 'roots',
    pad: { plateColor: 0x2d1b13, topColor: 0x4c2a18, lipColor: 0x111007, rustColor: 0x6f3c20, boltColor: 0x8fd45a, highlightColor: 0x7f6234 },
    ui: { cssClass: 'theme-roots', panelTop: '#3b2418', panelBottom: '#14200f', trim: '#6f3c20', accent: '#8fd45a', text: '#edf6c6', shadow: '#081007' },
    background: { coverageColors: [0x12220e, 0x263017, 0x4b2816], midgroundColor: 0x081007, detailColor: 0x8fd45a, glowColor: 0x9bcf65 }
  },
  surface: {
    ...DEFAULT_THEME,
    id: 'surface',
    pad: { plateColor: 0x415534, topColor: 0x6aa548, lipColor: 0x213018, rustColor: 0x8c6a3b, boltColor: 0xffe48a, highlightColor: 0x8ccf6a },
    ui: { cssClass: 'theme-surface', panelTop: '#526c35', panelBottom: '#2a4022', trim: '#8c6a3b', accent: '#ffe48a', text: '#fff8d5', shadow: '#14200f' },
    background: { coverageColors: [0x5da7c9, 0x6b8f3a, 0x526c35], midgroundColor: 0x2a4022, detailColor: 0xffe48a, glowColor: 0xffe48a }
  },
  skyscrapers: {
    ...DEFAULT_THEME,
    id: 'skyscrapers',
    pad: { plateColor: 0x303842, topColor: 0x4d5964, lipColor: 0x141820, rustColor: 0x687988, boltColor: 0xf8d46d, highlightColor: 0x7a8fa0 },
    ui: { cssClass: 'theme-city', panelTop: '#38414a', panelBottom: '#202631', trim: '#687988', accent: '#f8d46d', text: '#f5f0d8', shadow: '#11161d' },
    background: { coverageColors: [0x202631, 0x38414a, 0x4a617a], midgroundColor: 0x11161d, detailColor: 0xf8d46d, glowColor: 0xffd76e }
  },
  sky: {
    ...DEFAULT_THEME,
    id: 'sky',
    pad: { plateColor: 0xddefff, topColor: 0xffffff, lipColor: 0x7bb5d7, rustColor: 0xb6e7ff, boltColor: 0xffd76e, highlightColor: 0xffffff },
    ui: { cssClass: 'theme-sky', panelTop: '#b6e7ff', panelBottom: '#5da7c9', trim: '#ffffff', accent: '#ffd76e', text: '#ffffff', shadow: '#2e6f96' },
    background: { coverageColors: [0x69bde8, 0x91d4f3, 0xb6e7ff], midgroundColor: 0x5da7c9, detailColor: 0xffffff, glowColor: 0xffd76e }
  },
  upperAtmosphere: {
    ...DEFAULT_THEME,
    id: 'upperAtmosphere',
    pad: { plateColor: 0x9ccfff, topColor: 0xdfefff, lipColor: 0x2f5b92, rustColor: 0x8fc8ff, boltColor: 0xf0f5ff, highlightColor: 0xffffff },
    ui: { cssClass: 'theme-sky', panelTop: '#8fc8ff', panelBottom: '#203f7b', trim: '#dfefff', accent: '#f0f5ff', text: '#ffffff', shadow: '#1c376f' },
    background: { coverageColors: [0x203f7b, 0x3f73aa, 0x8fc8ff], midgroundColor: 0x1c376f, detailColor: 0xf0f5ff, glowColor: 0xffffff }
  },
  space: {
    ...DEFAULT_THEME,
    id: 'space',
    pad: { plateColor: 0x171b42, topColor: 0x2b3166, lipColor: 0x050814, rustColor: 0x453b8c, boltColor: 0xffffff, highlightColor: 0x8ea1ff },
    ui: { cssClass: 'theme-space', panelTop: '#2b3166', panelBottom: '#050814', trim: '#6a6fd8', accent: '#ffffff', text: '#f2f4ff', shadow: '#050814' },
    background: { coverageColors: [0x050814, 0x101633, 0x171b42], midgroundColor: 0x050814, detailColor: 0xffffff, glowColor: 0x8ea1ff }
  },
  galaxy: {
    ...DEFAULT_THEME,
    id: 'galaxy',
    pad: { plateColor: 0x24164c, topColor: 0x302260, lipColor: 0x10041d, rustColor: 0x7f4fc4, boltColor: 0xffa8f3, highlightColor: 0xffc5f3 },
    ui: { cssClass: 'theme-space', panelTop: '#302260', panelBottom: '#120520', trim: '#7f4fc4', accent: '#ffa8f3', text: '#fff0ff', shadow: '#10041d' },
    background: { coverageColors: [0x120520, 0x24164c, 0x2f185f], midgroundColor: 0x10041d, detailColor: 0xffa8f3, glowColor: 0xffc5f3 }
  },
  aliens: {
    ...DEFAULT_THEME,
    id: 'aliens',
    pad: { plateColor: 0x14382f, topColor: 0x1f4f3f, lipColor: 0x061613, rustColor: 0x5b49a1, boltColor: 0x8cffc2, highlightColor: 0x66d99d },
    ui: { cssClass: 'theme-aliens', panelTop: '#1f4f3f', panelBottom: '#081e1b', trim: '#5b49a1', accent: '#8cffc2', text: '#e9fff4', shadow: '#061613' },
    background: { coverageColors: [0x081e1b, 0x14382f, 0x234c3f], midgroundColor: 0x061613, detailColor: 0x8cffc2, glowColor: 0x8cffc2 }
  },
  void: {
    ...DEFAULT_THEME,
    id: 'void',
    pad: { plateColor: 0x050505, topColor: 0x111111, lipColor: 0x000000, rustColor: 0x222222, boltColor: 0x555555, highlightColor: 0x242424 },
    ui: { cssClass: 'theme-void', panelTop: '#111111', panelBottom: '#000000', trim: '#222222', accent: '#777777', text: '#dddddd', shadow: '#000000' },
    background: { coverageColors: [0x000000, 0x050505, 0x111111], midgroundColor: 0x000000, detailColor: 0x222222, glowColor: 0x333333 }
  },
  whiteEnd: {
    ...DEFAULT_THEME,
    id: 'whiteEnd',
    pad: { plateColor: 0xf1efe5, topColor: 0xffffff, lipColor: 0xd9d1b8, rustColor: 0xe9e1c9, boltColor: 0xc9b980, highlightColor: 0xffffff },
    ui: { cssClass: 'theme-light', panelTop: '#ffffff', panelBottom: '#f1efe5', trim: '#d9d1b8', accent: '#c9b980', text: '#ffffff', shadow: '#8b815f' },
    background: { coverageColors: [0xffffff, 0xf7f7ef, 0xf1efe5], midgroundColor: 0xd9d1b8, detailColor: 0xc9b980, glowColor: 0xffffff }
  },
  paradise: {
    ...DEFAULT_THEME,
    id: 'paradise',
    pad: { plateColor: 0xfff7d7, topColor: 0xffffff, lipColor: 0x9bd7ff, rustColor: 0xffd975, boltColor: 0xffd975, highlightColor: 0xffffff },
    ui: { cssClass: 'theme-light', panelTop: '#fff7d7', panelBottom: '#9bd7ff', trim: '#ffd975', accent: '#ffd975', text: '#ffffff', shadow: '#78a6c4' },
    background: { coverageColors: [0xfff5d2, 0xfff7d7, 0xf7f7ef], midgroundColor: 0xc7e8ff, detailColor: 0xffd975, glowColor: 0xffffff }
  }
};

export function getBiomeTheme(id: BiomeId): BiomeTheme {
  return BIOME_THEMES[id];
}
