import * as THREE from 'three';
import { BIOMES, BiomeDefinition, BiomeId } from '../config/BiomeConfig';
import { BiomeTheme, getBiomeTheme } from '../config/BiomeThemeConfig';
import { GAME_CONFIG } from '../config/GameConfig';
import { applyBackgroundRenderProfile, RENDER_ORDER } from '../render/RenderLayers';

type MotifFactory = (index: number, biome: BiomeDefinition) => THREE.Object3D;

export class BackgroundMotifs {
  readonly group = new THREE.Group();
  private activeBiomeId: BiomeId | null = null;
  private lastOpacity: number | null = null;
  private tileHeight = 84;

  constructor() {
    this.group.renderOrder = RENDER_ORDER.BACKGROUND;
  }

  setBiome(biome: BiomeDefinition): void {
    if (this.activeBiomeId === biome.id) {
      return;
    }

    this.activeBiomeId = biome.id;
    this.group.clear();
    this.group.renderOrder = RENDER_ORDER.BACKGROUND;
    this.lastOpacity = null;
    const theme = getBiomeTheme(biome.id);

    if (biome.id === 'hell') {
      this.createHellLayer(biome, theme);
      this.markLoopingChildren();
      return;
    }

    if (biome.id === 'lava') {
      this.createLavaLayer(biome, theme);
      this.markLoopingChildren();
      return;
    }

    if (biome.id === 'volcano') {
      this.createVolcanoLayer(biome, theme);
      this.markLoopingChildren();
      return;
    }

    if (biome.id === 'fossils') {
      this.createFossilLayer(biome, theme);
      this.markLoopingChildren();
      return;
    }

    if (this.isLateBiome(biome.id)) {
      this.createLateBiomeLayer(biome, theme);
      this.markLoopingChildren();
      return;
    }

    const factory = this.getFactory(biome.id);
    this.createGenericCoverage(theme);
    for (let i = 0; i < 34; i += 1) {
      const motif = factory(i, biome);
      const side = i % 2 === 0 ? -1 : 1;
      const sidePush = 2.35 + ((i * 7) % 5) * 0.28;
      motif.position.set(side * sidePush, i * 2.35 - 9, -2.4 - (i % 3) * 0.38);
      motif.rotation.z += side * (((i * 11) % 9) - 4) * 0.025;
      this.group.add(motif);
    }
    this.markLoopingChildren();
  }

  update(deltaSeconds: number, height: number, speedMultiplier = 1): void {
    const visualSpeedMultiplier = Math.min(
      GAME_CONFIG.scoring.backgroundVisualMaxMultiplier,
      1 + Math.max(0, speedMultiplier - 1) * GAME_CONFIG.scoring.backgroundSpeedScale
    );
    const speedBoost = visualSpeedMultiplier - 1;
    const minY = height - 30;
    const maxY = height + 64;

    for (const child of this.group.children) {
      const parallaxSpeed = child.userData.parallaxSpeed ?? 1;
      child.position.y += deltaSeconds * speedBoost * parallaxSpeed;
      const loopHeight = child.userData.loopHeight ?? this.tileHeight;
      while (child.position.y < minY) {
        child.position.y += loopHeight;
      }

      while (child.position.y > maxY) {
        child.position.y -= loopHeight;
      }
    }
  }

  setOpacity(opacity: number): void {
    if (this.lastOpacity !== null && Math.abs(this.lastOpacity - opacity) < 0.01) {
      return;
    }

    this.lastOpacity = opacity;
    this.group.visible = opacity > 0.02;

    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.transparent = opacity < 0.99;
        material.opacity = opacity;
        material.depthTest = false;
        material.depthWrite = false;
        material.needsUpdate = true;
      }
    });
  }

  private markLoopingChildren(): void {
    for (let i = 0; i < this.group.children.length; i += 1) {
      const child = this.group.children[i];
      child.userData.baseY = child.position.y;
      child.userData.loopHeight = child.userData.loopHeight ?? this.tileHeight;
      child.userData.parallaxSpeed = child.userData.parallaxSpeed ?? (0.45 + (i % 5) * 0.18);
    }
    applyBackgroundRenderProfile(this.group, RENDER_ORDER.BACKGROUND);
  }

  private createHellLayer(biome: BiomeDefinition, theme: BiomeTheme): void {
    this.createCoverageBands(theme, 18, 5.15, -18.5, 6.5);

    for (let i = 0; i < 15; i += 1) {
      const y = i * 5.15 - 18;

      const cavePlate = this.createCavePlate(5.9, 4.2, theme.background.coverageColors[i % theme.background.coverageColors.length]);
      cavePlate.position.set((i % 3 - 1) * 0.28, y + 0.15, -4.25);
      this.group.add(cavePlate);

      const leftWall = this.createRockWall(-3.72, y, -1);
      const rightWall = this.createRockWall(3.72, y + 1.2, 1);
      this.group.add(leftWall, rightWall);

      const ceilingSpike = this.triangle(0.72 + (i % 3) * 0.18, 1.35, 0x1b0d12);
      ceilingSpike.position.set(-1.45 + (i % 4) * 0.95, y + 2.35, -3.2);
      ceilingSpike.rotation.z = Math.PI;
      this.group.add(ceilingSpike);

      const floorSpike = this.triangle(0.58 + (i % 2) * 0.22, 1.05, 0x2a1010);
      floorSpike.position.set(1.55 - (i % 4) * 0.9, y - 1.95, -3.1);
      this.group.add(floorSpike);

      const flameA = this.createBigFlame(biome, 0.9 + (i % 2) * 0.2);
      flameA.position.set(i % 2 === 0 ? -2.5 : 2.48, y - 0.75, -2.15);
      this.group.add(flameA);

      const chain = this.createChain(6 + (i % 3));
      chain.position.set(i % 2 === 0 ? 2.95 : -2.95, y + 1.35, -2.35);
      const wire = this.createBarbedWire(2.35 + (i % 2) * 0.55);
      wire.position.set(i % 2 === 0 ? -0.92 : 0.92, y + 1.72, -2.75);
      wire.rotation.z = i % 2 === 0 ? -0.16 : 0.16;
      this.group.add(chain, wire);
    }

    for (let i = 0; i < 8; i += 1) {
      const demon = this.createDemonSilhouette();
      demon.position.set(i % 2 === 0 ? -2.45 : 2.45, i * 9.6 - 17.5, -2.45);
      demon.scale.setScalar(0.86 + (i % 2) * 0.18);
      this.group.add(demon);
    }

    for (let i = 0; i < 18; i += 1) {
      const pulseBlock = this.panel(0.72 + (i % 3) * 0.18, 0.12, i % 2 === 0 ? 0xff3c1d : 0x5b1413);
      pulseBlock.position.set((i % 5 - 2) * 1.12, i * 4.25 - 18.5, -3.6);
      this.group.add(pulseBlock);
    }

    for (let i = 0; i < 24; i += 1) {
      const stain = this.createGrimePatch(i % 2 === 0 ? 0x2e0c0b : 0x090405);
      stain.position.set((i % 4 - 1.5) * 1.45, i * 3.45 - 20.2, -3.05 - (i % 3) * 0.45);
      stain.rotation.z = -0.55 + (i % 5) * 0.22;
      stain.scale.setScalar(0.7 + (i % 4) * 0.16);
      this.group.add(stain);
    }
  }

  private createFossilLayer(biome: BiomeDefinition, theme: BiomeTheme): void {
    this.createCoverageBands(theme, 18, 5.4, -19, 6.8);

    for (let i = 0; i < 15; i += 1) {
      const y = i * 5.4 - 18;

      const stonePatch = this.createCavePlate(6.0, 4.5, theme.background.coverageColors[i % theme.background.coverageColors.length]);
      stonePatch.position.set((i % 2 === 0 ? -0.25 : 0.25), y + 0.15, -4.25);
      stonePatch.rotation.z = i % 2 === 0 ? -0.03 : 0.03;
      this.group.add(stonePatch);

      const sediment = this.panel(6.4, 0.16, i % 2 === 0 ? 0x5f412d : 0x735039, false);
      sediment.position.set(0, y + 2.2, -4.1);
      const sedimentB = this.panel(6.2, 0.1, i % 2 === 0 ? 0x8a6648 : 0x4a3326, false);
      sedimentB.position.set(0.12, y - 1.85, -4.0);
      this.group.add(sediment, sedimentB);

      const ribs = this.createDinoRibs(biome);
      ribs.position.set(i % 2 === 0 ? -1.95 : 1.95, y, -2.35);
      ribs.rotation.z = i % 2 === 0 ? -0.18 : 0.18;
      this.group.add(ribs);

      const skull = this.createDinoSkull(biome);
      skull.position.set(i % 2 === 0 ? 2.35 : -2.35, y + 1.25, -2.25);
      skull.scale.setScalar(0.9 + (i % 3) * 0.1);
      this.group.add(skull);

      const spiral = this.createFossilSpiral(biome);
      spiral.position.set(i % 2 === 0 ? 0.95 : -0.95, y - 1.7, -2.2);
      const crack = this.createCrack(1.0 + (i % 3) * 0.18);
      crack.position.set(i % 2 === 0 ? -0.2 : 0.25, y + 0.75, -2.05);
      crack.rotation.z = i % 2 === 0 ? -0.35 : 0.32;
      this.group.add(spiral, crack);
    }

    for (let i = 0; i < 18; i += 1) {
      const bone = this.createLongBone(biome);
      bone.position.set((i % 5 - 2) * 1.15, i * 4.15 - 19.5, -2.65);
      bone.rotation.z = -0.75 + (i % 4) * 0.48;
      bone.scale.setScalar(0.72 + (i % 3) * 0.1);
      this.group.add(bone);
    }

    for (let i = 0; i < 14; i += 1) {
      const embedded = this.createEmbeddedFossil(biome);
      embedded.position.set(i % 2 === 0 ? -2.85 : 2.85, i * 5.3 - 19.4, -2.55);
      embedded.rotation.z = i % 2 === 0 ? 0.45 : -0.45;
      embedded.scale.setScalar(0.8 + (i % 3) * 0.1);
      this.group.add(embedded);
    }
  }

  private createLavaLayer(biome: BiomeDefinition, theme: BiomeTheme): void {
    this.createCoverageBands(theme, 18, 5.0, -18, 6.5);

    for (let i = 0; i < 16; i += 1) {
      const y = i * 5.0 - 18;

      const backFlow = this.createLavaStream(0.55 + (i % 3) * 0.16, 4.5 + (i % 4) * 0.75, 0xff3d16);
      backFlow.position.set(-2.8 + (i % 4) * 1.85, y + 0.5, -4.15);
      this.group.add(backFlow);

      const brightFlow = this.createLavaStream(0.26 + (i % 2) * 0.12, 3.25 + (i % 3) * 0.55, biome.accentColor);
      brightFlow.position.set(i % 2 === 0 ? -1.85 : 1.85, y - 0.8, -2.9);
      this.group.add(brightFlow);

      const basaltLeft = this.createBasaltColumn(0.75 + (i % 3) * 0.22, 2.2 + (i % 2) * 0.6);
      basaltLeft.position.set(-3.55, y, -2.8);
      const basaltRight = this.createBasaltColumn(0.75 + ((i + 1) % 3) * 0.22, 2.35 + (i % 2) * 0.5);
      basaltRight.position.set(3.55, y + 1.1, -2.8);
      this.group.add(basaltLeft, basaltRight);

      const splash = this.createLavaSplash(biome);
      splash.position.set((i % 5 - 2) * 1.2, y + 1.65, -2.15);
      splash.scale.setScalar(0.78 + (i % 3) * 0.14);
      this.group.add(splash);
    }
  }

  private createVolcanoLayer(biome: BiomeDefinition, theme: BiomeTheme): void {
    this.createCoverageBands(theme, 18, 5.2, -18.5, 6.6);

    for (let i = 0; i < 16; i += 1) {
      const y = i * 5.2 - 18.5;
      const volcanoSilhouette = this.createVolcanoSilhouette(i, biome);
      volcanoSilhouette.position.set(i % 2 === 0 ? -1.9 : 1.9, y + 0.35, -4.15);
      volcanoSilhouette.scale.setScalar(1.25 + (i % 3) * 0.16);

      const ashCloud = this.createAshCloud(i);
      ashCloud.position.set((i % 4 - 1.5) * 1.45, y + 1.8, -3.4);
      ashCloud.scale.setScalar(1.25 + (i % 3) * 0.22);

      const basaltLeft = this.createBasaltColumn(0.75 + (i % 3) * 0.26, 3.4 + (i % 2) * 0.8);
      basaltLeft.position.set(-3.38, y - 0.1, -2.75);
      const basaltRight = this.createBasaltColumn(0.82 + ((i + 1) % 3) * 0.24, 3.5 + (i % 2) * 0.7);
      basaltRight.position.set(3.38, y + 1.05, -2.75);

      const crack = this.createCrack(0.95 + (i % 3) * 0.12);
      crack.position.set((i % 5 - 2) * 1.05, y - 1.4, -2.25);
      crack.rotation.z = -0.45 + (i % 4) * 0.3;

      const glowingCrack = this.createGlowingCrack(biome, 1 + (i % 3) * 0.18);
      glowingCrack.position.set((i % 3 - 1) * 1.35, y - 2.0, -2.18);
      glowingCrack.rotation.z = -0.1 + (i % 3) * 0.12;

      const lavaRun = this.createLavaStream(0.34 + (i % 2) * 0.12, 3.2 + (i % 3) * 0.65, biome.accentColor);
      lavaRun.position.set(i % 2 === 0 ? -2.55 : 2.55, y - 0.6, -2.55);
      lavaRun.rotation.z = i % 2 === 0 ? 0.07 : -0.07;

      const emberRow = this.createEmberRow(biome, 0.86 + (i % 2) * 0.18);
      emberRow.position.set((i % 5 - 2) * 0.72, y + 2.2, -2.05);

      this.group.add(volcanoSilhouette, ashCloud, basaltLeft, basaltRight, crack, glowingCrack, lavaRun, emberRow);
    }
  }

  private getFactory(id: BiomeId): MotifFactory {
      const factories: Record<BiomeId, MotifFactory> = {
      hell: (index, biome) => this.createFlame(index, biome),
      lava: (index, biome) => this.createLavaSplash(biome),
      volcano: (index, biome) => this.createVolcano(index, biome),
      fossils: (index, biome) => this.createFossil(index, biome),
      goldDiamonds: (index, biome) => this.createGem(index, biome),
      skeletons: (index, biome) => this.createBones(index, biome),
      roots: (index, biome) => this.createRoots(index, biome),
      surface: (index, biome) => this.createHill(index, biome),
      skyscrapers: (index, biome) => this.createBuilding(index, biome),
      sky: (index, biome) => (index % 2 === 0 ? this.createCloud(index, biome) : this.createBird(index, biome)),
      upperAtmosphere: (index, biome) => this.createPlane(index, biome),
      space: (index, biome) => this.createStar(index, biome),
      galaxy: (index, biome) => this.createPlanet(index, biome),
      aliens: (index, biome) => this.createAlien(index, biome),
      void: (index, biome) => this.createVoidMark(index, biome),
      whiteEnd: (index, biome) => this.createWhiteShard(index, biome),
      paradise: (index, biome) => this.createParadise(index, biome)
    };

    return factories[id];
  }

  private isLateBiome(id: BiomeId): boolean {
    return [
      'skeletons',
      'goldDiamonds',
      'roots',
      'surface',
      'skyscrapers',
      'sky',
      'upperAtmosphere',
      'space',
      'galaxy',
      'aliens',
      'void',
      'whiteEnd',
      'paradise'
    ].includes(id);
  }

  private createLateBiomeLayer(biome: BiomeDefinition, theme: BiomeTheme): void {
    if (biome.id === 'whiteEnd' || biome.id === 'paradise') {
      this.createEndCoverage(biome, theme);
    } else {
      const bandHeight = biome.id === 'void' ? 7.2 : 6.3;
      this.createCoverageBands(theme, 18, 5.2, -18.5, bandHeight);
    }

    for (let i = 0; i < 15; i += 1) {
      const y = i * 5.25 - 18.2;
      this.createLayerTexture(i, y, biome, theme);

      switch (biome.id) {
        case 'skeletons':
          this.createSkeletonCluster(i, y, biome, theme);
          break;
        case 'goldDiamonds':
          this.createGemCaveCluster(i, y, biome, theme);
          break;
        case 'roots':
          this.createRootCluster(i, y, biome, theme);
          break;
        case 'surface':
          this.createSurfaceCluster(i, y, biome, theme);
          break;
        case 'skyscrapers':
          this.createCityCluster(i, y, biome, theme);
          break;
        case 'sky':
          this.createSkyCluster(i, y, biome, theme);
          break;
        case 'upperAtmosphere':
          this.createUpperAtmosphereCluster(i, y, biome, theme);
          break;
        case 'space':
          this.createSpaceCluster(i, y, biome, theme);
          break;
        case 'galaxy':
          this.createGalaxyCluster(i, y, biome, theme);
          break;
        case 'aliens':
          this.createAlienCluster(i, y, biome, theme);
          break;
        case 'void':
          this.createVoidCluster(i, y, biome, theme);
          break;
        case 'whiteEnd':
        case 'paradise':
          this.createLightEndCluster(i, y, biome, theme);
          break;
      }
    }
  }

  private createLayerTexture(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    if (biome.id === 'sky' || biome.id === 'upperAtmosphere' || biome.id === 'whiteEnd' || biome.id === 'paradise') {
      const softBand = this.panel(6.7, 0.08 + (index % 3) * 0.03, theme.background.glowColor, false);
      softBand.position.set(0, y + 2.15, -4.35);
      this.group.add(softBand);
      return;
    }

    if (biome.id === 'space' || biome.id === 'galaxy' || biome.id === 'aliens' || biome.id === 'void') {
      for (let j = 0; j < 5; j += 1) {
        const dot = this.circle(0.035 + ((index + j) % 3) * 0.018, j % 2 === 0 ? theme.background.detailColor : theme.background.glowColor, false);
        dot.position.set(-2.85 + j * 1.25 + (index % 2) * 0.24, y - 2.0 + ((index + j) % 5) * 0.88, -3.65);
        this.group.add(dot);
      }
      return;
    }

    for (let j = 0; j < 3; j += 1) {
      const seam = this.panel(1.65 + (j % 2) * 0.5, 0.055, theme.background.midgroundColor, false);
      seam.position.set(-2.15 + j * 2.05, y - 1.6 + j * 1.45, -4.05);
      seam.rotation.z = -0.12 + ((index + j) % 4) * 0.08;
      this.group.add(seam);
    }
  }

  private createEndCoverage(biome: BiomeDefinition, theme: BiomeTheme): void {
    for (let i = 0; i < 28; i += 1) {
      const baseColor = theme.background.coverageColors[i % theme.background.coverageColors.length];
      const panel = this.panel(7.1, 7.4, baseColor, false);
      panel.position.set((i % 2 === 0 ? -0.08 : 0.08), -24 + i * 3.75, -4.85);
      panel.userData.loopHeight = this.tileHeight;
      this.group.add(panel);

      const glow = this.panel(6.6, 0.18 + (i % 3) * 0.06, theme.background.glowColor, false);
      glow.position.set(0, -22.35 + i * 3.75, -4.55);
      glow.userData.loopHeight = this.tileHeight;
      this.group.add(glow);

      const cloud = this.createCloudBank(i, biome.id === 'paradise' ? 0xfff7d7 : 0xffffff);
      cloud.position.set(i % 2 === 0 ? -2.1 : 2.1, -23 + i * 3.75, -3.6);
      cloud.scale.set(1.25, 0.72, 1);
      cloud.userData.loopHeight = this.tileHeight;
      this.group.add(cloud);
    }
  }

  private createSkeletonCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const niche = this.createCatacombNiche(index, theme);
    niche.position.set(index % 2 === 0 ? -2.55 : 2.55, y + 0.8, -3.35);
    const skull = this.createHumanSkull(biome);
    skull.position.set(index % 2 === 0 ? 2.25 : -2.25, y + 1.55, -2.45);
    skull.scale.setScalar(0.92 + (index % 3) * 0.12);
    const ribs = this.createRibArch(biome);
    ribs.position.set((index % 3 - 1) * 1.15, y - 0.8, -2.55);
    ribs.rotation.z = -0.1 + (index % 3) * 0.1;
    const tomb = this.createTombstone(theme.background.midgroundColor, biome.accentColor);
    tomb.position.set(index % 2 === 0 ? -1.15 : 1.15, y - 1.9, -2.35);
    const column = this.createBrokenColumn(theme.background.midgroundColor, biome.accentColor);
    column.position.set(index % 2 === 0 ? 3.05 : -3.05, y - 0.95, -2.75);
    const pile = this.createBonePile(biome);
    pile.position.set(index % 2 === 0 ? -2.9 : 2.9, y - 2.25, -2.3);
    const chain = this.createChain(5 + (index % 3));
    chain.position.set(index % 2 === 0 ? 0.55 : -0.55, y + 2.2, -2.7);
    this.group.add(niche, skull, ribs, tomb, column, pile, chain);
  }

  private createGemCaveCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const crystalA = this.createCrystalCluster(biome, index);
    crystalA.position.set(index % 2 === 0 ? -2.55 : 2.55, y - 1.0, -2.45);
    const crystalB = this.createCrystalCluster(biome, index + 3);
    crystalB.position.set(index % 2 === 0 ? 2.75 : -2.75, y + 1.35, -2.85);
    crystalB.scale.setScalar(0.82);
    const vein = this.createGoldVein(theme.background.glowColor);
    vein.position.set((index % 3 - 1) * 1.35, y + 2.15, -3.05);
    const pillar = this.createGoldenPillar(biome.accentColor, theme.background.glowColor);
    pillar.position.set(index % 2 === 0 ? -3.25 : 3.25, y - 0.4, -2.95);
    const chest = this.createTreasureChest(theme.background.midgroundColor, theme.background.glowColor);
    chest.position.set(index % 2 === 0 ? 1.45 : -1.45, y - 2.2, -2.5);
    this.group.add(crystalA, crystalB, vein, pillar, chest);
  }

  private createRootCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const arch = this.createRootArch(index, biome);
    arch.position.set(0, y + 0.35, -3.0);
    const rootA = this.createThickRoot(1.25 + (index % 3) * 0.25, theme.background.midgroundColor);
    rootA.position.set(index % 2 === 0 ? -2.75 : 2.75, y - 0.8, -2.55);
    rootA.rotation.z = index % 2 === 0 ? -0.45 : 0.45;
    const mushroom = this.createMushroomPatch(biome);
    mushroom.position.set(index % 2 === 0 ? 2.2 : -2.2, y - 2.05, -2.35);
    const stone = this.createPebbleCluster(0x302014, theme.background.detailColor);
    stone.position.set((index % 5 - 2) * 0.78, y + 1.6, -2.65);
    this.group.add(arch, rootA, mushroom, stone);
  }

  private createSurfaceCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const hills = this.createRollingHills(index, theme);
    hills.position.set(0, y - 1.65, -3.7);
    const tree = this.createCartoonTree(index, biome);
    tree.position.set(index % 2 === 0 ? -2.65 : 2.65, y - 0.7, -2.75);
    const cloud = this.createCloudBank(index, 0xffffff);
    cloud.position.set(index % 2 === 0 ? 2.15 : -2.15, y + 2.2, -3.4);
    cloud.scale.setScalar(0.82);
    const flower = this.createFlowerPatch(biome.accentColor);
    flower.position.set((index % 3 - 1) * 1.1, y - 2.22, -2.35);
    const birds = this.createBirdFlock(0x25485a);
    birds.position.set(index % 2 === 0 ? -1.3 : 1.3, y + 1.75, -3.0);
    this.group.add(hills, tree, cloud, flower, birds);
  }

  private createCityCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const skyline = this.createSkyline(index, biome, theme);
    skyline.position.set(0, y - 0.65, -3.35);
    const crane = this.createCrane(theme.background.detailColor);
    crane.position.set(index % 2 === 0 ? -2.7 : 2.7, y + 1.75, -2.8);
    const antenna = this.createAntenna(theme.background.glowColor);
    antenna.position.set(index % 2 === 0 ? 2.45 : -2.45, y + 2.1, -2.55);
    const sign = this.createCitySign(theme.background.glowColor);
    sign.position.set(index % 2 === 0 ? 1.35 : -1.35, y - 2.1, -2.35);
    this.group.add(skyline, crane, antenna, sign);
  }

  private createSkyCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const cloudA = this.createCloudBank(index, 0xffffff);
    cloudA.position.set(index % 2 === 0 ? -2.35 : 2.35, y - 0.9, -3.25);
    const cloudB = this.createCloudBank(index + 4, 0xf2fbff);
    cloudB.position.set(index % 2 === 0 ? 1.75 : -1.75, y + 1.55, -3.55);
    cloudB.scale.setScalar(0.72);
    const rays = this.createSunRays(theme.background.glowColor);
    rays.position.set(index % 2 === 0 ? 2.45 : -2.45, y + 2.2, -3.8);
    const flock = this.createBirdFlock(0x2d6b91);
    flock.position.set((index % 3 - 1) * 1.1, y + 0.45, -2.65);
    const balloon = this.createBalloon(theme.background.glowColor);
    balloon.position.set(index % 2 === 0 ? -3.0 : 3.0, y + 2.6, -2.8);
    this.group.add(cloudA, cloudB, rays, flock, balloon);
  }

  private createUpperAtmosphereCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const trail = this.createJetTrail(theme.background.detailColor);
    trail.position.set(0, y + 1.75, -3.35);
    trail.rotation.z = index % 2 === 0 ? -0.08 : 0.08;
    const plane = this.createPlane(index, biome);
    plane.position.set(index % 2 === 0 ? -2.4 : 2.4, y + 0.7, -2.45);
    plane.scale.setScalar(0.9);
    const thinCloud = this.createCloudBank(index + 2, 0xeaf6ff);
    thinCloud.position.set(index % 2 === 0 ? 2.1 : -2.1, y - 1.4, -3.55);
    thinCloud.scale.set(1.15, 0.58, 1);
    const smallPlane = this.createPlane(index + 5, biome);
    smallPlane.position.set(index % 2 === 0 ? 3.15 : -3.15, y + 2.45, -3.05);
    smallPlane.scale.setScalar(0.52);
    this.group.add(trail, plane, thinCloud, smallPlane);
  }

  private createSpaceCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const planet = this.createDistantPlanet(index, biome);
    planet.position.set(index % 2 === 0 ? -2.55 : 2.55, y + 1.35, -3.25);
    const asteroid = this.createAsteroid(index);
    asteroid.position.set(index % 2 === 0 ? 2.6 : -2.6, y - 1.55, -2.45);
    const comet = this.createComet(theme.background.glowColor);
    comet.position.set((index % 3 - 1) * 1.25, y + 2.2, -2.8);
    comet.rotation.z = index % 2 === 0 ? -0.28 : 0.28;
    const satellite = this.createSatellite(theme.background.detailColor);
    satellite.position.set(index % 2 === 0 ? -1.15 : 1.15, y - 2.15, -2.55);
    this.group.add(planet, asteroid, comet, satellite);
  }

  private createGalaxyCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const spiral = this.createGalaxySpiral(index, theme);
    spiral.position.set((index % 3 - 1) * 1.1, y + 0.55, -3.2);
    const planet = this.createRingPlanet(index, biome);
    planet.position.set(index % 2 === 0 ? -2.55 : 2.55, y - 1.35, -2.65);
    const moon = this.circle(0.13 + (index % 2) * 0.04, 0xd9d4ff);
    moon.position.set(index % 2 === 0 ? -1.9 : 1.9, y - 0.62, -2.45);
    const nebula = this.createNebulaRibbon(theme.background.glowColor);
    nebula.position.set(index % 2 === 0 ? 2.15 : -2.15, y + 2.05, -3.5);
    this.group.add(spiral, planet, moon, nebula);
  }

  private createAlienCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const tower = this.createAlienTower(index, biome, theme);
    tower.position.set(index % 2 === 0 ? -2.7 : 2.7, y - 0.65, -2.95);
    const ufo = this.createUfo(theme.background.glowColor);
    ufo.position.set(index % 2 === 0 ? 1.9 : -1.9, y + 2.0, -2.65);
    const head = this.createAlien(index, biome);
    head.position.set((index % 3 - 1) * 1.1, y - 1.8, -2.45);
    head.scale.setScalar(0.88);
    const eye = this.createEyeSymbol(theme.background.glowColor);
    eye.position.set(index % 2 === 0 ? 3.05 : -3.05, y + 0.55, -2.55);
    this.group.add(tower, ufo, head, eye);
  }

  private createVoidCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const tear = this.createVoidTear(index);
    tear.position.set(index % 2 === 0 ? -2.45 : 2.45, y + 0.5, -2.8);
    const glitchA = this.panel(1.2 + (index % 3) * 0.45, 0.035, index % 2 === 0 ? 0x2a2a2a : 0x111111, false);
    glitchA.position.set((index % 3 - 1) * 1.05, y + 1.9, -2.55);
    glitchA.rotation.z = index % 2 === 0 ? 0.02 : -0.02;
    const glitchB = this.panel(0.42, 0.045, 0x555555, false);
    glitchB.position.set(index % 2 === 0 ? 2.7 : -2.7, y - 1.85, -2.45);
    const particle = this.createBrokenParticles(theme.background.detailColor);
    particle.position.set(index % 2 === 0 ? -0.9 : 0.9, y - 0.85, -2.9);
    this.group.add(tear, glitchA, glitchB, particle);
  }

  private createLightEndCluster(index: number, y: number, biome: BiomeDefinition, theme: BiomeTheme): void {
    const lightPillar = this.createLightPillar(theme.background.glowColor, theme.background.detailColor);
    lightPillar.position.set(index % 2 === 0 ? -2.25 : 2.25, y + 0.2, -3.35);
    const halo = this.createHaloStack(theme.background.detailColor);
    halo.position.set(index % 2 === 0 ? 1.9 : -1.9, y + 1.65, -2.65);
    const cloud = this.createCloudBank(index, biome.id === 'paradise' ? 0xfff7d7 : 0xffffff);
    cloud.position.set((index % 3 - 1) * 1.25, y - 1.7, -2.85);
    cloud.scale.setScalar(0.85);
    const calm = this.panel(2.2, 0.05, theme.background.detailColor, false);
    calm.position.set(0, y + 2.45, -2.7);
    const particles = this.createSoftParticles(theme.background.detailColor);
    particles.position.set(index % 2 === 0 ? -0.8 : 0.8, y + 0.55, -2.75);
    this.group.add(lightPillar, halo, cloud, calm, particles);
  }

  private createSpriteGroup(scale = 1): THREE.Group {
    const group = new THREE.Group();
    group.scale.setScalar(scale);
    return group;
  }

  private createCoverageBands(theme: BiomeTheme, count: number, spacing: number, startY: number, height: number): void {
    for (let i = 0; i < count; i += 1) {
      const color = theme.background.coverageColors[i % theme.background.coverageColors.length];
      const band = this.createCavePlate(6.65, height, color);
      band.position.set(((i % 3) - 1) * 0.14, startY + i * spacing, -4.8);
      band.scale.x = 1.02 + (i % 2) * 0.04;
      band.userData.loopHeight = this.tileHeight;
      this.group.add(band);

      const lowerShade = this.panel(6.8, 0.22, theme.background.midgroundColor, false);
      lowerShade.position.set(0, startY + i * spacing - height * 0.48, -4.65);
      lowerShade.userData.loopHeight = this.tileHeight;
      this.group.add(lowerShade);
    }
  }

  private createGenericCoverage(theme: BiomeTheme): void {
    for (let i = 0; i < 16; i += 1) {
      const band = this.createCavePlate(6.45, 5.9, theme.background.coverageColors[i % theme.background.coverageColors.length]);
      band.position.set((i % 2 === 0 ? -0.16 : 0.16), i * 5.4 - 18, -4.7);
      band.userData.loopHeight = this.tileHeight;
      this.group.add(band);
    }
  }

  private mat(color: number): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  }

  private panel(width: number, height: number, color: number, outline = true): THREE.Group {
    const group = new THREE.Group();

    if (outline) {
      const outlineMesh = new THREE.Mesh(new THREE.PlaneGeometry(width + 0.08, height + 0.08), this.mat(0x1b0d12));
      outlineMesh.position.z = -0.01;
      group.add(outlineMesh);
    }

    group.add(new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.mat(color)));
    return group;
  }

  private roughPanel(width: number, height: number, color: number, points = 10): THREE.Group {
    const shape = new THREE.Shape();
    const jitter = 0.08;
    const coords: THREE.Vector2[] = [];

    for (let i = 0; i < points; i += 1) {
      const t = i / points;
      const edge = Math.floor(t * 4);
      const local = (t * 4) % 1;
      const wobble = Math.sin(i * 3.1) * jitter;

      if (edge === 0) coords.push(new THREE.Vector2(-width * 0.5 + local * width, height * 0.5 + wobble));
      if (edge === 1) coords.push(new THREE.Vector2(width * 0.5 + wobble, height * 0.5 - local * height));
      if (edge === 2) coords.push(new THREE.Vector2(width * 0.5 - local * width, -height * 0.5 + wobble));
      if (edge === 3) coords.push(new THREE.Vector2(-width * 0.5 + wobble, -height * 0.5 + local * height));
    }

    shape.moveTo(coords[0].x, coords[0].y);
    for (const point of coords.slice(1)) {
      shape.lineTo(point.x, point.y);
    }
    shape.closePath();

    const group = new THREE.Group();
    const outline = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.mat(0x110607));
    outline.scale.set(1.035, 1.045, 1);
    outline.position.z = -0.02;
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.mat(color));
    group.add(outline, fill);
    return group;
  }

  private circle(radius: number, color: number, outline = true): THREE.Group {
    const group = new THREE.Group();

    if (outline) {
      const outlineMesh = new THREE.Mesh(new THREE.CircleGeometry(radius + 0.045, 22), this.mat(0x1b0d12));
      outlineMesh.position.z = -0.01;
      group.add(outlineMesh);
    }

    group.add(new THREE.Mesh(new THREE.CircleGeometry(radius, 22), this.mat(color)));
    return group;
  }

  private triangle(width: number, height: number, color: number): THREE.Group {
    const shape = new THREE.Shape();
    shape.moveTo(0, height * 0.5);
    shape.lineTo(-width * 0.5, -height * 0.5);
    shape.lineTo(width * 0.5, -height * 0.5);
    shape.closePath();

    const group = new THREE.Group();
    const outline = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.mat(0x1b0d12));
    outline.scale.set(1.08, 1.08, 1);
    outline.position.z = -0.01;
    group.add(outline, new THREE.Mesh(new THREE.ShapeGeometry(shape), this.mat(color)));
    return group;
  }

  private createRockWall(x: number, y: number, side: -1 | 1): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const colors = [0x170a0d, 0x241012, 0x321313];

    for (let i = 0; i < 5; i += 1) {
      const rock = this.triangle(0.92 + (i % 2) * 0.26, 1.25 + (i % 3) * 0.3, colors[i % colors.length]);
      rock.position.set(side * (i * 0.28), i * 0.72 - 1.55, -3.4);
      rock.rotation.z = side * (Math.PI * 0.5 + i * 0.08);
      group.add(rock);
    }

    group.position.set(x, y, 0);
    return group;
  }

  private createCavePlate(width: number, height: number, color: number): THREE.Object3D {
    const group = this.roughPanel(width, height, color, 18);

    for (let i = 0; i < 7; i += 1) {
      const scratch = this.panel(0.55 + (i % 3) * 0.22, 0.045, i % 2 === 0 ? 0x0b0405 : 0x3a1716, false);
      scratch.position.set(-width * 0.38 + (i % 4) * width * 0.24, -height * 0.35 + Math.floor(i / 4) * height * 0.55, 0.03);
      scratch.rotation.z = -0.65 + (i % 4) * 0.34;
      group.add(scratch);
    }

    return group;
  }

  private createCatacombNiche(index: number, theme: BiomeTheme): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const back = this.roughPanel(1.05, 1.38, theme.background.midgroundColor, 12);
    const arch = new THREE.Mesh(
      new THREE.RingGeometry(0.48, 0.58, 18, 1, 0, Math.PI),
      this.mat(0x0f0f14)
    );
    arch.scale.y = 1.45;
    arch.rotation.z = Math.PI;
    arch.position.y = 0.12;
    const ledge = this.panel(1.05, 0.12, 0x16161c, false);
    ledge.position.y = -0.6;
    const smallSkull = this.createHumanSkull({ ...BIOMES[0], accentColor: theme.background.detailColor });
    smallSkull.scale.setScalar(0.42);
    smallSkull.position.set(index % 2 === 0 ? -0.2 : 0.18, -0.08, 0.04);
    group.add(back, arch, ledge, smallSkull);
    return group;
  }

  private createHumanSkull(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const head = this.circle(0.34, biome.accentColor);
    head.scale.set(1.08, 1.18, 1);
    const jaw = this.panel(0.48, 0.22, biome.accentColor);
    jaw.position.y = -0.32;
    const eyeA = this.circle(0.075, 0x121216, false);
    const eyeB = this.circle(0.075, 0x121216, false);
    eyeA.position.set(-0.13, 0.05, 0.04);
    eyeB.position.set(0.13, 0.05, 0.04);
    const nose = this.triangle(0.12, 0.16, 0x121216);
    nose.position.set(0, -0.08, 0.05);
    nose.rotation.z = Math.PI;
    const toothLine = this.panel(0.34, 0.035, 0x8a8172, false);
    toothLine.position.set(0, -0.36, 0.05);
    group.add(head, jaw, eyeA, eyeB, nose, toothLine);
    return group;
  }

  private createRibArch(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const spine = this.panel(0.1, 1.28, biome.accentColor);
    spine.rotation.z = 0.05;
    group.add(spine);
    for (let i = 0; i < 5; i += 1) {
      const rib = new THREE.Mesh(new THREE.RingGeometry(0.18 + i * 0.03, 0.24 + i * 0.03, 18, 1, 0, Math.PI), this.mat(biome.accentColor));
      rib.scale.set(1.35, 0.85, 1);
      rib.position.set(0, 0.42 - i * 0.18, 0.02);
      rib.rotation.z = i % 2 === 0 ? Math.PI * 0.5 : -Math.PI * 0.5;
      group.add(rib);
    }
    return group;
  }

  private createTombstone(stoneColor: number, markColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const body = this.roughPanel(0.58, 0.86, stoneColor, 12);
    const crossA = this.panel(0.08, 0.42, markColor, false);
    const crossB = this.panel(0.28, 0.07, markColor, false);
    crossA.position.z = 0.03;
    crossB.position.set(0, 0.08, 0.04);
    group.add(body, crossA, crossB);
    return group;
  }

  private createBrokenColumn(stoneColor: number, highlightColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const base = this.panel(0.62, 0.18, stoneColor);
    const shaft = this.panel(0.42, 1.18, stoneColor);
    shaft.position.y = 0.48;
    shaft.rotation.z = -0.05;
    const crack = this.panel(0.05, 0.42, highlightColor, false);
    crack.position.set(0.04, 0.46, 0.03);
    crack.rotation.z = -0.55;
    const broken = this.triangle(0.38, 0.28, stoneColor);
    broken.position.set(0.06, 1.16, 0.02);
    group.add(base, shaft, crack, broken);
    return group;
  }

  private createBonePile(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const bone = this.createLongBone(biome);
      bone.scale.setScalar(0.42 + (i % 2) * 0.1);
      bone.position.set(-0.46 + i * 0.22, -0.1 + (i % 2) * 0.12, 0.02 * i);
      bone.rotation.z = -0.7 + i * 0.35;
      group.add(bone);
    }
    return group;
  }

  private createCrystalCluster(biome: BiomeDefinition, index: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const colors = [biome.accentColor, 0xffd766, 0xffffff];
    for (let i = 0; i < 5; i += 1) {
      const shard = this.triangle(0.32 + (i % 2) * 0.12, 0.86 + (i % 3) * 0.26, colors[(index + i) % colors.length]);
      shard.position.set(-0.48 + i * 0.23, (i % 2) * 0.12, 0.02 * i);
      shard.rotation.z = -0.2 + i * 0.1;
      group.add(shard);
    }
    return group;
  }

  private createGoldVein(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 4; i += 1) {
      const vein = this.panel(0.72 - i * 0.08, 0.07, color, false);
      vein.position.set(-0.48 + i * 0.32, -0.12 + i * 0.08, 0.02);
      vein.rotation.z = -0.45 + i * 0.25;
      group.add(vein);
    }
    return group;
  }

  private createGoldenPillar(baseColor: number, glowColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const shaft = this.panel(0.38, 1.8, baseColor);
    const capA = this.panel(0.66, 0.16, glowColor);
    const capB = this.panel(0.58, 0.14, glowColor);
    capA.position.y = 0.92;
    capB.position.y = -0.92;
    group.add(shaft, capA, capB);
    return group;
  }

  private createTreasureChest(darkColor: number, goldColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const body = this.panel(0.82, 0.4, darkColor);
    const lid = this.panel(0.78, 0.22, goldColor);
    lid.position.y = 0.26;
    const lock = this.panel(0.12, 0.16, 0xfff0a8);
    lock.position.set(0, 0.02, 0.04);
    group.add(body, lid, lock);
    return group;
  }

  private createRootArch(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const root = this.panel(0.18, 2.2 - i * 0.18, i % 2 === 0 ? 0x2b170e : 0x6f3c20);
      root.position.set(-1.1 + i * 0.55, 0.1 + Math.sin((index + i) * 0.8) * 0.16, 0.02 * i);
      root.rotation.z = -0.72 + i * 0.36;
      group.add(root);
    }
    const leafGlow = this.circle(0.08, biome.accentColor, false);
    leafGlow.position.set(0.55, 0.65, 0.1);
    group.add(leafGlow);
    return group;
  }

  private createThickRoot(length: number, color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const main = this.panel(0.24, length, color);
    const branch = this.panel(0.13, length * 0.55, 0x6f3c20);
    branch.position.set(0.24, 0.12, 0.03);
    branch.rotation.z = 0.55;
    group.add(main, branch);
    return group;
  }

  private createMushroomPatch(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 4; i += 1) {
      const stem = this.panel(0.08, 0.28 + i * 0.03, 0xd8c7a0, false);
      const cap = this.circle(0.16 + (i % 2) * 0.04, i % 2 === 0 ? biome.accentColor : 0x8a4b34);
      stem.position.set(-0.42 + i * 0.25, 0, 0);
      cap.scale.y = 0.48;
      cap.position.set(stem.position.x, 0.2 + i * 0.03, 0.03);
      group.add(stem, cap);
    }
    return group;
  }

  private createPebbleCluster(darkColor: number, accentColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const rock = this.circle(0.1 + (i % 3) * 0.04, i % 2 === 0 ? darkColor : accentColor);
      rock.scale.y = 0.65;
      rock.position.set(-0.45 + i * 0.2, Math.sin(i) * 0.08, 0.02 * i);
      group.add(rock);
    }
    return group;
  }

  private createRollingHills(index: number, theme: BiomeTheme): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 3; i += 1) {
      const hill = this.circle(1.2 + i * 0.25, i % 2 === 0 ? theme.background.midgroundColor : 0x6aa548, false);
      hill.scale.y = 0.32 + i * 0.04;
      hill.position.set(-2.1 + i * 2.1 + (index % 2) * 0.2, 0, -0.02 * i);
      group.add(hill);
    }
    return group;
  }

  private createCartoonTree(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const trunk = this.panel(0.24, 0.95, 0x5f3a1f);
    const crownA = this.circle(0.42, 0x4d8a39);
    const crownB = this.circle(0.36, biome.accentColor);
    trunk.position.y = -0.35;
    crownA.position.y = 0.35;
    crownB.position.set(index % 2 === 0 ? 0.22 : -0.22, 0.56, 0.03);
    group.add(trunk, crownA, crownB);
    return group;
  }

  private createCloudBank(index: number, color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const puff = this.circle(0.28 + (i % 3) * 0.08, color, false);
      puff.scale.x = 1.25;
      puff.scale.y = 0.72;
      puff.position.set(-0.76 + i * 0.34, Math.sin((index + i) * 0.9) * 0.08, 0.01 * i);
      group.add(puff);
    }
    return group;
  }

  private createFlowerPatch(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const stem = this.panel(0.035, 0.18, 0x3f7b34, false);
      const bloom = this.circle(0.055, i % 2 === 0 ? color : 0xffffff, false);
      stem.position.set(-0.36 + i * 0.18, 0, 0);
      bloom.position.set(stem.position.x, 0.12, 0.03);
      group.add(stem, bloom);
    }
    return group;
  }

  private createBirdFlock(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 4; i += 1) {
      const bird = this.createBird(i, { ...BIOMES[0], accentColor: color });
      bird.scale.setScalar(0.38 + (i % 2) * 0.08);
      bird.position.set(-0.55 + i * 0.38, Math.sin(i) * 0.18, 0.02 * i);
      group.add(bird);
    }
    return group;
  }

  private createSkyline(index: number, biome: BiomeDefinition, theme: BiomeTheme): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 5; i += 1) {
      const height = 1.4 + ((index + i) % 4) * 0.42;
      const building = this.panel(0.68, height, i % 2 === 0 ? biome.padColor : theme.background.midgroundColor);
      building.position.set(-1.85 + i * 0.92, -0.2 + height * 0.25, 0);
      group.add(building);
      for (let j = 0; j < 4; j += 1) {
        const win = this.panel(0.12, 0.08, biome.accentColor, false);
        win.position.set(building.position.x + (j % 2 === 0 ? -0.14 : 0.14), building.position.y - height * 0.25 + j * 0.24, 0.04);
        group.add(win);
      }
    }
    return group;
  }

  private createCrane(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const mast = this.panel(0.08, 1.35, color, false);
    const arm = this.panel(1.0, 0.06, color, false);
    const cable = this.panel(0.035, 0.42, color, false);
    arm.position.set(0.42, 0.55, 0.02);
    cable.position.set(0.86, 0.3, 0.03);
    group.add(mast, arm, cable);
    return group;
  }

  private createAntenna(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const pole = this.panel(0.04, 0.86, color, false);
    const dish = this.circle(0.18, color, false);
    dish.scale.y = 0.38;
    dish.position.set(0.16, 0.2, 0.03);
    dish.rotation.z = -0.3;
    group.add(pole, dish);
    return group;
  }

  private createCitySign(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const sign = this.panel(0.78, 0.24, 0x11161d);
    const glow = this.panel(0.52, 0.045, color, false);
    glow.position.z = 0.03;
    group.add(sign, glow);
    return group;
  }

  private createSunRays(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 4; i += 1) {
      const ray = this.panel(0.06, 1.2, color, false);
      ray.rotation.z = -0.55 + i * 0.35;
      ray.position.x = -0.25 + i * 0.16;
      group.add(ray);
    }
    return group;
  }

  private createBalloon(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const balloon = this.circle(0.24, color);
    balloon.scale.y = 1.24;
    const basket = this.panel(0.22, 0.14, 0x8c6a3b);
    basket.position.y = -0.42;
    const lineA = this.panel(0.025, 0.34, 0x8c6a3b, false);
    const lineB = this.panel(0.025, 0.34, 0x8c6a3b, false);
    lineA.position.set(-0.08, -0.28, 0.02);
    lineB.position.set(0.08, -0.28, 0.02);
    group.add(balloon, lineA, lineB, basket);
    return group;
  }

  private createJetTrail(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 3; i += 1) {
      const trail = this.panel(1.5 - i * 0.25, 0.06, color, false);
      trail.position.set(-0.35 + i * 0.48, -0.14 + i * 0.12, 0.01 * i);
      group.add(trail);
    }
    return group;
  }

  private createDistantPlanet(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const planet = this.circle(0.44 + (index % 2) * 0.12, index % 2 === 0 ? biome.accentColor : 0x6a6fd8);
    planet.scale.y = 0.92;
    const shade = this.panel(0.72, 0.08, 0x171b42, false);
    shade.position.z = 0.03;
    shade.rotation.z = -0.18;
    group.add(planet, shade);
    return group;
  }

  private createAsteroid(index: number): THREE.Object3D {
    const rock = this.roughPanel(0.52 + (index % 3) * 0.1, 0.38 + (index % 2) * 0.12, 0x5a5147, 10);
    rock.rotation.z = index * 0.31;
    return rock;
  }

  private createComet(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const head = this.circle(0.15, color, false);
    const tail = this.panel(0.82, 0.07, color, false);
    tail.position.x = -0.46;
    group.add(tail, head);
    return group;
  }

  private createSatellite(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const body = this.panel(0.24, 0.18, color);
    const panelA = this.panel(0.38, 0.12, 0x6a6fd8);
    const panelB = this.panel(0.38, 0.12, 0x6a6fd8);
    panelA.position.x = -0.34;
    panelB.position.x = 0.34;
    group.add(body, panelA, panelB);
    return group;
  }

  private createGalaxySpiral(index: number, theme: BiomeTheme): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 4; i += 1) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.22 + i * 0.15, 0.25 + i * 0.15, 28, 1, 0.3, Math.PI * 1.45), this.mat(i % 2 === 0 ? theme.background.detailColor : theme.background.glowColor));
      ring.scale.y = 0.55;
      ring.rotation.z = index * 0.2 + i * 0.55;
      group.add(ring);
    }
    return group;
  }

  private createRingPlanet(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createPlanet(index, biome);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.48, 0.58, 28), this.mat(0xffc5f3));
    ring.scale.y = 0.22;
    ring.rotation.z = -0.32;
    group.add(ring);
    return group;
  }

  private createNebulaRibbon(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 3; i += 1) {
      const ribbon = this.panel(1.2 - i * 0.22, 0.08, color, false);
      ribbon.position.set(-0.22 + i * 0.28, Math.sin(i) * 0.16, 0.02 * i);
      ribbon.rotation.z = -0.3 + i * 0.24;
      group.add(ribbon);
    }
    return group;
  }

  private createAlienTower(index: number, biome: BiomeDefinition, theme: BiomeTheme): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const base = this.triangle(0.72, 1.5, theme.background.midgroundColor);
    base.rotation.z = Math.PI;
    const eye = this.circle(0.14, biome.accentColor, false);
    eye.position.y = 0.18;
    const spine = this.panel(0.1, 1.1, theme.background.glowColor, false);
    spine.position.y = -0.2;
    spine.rotation.z = index % 2 === 0 ? 0.08 : -0.08;
    group.add(base, spine, eye);
    return group;
  }

  private createUfo(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const dome = this.circle(0.26, color);
    dome.scale.y = 0.55;
    dome.position.y = 0.1;
    const saucer = this.circle(0.48, 0x5b49a1);
    saucer.scale.y = 0.22;
    const beam = this.triangle(0.62, 0.86, 0x8cffc2);
    beam.position.y = -0.5;
    beam.rotation.z = Math.PI;
    group.add(beam, saucer, dome);
    return group;
  }

  private createEyeSymbol(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const eye = this.circle(0.32, color);
    eye.scale.y = 0.45;
    const pupil = this.circle(0.08, 0x061613, false);
    pupil.position.z = 0.04;
    group.add(eye, pupil);
    return group;
  }

  private createVoidTear(index: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const outline = this.roughPanel(0.52, 1.2, 0x222222, 11);
    const inner = this.roughPanel(0.36, 0.96, 0x000000, 11);
    inner.position.z = 0.03;
    outline.rotation.z = index % 2 === 0 ? -0.12 : 0.12;
    inner.rotation.z = outline.rotation.z;
    group.add(outline, inner);
    return group;
  }

  private createBrokenParticles(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 6; i += 1) {
      const shard = this.triangle(0.08 + (i % 2) * 0.04, 0.14 + (i % 3) * 0.04, color);
      shard.position.set(-0.38 + i * 0.15, Math.sin(i * 1.7) * 0.28, 0.02 * i);
      shard.rotation.z = i * 0.7;
      group.add(shard);
    }
    return group;
  }

  private createSoftParticles(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 7; i += 1) {
      const particle = this.circle(0.035 + (i % 3) * 0.015, color, false);
      particle.position.set(-0.55 + i * 0.18, Math.sin(i * 1.3) * 0.42, 0.01 * i);
      group.add(particle);
    }
    return group;
  }

  private createLightPillar(color: number, trimColor: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const pillar = this.panel(0.38, 2.6, color, false);
    const sideA = this.panel(0.04, 2.25, trimColor, false);
    const sideB = this.panel(0.04, 2.25, trimColor, false);
    sideA.position.x = -0.24;
    sideB.position.x = 0.24;
    group.add(pillar, sideA, sideB);
    return group;
  }

  private createHaloStack(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.22 + i * 0.16, 0.25 + i * 0.16, 28), this.mat(color));
      ring.scale.y = 0.32;
      ring.position.y = i * 0.08;
      group.add(ring);
    }
    return group;
  }

  private createGrimePatch(color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const blot = this.roughPanel(0.72, 0.42, color, 12);
    const dripA = this.panel(0.07, 0.5, color, false);
    const dripB = this.panel(0.05, 0.34, color, false);
    dripA.position.set(-0.18, -0.34, 0.02);
    dripB.position.set(0.2, -0.27, 0.02);
    group.add(blot, dripA, dripB);
    return group;
  }

  private createBarbedWire(width: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const wireA = this.panel(width, 0.045, 0x1a0d0f, false);
    const wireB = this.panel(width, 0.045, 0x5a4038, false);
    wireA.rotation.z = 0.08;
    wireB.rotation.z = -0.08;
    group.add(wireA, wireB);

    for (let i = 0; i < 8; i += 1) {
      const barbA = this.triangle(0.14, 0.24, 0x1a0d0f);
      const barbB = this.triangle(0.14, 0.24, 0x1a0d0f);
      barbA.position.set(-width * 0.45 + i * (width / 7), 0.08, 0.03);
      barbB.position.set(-width * 0.45 + i * (width / 7), -0.08, 0.03);
      barbA.rotation.z = -0.78;
      barbB.rotation.z = Math.PI + 0.78;
      group.add(barbA, barbB);
    }

    return group;
  }

  private createAshCloud(index: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const colors = [0x161414, 0x252020, 0x3a302b];

    for (let i = 0; i < 5; i += 1) {
      const puff = this.circle(0.28 + (i % 2) * 0.12, colors[(index + i) % colors.length], false);
      puff.scale.x = 1.35 + (i % 3) * 0.25;
      puff.scale.y = 0.72 + (i % 2) * 0.12;
      puff.position.set(-0.62 + i * 0.3, Math.sin((index + i) * 1.7) * 0.08, 0.02);
      group.add(puff);
    }

    const hatch = this.panel(1.18, 0.035, 0x0a0808, false);
    hatch.position.set(0.04, -0.06, 0.04);
    hatch.rotation.z = -0.18;
    group.add(hatch);
    return group;
  }

  private createVolcanoSilhouette(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const mountain = this.triangle(1.55, 1.75, index % 2 === 0 ? 0x161313 : 0x221918);
    mountain.scale.x = 1.25;
    mountain.position.y = -0.15;
    const crater = this.panel(0.52, 0.14, 0x0a0707, false);
    crater.position.y = 0.62;
    const lavaGlow = this.panel(0.42, 0.08, biome.accentColor, false);
    lavaGlow.position.y = 0.66;
    const sideGlow = this.panel(0.12, 0.75, 0xdf4b21, false);
    sideGlow.position.set(index % 2 === 0 ? -0.22 : 0.22, 0.0, 0.03);
    sideGlow.rotation.z = index % 2 === 0 ? -0.18 : 0.18;
    group.add(mountain, crater, lavaGlow, sideGlow);
    return group;
  }

  private createGlowingCrack(biome: BiomeDefinition, scale: number): THREE.Object3D {
    const group = this.createSpriteGroup(scale);
    const outline = this.panel(1.15, 0.16, 0x120707, false);
    const glow = this.panel(1.0, 0.08, biome.accentColor, false);
    const hotCore = this.panel(0.62, 0.035, 0xffd067, false);
    const branchA = this.panel(0.44, 0.055, biome.accentColor, false);
    const branchB = this.panel(0.34, 0.045, 0xdf4b21, false);
    branchA.position.set(-0.34, 0.16, 0.03);
    branchB.position.set(0.3, -0.14, 0.03);
    branchA.rotation.z = 0.62;
    branchB.rotation.z = -0.58;
    glow.position.z = 0.02;
    hotCore.position.z = 0.04;
    group.add(outline, glow, hotCore, branchA, branchB);
    return group;
  }

  private createEmberRow(biome: BiomeDefinition, width: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const base = this.panel(width, 0.08, 0x130707, false);
    group.add(base);

    for (let i = 0; i < 5; i += 1) {
      const ember = this.circle(0.05 + (i % 2) * 0.025, i % 2 === 0 ? biome.accentColor : 0xffd067, false);
      ember.position.set(-width * 0.42 + i * width * 0.2, 0.08 + Math.sin(i * 1.9) * 0.06, 0.03);
      group.add(ember);
    }

    return group;
  }

  private createBigFlame(biome: BiomeDefinition, scale: number): THREE.Object3D {
    const group = this.createSpriteGroup(scale);
    const outer = this.triangle(0.92, 1.55, 0xff4a1d);
    const middle = this.triangle(0.62, 1.05, biome.accentColor);
    const core = this.triangle(0.34, 0.58, 0xffef7a);
    middle.position.y = -0.14;
    core.position.y = -0.3;
    group.add(outer, middle, core);
    return group;
  }

  private createLavaStream(width: number, height: number, color: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const outline = this.panel(width + 0.12, height + 0.12, 0x180808, false);
    const stream = this.panel(width, height, color, false);
    const highlight = this.panel(width * 0.36, height * 0.92, 0xffd15a, false);
    highlight.position.x = -width * 0.18;
    stream.position.z = 0.01;
    highlight.position.z = 0.02;
    group.add(outline, stream, highlight);

    for (let i = 0; i < 3; i += 1) {
      const drop = this.circle(width * (0.18 + i * 0.04), i % 2 === 0 ? color : 0xffd15a);
      drop.position.set((i - 1) * width * 0.22, -height * 0.45 - i * 0.34, 0.03);
      group.add(drop);
    }

    return group;
  }

  private createBasaltColumn(width: number, height: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const column = this.panel(width, height, 0x171016);
    column.rotation.z = width > 0.9 ? 0.06 : -0.05;
    const cap = this.panel(width * 1.12, 0.16, 0x2b1820);
    cap.position.y = height * 0.5;
    group.add(column, cap);
    return group;
  }

  private createLavaSplash(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const base = this.circle(0.22, biome.accentColor);
    base.scale.x = 1.7;
    group.add(base);

    for (let i = 0; i < 5; i += 1) {
      const drop = this.circle(0.08 + (i % 2) * 0.03, i % 2 === 0 ? 0xff3d16 : 0xffd15a);
      drop.position.set(-0.42 + i * 0.2, 0.16 + Math.abs(i - 2) * 0.12, 0.03);
      group.add(drop);
    }

    return group;
  }

  private createChain(links: number): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < links; i += 1) {
      const link = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.16, 16), this.mat(0x5a3a2d));
      link.scale.x = i % 2 === 0 ? 0.68 : 1;
      link.scale.y = i % 2 === 0 ? 1 : 0.68;
      link.position.y = -i * 0.28;
      group.add(link);
    }

    return group;
  }

  private createDemonSilhouette(): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const head = this.circle(0.38, 0x10060a, false);
    const body = this.triangle(0.88, 1.08, 0x10060a);
    body.position.y = -0.68;

    const hornA = this.triangle(0.3, 0.48, 0x10060a);
    const hornB = this.triangle(0.3, 0.48, 0x10060a);
    hornA.position.set(-0.28, 0.4, 0.02);
    hornB.position.set(0.28, 0.4, 0.02);
    hornA.rotation.z = -0.35;
    hornB.rotation.z = 0.35;

    const eyeA = this.panel(0.1, 0.06, 0xffb238, false);
    const eyeB = this.panel(0.1, 0.06, 0xffb238, false);
    eyeA.position.set(-0.13, 0.04, 0.03);
    eyeB.position.set(0.13, 0.04, 0.03);

    group.add(body, head, hornA, hornB, eyeA, eyeB);
    return group;
  }

  private createLongBone(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const shaft = this.panel(0.86, 0.12, biome.accentColor);
    const endA = this.circle(0.16, biome.accentColor);
    const endB = this.circle(0.16, biome.accentColor);
    endA.position.x = -0.45;
    endB.position.x = 0.45;
    group.add(shaft, endA, endB);
    return group;
  }

  private createDinoRibs(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const spine = this.panel(1.22, 0.12, biome.accentColor);
    spine.rotation.z = -0.05;
    group.add(spine);

    for (let i = 0; i < 5; i += 1) {
      const rib = new THREE.Mesh(
        new THREE.RingGeometry(0.22 + i * 0.025, 0.28 + i * 0.025, 18, 1, 0, Math.PI),
        this.mat(0xf1d99f)
      );
      rib.position.set(-0.48 + i * 0.24, -0.12, 0.02);
      rib.rotation.z = Math.PI;
      rib.scale.y = 1.35;
      group.add(rib);
    }

    return group;
  }

  private createDinoSkull(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const skull = this.circle(0.38, biome.accentColor);
    skull.scale.x = 1.35;
    const jaw = this.panel(0.72, 0.22, biome.accentColor);
    jaw.position.set(0.24, -0.32, 0.01);

    const eye = this.circle(0.08, 0x3a271d, false);
    eye.position.set(-0.1, 0.08, 0.03);
    const toothA = this.triangle(0.12, 0.2, 0xf8e6b5);
    const toothB = this.triangle(0.12, 0.2, 0xf8e6b5);
    toothA.position.set(0.32, -0.48, 0.04);
    toothB.position.set(0.5, -0.48, 0.04);
    toothA.rotation.z = Math.PI;
    toothB.rotation.z = Math.PI;

    group.add(skull, jaw, eye, toothA, toothB);
    return group;
  }

  private createFossilSpiral(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    for (let i = 0; i < 3; i += 1) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.16 + i * 0.12, 0.2 + i * 0.12, 24, 1, 0.35, Math.PI * 1.55),
        this.mat(i === 2 ? biome.accentColor : 0xf6e1ad)
      );
      ring.rotation.z = i * 0.55;
      group.add(ring);
    }
    return group;
  }

  private createCrack(scale: number): THREE.Object3D {
    const group = this.createSpriteGroup(scale);
    const main = this.panel(0.08, 1.1, 0x20140f, false);
    main.rotation.z = 0.2;
    group.add(main);

    for (let i = 0; i < 4; i += 1) {
      const branch = this.panel(0.05, 0.52 - i * 0.06, 0x20140f, false);
      branch.position.set(i % 2 === 0 ? -0.16 : 0.18, -0.35 + i * 0.24, 0.02);
      branch.rotation.z = i % 2 === 0 ? -0.75 : 0.75;
      group.add(branch);
    }

    return group;
  }

  private createEmbeddedFossil(biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1);
    const stonePocket = this.roughPanel(1.05, 0.72, 0x3f2d22, 14);
    const fossil = this.createFossilSpiral(biome);
    fossil.scale.setScalar(0.58);
    fossil.position.z = 0.03;
    const chip = this.triangle(0.22, 0.32, 0x7b5d43);
    chip.position.set(0.34, -0.22, 0.04);
    chip.rotation.z = -0.6;
    group.add(stonePocket, fossil, chip);
    return group;
  }

  private createFlame(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.9 + (index % 3) * 0.12);
    const outer = this.triangle(0.64, 1.12, biome.accentColor);
    const inner = this.triangle(0.34, 0.62, 0xffd45b);
    inner.position.y = -0.18;
    group.add(outer, inner);
    return group;
  }

  private createVolcano(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1.05);
    const mountain = this.triangle(1.22, 1.12, 0x4d2318);
    const lava = this.triangle(0.34, 0.46, biome.accentColor);
    lava.position.y = 0.23;
    group.add(mountain, lava);
    return group;
  }

  private createFossil(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.9);
    const shell = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.42, 22, 1, 0, Math.PI * 1.65), this.mat(biome.accentColor));
    shell.rotation.z = index % 2 === 0 ? 0.4 : -0.3;
    const spine = this.panel(0.7, 0.08, 0xf5dca8);
    spine.rotation.z = 0.45;
    group.add(shell, spine);
    return group;
  }

  private createGem(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.9);
    const diamond = this.triangle(0.72, 0.82, index % 2 === 0 ? biome.accentColor : 0xffd766);
    diamond.rotation.z = Math.PI;
    const shine = this.panel(0.16, 0.44, 0xffffff, false);
    shine.rotation.z = -0.55;
    shine.position.x = -0.08;
    group.add(diamond, shine);
    return group;
  }

  private createBones(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.85);
    const bone = this.panel(0.9, 0.12, biome.accentColor);
    bone.rotation.z = index % 2 === 0 ? 0.55 : -0.55;
    const endA = this.circle(0.14, biome.accentColor);
    const endB = this.circle(0.14, biome.accentColor);
    endA.position.x = -0.44;
    endB.position.x = 0.44;
    bone.add(endA, endB);
    group.add(bone);
    return group;
  }

  private createRoots(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.95);
    for (let i = 0; i < 3; i += 1) {
      const root = this.panel(0.14, 1.0 - i * 0.18, i === 0 ? biome.accentColor : 0x6f3c20);
      root.rotation.z = -0.6 + i * 0.55;
      root.position.x = (i - 1) * 0.18;
      group.add(root);
    }
    return group;
  }

  private createHill(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1.1);
    const hill = this.circle(0.48, 0x6aa548);
    hill.scale.y = 0.54;
    const sun = this.circle(0.18, biome.accentColor, false);
    sun.position.set(0.36, 0.3, 0.01);
    group.add(hill, sun);
    return group;
  }

  private createBuilding(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.95);
    const body = this.panel(0.62, 1.16, biome.padColor);
    for (let i = 0; i < 5; i += 1) {
      const window = this.panel(0.12, 0.1, biome.accentColor, false);
      window.position.set((i % 2 === 0 ? -0.14 : 0.14), -0.34 + i * 0.16, 0.01);
      body.add(window);
    }
    group.add(body);
    return group;
  }

  private createCloud(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.85);
    const a = this.circle(0.32, 0xffffff);
    const b = this.circle(0.42, 0xffffff);
    const c = this.circle(0.3, 0xffffff);
    a.position.x = -0.32;
    c.position.x = 0.34;
    group.add(a, b, c);
    return group;
  }

  private createBird(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.75);
    const wingA = this.triangle(0.38, 0.42, biome.accentColor);
    const wingB = this.triangle(0.38, 0.42, biome.accentColor);
    wingA.rotation.z = -1.25;
    wingB.rotation.z = 1.25;
    wingA.position.x = -0.16;
    wingB.position.x = 0.16;
    group.add(wingA, wingB);
    return group;
  }

  private createPlane(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.9);
    const body = this.panel(0.92, 0.16, 0xf3f6ff);
    const wing = this.triangle(0.48, 0.52, biome.accentColor);
    wing.rotation.z = Math.PI * 0.5;
    wing.position.y = -0.08;
    group.add(body, wing);
    return group;
  }

  private createStar(index: number, biome: BiomeDefinition): THREE.Object3D {
    return this.circle(0.08 + (index % 3) * 0.04, biome.accentColor, false);
  }

  private createPlanet(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.9);
    const planet = this.circle(0.38, index % 2 === 0 ? biome.accentColor : 0x6fd4ff);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.56, 26), this.mat(0xffc5f3));
    ring.scale.y = 0.28;
    ring.rotation.z = -0.22;
    group.add(planet, ring);
    return group;
  }

  private createAlien(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.85);
    const head = this.circle(0.38, biome.accentColor);
    const eyeA = this.circle(0.06, 0x082018, false);
    const eyeB = this.circle(0.06, 0x082018, false);
    eyeA.position.set(-0.12, 0.05, 0.02);
    eyeB.position.set(0.12, 0.05, 0.02);
    head.add(eyeA, eyeB);
    group.add(head);
    return group;
  }

  private createVoidMark(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(1.05);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.34, 24), this.mat(0x202020));
    group.add(ring);
    return group;
  }

  private createWhiteShard(index: number, biome: BiomeDefinition): THREE.Object3D {
    const shard = this.triangle(0.44, 0.92, 0xffffff);
    shard.rotation.z = index % 2 === 0 ? 0.2 : -0.2;
    return shard;
  }

  private createParadise(index: number, biome: BiomeDefinition): THREE.Object3D {
    const group = this.createSpriteGroup(0.95);
    const pillar = this.panel(0.28, 1.0, 0xfff7d7);
    const top = this.panel(0.66, 0.16, biome.accentColor);
    top.position.y = 0.58;
    group.add(pillar, top);
    return group;
  }
}
