export type UpdateCallback = (deltaSeconds: number, elapsedSeconds: number) => void;

export class GameLoop {
  private frameId = 0;
  private previousTime = 0;
  private elapsed = 0;

  constructor(private readonly onUpdate: UpdateCallback) {}

  start(): void {
    this.stop();
    this.previousTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frameId !== 0) {
      cancelAnimationFrame(this.frameId);
      this.frameId = 0;
    }
  }

  private readonly tick = (time: number): void => {
    const deltaSeconds = Math.min((time - this.previousTime) / 1000, 0.033);
    this.previousTime = time;
    this.elapsed += deltaSeconds;
    this.onUpdate(deltaSeconds, this.elapsed);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
