import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProfile } from '../features/auth/auth-slice';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [user, dispatch]);

  if (!user) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-slate-300">Loading profile…</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-100">Welcome back, {user.username}</h1>
      <div className="mt-6 rounded border border-slate-800 bg-slate-900/70 p-6">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Email</dt>
            <dd className="text-slate-100">{user.email}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Locale</dt>
            <dd className="text-slate-100">{user.locale}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Roles</dt>
            <dd className="text-slate-100">{user.roles.join(', ')}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
