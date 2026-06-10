export class KeyboardInput {
  private left = false;
  private right = false;

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  get axis(): number {
    return Number(this.right) - Number(this.left);
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.left = true;
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.right = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      this.left = false;
    }

    if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      this.right = false;
    }
  };
}
