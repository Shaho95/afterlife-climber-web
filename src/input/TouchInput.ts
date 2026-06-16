import { GAME_CONFIG } from '../config/GameConfig';
import { clamp } from '../utils/math';

export class TouchInput {
  readonly element: HTMLDivElement;
  private readonly knob: HTMLSpanElement;
  private activePointerId: number | null = null;
  private currentAxis = 0;

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

    this.element.addEventListener('pointerdown', this.handlePointerDown);
    this.element.addEventListener('pointermove', this.handlePointerMove);
    this.element.addEventListener('pointerup', this.handlePointerUp);
    this.element.addEventListener('pointercancel', this.handlePointerUp);
  }

  get axis(): number {
    return this.currentAxis;
  }

  get isActive(): boolean {
    return this.activePointerId !== null;
  }

  show(): void {
    this.element.hidden = false;
  }

  hide(): void {
    this.reset();
    this.element.hidden = true;
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerUp);
    this.element.remove();
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      return;
    }

    event.preventDefault();
    this.activePointerId = event.pointerId;
    this.element.setPointerCapture(event.pointerId);
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

  private updateFromPointer(clientX: number): void {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const maxDistance = GAME_CONFIG.player.mobileJoystickMaxDistance;
    const offsetX = clamp(clientX - centerX, -maxDistance, maxDistance);
    const rawAxis = offsetX / maxDistance;
    const deadzone = GAME_CONFIG.player.mobileJoystickDeadzone;
    this.currentAxis = Math.abs(rawAxis) < deadzone ? 0 : rawAxis;
    this.knob.style.transform = `translate(calc(-50% + ${offsetX}px), -50%)`;
  }

  private reset(): void {
    this.activePointerId = null;
    this.currentAxis = 0;
    this.knob.style.transform = 'translate(-50%, -50%)';
  }
}
