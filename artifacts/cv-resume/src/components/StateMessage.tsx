import React from 'react';

interface StateMessageProps {
  type: 'empty' | 'error' | 'success' | 'warning';
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function StateMessage({
  type,
  title,
  description,
  action,
  className = '',
}: StateMessageProps) {
  const typeStyles = {
    empty: {
      container: 'bg-muted/30 border-border/50',
      icon: '📭',
      titleColor: 'text-foreground/70',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900',
      icon: '⚠️',
      titleColor: 'text-red-900 dark:text-red-200',
    },
    success: {
      container: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900',
      icon: '✓',
      titleColor: 'text-green-900 dark:text-green-200',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900',
      icon: '⚡',
      titleColor: 'text-yellow-900 dark:text-yellow-200',
    },
  };

  const styles = typeStyles[type];

  return (
    <div
      className={`
        rounded-lg border p-6 text-center
        ${styles.container}
        ${className}
        animate-fade-in
      `}
    >
      <div className="text-4xl mb-3">{styles.icon}</div>
      <h3 className={`font-semibold text-lg mb-1 ${styles.titleColor}`}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
