import type { RuntimeContext, GameRuntime, GameRegistryApi } from '@game-engine/index';

const SIZE = 3;
const CELL_SIZE = 120;

class TicTacToeRuntime implements GameRuntime {
  private context: CanvasRenderingContext2D;
  private board: ('X' | 'O' | null)[][] = Array.from({ length: SIZE }, () =>
    Array(SIZE).fill(null),
  );
  private current: 'X' | 'O' = 'X';
  private running = false;

  constructor(private readonly runtimeContext: RuntimeContext) {
    const ctx = runtimeContext.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');
    this.context = ctx;
    runtimeContext.canvas.width = SIZE * CELL_SIZE;
    runtimeContext.canvas.height = SIZE * CELL_SIZE;
    runtimeContext.canvas.addEventListener('click', this.handleClick);
    this.draw();
  }

  start() {
    this.running = true;
  }
  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
  }
  reset() {
    this.board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
    this.current = 'X';
    this.running = true;
    this.draw();
  }
  dispose() {
    this.runtimeContext.canvas.removeEventListener('click', this.handleClick);
  }

  private handleClick = (event: MouseEvent) => {
    if (!this.running) return;
    const rect = this.runtimeContext.canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * SIZE);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * SIZE);
    if (this.board[y][x]) return;
    this.board[y][x] = this.current;
    if (this.checkWin()) {
      this.runtimeContext.onScoreUpdate(this.current === 'X' ? 1 : 0);
      this.runtimeContext.onGameOver(this.current === 'X' ? 1 : 0);
      this.running = false;
    } else if (this.board.every((row) => row.every(Boolean))) {
      this.runtimeContext.onGameOver(0);
      this.running = false;
    } else {
      this.current = this.current === 'X' ? 'O' : 'X';
    }
    this.draw();
  };

  private checkWin() {
    const lines = [
      ...this.board,
      ...Array.from({ length: SIZE }, (_, col) => this.board.map((row) => row[col])),
      this.board.map((_, i) => this.board[i][i]),
      this.board.map((_, i) => this.board[i][SIZE - 1 - i]),
    ];
    return lines.some((line) => line.every((cell) => cell === this.current));
  }

  private draw() {
    this.context.fillStyle = '#020617';
    this.context.fillRect(0, 0, SIZE * CELL_SIZE, SIZE * CELL_SIZE);
    this.context.strokeStyle = '#334155';
    this.context.lineWidth = 4;
    for (let i = 1; i < SIZE; i += 1) {
      this.context.beginPath();
      this.context.moveTo(i * CELL_SIZE, 0);
      this.context.lineTo(i * CELL_SIZE, SIZE * CELL_SIZE);
      this.context.stroke();
      this.context.beginPath();
      this.context.moveTo(0, i * CELL_SIZE);
      this.context.lineTo(SIZE * CELL_SIZE, i * CELL_SIZE);
      this.context.stroke();
    }

    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.font = '72px sans-serif';
    this.board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) return;
        this.context.fillStyle = cell === 'X' ? '#38bdf8' : '#f43f5e';
        this.context.fillText(cell, x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2);
      });
    });
  }
}

export function registerTicTacToe(registry: GameRegistryApi) {
  registry.register({
    key: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic 3x3 duel. Get three in a row to win.',
    genre: 'Board',
    createRuntime: (context: RuntimeContext) => new TicTacToeRuntime(context),
  });
}
