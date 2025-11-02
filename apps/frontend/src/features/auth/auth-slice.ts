import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api, { setApiTokens, clearApiTokens } from '../../utils/api-client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  roles: string[];
  locale: string;
}

interface AuthState {
  user: UserProfile | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error?: string;
  accessToken?: string;
  refreshToken?: string;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data as { accessToken: string; refreshToken: string };
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: { username: string; email: string; password: string }) => {
    const response = await api.post('/auth/register', payload);
    return response.data as { accessToken: string; refreshToken: string };
  },
);

export const fetchProfile = createAsyncThunk('auth/profile', async () => {
  const response = await api.get('/users/me');
  return response.data as UserProfile;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.accessToken = undefined;
      state.refreshToken = undefined;
      state.status = 'idle';
      clearApiTokens();
    },
    setTokens(state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      setApiTokens(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        setApiTokens(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = undefined;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        setApiTokens(action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, setTokens } = authSlice.actions;
export default authSlice.reducer;
