import * as THREE from 'three';
import { GAME_CONFIG } from '../config/GameConfig';
import { Player } from '../player/Player';
import { clamp, damp } from '../utils/math';

export class CameraController {
  private highestY = 0;
  private boostAssistTimer = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly player: Player
  ) {}

  reset(startHeight: number = GAME_CONFIG.world.startingHeight): void {
    this.highestY = startHeight;
    this.boostAssistTimer = 0;
    this.camera.position.set(0, startHeight + GAME_CONFIG.camera.yOffset, GAME_CONFIG.camera.zOffset);
    this.camera.lookAt(0, startHeight + GAME_CONFIG.camera.lookAheadY, 0);
  }

  update(deltaSeconds: number, speedMultiplier = 1): void {
    this.boostAssistTimer = Math.max(0, this.boostAssistTimer - deltaSeconds);
    const speedRatio = clamp(
      (Math.max(1, speedMultiplier) - 1) / Math.max(0.01, GAME_CONFIG.scoring.maxSpeedMultiplier - 1),
      0,
      1
    );
    const cameraPressureMultiplier = 1 + speedRatio * GAME_CONFIG.scoring.cameraPressureSpeedScale;
    const boostFollowMultiplier = this.boostAssistTimer > 0
      ? GAME_CONFIG.padTypes.boostCameraFollowMultiplier
      : 1;
    const cameraFollowMultiplier = (1 + speedRatio * GAME_CONFIG.scoring.cameraSpeedScale) * boostFollowMultiplier;
    const pressureSpeed = Math.min(
      GAME_CONFIG.camera.maxRiseSpeed,
      GAME_CONFIG.camera.baseRiseSpeed + (this.highestY / 100) * GAME_CONFIG.camera.riseSpeedPer100m
    ) * cameraPressureMultiplier;
    const playerY = this.player.mesh.position.y;
    const pressureCapY = playerY + GAME_CONFIG.scoring.cameraMaxLeadY;
    const pressureY = this.highestY < pressureCapY
      ? Math.min(this.highestY + pressureSpeed * deltaSeconds, pressureCapY)
      : this.highestY;
    this.highestY = Math.max(pressureY, playerY);
    const targetX = this.player.mesh.position.x * GAME_CONFIG.camera.xInfluence;
    const targetY = this.highestY + GAME_CONFIG.camera.yOffset;
    const followSmoothing = 7 * cameraFollowMultiplier;

    this.camera.position.x = damp(this.camera.position.x, targetX, followSmoothing, deltaSeconds);
    this.camera.position.y = damp(this.camera.position.y, targetY, followSmoothing, deltaSeconds);
    this.camera.position.z = GAME_CONFIG.camera.zOffset;

    const lookAt = new THREE.Vector3(0, this.highestY + GAME_CONFIG.camera.lookAheadY, 0);
    this.camera.lookAt(lookAt);
  }

  triggerBoostAssist(): void {
    this.boostAssistTimer = GAME_CONFIG.padTypes.boostCameraAssistDuration;
  }

  get failY(): number {
    return this.camera.position.y - GAME_CONFIG.world.failDistanceBelowCamera;
  }
}
