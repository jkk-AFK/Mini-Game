import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import zhCN from './locales/zh-CN/translation.json';

const STORAGE_KEY = 'arcade.locale';

function resolveInitialLocale() {
  const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
  if (stored) {
    return stored;
  }
  if (typeof navigator !== 'undefined') {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('zh')) {
      return 'zh-CN';
    }
  }
  return 'en';
}

const initialLocale = resolveInitialLocale();

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    'zh-CN': { translation: zhCN },
  },
  lng: initialLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function persistLocale(locale: string) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, locale);
  }
}

export { i18n };
