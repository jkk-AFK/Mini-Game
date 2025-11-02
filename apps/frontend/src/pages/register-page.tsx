import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { register as registerUser, fetchProfile } from '../features/auth/auth-slice';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export function RegisterPage() {
  const { register, handleSubmit } = useForm<RegisterForm>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async (data) => {
    await dispatch(registerUser(data)).unwrap();
    await dispatch(fetchProfile());
    navigate('/');
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h2 className="text-xl font-semibold text-slate-100">Create account</h2>
      <label className="text-sm text-slate-300">
        Username
        <input
          className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
          {...register('username', { required: true })}
        />
      </label>
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
          {...register('password', { required: true, minLength: 8 })}
        />
      </label>
      <button type="submit" className="rounded bg-sky-500 py-2 font-semibold text-slate-900">
        Register
      </button>
    </form>
  );
}
