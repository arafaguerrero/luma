import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import PaletteDisplay from '@/react-app/components/PaletteDisplay';
import { Download, Loader2, Lock, Sparkles, Eye, User } from 'lucide-react';
import { getStoredFingerprint } from '@/react-app/utils/fingerprint';

export default function PaletteView() {
  const { user, isPending } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [palette, setPalette] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewStatus, setPreviewStatus] = useState<any>(null);
  const [previewBlocked, setPreviewBlocked] = useState(false);

  const paletteId = searchParams.get('id');
  const style = searchParams.get('style');

  useEffect(() => {
    const checkPreviewAndLoadPalette = async () => {
      if (!style) return;

      try {
        setLoading(true);
        const fingerprint = getStoredFingerprint();

        // Check preview status first
        const statusResponse = await fetch('/api/preview/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
        });

        if (!statusResponse.ok) throw new Error('Failed to check preview status');
        const status = await statusResponse.json();
        setPreviewStatus(status);

        // If user has subscription, load palette directly
        if (status.hasActiveSubscription) {
          const response = await fetch('/api/palettes/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              colorCount: 5,
              style: style,
              markerSet: 'honolulu',
            }),
          });

          if (!response.ok) throw new Error('Failed to load palette');
          const result = await response.json();
          setPalette(result);
          setLoading(false);
          return;
        }

        // If preview limit reached and user not authenticated, block
        if (status.previewCount >= status.limit && !status.isAuthenticated) {
          setPreviewBlocked(true);
          setLoading(false);
          return;
        }

        // Track preview usage
        const trackResponse = await fetch('/api/preview/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
        });

        if (!trackResponse.ok) throw new Error('Failed to track preview');
        const trackResult = await trackResponse.json();

        if (!trackResult.allowed) {
          setPreviewBlocked(true);
          setLoading(false);
          return;
        }

        setPreviewStatus(trackResult);

        // Load palette
        const response = await fetch('/api/palettes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            colorCount: 5,
            style: style,
            markerSet: 'honolulu',
          }),
        });

        if (!response.ok) throw new Error('Failed to load palette');
        const result = await response.json();
        setPalette(result);
      } catch (error) {
        console.error('Failed to load palette:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!isPending) {
      checkPreviewAndLoadPalette();
    }
  }, [isPending, style]);

  const handleDownload = () => {
    if (!palette) return;

    // Only allow download for subscribed users
    if (!previewStatus?.hasActiveSubscription) {
      alert('Download disponível apenas para assinantes');
      return;
    }

    // Create a simple text representation of the palette
    const paletteText = palette.colors
      .map((color: any) => `${color.code} - ${color.name} (${color.hex})`)
      .join('\n');

    const blob = new Blob([paletteText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-${palette.style || 'custom'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // Preview limit reached - show signup prompt
  if (previewBlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        <div className="pt-[100px] pb-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-12 shadow-2xl text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Você atingiu o limite de paletas
              </h1>
              
              <p className="text-lg text-gray-600 mb-8">
                Crie uma conta gratuita para continuar explorando paletas
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    sessionStorage.setItem('authReturnUrl', window.location.pathname + window.location.search);
                    navigate('/login');
                  }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Criar conta gratuita
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Voltar para a Home
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!palette) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        <div className="pt-[100px] pb-16 px-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Paleta não encontrada</h1>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Voltar para a Home
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Show limited view for free users (authenticated but no subscription)
  const isLimitedView = previewStatus?.isAuthenticated && !previewStatus?.hasActiveSubscription;
  
  // Partially hide color codes for free users
  const displayColors = isLimitedView 
    ? palette.colors.map((color: any, index: number) => {
        if (index < 2) return color; // Show first 2 colors fully
        return {
          ...color,
          code: '***', // Hide code
          name: color.name.slice(0, 10) + '...' // Partially hide name
        };
      })
    : palette.colors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="pt-[100px] pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Preview warning for second preview - request registration */}
          {previewStatus && previewStatus.previewCount === 2 && !previewStatus.hasActiveSubscription && !previewStatus.isAuthenticated && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-md">
              <div className="flex items-center justify-center gap-2 mb-3">
                <User className="w-6 h-6 text-blue-600" />
                <p className="text-xl font-semibold text-blue-900">
                  Crie sua conta para continuar
                </p>
              </div>
              <p className="text-blue-800 mb-4">
                Cadastre-se gratuitamente para continuar explorando paletas.
              </p>
              <button
                onClick={() => {
                  sessionStorage.setItem('authReturnUrl', window.location.pathname + window.location.search);
                  navigate('/login');
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <User className="w-5 h-5" />
                Criar conta gratuita
              </button>
            </div>
          )}

          {/* Preview warning for third preview - prompt subscription */}
          {previewStatus && previewStatus.previewCount === 3 && !previewStatus.hasActiveSubscription && (
            <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-6 text-center shadow-md">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <p className="text-xl font-semibold text-purple-900">
                  Desbloqueie acesso ilimitado
                </p>
              </div>
              <p className="text-purple-800 mb-4">
                Esta é sua última visualização gratuita. Assine agora para ter acesso ilimitado a todas as paletas, downloads e muito mais!
              </p>
              <button
                onClick={() => navigate(`/subscription?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Ver planos de assinatura
              </button>
            </div>
          )}

          {/* Limited view banner for free users */}
          {isLimitedView && (
            <div className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 text-center border-2 border-purple-200">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Lock className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Visualização Limitada
                </h3>
              </div>
              <p className="text-gray-700 mb-4">
                Alguns códigos e nomes estão ocultos. Downloads e exportações estão bloqueados.
              </p>
              <button
                onClick={() => navigate(`/subscription?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Desbloquear esta paleta
              </button>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sua Paleta{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                {palette.style?.charAt(0).toUpperCase() + palette.style?.slice(1)}
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              Paleta exclusiva gerada especialmente para você
            </p>
          </div>

          <PaletteDisplay colors={displayColors} />

          <div className="mt-8 flex justify-center gap-4">
            {previewStatus?.hasActiveSubscription ? (
              <button
                onClick={handleDownload}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Baixar Paleta
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/subscription?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  Assinar para Baixar
                </button>
                
                {previewStatus && previewStatus.previewCount === 2 && !previewStatus.isAuthenticated && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem('authReturnUrl', window.location.pathname + window.location.search);
                      navigate('/login');
                    }}
                    className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <User className="w-5 h-5" />
                    Criar conta gratuita
                  </button>
                )}
              </>
            )}
            
            {!(previewStatus && previewStatus.previewCount === 2 && !previewStatus.isAuthenticated) && (
              <button
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                Criar Nova Paleta
              </button>
            )}
          </div>

          <div className="mt-12 bg-white rounded-xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Informações da Paleta
            </h3>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Estilo:</span> {palette.style}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Cores:</span> {palette.colors?.length || 0}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Set:</span> Ohuhu Honolulu 320 cores
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
