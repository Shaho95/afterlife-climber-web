import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { PadTheme } from '../config/BiomeThemeConfig';
import { applyForegroundRenderProfile, RENDER_ORDER } from '../render/RenderLayers';

export enum PadType {
  NORMAL = 'normal',
  FRAGILE = 'fragile',
  MOVING = 'moving',
  BOOST = 'boost',
  CURSED = 'cursed'
}

export interface PadState {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  index: number;
  fragile: boolean;
  maxTouches: number;
  type: PadType;
}

export class Pad {
  readonly mesh: THREE.Group;
  state: PadState;
  remainingTouches: number = GAME_CONFIG.padDurability.normalPadTouches;
  private fadeTimer = 0;
  private pulseTimer = 0;
  private active = true;
  private readonly crackMarks: THREE.Mesh[] = [];
  private readonly movingMarks: THREE.Mesh[] = [];
  private readonly boostMarks: THREE.Mesh[] = [];
  private readonly cursedMarks: THREE.Mesh[] = [];

  constructor(material: THREE.MeshBasicMaterial) {
    this.state = {
      x: 0,
      y: 0,
      width: GAME_CONFIG.pads.width,
      height: GAME_CONFIG.pads.height,
      depth: GAME_CONFIG.pads.depth,
      index: 0,
      fragile: false,
      maxTouches: GAME_CONFIG.padDurability.normalPadTouches,
      type: PadType.NORMAL
    };

    this.mesh = new THREE.Group();

    const readabilityBackplate = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.pads.width * 1.56, GAME_CONFIG.pads.height * 1.95),
      new THREE.MeshBasicMaterial({
        color: 0x050203,
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    readabilityBackplate.userData.padPart = 'readabilityBackplate';
    readabilityBackplate.position.set(0, -GAME_CONFIG.pads.height * 0.08, -0.11);

    const readabilityGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.pads.width * 1.42, GAME_CONFIG.pads.height * 1.12),
      new THREE.MeshBasicMaterial({
        color: 0xffd16a,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    readabilityGlow.userData.padPart = 'readabilityGlow';
    readabilityGlow.position.set(0, 0, -0.1);

    const plate = this.createRustedPlate(
      GAME_CONFIG.pads.width + 0.18,
      GAME_CONFIG.pads.height + 0.12,
      0x2a1412
    );
    plate.position.z = -0.02;

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.pads.width * 0.92, GAME_CONFIG.pads.height * 0.78),
      new THREE.MeshBasicMaterial({ color: 0x170809, side: THREE.DoubleSide })
    );
    shadow.userData.padPart = 'shadow';
    shadow.position.set(0.04, -GAME_CONFIG.pads.height * 0.82, -0.06);

    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(GAME_CONFIG.pads.width * 1.04, GAME_CONFIG.pads.height * 0.74),
      material
    );
    top.userData.padPart = 'top';
    top.position.z = 0.03;
    top.rotation.z = -0.018;

    const darkLip = this.panel(GAME_CONFIG.pads.width * 0.94, GAME_CONFIG.pads.height * 0.16, 0x160809);
    darkLip.userData.padPart = 'lip';
    darkLip.position.set(0, -GAME_CONFIG.pads.height * 0.38, 0.04);

    const highlight = this.panel(GAME_CONFIG.pads.width * 0.72, GAME_CONFIG.pads.height * 0.08, 0x74432d);
    highlight.userData.padPart = 'highlight';
    highlight.position.set(-GAME_CONFIG.pads.width * 0.06, GAME_CONFIG.pads.height * 0.25, 0.05);
    highlight.rotation.z = 0.015;

    this.mesh.add(readabilityBackplate, readabilityGlow, shadow, plate, top, darkLip, highlight);

    for (let i = 0; i < 5; i += 1) {
      const bolt = this.createBolt(i);
      bolt.position.set(-GAME_CONFIG.pads.width * 0.43 + i * GAME_CONFIG.pads.width * 0.215, i % 2 === 0 ? 0.11 : -0.08, 0.08);
      this.mesh.add(bolt);
    }

    for (let i = 0; i < 4; i += 1) {
      const scratch = this.panel(0.24 + i * 0.04, 0.035, i % 2 === 0 ? 0x0d0506 : 0x915139);
      scratch.userData.padPart = i % 2 === 0 ? 'scratchDark' : 'scratchAccent';
      scratch.position.set(-0.55 + i * 0.36, i % 2 === 0 ? 0.01 : -0.14, 0.09);
      scratch.rotation.z = -0.45 + i * 0.22;
      this.mesh.add(scratch);
    }

    for (let i = 0; i < 3; i += 1) {
      const crack = this.panel(0.32 - i * 0.04, 0.035, 0x050203);
      crack.userData.padPart = 'crack';
      crack.position.set(-0.32 + i * 0.31, i % 2 === 0 ? 0.02 : -0.09, 0.12);
      crack.rotation.z = -0.72 + i * 0.58;
      crack.visible = false;
      this.crackMarks.push(crack);
      this.mesh.add(crack);
    }

    const moveLeft = this.createChevron(0x8bd7ff);
    moveLeft.userData.padPart = 'movingMark';
    moveLeft.position.set(-0.36, 0.02, 0.14);
    moveLeft.rotation.z = Math.PI;
    const moveRight = this.createChevron(0x8bd7ff);
    moveRight.userData.padPart = 'movingMark';
    moveRight.position.set(0.36, 0.02, 0.14);
    this.movingMarks.push(moveLeft, moveRight);
    this.mesh.add(moveLeft, moveRight);

    for (let i = 0; i < 3; i += 1) {
      const arrow = this.createBoostArrow();
      arrow.userData.padPart = 'boostMark';
      arrow.position.set(-0.24 + i * 0.24, 0.0, 0.15);
      this.boostMarks.push(arrow);
      this.mesh.add(arrow);
    }

    const cursedAura = new THREE.Mesh(
      new THREE.CircleGeometry(0.64, 24),
      new THREE.MeshBasicMaterial({ color: 0x7a174f, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false })
    );
    cursedAura.userData.padPart = 'cursedAura';
    cursedAura.scale.y = 0.34;
    cursedAura.position.z = -0.01;
    const cursedEye = this.panel(0.38, 0.08, 0xff336f);
    cursedEye.userData.padPart = 'cursedEye';
    cursedEye.position.set(0, 0.02, 0.16);
    this.cursedMarks.push(cursedAura, cursedEye);
    this.mesh.add(cursedAura, cursedEye);
    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PAD);
  }

  setState(state: PadState): void {
    this.state = state;
    this.remainingTouches = state.maxTouches;
    this.active = true;
    this.fadeTimer = 0;
    this.pulseTimer = 0;
    this.mesh.visible = true;
    this.mesh.scale.set(1, 1, 1);
    this.setWearVisuals();
    this.setTypeVisuals();
    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PAD);
    this.mesh.position.set(state.x, state.y, 0);
  }

  setVisualOffset(offsetX: number): void {
    if (!this.active && this.fadeTimer <= 0) {
      return;
    }

    this.mesh.position.x = this.state.x + offsetX;
  }

  update(deltaSeconds: number): void {
    this.pulseTimer = Math.max(0, this.pulseTimer - deltaSeconds);

    if (this.fadeTimer <= 0 && this.pulseTimer <= 0) {
      return;
    }

    if (this.fadeTimer > 0) {
      this.fadeTimer = Math.max(0, this.fadeTimer - deltaSeconds);
    }

    const fadeScale = this.fadeTimer > 0
      ? 0.72 + (this.fadeTimer / GAME_CONFIG.padDurability.padFadeDuration) * 0.28
      : 1;
    const pulseProgress = this.pulseTimer > 0
      ? this.pulseTimer / GAME_CONFIG.padTypes.boostPulseDuration
      : 0;
    const pulseScale = 1 + Math.sin(pulseProgress * Math.PI) * (GAME_CONFIG.padTypes.boostPulseScale - 1);
    this.mesh.scale.set(fadeScale * pulseScale, fadeScale * pulseScale, 1);

    if (!this.active && this.fadeTimer <= 0) {
      this.mesh.visible = false;
    }
  }

  get topY(): number {
    return this.state.y + this.state.height * 0.5;
  }

  containsX(x: number, halfWidth: number, difficulty = 0): boolean {
    if (!this.canLand) {
      return false;
    }

    const visualHalfPad =
      this.state.width * GAME_CONFIG.pads.landingWidthMultiplier * 0.5 +
      GAME_CONFIG.pads.landingForgivenessMargin;
    const speedPenalty = Math.min(0.08, difficulty * 0.04);
    const halfPad = Math.max(this.state.width * 0.5, visualHalfPad - speedPenalty);
    return x + halfWidth > this.mesh.position.x - halfPad && x - halfWidth < this.mesh.position.x + halfPad;
  }

  consumeTouch(): boolean {
    if (!this.canLand) {
      return false;
    }

    this.remainingTouches = Math.max(0, this.remainingTouches - 1);
    if (this.state.type === PadType.BOOST) {
      this.pulseTimer = GAME_CONFIG.padTypes.boostPulseDuration;
    }
    this.setWearVisuals();
    this.setTypeVisuals();

    if (this.remainingTouches <= 0) {
      this.active = false;
      this.fadeTimer = GAME_CONFIG.padDurability.padFadeDuration;
    }

    return true;
  }

  get canLand(): boolean {
    return this.active && this.remainingTouches > 0;
  }

  applyTheme(theme: PadTheme): void {
    this.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      const material = object.material;
      if (!(material instanceof THREE.MeshBasicMaterial)) {
        return;
      }

      switch (object.userData.padPart) {
        case 'plate':
          material.color.setHex(theme.plateColor);
          break;
        case 'top':
          material.color.setHex(theme.topColor);
          break;
        case 'lip':
          material.color.setHex(theme.lipColor);
          break;
        case 'rust':
        case 'scratchAccent':
          material.color.setHex(theme.rustColor);
          break;
        case 'bolt':
          material.color.setHex(theme.boltColor);
          break;
        case 'highlight':
          material.color.setHex(theme.highlightColor);
          break;
        case 'scratchDark':
          material.color.setHex(theme.lipColor);
          break;
        case 'readabilityGlow':
          material.color.setHex(theme.boltColor);
          material.opacity = 0.3;
          break;
        case 'readabilityBackplate':
          material.color.setHex(0x050203);
          material.opacity = 0.7;
          break;
        case 'crack':
          material.color.setHex(theme.crackColor ?? 0x050203);
          break;
        case 'movingMark':
          material.color.setHex(theme.movingMarkColor ?? theme.highlightColor);
          break;
        case 'boostMark':
          material.color.setHex(theme.boostMarkColor ?? theme.boltColor);
          break;
        case 'cursedAura':
          material.color.setHex(theme.cursedAuraColor ?? 0x7a174f);
          break;
        case 'cursedEye':
          material.color.setHex(theme.cursedEyeColor ?? 0xff336f);
          break;
      }
    });
    this.setWearVisuals();
    this.setTypeVisuals();
    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PAD);
  }

  private setWearVisuals(): void {
    const worn = this.state.fragile || this.remainingTouches <= GAME_CONFIG.padDurability.padCrackVisualThreshold;
    for (const crack of this.crackMarks) {
      crack.visible = worn;
    }

    this.mesh.rotation.z = this.state.fragile ? -0.045 : 0;
  }

  private setTypeVisuals(): void {
    const isMoving = this.state.type === PadType.MOVING;
    const isBoost = this.state.type === PadType.BOOST;
    const isCursed = this.state.type === PadType.CURSED;
    for (const mark of this.movingMarks) {
      mark.visible = isMoving;
    }
    for (const mark of this.boostMarks) {
      mark.visible = isBoost;
    }
    for (const mark of this.cursedMarks) {
      mark.visible = isCursed;
    }

    if (isCursed) {
      this.mesh.rotation.z = -0.02;
    }
  }

  private createChevron(color: number): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(-0.12, -0.12);
    shape.lineTo(0.08, 0);
    shape.lineTo(-0.12, 0.12);
    shape.lineTo(-0.06, 0);
    shape.closePath();
    return new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
  }

  private createBoostArrow(): THREE.Mesh {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.18);
    shape.lineTo(0.13, -0.02);
    shape.lineTo(0.05, -0.02);
    shape.lineTo(0.05, -0.18);
    shape.lineTo(-0.05, -0.18);
    shape.lineTo(-0.05, -0.02);
    shape.lineTo(-0.13, -0.02);
    shape.closePath();
    return new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: 0xffe86a, side: THREE.DoubleSide })
    );
  }

  private createRoughShape(width: number, height: number): THREE.Shape {
    const shape = new THREE.Shape();
    const points = [
      [-0.5, 0.38],
      [-0.39, 0.52],
      [-0.12, 0.47],
      [0.16, 0.53],
      [0.47, 0.42],
      [0.52, 0.04],
      [0.45, -0.44],
      [0.12, -0.5],
      [-0.18, -0.44],
      [-0.49, -0.52],
      [-0.54, -0.08]
    ];

    shape.moveTo(points[0][0] * width, points[0][1] * height);
    for (const point of points.slice(1)) {
      shape.lineTo(point[0] * width, point[1] * height);
    }
    shape.closePath();
    return shape;
  }

  private createRustedPlate(width: number, height: number, color: number): THREE.Group {
    const group = new THREE.Group();
    const shape = this.createRoughShape(width, height);

    const outline = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color: 0x090405, side: THREE.DoubleSide })
    );
    outline.scale.set(1.12, 1.2, 1);
    outline.position.z = -0.02;

    const fill = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
    fill.userData.padPart = 'plate';

    const rustA = this.panel(width * 0.34, height * 0.18, 0x6b2e1e);
    rustA.userData.padPart = 'rust';
    rustA.position.set(-width * 0.22, height * 0.14, 0.03);
    rustA.rotation.z = -0.18;

    const rustB = this.panel(width * 0.22, height * 0.14, 0x8f4a2b);
    rustB.userData.padPart = 'rust';
    rustB.position.set(width * 0.24, -height * 0.16, 0.03);
    rustB.rotation.z = 0.22;

    group.add(outline, fill, rustA, rustB);
    return group;
  }

  private panel(width: number, height: number, color: number): THREE.Mesh {
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
  }

  private createBolt(index: number): THREE.Group {
    const group = new THREE.Group();
    const outline = new THREE.Mesh(
      new THREE.CircleGeometry(0.075, 14),
      new THREE.MeshBasicMaterial({ color: 0x080303, side: THREE.DoubleSide })
    );
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(0.052, 14),
      new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? 0x8c5a35 : 0x4e3329, side: THREE.DoubleSide })
    );
    fill.userData.padPart = 'bolt';
    fill.position.z = 0.01;
    group.add(outline, fill);
    return group;
  }
}
