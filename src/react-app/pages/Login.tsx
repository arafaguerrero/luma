import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import { LogIn, Palette } from 'lucide-react';

export default function Login() {
  const { user, redirectToLogin, isPending } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // If user is already logged in, redirect to return URL or home
    if (user && !isPending) {
      const returnUrl = searchParams.get('returnUrl') || '/';
      navigate(returnUrl);
    }
  }, [user, isPending, navigate, searchParams]);

  const handleLogin = async () => {
    // Store the return URL in session storage
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      sessionStorage.setItem('authReturnUrl', returnUrl);
    }
    
    await redirectToLogin();
  };

  if (isPending) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="pt-[100px] pb-16 px-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Faça login para continuar
              </h1>
              <p className="text-gray-600">
                Entre com sua conta Google para acessar e baixar sua paleta
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Entrar com Google
            </button>

            <p className="text-xs text-gray-500 text-center mt-6">
              Ao fazer login, você concorda com nossos Termos de Serviço e Política de Privacidade
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
