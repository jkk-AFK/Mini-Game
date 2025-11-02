import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutRemote } from '../features/auth/auth-slice';
import { LocaleSwitcher } from '../components/locale-switcher';

export function AppLayout() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await dispatch(logoutRemote());
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold">
            {t('app.title')}
          </Link>
          <nav className="flex items-center gap-3 text-sm text-slate-200">
            <Link to="/" className="hover:text-sky-300">
              {t('app.nav.home')}
            </Link>
            <Link to="/profile" className="hover:text-sky-300">
              {t('app.nav.profile')}
            </Link>
            {user && (
              <Link to="/lobby" className="hover:text-sky-300">
                {t('app.nav.lobby')}
              </Link>
            )}
            {user?.roles?.includes('admin') && (
              <Link to="/admin" className="hover:text-sky-300">
                {t('app.nav.admin')}
              </Link>
            )}
            <LocaleSwitcher />
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded bg-slate-800 px-3 py-1 font-semibold text-slate-100 hover:bg-slate-700"
              >
                {t('buttons.signOut')}
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="rounded bg-sky-500 px-3 py-1 font-semibold text-slate-900"
              >
                {t('app.nav.signin')}
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <Outlet />
      </main>
      <footer className="border-t border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400">
          {t('app.footer', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
}
