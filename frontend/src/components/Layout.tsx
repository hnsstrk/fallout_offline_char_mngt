import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../services/store';
import { Menu, X, LogOut, Users, Home } from 'lucide-react';

export default function Layout() {
  const { user, logout, isMobileMenuOpen, toggleMobileMenu } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-wasteland-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-vault-600">Vault-Tec</span>
              <span className="hidden sm:inline text-wasteland-600">Character Manager</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-wasteland-100">
                <Home size={18} />
                <span>Characters</span>
              </Link>

              {(user?.role === 'admin') && (
                <Link to="/users" className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-wasteland-100">
                  <Users size={18} />
                  <span>Users</span>
                </Link>
              )}

              <div className="flex items-center space-x-3 pl-3 border-l border-wasteland-300">
                <span className="text-sm text-wasteland-600">
                  {user?.username} <span className="text-xs">({user?.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </nav>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-wasteland-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-wasteland-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              <Link
                to="/"
                onClick={toggleMobileMenu}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-wasteland-100"
              >
                <Home size={18} />
                <span>Characters</span>
              </Link>

              {(user?.role === 'admin') && (
                <Link
                  to="/users"
                  onClick={toggleMobileMenu}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-wasteland-100"
                >
                  <Users size={18} />
                  <span>Users</span>
                </Link>
              )}

              <div className="border-t border-wasteland-200 pt-2 mt-2">
                <div className="px-3 py-2 text-sm text-wasteland-600">
                  {user?.username} ({user?.role})
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
