import { gameRegistry } from '@game-engine/index';
import { registerTetris } from './tetris/tetris';
import { registerSnake } from './snake/snake';
import { registerTicTacToe } from './tictactoe/tic-tac-toe';
import { registerMario } from './mario/mario';

let initialized = false;

export function ensureGamesRegistered() {
  if (initialized) return;
  registerTetris(gameRegistry);
  registerSnake(gameRegistry);
  registerTicTacToe(gameRegistry);
  registerMario(gameRegistry);
  initialized = true;
}

export const gamesList = () => gameRegistry.list();
