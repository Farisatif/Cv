import React from 'react';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

interface InteractiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animation?: 'scale' | 'glow' | 'shimmer';
  className?: string;
}

export function InteractiveButton({
  children,
  variant = 'primary',
  size = 'md',
  animation = 'scale',
  className = '',
  ...props
}: InteractiveButtonProps) {
  const { ref, handlers } = useMicroInteractions({
    onHover: true,
    onPress: true,
    scale: 1.03,
    duration: 300,
  });

  const baseStyles = 'font-medium transition-all duration-300 relative overflow-hidden';

  const variantStyles = {
    primary: 'bg-foreground text-background hover:shadow-lg',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'text-foreground hover:bg-muted/20',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };

  const animationClass = {
    scale: 'active:scale-95',
    glow: 'active:shadow-glow',
    shimmer: 'active:opacity-90',
  }[animation];

  return (
    <button
      ref={ref}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${animationClass}
        ${className}
      `}
      {...handlers}
      {...props}
    >
      {children}
    </button>
  );
}
