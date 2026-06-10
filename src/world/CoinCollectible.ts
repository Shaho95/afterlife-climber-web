import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { applyForegroundRenderProfile, RENDER_ORDER } from '../render/RenderLayers';

export class CoinCollectible {
  readonly mesh = new THREE.Group();
  active = false;
  value: number = GAME_CONFIG.coins.coinValue;
  padIndex = -1;
  private phase = 0;

  constructor() {
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffd447, transparent: true, opacity: 0.48, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x1b0d05, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const outerMaterial = new THREE.MeshBasicMaterial({ color: 0xffbd19, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const innerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff74, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x9a4b0b, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const shineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffd6, side: THREE.DoubleSide, depthTest: false, depthWrite: false });

    const glow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 28), glowMaterial);
    const outline = new THREE.Mesh(new THREE.CircleGeometry(0.265, 28), outlineMaterial);
    const outer = new THREE.Mesh(new THREE.CircleGeometry(0.225, 28), outerMaterial);
    const inner = new THREE.Mesh(new THREE.CircleGeometry(0.155, 24), innerMaterial);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.23), stripeMaterial);
    const shine = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.16), shineMaterial);
    const shineCap = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.026), shineMaterial);
    for (const disc of [glow, outline, outer, inner]) {
      disc.scale.x = 0.72;
    }
    stripe.position.set(0.03, 0, 0.04);
    stripe.rotation.z = 0.04;
    shine.position.set(-0.07, 0.045, 0.05);
    shine.rotation.z = -0.18;
    shineCap.position.set(-0.03, 0.12, 0.06);
    shineCap.rotation.z = -0.08;

    this.mesh.add(glow, outline, outer, inner, stripe, shine, shineCap);
    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PICKUP);
    this.mesh.visible = false;
  }

  spawn(padIndex: number, x: number, y: number, value: number): void {
    this.active = true;
    this.value = value;
    this.padIndex = padIndex;
    this.phase = padIndex * 0.41;
    this.mesh.visible = true;
    this.mesh.position.set(x, y, 1.1);
    this.mesh.scale.setScalar(1);
    applyForegroundRenderProfile(this.mesh, RENDER_ORDER.PICKUP);
  }

  update(deltaSeconds: number): void {
    if (!this.active) {
      return;
    }

    this.phase += deltaSeconds * 5.6;
    const pulse = 1 + Math.sin(this.phase * 1.4) * 0.07;
    const flip = 0.78 + Math.abs(Math.cos(this.phase)) * 0.22;
    this.mesh.scale.set(pulse * flip, pulse, 1);
    this.mesh.rotation.z = Math.sin(this.phase * 0.55) * 0.07;
  }

  collect(): number {
    if (!this.active) {
      return 0;
    }

    const value = this.value;
    this.deactivate();
    return value;
  }

  deactivate(): void {
    this.active = false;
    this.padIndex = -1;
    this.mesh.visible = false;
  }
}
