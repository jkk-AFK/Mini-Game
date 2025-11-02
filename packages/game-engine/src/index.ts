export interface RuntimeContext {
  canvas: HTMLCanvasElement;
  onScoreUpdate(score: number): void;
  onGameOver(score: number): void;
}

export interface GameRuntime {
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  dispose(): void;
}

export type RuntimeFactory = (context: RuntimeContext) => GameRuntime;

export interface RegistryEntry {
  key: string;
  name: string;
  description: string;
  genre: string;
  createRuntime: RuntimeFactory;
}

export interface GameRegistryApi {
  register(entry: RegistryEntry): void;
  list(): RegistryEntry[];
  get(key: string): RegistryEntry | undefined;
}

class GameRegistry implements GameRegistryApi {
  private readonly registry = new Map<string, RegistryEntry>();

  register(entry: RegistryEntry) {
    this.registry.set(entry.key, entry);
  }

  list() {
    return Array.from(this.registry.values());
  }

  get(key: string) {
    return this.registry.get(key);
  }
}

export const gameRegistry = new GameRegistry();

export { GameLoop } from './utils/game-loop.js';
