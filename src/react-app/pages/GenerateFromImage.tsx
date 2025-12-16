import { useState, useRef } from 'react';
import { Upload, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import ColorThief from 'colorthief';

interface ColorMatch {
  id: number;
  brand: string;
  code: string;
  name: string;
  hex: string;
  set_name: string;
}

export default function GenerateFromImage() {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedColors, setGeneratedColors] = useState<ColorMatch[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  const brands = ['ohuhu'];
  const sets: Record<string, string[]> = {
    ohuhu: ['320 colors'],
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
      setGeneratedColors([]);
    }
  };

  const handleGeneratePalette = async () => {
    if (!imageFile) {
      setError('Por favor, envie uma imagem primeiro.');
      return;
    }

    if (!selectedBrand) {
      setError('Por favor, selecione uma marca.');
      return;
    }

    if (!selectedSet) {
      setError('Por favor, selecione um set.');
      return;
    }

    if (!imgRef.current) {
      setError('Erro ao processar a imagem. Tente novamente.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Extract colors using ColorThief
      const colorThief = new ColorThief();
      
      // Wait for image to load if not already loaded
      if (!imgRef.current.complete) {
        await new Promise((resolve) => {
          if (imgRef.current) {
            imgRef.current.onload = resolve;
          }
        });
      }

      // Get palette of 8 colors (we'll use top 5-7)
      const palette = colorThief.getPalette(imgRef.current, 8);
      
      // Convert RGB arrays to hex
      const extractedColors = palette.map(([r, g, b]: [number, number, number]) => rgbToHex(r, g, b));

      // Send to backend to match with brand colors
      const response = await fetch('/api/palettes/match-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          colors: extractedColors,
          brand: selectedBrand,
          set: selectedSet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao analisar a imagem');
      }

      const data = await response.json();
      setGeneratedColors(data.colors);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error ? err.message : 'Ocorreu um erro ao processar a imagem'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Voltar</span>
        </button>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-900">
          Gerar Paleta com Imagem
        </h1>

        {/* Upload Box */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {!imagePreview ? (
              <div className="border-4 border-dashed border-gray-300 rounded-xl p-12 hover:border-purple-400 transition-colors">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-gray-900 mb-2">
                      Envie sua imagem aqui
                    </p>
                    <p className="text-gray-600">
                      Clique para selecionar ou arraste a imagem
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  ref={imgRef}
                  src={imagePreview}
                  alt="Preview"
                  crossOrigin="anonymous"
                  className="w-full h-auto max-h-96 object-contain rounded-xl"
                />
                <div className="absolute top-4 right-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setImageFile(null);
                      setImagePreview('');
                      setGeneratedColors([]);
                    }}
                    className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors shadow-lg"
                  >
                    Trocar imagem
                  </button>
                </div>
              </div>
            )}
          </label>
        </div>

        {/* Brand and Set Selection */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Selecione a marca *
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedSet('');
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
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              Selecione o set *
            </label>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
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

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGeneratePalette}
            disabled={loading || !imageFile || !selectedBrand || !selectedSet}
            className="w-full px-8 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Analisando imagem...</span>
              </div>
            ) : (
              'Gerar Paleta'
            )}
          </button>
        </div>

        {/* Generated Palette */}
        {generatedColors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Sua Paleta Gerada
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {generatedColors.map((color) => (
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
                    <p className="text-sm text-gray-500 font-medium">{color.brand}</p>
                    {color.set_name && (
                      <p className="text-xs text-gray-500 italic">{color.set_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
