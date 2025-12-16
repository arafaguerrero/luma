import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import { Check, Sparkles, Loader2 } from 'lucide-react';

export default function Subscription() {
  const { user, redirectToLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 'R$ 19,90',
      period: '/mês',
      features: [
        'Acesso ilimitado a todas as paletas',
        'Download em alta qualidade',
        'Geração de paletas personalizadas',
        'Equivalência de cores',
        'Suporte prioritário',
      ],
    },
    {
      id: 'semester',
      name: 'Semestral',
      price: 'R$ 99,90',
      period: '/6 meses',
      popular: true,
      features: [
        'Tudo do plano Mensal',
        'Economize 17%',
        'Acesso a novos recursos',
        'Atualizações exclusivas',
        'Suporte premium',
      ],
    },
    {
      id: 'annual',
      name: 'Anual',
      price: 'R$ 179,90',
      period: '/ano',
      features: [
        'Tudo do plano Semestral',
        'Economize 25%',
        'Melhor custo-benefício',
        'Recursos antecipados',
        'Suporte VIP',
      ],
    },
  ];

  const handleSubscribe = async (planId: string) => {
    setLoading(true);

    try {
      // If user is not logged in, redirect to login first
      if (!user) {
        const returnUrl = searchParams.get('returnUrl');
        const loginUrl = returnUrl 
          ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
          : '/login';
        sessionStorage.setItem('selectedPlan', planId);
        navigate(loginUrl);
        return;
      }

      // Create subscription
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) throw new Error('Failed to create subscription');

      // Redirect to return URL or home
      const returnUrl = searchParams.get('returnUrl') || '/';
      navigate(returnUrl);
    } catch (error) {
      console.error('Subscription failed:', error);
      alert('Erro ao criar assinatura. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="pt-[100px] pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Tenha acesso a{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                esta paleta e muitas outras
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Escolha o plano perfeito para suas necessidades criativas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all ${
                  plan.popular ? 'ring-4 ring-purple-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full inline-block mb-4">
                    Mais Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading}
                  className={`w-full px-6 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 inline mr-2" />
                      Assinar Agora
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Todos os planos incluem garantia de 7 dias. Cancele a qualquer momento.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
