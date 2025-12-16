interface ColorData {
  id: number;
  brand: string;
  code: string;
  name: string;
  hex: string;
  set_name: string;
}

import { useState } from 'react';

interface CircularColorWheelProps {
  colors: ColorData[];
  selectedColor: ColorData | null;
  onColorSelect: (color: ColorData) => void;
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

// Parse color code
function parseCode(code: string) {
  const match = code.match(/^([A-Z]+)(\d)(\d{1,2})$/);
  if (!match) return null;
  
  return {
    family: match[1],
    saturation: parseInt(match[2]),
    brightness: parseInt(match[3]),
  };
}

export default function CircularColorWheel({ colors, selectedColor, onColorSelect }: CircularColorWheelProps) {
  const [hoveredColor, setHoveredColor] = useState<ColorData | null>(null);
  const centerX = 300;
  const centerY = 300;
  const baseRadius = 40;
  const ringWidth = 26;
  const maxRings = 10;

  // Grey/neutral families (excluding E which is brown/earth tones)
  const greyFamilies = ['GG', 'BGY', 'CG', 'YGY', 'WG', 'FY'];

  // Parse and organize colors
  const chromaticColors: Record<string, Record<number, ColorData[]>> = {};
  const greyColors: ColorData[] = [];
  const familyHues: Record<string, number[]> = {};

  colors.forEach(color => {
    const parsed = parseCode(color.code);
    if (!parsed) return;

    if (greyFamilies.includes(parsed.family)) {
      greyColors.push(color);
    } else {
      if (!chromaticColors[parsed.family]) {
        chromaticColors[parsed.family] = {};
        familyHues[parsed.family] = [];
      }
      if (!chromaticColors[parsed.family][parsed.saturation]) {
        chromaticColors[parsed.family][parsed.saturation] = [];
      }
      chromaticColors[parsed.family][parsed.saturation].push(color);
      const hsl = hexToHsl(color.hex);
      if (hsl && !isNaN(hsl.h)) {
        familyHues[parsed.family].push(hsl.h);
      }
    }
  });

  // Sort colors by brightness within each family/saturation group
  Object.values(chromaticColors).forEach(familyGroup => {
    Object.values(familyGroup).forEach(saturationGroup => {
      saturationGroup.sort((a, b) => {
        const aData = parseCode(a.code);
        const bData = parseCode(b.code);
        if (!aData || !bData) return 0;
        return aData.brightness - bData.brightness;
      });
    });
  });

  // Calculate average hue for each family
  const familyHueAverages: { family: string; avgHue: number }[] = [];
  for (const family in familyHues) {
    if (familyHues[family].length > 0) {
      const avgHue = familyHues[family].reduce((sum, h) => sum + h, 0) / familyHues[family].length;
      familyHueAverages.push({ family, avgHue });
    }
  }

  // Order families by average hue (color wheel order)
  const dynamicFamilyOrder = familyHueAverages
    .sort((a, b) => a.avgHue - b.avgHue)
    .map(item => item.family);

  const activeFamilies = dynamicFamilyOrder.filter(family => chromaticColors[family]);
  const familyCount = activeFamilies.length;

  // Sort grey colors by lightness
  greyColors.sort((a, b) => {
    const aHsl = hexToHsl(a.hex);
    const bHsl = hexToHsl(b.hex);
    if (!aHsl || !bHsl) return 0;
    return bHsl.l - aHsl.l;
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <svg 
          viewBox="0 0 600 600" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Draw chromatic colors in rings */}
          {activeFamilies.map((family, familyIndex) => {
            const familyAngleStart = (familyIndex / familyCount) * 2 * Math.PI - Math.PI / 2;
            const familyAngleSpan = (2 * Math.PI) / familyCount;
            
            return (
              <g key={family}>
                {/* Draw each saturation ring for this family */}
                {Array.from({ length: maxRings }, (_, saturation) => {
                  const colorsInRing = chromaticColors[family]?.[saturation] || [];
                  if (colorsInRing.length === 0) return null;

                  const ringRadius = baseRadius + saturation * ringWidth;
                  const nextRingRadius = baseRadius + (saturation + 1) * ringWidth;
                  
                  return colorsInRing.map((color, colorIndex) => {
                    const angleStep = familyAngleSpan / Math.max(colorsInRing.length, 1);
                    const angleStart = familyAngleStart + colorIndex * angleStep;
                    const angleEnd = familyAngleStart + (colorIndex + 1) * angleStep;
                    
                    const innerRadius = ringRadius;
                    const outerRadius = nextRingRadius - 1.5;
                    
                    const x1 = centerX + innerRadius * Math.cos(angleStart);
                    const y1 = centerY + innerRadius * Math.sin(angleStart);
                    const x2 = centerX + outerRadius * Math.cos(angleStart);
                    const y2 = centerY + outerRadius * Math.sin(angleStart);
                    const x3 = centerX + outerRadius * Math.cos(angleEnd);
                    const y3 = centerY + outerRadius * Math.sin(angleEnd);
                    const x4 = centerX + innerRadius * Math.cos(angleEnd);
                    const y4 = centerY + innerRadius * Math.sin(angleEnd);
                    
                    const largeArc = angleEnd - angleStart > Math.PI ? 1 : 0;
                    
                    const pathData = [
                      `M ${x1} ${y1}`,
                      `L ${x2} ${y2}`,
                      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}`,
                      `L ${x4} ${y4}`,
                      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}`,
                      'Z',
                    ].join(' ');
                    
                    const isSelected = selectedColor?.id === color.id;
                    
                    return (
                      <path
                        key={color.id}
                        d={pathData}
                        fill={color.hex}
                        stroke={isSelected ? '#7C3AED' : 'white'}
                        strokeWidth={isSelected ? 2 : 0.3}
                        className="cursor-pointer transition-all hover:opacity-90"
                        onClick={() => onColorSelect(color)}
                        onMouseEnter={() => setHoveredColor(color)}
                        onMouseLeave={() => setHoveredColor(null)}
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 6px rgba(124, 58, 237, 0.9))' : undefined,
                        }}
                      >
                        <title>{`${color.code} - ${color.name}`}</title>
                      </path>
                    );
                  });
                })}
                
                {/* Family label */}
                <text
                  x={centerX + (baseRadius + maxRings * ringWidth + 18) * Math.cos(familyAngleStart + familyAngleSpan / 2)}
                  y={centerY + (baseRadius + maxRings * ringWidth + 18) * Math.sin(familyAngleStart + familyAngleSpan / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-bold fill-gray-700"
                  style={{ fontSize: '12px' }}
                >
                  {family}
                </text>
              </g>
            );
          })}

          {/* Center white circle background */}
          <circle
            cx={centerX}
            cy={centerY}
            r={baseRadius - 2}
            fill="white"
            stroke="#E5E7EB"
            strokeWidth="1.5"
          />

          {/* Grey/neutral colors in the center */}
          {greyColors.length > 0 && (
            <g>
              {greyColors.slice(0, 24).map((color, index) => {
                // Arrange in concentric circles
                const maxRadius = baseRadius - 6;
                const numRings = 3;
                const colorsPerRing = [1, 7, 16];
                
                let ring = 0;
                let indexInRing = index;
                let accumulatedColors = 0;
                
                for (let i = 0; i < numRings; i++) {
                  if (index < accumulatedColors + colorsPerRing[i]) {
                    ring = i;
                    indexInRing = index - accumulatedColors;
                    break;
                  }
                  accumulatedColors += colorsPerRing[i];
                }
                
                if (ring === 0) {
                  // Center dot
                  const isSelected = selectedColor?.id === color.id;
                  return (
                    <circle
                      key={color.id}
                      cx={centerX}
                      cy={centerY}
                      r={4}
                      fill={color.hex}
                      stroke={isSelected ? '#7C3AED' : '#cccccc'}
                      strokeWidth={isSelected ? 1.5 : 0.3}
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => onColorSelect(color)}
                      onMouseEnter={() => setHoveredColor(color)}
                      onMouseLeave={() => setHoveredColor(null)}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.9))' : undefined,
                      }}
                    >
                      <title>{`${color.code} - ${color.name}`}</title>
                    </circle>
                  );
                } else {
                  // Outer rings
                  const radius = (maxRadius / numRings) * (ring + 0.5);
                  const angleStep = (2 * Math.PI) / colorsPerRing[ring];
                  const angle = angleStep * indexInRing - Math.PI / 2;
                  
                  const x = centerX + radius * Math.cos(angle);
                  const y = centerY + radius * Math.sin(angle);
                  
                  const isSelected = selectedColor?.id === color.id;
                  
                  return (
                    <circle
                      key={color.id}
                      cx={x}
                      cy={y}
                      r={3.5}
                      fill={color.hex}
                      stroke={isSelected ? '#7C3AED' : '#cccccc'}
                      strokeWidth={isSelected ? 1.5 : 0.3}
                      className="cursor-pointer transition-all hover:opacity-90"
                      onClick={() => onColorSelect(color)}
                      onMouseEnter={() => setHoveredColor(color)}
                      onMouseLeave={() => setHoveredColor(null)}
                      style={{
                        filter: isSelected ? 'drop-shadow(0 0 4px rgba(124, 58, 237, 0.9))' : undefined,
                      }}
                    >
                      <title>{`${color.code} - ${color.name}`}</title>
                    </circle>
                  );
                }
              })}
            </g>
          )}

          {/* Ring labels (saturation levels) */}
          {Array.from({ length: maxRings }, (_, i) => {
            const radius = baseRadius + i * ringWidth + ringWidth / 2;
            const angle = -Math.PI / 2 - Math.PI / 6;
            
            return (
              <text
                key={`sat-${i}`}
                x={centerX + radius * Math.cos(angle)}
                y={centerY + radius * Math.sin(angle)}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[8px] font-semibold fill-gray-600"
                style={{ fontSize: '8px' }}
              >
                {i}
              </text>
            );
          })}
        </svg>
      </div>
      
      {/* Hover tooltip */}
      {hoveredColor && !selectedColor && (
        <div className="absolute top-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none z-10">
          <p className="font-bold text-sm">{hoveredColor.code}</p>
          <p className="text-xs opacity-80">{hoveredColor.name}</p>
        </div>
      )}
      
      {/* Selected color info panel - positioned outside the SVG */}
      {selectedColor && (
        <div className="mt-6 bg-white rounded-xl shadow-xl p-4 border-2 border-purple-200 max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-16 h-16 rounded-lg shadow-md ring-4 ring-white flex-shrink-0"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{selectedColor.code}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{selectedColor.name}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1 border-t pt-2">
            <p className="font-mono font-semibold">{selectedColor.hex.toUpperCase()}</p>
            {parseCode(selectedColor.code) && (
              <>
                <p>Saturação: {parseCode(selectedColor.code)!.saturation}</p>
                <p>Brilho: {parseCode(selectedColor.code)!.brightness}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
