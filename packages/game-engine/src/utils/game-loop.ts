export type LoopCallback = (delta: number) => void;

export class GameLoop {
  private animationFrame?: number;
  private lastTimestamp = 0;
  private running = false;

  constructor(private readonly callback: LoopCallback) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick);
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
  }

  reset() {
    this.pause();
    this.lastTimestamp = performance.now();
  }

  dispose() {
    this.pause();
  }

  private tick = (timestamp: number) => {
    if (!this.running) return;
    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.callback(delta);
    this.animationFrame = requestAnimationFrame(this.tick);
  };
}
