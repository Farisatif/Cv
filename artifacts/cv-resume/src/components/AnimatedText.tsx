import React, { useEffect, useState } from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

interface AnimatedTextProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  animation?: 'fadeInUp' | 'fadeInDown' | 'slideInUp' | 'scaleIn' | 'rotateIn';
  className?: string;
  triggerOnScroll?: boolean;
  triggerOnce?: boolean;
}

export function AnimatedText({
  children,
  delay = 0,
  duration = 600,
  animation = 'fadeInUp',
  className = '',
  triggerOnScroll = false,
  triggerOnce = true,
}: AnimatedTextProps) {
  const { ref, isVisible } = useRevealOnScroll({
    threshold: 0.3,
    triggerOnce,
    delay,
  });

  const shouldAnimate = triggerOnScroll ? isVisible : true;

  const animationStyle: React.CSSProperties = {
    animation: shouldAnimate ? `${animation} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none',
    animationDelay: `${delay}ms`,
  };

  return (
    <span
      ref={ref as any}
      className={className}
      style={animationStyle}
    >
      {children}
    </span>
  );
}
