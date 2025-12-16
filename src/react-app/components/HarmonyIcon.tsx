interface HarmonyIconProps {
  type: string;
  isActive: boolean;
}

export default function HarmonyIcon({ type, isActive }: HarmonyIconProps) {
  const baseColor = isActive ? 'currentColor' : '#9CA3AF';

  const icons: Record<string, React.ReactElement> = {
    complementary: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="20" r="8" fill={baseColor} />
        <circle cx="50" cy="80" r="8" fill={baseColor} />
        <line x1="50" y1="28" x2="50" y2="72" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    analogous: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="20" r="7" fill={baseColor} />
        <circle cx="70" cy="28" r="7" fill={baseColor} />
        <circle cx="30" cy="28" r="7" fill={baseColor} />
        <path d="M 30 28 Q 50 5 70 28" fill="none" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    triadic: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="15" r="7" fill={baseColor} />
        <circle cx="20" cy="73" r="7" fill={baseColor} />
        <circle cx="80" cy="73" r="7" fill={baseColor} />
        <path d="M 50 15 L 20 73 L 80 73 Z" fill="none" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    tetradic: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="15" r="7" fill={baseColor} />
        <circle cx="85" cy="50" r="7" fill={baseColor} />
        <circle cx="50" cy="85" r="7" fill={baseColor} />
        <circle cx="15" cy="50" r="7" fill={baseColor} />
        <path d="M 50 15 L 85 50 L 50 85 L 15 50 Z" fill="none" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    split_complementary: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="15" r="7" fill={baseColor} />
        <circle cx="30" cy="75" r="7" fill={baseColor} />
        <circle cx="70" cy="75" r="7" fill={baseColor} />
        <line x1="50" y1="22" x2="30" y2="68" stroke={baseColor} strokeWidth="2" />
        <line x1="50" y1="22" x2="70" y2="68" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    monochromatic: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="25" r="5" fill={baseColor} />
        <circle cx="50" cy="40" r="6" fill={baseColor} />
        <circle cx="50" cy="55" r="7" fill={baseColor} />
        <circle cx="50" cy="70" r="8" fill={baseColor} />
        <line x1="50" y1="30" x2="50" y2="62" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    square: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="20" r="7" fill={baseColor} />
        <circle cx="80" cy="50" r="7" fill={baseColor} />
        <circle cx="50" cy="80" r="7" fill={baseColor} />
        <circle cx="20" cy="50" r="7" fill={baseColor} />
        <rect x="27" y="27" width="46" height="46" fill="none" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
    diadic: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="45" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.3" />
        <circle cx="50" cy="20" r="8" fill={baseColor} />
        <circle cx="70" cy="35" r="8" fill={baseColor} />
        <line x1="50" y1="28" x2="70" y2="27" stroke={baseColor} strokeWidth="2" />
      </svg>
    ),
  };

  return (
    <div className="w-16 h-16">
      {icons[type] || icons.complementary}
    </div>
  );
}
