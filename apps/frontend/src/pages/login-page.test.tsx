import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { LoginPage } from './login-page';

const dispatchMock = vi.fn((action?: unknown) => {
  if (typeof action === 'function' && 'typePrefix' in action) {
    const typePrefix = (action as { typePrefix: string }).typePrefix;
    if (typePrefix === 'auth/register') {
      return { unwrap: () => Promise.resolve() };
    }
    if (typePrefix === 'auth/profile') {
      return Promise.resolve();
    }
  }
  return { unwrap: () => Promise.resolve() };
});

vi.mock('../store/hooks', () => ({
  useAppDispatch: () => dispatchMock,
  useAppSelector: (selector: (state: unknown) => unknown) =>
    selector({ auth: { status: 'idle' } }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'auth.signIn': 'Sign in',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.signingIn': 'Signing in…',
        'auth.signingUp': 'Creating account…',
        'auth.withGoogle': 'Sign in with Google',
        'auth.withFacebook': 'Sign in with Facebook',
        'auth.or': 'OR',
        'auth.registerTitle': 'Create account',
        'auth.username': 'Username',
        'auth.register': 'Register',
        'auth.needAccount': 'Need an account?',
        'auth.haveAccount': 'Already have an account?',
      }[key] ?? key),
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    dispatchMock.mockClear();
    vi.stubGlobal('open', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows login form by default and toggles to registration', () => {
    const { getByLabelText, getByText } = render(<LoginPage />);

    expect(getByLabelText('Email')).toBeInTheDocument();
    const switchContainer = getByText('Need an account?').parentElement as HTMLElement;
    fireEvent.click(within(switchContainer).getByRole('button', { name: 'Register' }));
    expect(getByLabelText('Username')).toBeInTheDocument();
  });

  it('submits registration form and dispatches register flow', async () => {
    const { getByText, getAllByText } = render(<LoginPage />);

    const switchContainer = getByText('Need an account?').parentElement as HTMLElement;
    fireEvent.click(within(switchContainer).getByRole('button', { name: 'Register' }));

    const registerForm = getAllByText('Create account')[0].closest('form') as HTMLElement;
    const formScope = within(registerForm);

    fireEvent.change(formScope.getByLabelText('Username'), { target: { value: 'PlayerOne' } });
    fireEvent.change(formScope.getByLabelText('Email'), { target: { value: 'player@example.com' } });
    fireEvent.change(formScope.getByLabelText('Password'), { target: { value: 'superSecret1' } });

    fireEvent.click(formScope.getByRole('button', { name: 'Register' }));

    await waitFor(() => {
      expect(dispatchMock).toHaveBeenCalledTimes(2);
    });
  });
});
