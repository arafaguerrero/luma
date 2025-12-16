import { Palette, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate, useLocation } from 'react-router';

export default function Header() {
  const { user, isPending, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogin = () => {
    // Store current path for return after login
    sessionStorage.setItem('authReturnUrl', location.pathname + location.search);
    navigate('/login');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-[70px] bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-7 h-7 text-purple-600" />
          <span className="text-xl font-semibold text-gray-900">Rafa Colors</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('hero')}
            className="text-gray-700 hover:text-purple-600 transition-colors"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('generate')}
            className="text-gray-700 hover:text-purple-600 transition-colors"
          >
            Gerar Paleta
          </button>
          <button
            onClick={() => scrollToSection('equivalency')}
            className="text-gray-700 hover:text-purple-600 transition-colors"
          >
            Equivalência
          </button>
          <button
            onClick={() => scrollToSection('presets')}
            className="text-gray-700 hover:text-purple-600 transition-colors"
          >
            Biblioteca de Cores
          </button>

          {!isPending && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                    <User className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.email?.split('@')[0] || 'Usuário'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
