import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <Link to="/" className="mb-6 block text-center text-2xl font-bold">
          {t('app.title')}
        </Link>
        <Outlet />
      </div>
    </div>
  );
}
