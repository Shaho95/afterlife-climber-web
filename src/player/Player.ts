import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { SkinVisual } from '../config/SkinConfig';
import { applyForegroundRenderProfile, RENDER_ORDER } from '../render/RenderLayers';
import { clamp } from '../utils/math';

export class Player {
  readonly mesh: THREE.Group;
  readonly velocity = new THREE.Vector3();
  private readonly body: THREE.Mesh;

  constructor() {
    this.mesh = new THREE.Group();
    this.mesh.renderOrder = RENDER_ORDER.PLAYER;

    const bodyShape = this.createRoundedBlockShape(GAME_CONFIG.player.width, GAME_CONFIG.player.height, 0.08);
    const bodyOutline = new THREE.Mesh(
      new THREE.ShapeGeometry(bodyShape),
      new THREE.MeshBasicMaterial({ color: 0x16080a, side: THREE.DoubleSide, depthTest: false })
    );
    bodyOutline.scale.set(1.12, 1.08, 1);
    bodyOutline.position.set(0, GAME_CONFIG.player.height * 0.5, 0.31);
    bodyOutline.renderOrder = 2;

    this.body = new THREE.Mesh(
      new THREE.ShapeGeometry(bodyShape),
      new THREE.MeshBasicMaterial({ color: 0xffe8bd, side: THREE.DoubleSide, depthTest: false })
    );
    this.body.castShadow = false;
    this.body.position.set(0, GAME_CONFIG.player.height * 0.5, 0.34);
    this.body.renderOrder = 3;
    this.mesh.add(bodyOutline, this.body);

    const bodyFront = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 0.68),
      new THREE.MeshBasicMaterial({ color: 0xfff4d6, depthTest: false, side: THREE.DoubleSide })
    );
    bodyFront.position.set(0, GAME_CONFIG.player.height * 0.52, 0.37);
    bodyFront.renderOrder = 4;
    this.mesh.add(bodyFront);

    const scarf = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x4b1713, depthTest: false, side: THREE.DoubleSide })
    );
    scarf.position.set(-0.02, GAME_CONFIG.player.height * 0.9, 0.39);
    scarf.rotation.z = -0.08;
    scarf.renderOrder = 5;
    this.mesh.add(scarf);

    const headShape = this.createRoundedBlockShape(0.58, 0.46, 0.07);
    const headOutline = new THREE.Mesh(
      new THREE.ShapeGeometry(headShape),
      new THREE.MeshBasicMaterial({ color: 0x16080a, side: THREE.DoubleSide, depthTest: false })
    );
    headOutline.scale.set(1.12, 1.12, 1);
    headOutline.position.set(0, GAME_CONFIG.player.height + 0.28, 0.37);
    headOutline.renderOrder = 6;

    const head = new THREE.Mesh(
      new THREE.ShapeGeometry(headShape),
      new THREE.MeshBasicMaterial({ color: 0xffcf95, side: THREE.DoubleSide, depthTest: false })
    );
    head.position.set(0, GAME_CONFIG.player.height + 0.28, 0.4);
    head.renderOrder = 7;
    this.mesh.add(headOutline, head);

    const faceFront = new THREE.Mesh(
      new THREE.PlaneGeometry(0.42, 0.24),
      new THREE.MeshBasicMaterial({ color: 0xffddb2, depthTest: false, side: THREE.DoubleSide })
    );
    faceFront.position.set(0, GAME_CONFIG.player.height + 0.26, 0.43);
    faceFront.renderOrder = 8;
    this.mesh.add(faceFront);

    const visor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.34, 0.07),
      new THREE.MeshBasicMaterial({ color: 0x1d1014, depthTest: false, side: THREE.DoubleSide })
    );
    visor.position.set(0, GAME_CONFIG.player.height + 0.31, 0.45);
    visor.renderOrder = 9;
    this.mesh.add(visor);

    const expressionMaterial = new THREE.MeshBasicMaterial({ color: 0x12090a, depthTest: false, side: THREE.DoubleSide });
    const eyeLeft = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), expressionMaterial);
    const eyeRight = new THREE.Mesh(new THREE.CircleGeometry(0.025, 10), expressionMaterial);
    eyeLeft.position.set(-0.095, GAME_CONFIG.player.height + 0.32, 0.47);
    eyeRight.position.set(0.095, GAME_CONFIG.player.height + 0.32, 0.47);
    eyeLeft.renderOrder = 12;
    eyeRight.renderOrder = 12;
    const mouth = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.025), expressionMaterial);
    mouth.position.set(0, GAME_CONFIG.player.height + 0.22, 0.47);
    mouth.renderOrder = 12;
    this.mesh.add(eyeLeft, eyeRight, mouth);

    const eyeShine = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 0.025),
      new THREE.MeshBasicMaterial({ color: 0xfff0c6, depthTest: false, side: THREE.DoubleSide })
    );
    eyeShine.position.set(-0.08, GAME_CONFIG.player.height + 0.325, 0.46);
    eyeShine.renderOrder = 10;
    this.mesh.add(eyeShine);

    const heartMark = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.18),
      new THREE.MeshBasicMaterial({ color: 0xffb238, depthTest: false, side: THREE.DoubleSide })
    );
    heartMark.position.set(0, 0.72, 0.42);
    heartMark.renderOrder = 11;
    this.mesh.add(heartMark);

    const armMaterial = new THREE.MeshBasicMaterial({ color: 0x1b0a0b, depthTest: false, side: THREE.DoubleSide });
    const armLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.42), armMaterial);
    const armRight = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.42), armMaterial);
    armLeft.position.set(-0.42, 0.62, 0.33);
    armRight.position.set(0.42, 0.62, 0.33);
    armLeft.rotation.z = -0.16;
    armRight.rotation.z = 0.16;
    armLeft.renderOrder = 1;
    armRight.renderOrder = 1;
    this.mesh.add(armLeft, armRight);

    const footMaterial = new THREE.MeshBasicMaterial({ color: 0x1b0a0b, depthTest: false, side: THREE.DoubleSide });
    const footLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), footMaterial);
    const footRight = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), footMaterial);
    footLeft.position.set(-0.18, 0.03, 0.36);
    footRight.position.set(0.18, 0.03, 0.36);
    footLeft.renderOrder = 2;
    footRight.renderOrder = 2;
    this.mesh.add(footLeft, footRight);
    this.ensureVisible();
  }

  reset(): void {
    this.mesh.position.set(0, 0.55, 0.45);
    this.velocity.set(0, GAME_CONFIG.player.bounceVelocity, 0);
  }

  integrate(deltaSeconds: number): void {
    this.velocity.y += GAME_CONFIG.player.gravity * deltaSeconds;
    this.mesh.position.addScaledVector(this.velocity, deltaSeconds);
    this.mesh.position.x = clamp(this.mesh.position.x, GAME_CONFIG.world.minX, GAME_CONFIG.world.maxX);
    this.body.rotation.z = -this.velocity.x * 0.025;
  }

  integrateVertical(deltaSeconds: number): void {
    this.velocity.y += GAME_CONFIG.player.gravity * deltaSeconds;
    this.mesh.position.y += this.velocity.y * deltaSeconds;
    this.mesh.position.x = clamp(this.mesh.position.x, GAME_CONFIG.world.minX, GAME_CONFIG.world.maxX);
    this.body.rotation.z = 0;
  }

  bounce(velocity: number): void {
    this.velocity.y = velocity;
  }

  applySkinVisual(visual: SkinVisual): void {
    this.mesh.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !(object.material instanceof THREE.MeshBasicMaterial)) {
        return;
      }

      switch (object.renderOrder) {
        case 1:
        case 2:
        case 6:
          object.material.color.setHex(visual.outline);
          break;
        case 3:
          object.material.color.setHex(visual.body);
          break;
        case 4:
          object.material.color.setHex(visual.bodyLight);
          break;
        case 5:
          object.material.color.setHex(visual.scarf);
          break;
        case 7:
          object.material.color.setHex(visual.head);
          break;
        case 8:
          object.material.color.setHex(visual.face);
          break;
        case 9:
          object.material.color.setHex(visual.visor);
          break;
        case 10:
          object.material.color.setHex(visual.shine);
          break;
        case 11:
          object.material.color.setHex(visual.accent);
          break;
      }
    });
    this.ensureVisible();
  }

  ensureVisible(): void {
    this.mesh.visible = true;
    this.mesh.renderOrder = RENDER_ORDER.PLAYER;
    if (
      !Number.isFinite(this.mesh.scale.x) ||
      !Number.isFinite(this.mesh.scale.y) ||
      this.mesh.scale.x <= 0.01 ||
      this.mesh.scale.y <= 0.01
    ) {
      this.mesh.scale.set(1, 1, 1);
    }
    if (!Number.isFinite(this.mesh.position.z) || Math.abs(this.mesh.position.z - 0.45) > 0.001) {
      this.mesh.position.z = 0.45;
    }

    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PLAYER, true);
  }

  get feetY(): number {
    return this.mesh.position.y;
  }

  get previousFeetY(): number {
    return this.mesh.position.y - this.velocity.y / 60;
  }

  get halfWidth(): number {
    return GAME_CONFIG.player.width * 0.5;
  }

  private createRoundedBlockShape(width: number, height: number, radius: number): THREE.Shape {
    const x = width * -0.5;
    const y = height * -0.5;
    const shape = new THREE.Shape();

    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    return shape;
  }
}
