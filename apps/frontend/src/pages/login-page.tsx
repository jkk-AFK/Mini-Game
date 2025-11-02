import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, fetchProfile, setTokens, register as registerUser } from '../features/auth/auth-slice';

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const {
    register: registerLoginField,
    handleSubmit: handleLoginSubmit,
    reset: resetLoginForm,
  } = useForm<LoginForm>();
  const {
    register: registerRegisterField,
    handleSubmit: handleRegisterSubmit,
    reset: resetRegisterForm,
  } = useForm<RegisterForm>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);
  const { t } = useTranslation();

  const onSubmitLogin = handleLoginSubmit(async (data) => {
    await dispatch(login(data)).unwrap();
    await dispatch(fetchProfile());
    navigate('/');
  });

  const onSubmitRegister = handleRegisterSubmit(async (data) => {
    await dispatch(registerUser(data)).unwrap();
    await dispatch(fetchProfile());
    navigate('/');
  });

  useEffect(() => {
    const allowedOrigins = new Set([window.location.origin]);
    const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN as string | undefined;
    if (backendOrigin) {
      allowedOrigins.add(backendOrigin);
    }

    const handler = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== 'oauth') {
        return;
      }
      if (!allowedOrigins.has(event.origin)) {
        return;
      }
      const tokens = event.data.tokens as { accessToken?: string; refreshToken?: string };
      if (!tokens?.accessToken || !tokens?.refreshToken) {
        return;
      }
      dispatch(setTokens(tokens as { accessToken: string; refreshToken: string }));
      await dispatch(fetchProfile());
      navigate('/');
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [dispatch, navigate]);

  const openOAuthWindow = (provider: 'google' | 'facebook') => {
    const width = 520;
    const height = 640;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      `/api/v1/auth/${provider}`,
      `oauth_${provider}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no`,
    );
  };

  const isLoading = status === 'loading';

  const handleSwitchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    if (nextMode === 'login') {
      resetRegisterForm();
    } else {
      resetLoginForm();
    }
  };

  const oauthSection = (
    <>
      <div className="relative my-4 flex items-center justify-center text-xs uppercase tracking-wide text-slate-600">
        <span className="bg-slate-900 px-2">{t('auth.or')}</span>
        <div className="absolute left-0 right-0 h-px bg-slate-800" />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => openOAuthWindow('google')}
          className="w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
        >
          {t('auth.withGoogle')}
        </button>
        <button
          type="button"
          onClick={() => openOAuthWindow('facebook')}
          className="w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
        >
          {t('auth.withFacebook')}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center gap-2 text-sm text-slate-300">
        {mode === 'login' ? (
          <>
            <span>{t('auth.needAccount')}</span>
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className="font-semibold text-sky-400 hover:underline"
            >
              {t('auth.register')}
            </button>
          </>
        ) : (
          <>
            <span>{t('auth.haveAccount')}</span>
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="font-semibold text-sky-400 hover:underline"
            >
              {t('auth.signIn')}
            </button>
          </>
        )}
      </div>
      {mode === 'login' ? (
        <form className="flex flex-col gap-4" onSubmit={onSubmitLogin}>
          <h2 className="text-xl font-semibold text-slate-100">{t('auth.signIn')}</h2>
          <label className="text-sm text-slate-300">
            {t('auth.email')}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="email"
              autoComplete="email"
              {...registerLoginField('email', { required: true })}
            />
          </label>
          <label className="text-sm text-slate-300">
            {t('auth.password')}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="password"
              autoComplete="current-password"
              {...registerLoginField('password', { required: true })}
            />
          </label>
          <button
            type="submit"
            className="rounded bg-sky-500 py-2 font-semibold text-slate-900"
            disabled={isLoading}
          >
            {isLoading ? t('auth.signingIn') : t('auth.signIn')}
          </button>
          {oauthSection}
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSubmitRegister}>
          <h2 className="text-xl font-semibold text-slate-100">{t('auth.registerTitle')}</h2>
          <label className="text-sm text-slate-300">
            {t('auth.username')}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              autoComplete="username"
              {...registerRegisterField('username', { required: true })}
            />
          </label>
          <label className="text-sm text-slate-300">
            {t('auth.email')}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="email"
              autoComplete="email"
              {...registerRegisterField('email', { required: true })}
            />
          </label>
          <label className="text-sm text-slate-300">
            {t('auth.password')}
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
              type="password"
              autoComplete="new-password"
              {...registerRegisterField('password', { required: true, minLength: 8 })}
            />
          </label>
          <button
            type="submit"
            className="rounded bg-sky-500 py-2 font-semibold text-slate-900"
            disabled={isLoading}
          >
            {isLoading ? t('auth.signingUp') : t('auth.register')}
          </button>
          {oauthSection}
        </form>
      )}
    </div>
  );
}
