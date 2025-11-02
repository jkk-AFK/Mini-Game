export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  gameKey: string;
  createdAt: string;
}

export interface GameDefinition {
  key: string;
  name: string;
  description: string;
  genre: string;
}

export interface ControlDefinition {
  action: string;
  input: string;
}
