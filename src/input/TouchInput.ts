import { clamp } from '../utils/math';

export class TouchInput {
  private activePointerId: number | null = null;
  private startX = 0;
  private currentAxis = 0;

  constructor(private readonly target: HTMLElement) {
    target.addEventListener('pointerdown', this.handlePointerDown);
    target.addEventListener('pointermove', this.handlePointerMove);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointercancel', this.handlePointerUp);
  }

  get axis(): number {
    return this.currentAxis;
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.handlePointerDown);
    this.target.removeEventListener('pointermove', this.handlePointerMove);
    this.target.removeEventListener('pointerup', this.handlePointerUp);
    this.target.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.activePointerId = event.pointerId;
    this.startX = event.clientX;
    this.currentAxis = 0;
    this.target.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    const dragDistance = event.clientX - this.startX;
    this.currentAxis = clamp(dragDistance / 90, -1, 1);
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.activePointerId = null;
    this.currentAxis = 0;
  };
}
