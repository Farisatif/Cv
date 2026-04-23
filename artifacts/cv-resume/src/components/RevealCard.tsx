import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useElementShine } from '@/hooks/useElementShine';

interface RevealCardProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'fadeInDown' | 'scaleIn' | 'slideInUp';
  delay?: number;
  duration?: number;
  hoverEffect?: boolean;
  shineEffect?: boolean;
  onClick?: () => void;
}

export function RevealCard({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 600,
  hoverEffect = true,
  shineEffect = false,
  onClick,
}: RevealCardProps) {
  const { ref: revealRef, isVisible } = useRevealOnScroll({
    threshold: 0.2,
    triggerOnce: true,
    delay,
  });

  const { ref: interactiveRef, handlers } = useMicroInteractions({
    onHover: hoverEffect,
    onPress: hoverEffect,
    scale: 1.02,
    duration: 300,
  });

  const shineRef = useElementShine({
    enabled: shineEffect,
    duration: 3000,
  });

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (revealRef.current && interactiveRef.current && shineRef.current) {
      // Merge all refs
      const element = revealRef.current;
      if (element) {
        revealRef.current = element;
        interactiveRef.current = element;
        shineRef.current = element;
      }
    }
  }, [revealRef, interactiveRef, shineRef]);

  const animationStyle: React.CSSProperties = {
    animation: isVisible ? `${animation} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards` : 'none',
    opacity: isVisible ? 1 : 0,
  };

  return (
    <div
      ref={containerRef}
      className={`${className}`}
      style={animationStyle}
      onClick={onClick}
      {...handlers}
    >
      {children}
    </div>
  );
}
