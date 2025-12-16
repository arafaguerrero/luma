import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router';
import HarmonyIcon from '@/react-app/components/HarmonyIcon';
import Header from '@/react-app/components/Header';
import Footer from '@/react-app/components/Footer';

interface ColorData {
  id: number;
  brand: string;
  code: string;
  name: string;
  hex: string;
  set_name: string;
}

type HarmonyType = 
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'tetradic'
  | 'split_complementary'
  | 'monochromatic'
  | 'square'
  | 'diadic';

interface Harmony {
  id: HarmonyType;
  name: string;
  icon: string;
}

const harmonies: Harmony[] = [
  { id: 'complementary', name: 'Complementares', icon: '' },
  { id: 'analogous', name: 'Análogas', icon: '' },
  { id: 'triadic', name: 'Tríade', icon: '' },
  { id: 'tetradic', name: 'Tétrade', icon: '' },
  { id: 'split_complementary', name: 'Complementar Dividida', icon: '' },
  { id: 'monochromatic', name: 'Monocromática', icon: '' },
  { id: 'square', name: 'Quadrada', icon: '' },
  { id: 'diadic', name: 'Diádica', icon: '' },
];

export default function ChooseByCode() {
  const navigate = useNavigate();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [availableColors, setAvailableColors] = useState<ColorData[]>([]);
  const [selectedColor, setSelectedColor] = useState<ColorData | null>(null);
  const [selectedHarmony, setSelectedHarmony] = useState<HarmonyType | null>(null);
  const [harmonyColors, setHarmonyColors] = useState<ColorData[]>([]);
  const [loading, setLoading] = useState(false);
  const [harmonyFallback, setHarmonyFallback] = useState<{
    used: boolean;
    requested: string;
    actual: string;
  } | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  const brands = ['ohuhu'];
  const sets: Record<string, string[]> = {
    ohuhu: ['320 colors'],
  };

  const isFormComplete = selectedBrand && selectedSet;

  // Load available colors when brand and set are selected
  useEffect(() => {
    if (selectedBrand && selectedSet) {
      loadColors();
    }
  }, [selectedBrand, selectedSet]);

  // Generate harmony when color and harmony type are selected
  useEffect(() => {
    if (selectedColor && selectedHarmony && isFormComplete) {
      generateHarmony();
    }
  }, [selectedColor, selectedHarmony]);

  const loadColors = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/colors?brand=${selectedBrand}&set=${encodeURIComponent(selectedSet)}`
      );
      if (!response.ok) throw new Error('Failed to load colors');
      const data = await response.json();
      setAvailableColors(data);
    } catch (error) {
      console.error('Error loading colors:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHarmony = async () => {
    if (!selectedColor || !selectedHarmony) return;

    setLoading(true);
    try {
      const response = await fetch('/api/colors/harmony', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          colorCode: selectedColor.code,
          brand: selectedBrand,
          set: selectedSet,
          harmonyType: selectedHarmony,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate harmony');
      const data = await response.json();
      setHarmonyColors(data.colors || []);
      
      if (data.fallbackUsed) {
        setHarmonyFallback({
          used: true,
          requested: data.requestedHarmony,
          actual: data.actualHarmony,
        });
      } else {
        setHarmonyFallback(null);
      }
    } catch (error) {
      console.error('Error generating harmony:', error);
      setHarmonyColors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleColorSelect = (colorId: string) => {
    if (colorId === '') {
      setSelectedColor(null);
      return;
    }
    const color = availableColors.find(c => c.id.toString() === colorId);
    if (color) {
      setSelectedColor(color);
    }
  };

  const sortedColors = [...availableColors].sort((a, b) => {
    return a.code.localeCompare(b.code, undefined, { numeric: true });
  });

  const filteredColors = dropdownSearch
    ? sortedColors.filter(color => 
        color.code.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
        color.name.toLowerCase().includes(dropdownSearch.toLowerCase())
      )
    : sortedColors;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="pt-[100px] pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/choose-base-color')}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>

          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gray-900">
            Escolher por Código / Nome
          </h1>
          
          <p className="text-center text-gray-600 mb-12">
            Selecione a marca, o set e depois escolha sua cor pela lista
          </p>

          {/* Brand and Set Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              1. Selecione a marca e o set
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Marca *
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                    setSelectedSet('');
                    setSelectedColor(null);
                    setSelectedHarmony(null);
                    setHarmonyColors([]);
                  }}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">Escolha uma marca</option>
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === 'ohuhu' ? 'Ohuhu' : brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Set *
                </label>
                <select
                  value={selectedSet}
                  onChange={(e) => {
                    setSelectedSet(e.target.value);
                    setSelectedColor(null);
                    setSelectedHarmony(null);
                    setHarmonyColors([]);
                  }}
                  disabled={!selectedBrand}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Escolha um set</option>
                  {selectedBrand &&
                    sets[selectedBrand]?.map((set) => (
                      <option key={set} value={set}>
                        {set === '320 colors' ? 'Honolulu (320 cores)' : set}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Color Selection */}
          <div
            className={`bg-white rounded-2xl shadow-xl p-8 mb-8 transition-all ${
              !isFormComplete ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <h2 className="text-xl font-semibold mb-6 text-gray-900">
              2. Escolha a cor base
            </h2>

            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={dropdownSearch}
                onChange={(e) => setDropdownSearch(e.target.value)}
                placeholder="Buscar por código ou nome..."
                disabled={!isFormComplete || availableColors.length === 0}
                className="w-full pl-12 pr-6 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <select
              value={selectedColor?.id.toString() || ''}
              onChange={(e) => handleColorSelect(e.target.value)}
              disabled={!isFormComplete || availableColors.length === 0}
              className="w-full px-6 py-4 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              size={10}
            >
              <option value="">Selecione uma cor...</option>
              {filteredColors.map((color) => (
                <option key={color.id} value={color.id.toString()}>
                  {color.code} - {color.name}
                </option>
              ))}
            </select>
            
            {dropdownSearch && filteredColors.length === 0 && (
              <p className="text-center text-gray-500 text-sm mt-3">
                Nenhuma cor encontrada para "{dropdownSearch}"
              </p>
            )}
            
            {filteredColors.length > 0 && (
              <p className="text-center text-gray-500 text-xs mt-3">
                {filteredColors.length} {filteredColors.length === 1 ? 'cor disponível' : 'cores disponíveis'}
              </p>
            )}

            {/* Selected Color Preview */}
            {selectedColor && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <p className="text-sm font-semibold text-gray-700 mb-3">Cor selecionada:</p>
                <div className="flex items-center gap-4">
                  <div
                    className="w-20 h-20 rounded-lg shadow-md ring-4 ring-white flex-shrink-0"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    <p className="text-xl font-bold text-gray-900">{selectedColor.code}</p>
                    <p className="text-base text-gray-600">{selectedColor.name}</p>
                    <p className="text-sm font-mono text-gray-500 mt-1">{selectedColor.hex.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Harmony Selection */}
          {selectedColor && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-900">
                3. Escolha o tipo de harmonia
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {harmonies.map((harmony) => (
                  <button
                    key={harmony.id}
                    onClick={() => setSelectedHarmony(harmony.id)}
                    className={`
                      flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all
                      ${selectedHarmony === harmony.id
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                        : 'bg-white border-2 border-gray-300 text-gray-600 hover:border-purple-300'
                      }
                      cursor-pointer
                    `}
                  >
                    <HarmonyIcon type={harmony.id} isActive={selectedHarmony === harmony.id} />
                    <span className="text-xs font-medium text-center whitespace-nowrap">{harmony.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Harmony Results */}
          {harmonyColors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {harmonyFallback?.used && (
                <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                  <p className="text-amber-900 text-center">
                    <span className="font-semibold">A harmonia "{harmonies.find(h => h.id === harmonyFallback.requested)?.name}" não pôde ser encontrada.</span>
                    <br />
                    Mostrando a harmonia "{harmonies.find(h => h.id === harmonyFallback.actual)?.name}" como alternativa.
                  </p>
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Paleta de Harmonia - {harmonies.find(h => h.id === (harmonyFallback?.actual || selectedHarmony))?.name}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {harmonyColors.map((color) => (
                  <div
                    key={color.id}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div
                      className="w-full h-32 rounded-xl mb-4 shadow-md ring-2 ring-white/50"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="space-y-2">
                      <h3 className="font-bold text-2xl text-gray-900">{color.code}</h3>
                      <p className="text-base text-gray-600">{color.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
