import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './services/store';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CharacterPage from './pages/CharacterPage';
import UsersPage from './pages/UsersPage';
import Layout from './components/Layout';

function App() {
  const { token, isAuthenticated, loadCurrentUser } = useStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      loadCurrentUser();
    }
  }, [token, isAuthenticated, loadCurrentUser]);

  if (token && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vault-600 mx-auto"></div>
          <p className="mt-4 text-wasteland-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/characters/:id" element={<CharacterPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PrivateRoute() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const { Outlet } = require('react-router-dom');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default App;
