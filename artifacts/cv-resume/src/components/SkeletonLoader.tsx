import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'card' | 'text' | 'circle' | 'line';
  className?: string;
}

export function SkeletonLoader({
  count = 1,
  variant = 'card',
  className = '',
}: SkeletonLoaderProps) {
  const variants = {
    card: 'rounded-lg h-48 w-full',
    text: 'rounded h-4 w-3/4',
    circle: 'rounded-full w-12 h-12',
    line: 'rounded h-2 w-full',
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton animate-pulse bg-muted ${variants[variant]} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  ));

  return (
    <div className="space-y-4">
      {skeletons}
    </div>
  );
}
