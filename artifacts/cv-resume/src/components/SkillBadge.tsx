import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

interface SkillBadgeProps {
  name: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  icon?: React.ReactNode;
  delay?: number;
  className?: string;
}

export function SkillBadge({
  name,
  level = 'intermediate',
  icon,
  delay = 0,
  className = '',
}: SkillBadgeProps) {
  const { ref, isVisible } = useRevealOnScroll({
    threshold: 0.3,
    triggerOnce: true,
    delay,
  });

  const levelColors = {
    beginner: 'from-green-500/20 to-green-400/10',
    intermediate: 'from-blue-500/20 to-blue-400/10',
    advanced: 'from-purple-500/20 to-purple-400/10',
    expert: 'from-amber-500/20 to-amber-400/10',
  };

  const levelBorder = {
    beginner: 'border-green-200 dark:border-green-800',
    intermediate: 'border-blue-200 dark:border-blue-800',
    advanced: 'border-purple-200 dark:border-purple-800',
    expert: 'border-amber-200 dark:border-amber-800',
  };

  const levelDot = {
    beginner: 'bg-green-500',
    intermediate: 'bg-blue-500',
    advanced: 'bg-purple-500',
    expert: 'bg-amber-500',
  };

  return (
    <div
      ref={ref}
      className={`
        transition-all duration-500 transform
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        ${className}
      `}
    >
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          border ${levelBorder[level]}
          bg-gradient-to-r ${levelColors[level]}
          hover:shadow-lg hover:scale-105
          transition-all duration-300
          group cursor-default
        `}
      >
        {icon && (
          <span className="text-sm group-hover:scale-110 transition-transform">
            {icon}
          </span>
        )}
        <span className="text-sm font-medium">{name}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${levelDot[level]} opacity-70`} />
      </div>
    </div>
  );
}
