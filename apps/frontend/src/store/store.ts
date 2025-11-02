import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/auth-slice';
import gamesReducer from '../features/games/games-slice';
import lobbyReducer from '../features/lobby/lobby-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    games: gamesReducer,
    lobby: lobbyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
