interface ColorCircleProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorCircle({ color, size = 'md' }: ColorCircleProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full shadow-lg ring-2 ring-white/50`}
      style={{ backgroundColor: color }}
    />
  );
}
