import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'slideInUp' | 'scaleIn';
  delay?: number;
  duration?: number;
}

export function AnimatedSection({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useRevealOnScroll({
    threshold: 0.1,
    triggerOnce: true,
    delay,
  });

  const animationStyle: React.CSSProperties = {
    animation: isVisible
      ? `${animation} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
      : 'none',
    opacity: isVisible ? 1 : 0,
  };

  return (
    <section
      ref={ref}
      className={className}
      style={animationStyle}
    >
      {children}
    </section>
  );
}
