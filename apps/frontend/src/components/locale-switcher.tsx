import { useTransition, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLocale } from '../features/preferences/preferences-slice';
import { persistLocale, i18n } from '../i18n';
import api from '../utils/api-client';

const SUPPORTED_LOCALES: Array<{ value: string; labelKey: string }> = [
  { value: 'en', labelKey: 'locales.en' },
  { value: 'zh-CN', labelKey: 'locales.zh-CN' },
];

interface Props {
  showLabel?: boolean;
}

export function LocaleSwitcher({ showLabel = false }: Props) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const locale = useAppSelector((state) => state.preferences.locale);
  const user = useAppSelector((state) => state.auth.user);
  const [pending, startTransition] = useTransition();
  const [updating, setUpdating] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value;
    if (nextLocale === locale) {
      return;
    }
    dispatch(setLocale(nextLocale));
    persistLocale(nextLocale);
    startTransition(() => {
      void i18n.changeLanguage(nextLocale);
    });
    if (user) {
      setUpdating(true);
      api
        .patch('/users/me', { locale: nextLocale })
        .catch(() => {
          // swallow errors; user can retry later
        })
        .finally(() => setUpdating(false));
    }
  };

  const select = (
    <select
      value={locale}
      onChange={handleChange}
      disabled={pending || updating}
      className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
      aria-label={showLabel ? undefined : t('profile.locale')}
    >
      {SUPPORTED_LOCALES.map((item) => (
        <option key={item.value} value={item.value}>
          {t(item.labelKey)}
        </option>
      ))}
    </select>
  );

  if (showLabel) {
    return (
      <label className="flex items-center gap-2 text-xs text-slate-400">
        <span>{t('profile.locale')}</span>
        {select}
      </label>
    );
  }

  return <div>{select}</div>;
}
