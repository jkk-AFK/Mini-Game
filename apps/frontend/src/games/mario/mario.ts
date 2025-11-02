import { GameLoop } from '@game-engine/index';
import type { RuntimeContext, GameRuntime, GameRegistryApi } from '@game-engine/index';

interface Vector {
  x: number;
  y: number;
}

const GRAVITY = 0.0015;
const SPEED = 0.2;
const JUMP_FORCE = 0.5;
const FLOOR_Y = 220;

const OBSTACLES: { x: number; width: number; height: number }[] = [
  { x: 200, width: 50, height: 40 },
  { x: 360, width: 60, height: 60 },
  { x: 520, width: 40, height: 30 },
];

class MarioRuntime implements GameRuntime {
  private loop = new GameLoop((delta) => this.update(delta));
  private context: CanvasRenderingContext2D;
  private position: Vector = { x: 40, y: FLOOR_Y };
  private velocity: Vector = { x: 0, y: 0 };
  private isGrounded = true;
  private score = 0;
  private keys: Record<string, boolean> = {};
  private goalX = 700;
  private running = false;
  private startTime = 0;

  constructor(private readonly runtimeContext: RuntimeContext) {
    const ctx = runtimeContext.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    this.context = ctx;
    runtimeContext.canvas.width = 800;
    runtimeContext.canvas.height = 300;
    this.bindInput();
    this.draw();
  }

  start() {
    this.running = true;
    this.startTime = performance.now();
    this.loop.start();
  }

  pause() {
    this.running = false;
    this.loop.pause();
  }

  resume() {
    this.running = true;
    this.loop.start();
  }

  reset() {
    this.position = { x: 40, y: FLOOR_Y };
    this.velocity = { x: 0, y: 0 };
    this.isGrounded = true;
    this.score = 0;
    this.runtimeContext.onScoreUpdate(this.score);
    this.startTime = performance.now();
    this.loop.reset();
    this.loop.start();
  }

  dispose() {
    this.loop.dispose();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private bindInput() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    this.keys[event.key] = true;
    if (event.key === ' ' && this.isGrounded) {
      this.velocity.y = -JUMP_FORCE;
      this.isGrounded = false;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys[event.key] = false;
  };

  private update(delta: number) {
    const acceleration = delta;
    if (this.keys['ArrowRight']) {
      this.velocity.x = SPEED;
    } else if (this.keys['ArrowLeft']) {
      this.velocity.x = -SPEED;
    } else {
      this.velocity.x = 0;
    }

    this.velocity.y += GRAVITY * acceleration;
    this.position.x += this.velocity.x * acceleration;
    this.position.y += this.velocity.y * acceleration;

    if (this.position.y >= FLOOR_Y) {
      this.position.y = FLOOR_Y;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    this.resolveCollisions();

    if (this.position.x >= this.goalX) {
      const timeTaken = Math.max(1, (performance.now() - this.startTime) / 1000);
      this.score = Math.floor(10000 / timeTaken);
      this.runtimeContext.onScoreUpdate(this.score);
      this.runtimeContext.onGameOver(this.score);
      this.pause();
    }

    this.draw();
  }

  private resolveCollisions() {
    OBSTACLES.forEach((obstacle) => {
      const withinX =
        this.position.x + 24 > obstacle.x && this.position.x < obstacle.x + obstacle.width;
      const withinY = this.position.y >= FLOOR_Y - obstacle.height;
      if (withinX && withinY) {
        if (this.velocity.y > 0) {
          this.position.y = FLOOR_Y - obstacle.height;
          this.velocity.y = 0;
          this.isGrounded = true;
        }
      }
    });
  }

  private draw() {
    this.context.fillStyle = '#0f172a';
    this.context.fillRect(0, 0, 800, 300);

    this.context.fillStyle = '#1e293b';
    this.context.fillRect(0, FLOOR_Y + 24, 800, 300 - FLOOR_Y);

    this.context.fillStyle = '#38bdf8';
    this.context.fillRect(this.position.x, this.position.y - 24, 20, 24);

    this.context.fillStyle = '#f97316';
    OBSTACLES.forEach((obstacle) => {
      this.context.fillRect(
        obstacle.x,
        FLOOR_Y + 24 - obstacle.height,
        obstacle.width,
        obstacle.height,
      );
    });

    this.context.fillStyle = '#22c55e';
    this.context.fillRect(this.goalX, FLOOR_Y - 40, 20, 40);
  }
}

export function registerMario(registry: GameRegistryApi) {
  registry.register({
    key: 'mario',
    name: 'Pixel Runner',
    description: 'Dash through obstacles and reach the castle flag.',
    genre: 'Platformer',
    createRuntime: (context: RuntimeContext) => new MarioRuntime(context),
  });
}
