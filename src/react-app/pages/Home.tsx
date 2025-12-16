import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';
import PaletteDisplay from '@/react-app/components/PaletteDisplay';
import ColorCircle from '@/react-app/components/ColorCircle';
import { usePalette } from '@/react-app/hooks/usePalette';
import {
  Upload,
  Palette as PaletteIcon,
  Sparkles,
  Search,
  Loader2,
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    generatePalette,
    findEquivalency,
    getPresets,
    getRecentPalettes,
  } = usePalette();

  const [generatedPalette, setGeneratedPalette] = useState<any[] | null>(null);
  const [presets, setPresets] = useState<any[]>([]);
  const [recentPalettes, setRecentPalettes] = useState<any[]>([]);
  const [equivalencyResult, setEquivalencyResult] = useState<any>(null);

  // Form states
  const [colorCount, setColorCount] = useState(5);
  const [paletteStyle, setPaletteStyle] = useState('pastel');
  const [markerSet, setMarkerSet] = useState('honolulu');
  const [colorCode, setColorCode] = useState('');
  const [brandSelect, setBrandSelect] = useState('Ohuhu');

  useEffect(() => {
    loadPresets();
    loadRecentPalettes();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const loadRecentPalettes = async () => {
    try {
      const data = await getRecentPalettes();
      setRecentPalettes(data);
    } catch (error) {
      console.error('Failed to load recent palettes:', error);
    }
  };

  const handleGeneratePalette = async () => {
    try {
      const response = await fetch('/api/palettes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorCount,
          style: paletteStyle,
          markerSet,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate palette');
      const result = await response.json();
      setGeneratedPalette(result.colors);
      loadRecentPalettes();
    } catch (error) {
      console.error('Failed to generate palette:', error);
    }
  };

  const handleFindEquivalency = async () => {
    if (!colorCode.trim()) return;

    try {
      const result = await findEquivalency(colorCode.trim(), brandSelect);
      setEquivalencyResult(result);
    } catch (error) {
      console.error('Failed to find equivalency:', error);
    }
  };

  const handlePresetClick = (preset: any) => {
    // Simply navigate to palette view - preview tracking logic will handle access control
    navigate(`/palette?style=${preset.style}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      {/* Hero Section */}
      <section id="hero" className="pt-[100px] pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-[60%_40%] gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Gerador de Paletas &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  Equivalência de Cores
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Crie paletas instantâneas, encontre equivalências entre marcadores à base de alcool, acrilicas, gel pens e lapis de cores e explore combinações perfeitas para suas ilustrações.
              </p>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() =>
                    document.getElementById('generate')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Gerar Paleta
                </button>
                <button
                  onClick={() =>
                    document
                      .getElementById('equivalency')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Encontrar Equivalência
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-semibold mb-6 text-gray-800">
                Exemplo de Paleta
              </h3>
              <div className="flex gap-3 justify-center">
                {['#FF6B9D', '#C44569', '#FFA07A', '#F8B500', '#A29BFE'].map(
                  (color, index) => (
                    <ColorCircle key={index} color={color} size="lg" />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Cards */}
      <section id="generate" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 - Upload Image */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Gerar Paleta com Imagem
              </h3>
              <p className="text-gray-600 mb-6">
                Faça upload de uma foto e extraia automaticamente uma paleta com as
                principais cores.
              </p>
              <button
                onClick={() => window.location.href = '/generate-from-image'}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Começar
              </button>
            </div>

            {/* Card 2 - Choose Base Color */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <PaletteIcon className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Escolher Cor Base
              </h3>
              <p className="text-gray-600 mb-6">
                Selecione uma cor inicial e gere combinações harmoniosas.
              </p>
              <button
                onClick={() => window.location.href = '/choose-base-color'}
                className="w-full px-6 py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 transition-colors"
              >
                Começar
              </button>
            </div>

            {/* Card 3 - Custom Palette */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Criar Paleta Personalizada
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantas cores você quer?
                  </label>
                  <select
                    value={colorCount}
                    onChange={(e) => setColorCount(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={7}>7</option>
                    <option value={9}>9</option>
                    <option value={12}>12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estilo da paleta
                  </label>
                  <select
                    value={paletteStyle}
                    onChange={(e) => setPaletteStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="pastel">Pastel</option>
                    <option value="warm">Warm (quente)</option>
                    <option value="cold">Cold (fria)</option>
                    <option value="summer">Summer</option>
                    <option value="autumn">Autumn</option>
                    <option value="vibrant">Vibrant</option>
                    <option value="neutral">Neutral</option>
                    <option value="nature">Nature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set / Coleção
                  </label>
                  <select
                    value={markerSet}
                    onChange={(e) => setMarkerSet(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="honolulu">Ohuhu Honolulu</option>
                    <option value="honolulu_plus">Honolulu PLUS</option>
                    <option value="skin_tones">Skin Tones</option>
                    <option value="pastel_set">Pastel Set</option>
                    <option value="brush_set">Brush Set</option>
                  </select>
                </div>

                <button
                  onClick={handleGeneratePalette}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    'Gerar Paleta'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Palette Result */}
          {generatedPalette && (
            <div className="mt-12">
              <PaletteDisplay colors={generatedPalette} title="Paleta Gerada" />
            </div>
          )}
        </div>
      </section>

      {/* Equivalency Section */}
      <section id="equivalency" className="py-16 px-6 bg-white/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Equivalência de Cores
          </h2>

          <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código da cor (ex.: Y120)
              </label>
              <input
                type="text"
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                placeholder="Y120"
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escolher marca
              </label>
              <select
                value={brandSelect}
                onChange={(e) => setBrandSelect(e.target.value)}
                className="w-full px-6 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="Ohuhu">Ohuhu</option>
                <option value="Copic">Copic</option>
                <option value="Touch">Touch</option>
                <option value="Expressão">Expressão</option>
              </select>
            </div>

            <button
              onClick={handleFindEquivalency}
              disabled={loading || !colorCode.trim()}
              className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                <>
                  <Search className="w-5 h-5 inline mr-2" />
                  Encontrar Equivalente
                </>
              )}
            </button>

            {/* Equivalency Results */}
            {equivalencyResult && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Resultados:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                    <div className="flex items-center gap-4 mb-3">
                      <ColorCircle color={equivalencyResult.source.hex} size="lg" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {equivalencyResult.source.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {equivalencyResult.source.brand} -{' '}
                          {equivalencyResult.source.code}
                        </p>
                        <p className="text-xs font-mono text-gray-500">
                          {equivalencyResult.source.hex}
                        </p>
                      </div>
                    </div>
                  </div>

                  {equivalencyResult.matches.slice(0, 1).map((match: any) => (
                    <div
                      key={match.id}
                      className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl"
                    >
                      <div className="flex items-center gap-4 mb-3">
                        <ColorCircle color={match.hex} size="lg" />
                        <div>
                          <p className="font-semibold text-gray-900">{match.name}</p>
                          <p className="text-sm text-gray-600">
                            {match.brand} - {match.code}
                          </p>
                          <p className="text-xs font-mono text-gray-500">{match.hex}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Proximidade: {Math.round(match.distance)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Presets Section */}
      <section id="presets" className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">
            Precisa de inspiração?{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Comece por aqui ✨
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {presets.map((preset, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handlePresetClick(preset)}
              >
                <div className="flex gap-2 mb-4 justify-center">
                  {preset.colors.map((color: string, i: number) => (
                    <ColorCircle key={i} color={color} size="md" />
                  ))}
                </div>
                <h3 className="text-center font-semibold text-gray-900 mb-3">
                  {preset.name}
                </h3>
                <button className="w-full px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-colors">
                  Gerar esta Paleta
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Palettes */}
      {recentPalettes.length > 0 && (
        <section className="py-16 px-6 bg-white/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-gray-900">
              Suas Últimas Paletas
            </h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-6">
                {recentPalettes.map((palette) => {
                  const colors = JSON.parse(palette.colors);
                  return (
                    <div
                      key={palette.id}
                      className="flex-shrink-0 w-64 bg-white rounded-xl p-4 shadow-lg"
                    >
                      <div className="flex gap-2 mb-3">
                        {colors.slice(0, 5).map((color: string, i: number) => (
                          <ColorCircle key={i} color={color} size="sm" />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(palette.created_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={() => setGeneratedPalette(colors)}
                        className="w-full px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
                      >
                        Abrir
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
