import { Outlet, Link } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

export function AppLayout() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-xl font-bold">
            Arcade Platform
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="hover:text-sky-300">
              Home
            </Link>
            <Link to="/profile" className="hover:text-sky-300">
              Profile
            </Link>
            {user && (
              <Link to="/lobby" className="hover:text-sky-300">
                Lobby
              </Link>
            )}
            {user?.roles?.includes('admin') && (
              <Link to="/admin" className="hover:text-sky-300">
                Admin
              </Link>
            )}
            {!user && (
              <Link
                to="/auth/login"
                className="rounded bg-sky-500 px-3 py-1 font-semibold text-slate-900"
              >
                Sign in
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
          © {new Date().getFullYear()} Arcade Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
