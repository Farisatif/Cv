import React, { useEffect, useRef } from 'react';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

interface StatsCounterProps {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
}

export function StatsCounter({
  value,
  label,
  suffix = '',
  decimals = 0,
  duration = 2000,
  className = '',
  valueClassName = '',
  labelClassName = '',
}: StatsCounterProps) {
  const { ref, isVisible } = useRevealOnScroll({
    threshold: 0.5,
    triggerOnce: true,
  });

  const { count, setIsVisible } = useCountAnimation({
    end: value,
    duration,
    decimals,
  });

  useEffect(() => {
    setIsVisible(isVisible);
  }, [isVisible, setIsVisible]);

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-500 ${className} ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`text-3xl sm:text-4xl font-bold mb-2 ${valueClassName}`}>
        {count}
        {suffix}
      </div>
      <div className={`text-sm sm:text-base text-muted-foreground ${labelClassName}`}>
        {label}
      </div>
    </div>
  );
}
