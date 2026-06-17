import { GAME_CONFIG } from '../config/GameConfig';
import { clamp } from '../utils/math';

export class TouchInput {
  readonly element: HTMLDivElement;
  private readonly knob: HTMLSpanElement;
  private activePointerId: number | null = null;
  private enabled = false;
  private currentAxis = 0;
  private centerX = 0;

  constructor(private readonly target: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'mobile-joystick';
    this.element.hidden = true;
    this.element.innerHTML = '<span class="mobile-joystick__knob"></span>';
    const knob = this.element.querySelector<HTMLSpanElement>('.mobile-joystick__knob');
    if (!knob) {
      throw new Error('Mobile joystick kunde inte initieras.');
    }
    this.knob = knob;
    (target.parentElement ?? document.body).append(this.element);

    target.addEventListener('pointerdown', this.handlePointerDown);
    target.addEventListener('pointermove', this.handlePointerMove);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointercancel', this.handlePointerUp);
  }

  get axis(): number {
    return this.currentAxis;
  }

  get isActive(): boolean {
    return this.activePointerId !== null;
  }

  show(): void {
    this.enabled = true;
  }

  hide(): void {
    this.enabled = false;
    this.reset();
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.removeEventListener('pointermove', this.handlePointerMove);
    this.target.removeEventListener('pointerup', this.handlePointerUp);
    this.target.removeEventListener('pointercancel', this.handlePointerUp);
    this.element.remove();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (!this.enabled || event.pointerType === 'mouse') {
      return;
    }

    if (!this.isInsideActivationZone(event.clientY)) {
      return;
    }

    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.centerX = event.clientX;
    this.positionJoystick(event.clientX, event.clientY);
    this.target.setPointerCapture(event.pointerId);
    this.updateFromPointer(event.clientX);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    event.preventDefault();
    this.updateFromPointer(event.clientX);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    event.preventDefault();
    this.reset();
  };

  private isInsideActivationZone(clientY: number): boolean {
    const viewportHeight = Math.max(1, window.innerHeight || this.target.getBoundingClientRect().height);
    return clientY / viewportHeight >= GAME_CONFIG.player.mobileJoystickActivationZoneStart;
  }

  private positionJoystick(clientX: number, clientY: number): void {
    const size = this.element.offsetWidth || 104;
    const halfSize = size * 0.5;
    const safeX = clamp(clientX, halfSize + 8, window.innerWidth - halfSize - 8);
    const safeY = clamp(clientY, halfSize + 8, window.innerHeight - halfSize - 8);
    this.centerX = safeX;
    this.element.style.left = `${safeX}px`;
    this.element.style.top = `${safeY}px`;
    this.element.hidden = false;
  }

  private updateFromPointer(clientX: number): void {
    const maxDistance = GAME_CONFIG.player.mobileJoystickMaxDistance;
    const offsetX = clamp(clientX - this.centerX, -maxDistance, maxDistance);
    const rawAxis = offsetX / maxDistance;
    const deadzone = GAME_CONFIG.player.mobileJoystickDeadzone;
    if (Math.abs(rawAxis) < deadzone) {
      this.currentAxis = 0;
    } else {
      const normalized = (Math.abs(rawAxis) - deadzone) / (1 - deadzone);
      const curved = Math.pow(normalized, GAME_CONFIG.player.mobileInputCurve);
      this.currentAxis = clamp(
        Math.sign(rawAxis) * curved * GAME_CONFIG.player.mobileJoystickSensitivity,
        -1,
        1
      );
    }
    this.knob.style.transform = `translate(calc(-50% + ${offsetX}px), -50%)`;
  }

  private reset(): void {
    this.activePointerId = null;
    this.currentAxis = 0;
    this.element.hidden = true;
    this.knob.style.transform = 'translate(-50%, -50%)';
  }
}
