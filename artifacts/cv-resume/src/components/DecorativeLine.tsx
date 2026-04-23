import React from 'react';

interface DecorativeLineProps {
  variant?: 'horizontal' | 'vertical' | 'diagonal';
  className?: string;
  animated?: boolean;
  delay?: number;
}

export function DecorativeLine({
  variant = 'horizontal',
  className = '',
  animated = true,
  delay = 0,
}: DecorativeLineProps) {
  const baseStyles = 'pointer-events-none';

  const variantStyles = {
    horizontal: 'w-full h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent',
    vertical: 'w-0.5 h-full bg-gradient-to-b from-transparent via-accent/50 to-transparent',
    diagonal: 'w-full h-0.5 bg-gradient-to-r from-transparent via-accent/50 to-transparent transform -rotate-45 origin-center',
  };

  const animationStyle = animated
    ? {
        animation: `shimmer 3s ease-in-out infinite`,
        animationDelay: `${delay}ms`,
        '--shimmer-delay': `${delay}ms`,
      } as React.CSSProperties
    : undefined;

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={animationStyle}
    />
  );
}
