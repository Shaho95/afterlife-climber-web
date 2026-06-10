export class ProgressionManager {
  private bestHeight = 0;

  recordRun(height: number): void {
    this.bestHeight = Math.max(this.bestHeight, height);
  }

  getBestHeight(): number {
    return this.bestHeight;
  }
}
