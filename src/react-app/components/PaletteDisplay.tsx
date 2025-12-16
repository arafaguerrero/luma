import ColorCircle from './ColorCircle';

interface ColorData {
  id?: number;
  brand?: string;
  code?: string;
  name?: string;
  hex: string;
  set_name?: string;
}

interface PaletteDisplayProps {
  colors: (string | ColorData)[];
  title?: string;
}

export default function PaletteDisplay({ colors, title }: PaletteDisplayProps) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-lg">
      {title && <h3 className="text-lg font-semibold mb-6 text-gray-800">{title}</h3>}
      <div className="flex gap-6 flex-wrap justify-center items-start">
        {colors.map((color, index) => {
          const isColorObject = typeof color === 'object' && color !== null;
          const hexValue = isColorObject ? color.hex : color;
          const colorCode = isColorObject ? color.code : null;
          const colorName = isColorObject ? color.name : null;

          return (
            <div key={index} className="flex flex-col items-center gap-3 min-w-[80px]">
              <ColorCircle color={hexValue} size="lg" />
              {colorCode && colorName ? (
                <div className="text-center max-w-[100px]">
                  <div className="text-sm font-bold text-gray-900 mb-1">{colorCode}</div>
                  <div className="text-xs text-gray-600 leading-tight">{colorName}</div>
                </div>
              ) : (
                <span className="text-xs font-mono text-gray-600">{hexValue}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
