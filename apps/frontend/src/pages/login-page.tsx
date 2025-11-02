import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { login, fetchProfile, setTokens } from '../features/auth/auth-slice';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginPage() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);

  const onSubmit = handleSubmit(async (data) => {
    await dispatch(login(data)).unwrap();
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

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h2 className="text-xl font-semibold text-slate-100">Sign in</h2>
      <label className="text-sm text-slate-300">
        Email
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
          type="email"
          {...register('email', { required: true })}
        />
      </label>
      <label className="text-sm text-slate-300">
        Password
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
          type="password"
          {...register('password', { required: true })}
        />
      </label>
      <button
        type="submit"
        className="rounded bg-sky-500 py-2 font-semibold text-slate-900"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Signing in…' : 'Sign in'}
      </button>
      <div className="relative my-4 flex items-center justify-center text-xs uppercase tracking-wide text-slate-600">
        <span className="bg-slate-900 px-2">或</span>
        <div className="absolute left-0 right-0 h-px bg-slate-800" />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => openOAuthWindow('google')}
          className="w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
        >
          使用 Google 登录
        </button>
        <button
          type="button"
          onClick={() => openOAuthWindow('facebook')}
          className="w-full rounded border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-slate-500"
        >
          使用 Facebook 登录
        </button>
      </div>
    </form>
  );
}
