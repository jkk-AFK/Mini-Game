import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MatchPlayer {
  userId: string;
  team: number;
}

export interface MatchSession {
  _id: string;
  gameKey: string;
  status: 'waiting' | 'active' | 'finished';
  players: MatchPlayer[];
}

interface LobbyState {
  connected: boolean;
  queueing: boolean;
  queueGameKey?: string;
  queueMode?: 'single' | 'multi';
  currentMatch?: MatchSession;
  lastError?: string;
  lastUpdated: number;
}

const initialState: LobbyState = {
  connected: false,
  queueing: false,
  lastUpdated: Date.now(),
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    lobbyConnected(state) {
      state.connected = true;
      state.lastError = undefined;
      state.lastUpdated = Date.now();
    },
    lobbyDisconnected(state) {
      state.connected = false;
      state.queueing = false;
      state.queueGameKey = undefined;
      state.queueMode = undefined;
      state.lastUpdated = Date.now();
    },
    queueStarted(state, action: PayloadAction<{ gameKey: string; mode: 'single' | 'multi' }>) {
      state.queueing = true;
      state.queueGameKey = action.payload.gameKey;
      state.queueMode = action.payload.mode;
      state.lastUpdated = Date.now();
    },
    queueCleared(state) {
      state.queueing = false;
      state.queueGameKey = undefined;
      state.queueMode = undefined;
      state.lastUpdated = Date.now();
    },
    matchFound(state, action: PayloadAction<MatchSession>) {
      state.queueing = false;
      state.currentMatch = action.payload;
      state.lastUpdated = Date.now();
    },
    lobbyError(state, action: PayloadAction<string>) {
      state.lastError = action.payload;
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  lobbyConnected,
  lobbyDisconnected,
  queueStarted,
  queueCleared,
  matchFound,
  lobbyError,
} = lobbySlice.actions;

export default lobbySlice.reducer;
