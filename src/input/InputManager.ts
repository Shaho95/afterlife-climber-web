import { KeyboardInput } from './KeyboardInput';
import { TouchInput } from './TouchInput';
import { clamp } from '../utils/math';

export class InputManager {
  private readonly keyboard = new KeyboardInput();
  private readonly touch: TouchInput;

  constructor(target: HTMLElement) {
    this.touch = new TouchInput(target);
  }

  get horizontal(): number {
    return clamp(this.keyboard.axis + this.touch.axis, -1, 1);
  }

  get isUsingTouch(): boolean {
    return this.touch.isActive;
  }

  showJoystick(): void {
    this.touch.show();
  }

  hideJoystick(): void {
    this.touch.hide();
  }

  dispose(): void {
    this.keyboard.dispose();
    this.touch.dispose();
  }
}
