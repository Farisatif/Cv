import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useElementShine } from '@/hooks/useElementShine';

interface EnhancedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  animation?: 'fadeInUp' | 'fadeInDown' | 'scaleIn' | 'slideInUp';
  enableHover?: boolean;
  enableShine?: boolean;
  enableGlow?: boolean;
  onClick?: () => void;
}

export function EnhancedCard({
  children,
  className = '',
  delay = 0,
  duration = 600,
  animation = 'fadeInUp',
  enableHover = true,
  enableShine = false,
  enableGlow = false,
  onClick,
}: EnhancedCardProps) {
  const { ref: containerRef, isVisible } = useRevealOnScroll({
    threshold: 0.2,
    triggerOnce: true,
    delay,
  });

  const { ref: interactiveRef, handlers } = useMicroInteractions({
    onHover: enableHover,
    onPress: enableHover,
    scale: 1.02,
    duration: 300,
  });

  const shineRef = useElementShine({
    enabled: enableShine,
    duration: 3000,
  });

  const animationStyle: React.CSSProperties = {
    animation: isVisible
      ? `${animation} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
      : 'none',
    opacity: isVisible ? 1 : 0,
  };

  const glowClass = enableGlow ? 'group relative' : '';

  return (
    <div
      ref={containerRef}
      className={glowClass}
      style={animationStyle}
    >
      {enableGlow && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10" />
      )}
      <div
        ref={interactiveRef}
        className={`
          rounded-lg border border-border/50 
          transition-all duration-300
          ${enableHover ? 'hover:border-border hover:shadow-lg' : ''}
          ${className}
        `}
        onClick={onClick}
        {...handlers}
      >
        {children}
      </div>
    </div>
  );
}
