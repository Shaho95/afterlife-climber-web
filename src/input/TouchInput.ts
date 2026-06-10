import { clamp } from '../utils/math';

export class TouchInput {
  private activePointerId: number | null = null;
  private normalizedX: number | null = null;

  constructor(private readonly target: HTMLElement) {
    target.addEventListener('pointerdown', this.handlePointerDown);
    target.addEventListener('pointermove', this.handlePointerMove);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointercancel', this.handlePointerUp);
  }

  get axis(): number {
    return 0;
  }

  get isActive(): boolean {
    return this.activePointerId !== null && this.normalizedX !== null;
  }

  get directNormalizedX(): number | null {
    return this.normalizedX;
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.removeEventListener('pointermove', this.handlePointerMove);
    this.target.removeEventListener('pointerup', this.handlePointerUp);
    this.target.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') {
      return;
    }

    this.activePointerId = event.pointerId;
    this.normalizedX = this.normalizeClientX(event.clientX);
    this.target.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.normalizedX = this.normalizeClientX(event.clientX);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.activePointerId = null;
    this.normalizedX = null;
  };

  private normalizeClientX(clientX: number): number {
    const rect = this.target.getBoundingClientRect();
    if (rect.width <= 0) {
      return 0.5;
    }

    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }
}
