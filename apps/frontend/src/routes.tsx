import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './layouts/app-layout';
import { AuthLayout } from './layouts/auth-layout';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/login-page';
import { RegisterPage } from './pages/register-page';
import { ProfilePage } from './pages/profile-page';
import { GamePage } from './pages/game-page';
import { AdminDashboardPage } from './pages/admin-dashboard-page';
import { LobbyPage } from './pages/lobby-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'games/:gameKey', element: <GamePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'lobby', element: <LobbyPage /> },
      { path: 'admin', element: <AdminDashboardPage /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
]);
