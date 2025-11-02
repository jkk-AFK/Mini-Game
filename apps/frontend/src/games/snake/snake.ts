import { GameLoop } from '@game-engine/index';
import type { RuntimeContext, GameRuntime, GameRegistryApi } from '@game-engine/index';

type Direction = 'up' | 'down' | 'left' | 'right';

const GRID_SIZE = 20;
const CELL_SIZE = 24;

function nextPosition(direction: Direction, [x, y]: [number, number]): [number, number] {
  switch (direction) {
    case 'up':
      return [x, y - 1];
    case 'down':
      return [x, y + 1];
    case 'left':
      return [x - 1, y];
    case 'right':
    default:
      return [x + 1, y];
  }
}

class SnakeRuntime implements GameRuntime {
  private loop = new GameLoop((delta) => this.update(delta));
  private context: CanvasRenderingContext2D;
  private snake: [number, number][] = [
    [10, 10],
    [9, 10],
  ];
  private food: [number, number] = [5, 5];
  private direction: Direction = 'right';
  private queuedDirection: Direction = 'right';
  private tickInterval = 150;
  private tickCounter = 0;
  private score = 0;

  constructor(private readonly runtimeContext: RuntimeContext) {
    const ctx = runtimeContext.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    this.context = ctx;
    runtimeContext.canvas.width = GRID_SIZE * CELL_SIZE;
    runtimeContext.canvas.height = GRID_SIZE * CELL_SIZE;
    this.bindInput();
    this.spawnFood();
    this.draw();
  }

  start() {
    this.loop.start();
  }
  pause() {
    this.loop.pause();
  }
  resume() {
    this.loop.start();
  }
  reset() {
    this.snake = [
      [10, 10],
      [9, 10],
    ];
    this.direction = 'right';
    this.queuedDirection = 'right';
    this.score = 0;
    this.runtimeContext.onScoreUpdate(this.score);
    this.spawnFood();
    this.loop.reset();
    this.loop.start();
  }
  dispose() {
    this.loop.dispose();
    window.removeEventListener('keydown', this.handleKey);
  }

  private update(delta: number) {
    this.tickCounter += delta;
    if (this.tickCounter < this.tickInterval) return;
    this.tickCounter = 0;

    this.direction = this.queuedDirection;
    const head = nextPosition(this.direction, this.snake[0]);

    if (head[0] < 0 || head[0] >= GRID_SIZE || head[1] < 0 || head[1] >= GRID_SIZE) {
      return this.gameOver();
    }

    if (this.snake.some((segment) => segment[0] === head[0] && segment[1] === head[1])) {
      return this.gameOver();
    }

    this.snake.unshift(head);

    if (head[0] === this.food[0] && head[1] === this.food[1]) {
      this.score += 10;
      this.runtimeContext.onScoreUpdate(this.score);
      this.spawnFood();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  private draw() {
    this.context.fillStyle = '#020617';
    this.context.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

    this.context.fillStyle = '#22d3ee';
    this.snake.forEach(([x, y], index) => {
      this.context.globalAlpha = index === 0 ? 1 : 0.7;
      this.context.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    this.context.globalAlpha = 1;

    this.context.fillStyle = '#f97316';
    this.context.fillRect(
      this.food[0] * CELL_SIZE,
      this.food[1] * CELL_SIZE,
      CELL_SIZE - 2,
      CELL_SIZE - 2,
    );
  }

  private spawnFood() {
    let position: [number, number];
    do {
      position = [Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE)];
    } while (
      this.snake.some((segment) => segment[0] === position[0] && segment[1] === position[1])
    );
    this.food = position;
  }

  private bindInput() {
    window.addEventListener('keydown', this.handleKey);
  }

  private handleKey = (event: KeyboardEvent) => {
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const next = keyMap[event.key];
    if (!next) return;
    if (this.isOpposite(next)) return;
    this.queuedDirection = next;
  };

  private isOpposite(direction: Direction) {
    return (
      (direction === 'up' && this.direction === 'down') ||
      (direction === 'down' && this.direction === 'up') ||
      (direction === 'left' && this.direction === 'right') ||
      (direction === 'right' && this.direction === 'left')
    );
  }

  private gameOver() {
    this.loop.pause();
    this.runtimeContext.onGameOver(this.score);
  }
}

export function registerSnake(registry: GameRegistryApi) {
  registry.register({
    key: 'snake',
    name: 'Snake',
    description: 'Collect food and avoid collisions to grow your snake.',
    genre: 'Arcade',
    createRuntime: (context: RuntimeContext) => new SnakeRuntime(context),
  });
}
