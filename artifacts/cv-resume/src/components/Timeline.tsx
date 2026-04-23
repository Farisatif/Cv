import React from 'react';
import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  description?: string;
  details?: string[];
  icon?: React.ReactNode;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({
  items,
  className = '',
}: TimelineProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent/50 via-accent/30 to-accent/0" />

      {/* Timeline items */}
      <div className="space-y-8">
        {items.map((item, index) => (
          <TimelineItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  item,
  index,
}: {
  item: TimelineItem;
  index: number;
}) {
  const { ref, isVisible } = useRevealOnScroll({
    threshold: 0.2,
    triggerOnce: true,
    delay: index * 100,
  });

  return (
    <div
      ref={ref}
      className={`relative pl-16 transition-all duration-600 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Timeline dot */}
      <div className="absolute left-0 top-1 w-12 h-12 rounded-full border-2 border-accent bg-card flex items-center justify-center shadow-md">
        {item.icon ? (
          <span className="text-lg">{item.icon}</span>
        ) : (
          <div className="w-2 h-2 rounded-full bg-accent" />
        )}
      </div>

      {/* Content */}
      <div className="group cursor-pointer">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h3 className="font-semibold text-base group-hover:text-accent transition-colors">
              {item.title}
            </h3>
            {item.subtitle && (
              <p className="text-sm text-muted-foreground">
                {item.subtitle}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
            {item.date}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground mb-2">
            {item.description}
          </p>
        )}

        {item.details && item.details.length > 0 && (
          <ul className="space-y-1">
            {item.details.map((detail, i) => (
              <li
                key={i}
                className="text-sm text-muted-foreground flex gap-2"
              >
                <span className="text-accent">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
