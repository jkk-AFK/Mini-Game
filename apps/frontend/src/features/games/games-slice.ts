import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../utils/api-client';

export interface GameInfo {
  key: string;
  name: string;
  genre: string;
  metadata?: Record<string, unknown>;
}

interface GamesState {
  items: GameInfo[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  error?: string;
}

const initialState: GamesState = {
  items: [],
  status: 'idle',
};

export const fetchGames = createAsyncThunk('games/fetch', async () => {
  const response = await api.get('/games');
  return response.data as GameInfo[];
});

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.items = action.payload;
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message;
      });
  },
});

export default gamesSlice.reducer;
