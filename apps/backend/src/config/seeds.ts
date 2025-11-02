import { GameModel } from '../models/game.js';

const defaultGames = [
  {
    key: 'mario',
    name: 'Pixel Runner',
    genre: 'Platformer',
    metadata: {
      description: 'Sprint through pixel worlds, leap over obstacles, and reach the goal flag.',
    },
  },
  {
    key: 'tetris',
    name: 'Tetris',
    genre: 'Puzzle',
    metadata: {
      description: 'Rotate and stack falling tetrominos to clear lines.',
    },
  },
  {
    key: 'snake',
    name: 'Snake',
    genre: 'Arcade',
    metadata: {
      description: 'Guide the snake to snack on food without hitting walls or itself.',
    },
  },
  {
    key: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    genre: 'Board',
    metadata: {
      description: 'Classic 3x3 duel. Line up three marks to win.',
    },
  },
];

export async function ensureSeedData() {
  for (const game of defaultGames) {
    await GameModel.updateOne({ key: game.key }, { $setOnInsert: game }, { upsert: true });
  }
}
