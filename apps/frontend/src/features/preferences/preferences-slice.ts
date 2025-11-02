import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { i18n } from '../../i18n';

export interface PreferencesState {
  locale: string;
}

const initialState: PreferencesState = {
  locale: i18n.language,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<string>) {
      state.locale = action.payload;
    },
  },
});

export const { setLocale } = preferencesSlice.actions;
export default preferencesSlice.reducer;
