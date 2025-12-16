import { ArrowLeft, List, Circle } from 'lucide-react';
import { useNavigate } from 'react-router';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';

export default function ChooseBaseColorMethod() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="pt-[100px] pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900">
            Como você prefere escolher sua cor base?
          </h1>
          
          <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            Escolha o método que funciona melhor para você. Ambas as opções levam ao mesmo resultado.
          </p>

          {/* Method Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card 1 - Choose by Code */}
            <div 
              onClick={() => navigate('/choose-base-color/by-code')}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group hover:scale-105 border-2 border-transparent hover:border-purple-300"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <List className="w-8 h-8 text-purple-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
                Escolher por código / nome
              </h2>
              
              <p className="text-center text-gray-600 mb-6">
                Ideal para quem já sabe o código exato da cor que deseja usar.
              </p>
              
              <button className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                Começar
              </button>
            </div>

            {/* Card 2 - Choose by Color Wheel */}
            <div 
              onClick={() => navigate('/choose-base-color/by-wheel')}
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all cursor-pointer group hover:scale-105 border-2 border-transparent hover:border-purple-300"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Circle className="w-8 h-8 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-center mb-4 text-gray-900">
                Escolher pelo círculo cromático
              </h2>
              
              <p className="text-center text-gray-600 mb-6">
                Explore visualmente as cores e encontre a ideal de forma intuitiva.
              </p>
              
              <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                Começar
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 max-w-3xl mx-auto bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-purple-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              O que acontece depois?
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">1</span>
                </div>
                <p>Você escolhe a marca e o set de marcadores (ex: Ohuhu Honolulu)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">2</span>
                </div>
                <p>Seleciona sua cor base usando o método escolhido</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">3</span>
                </div>
                <p>Escolhe o tipo de harmonia (complementar, análoga, tríade, etc.)</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold">4</span>
                </div>
                <p>O sistema gera automaticamente combinações harmoniosas de cores!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
