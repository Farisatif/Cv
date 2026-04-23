import { useRef, useEffect } from 'react';

interface ShineOptions {
  enabled?: boolean;
  duration?: number;
  angle?: number;
}

export function useElementShine<T extends HTMLElement>(
  options: ShineOptions = {}
) {
  const {
    enabled = true,
    duration = 3000,
    angle = 45,
  } = options;

  const ref = useRef<T>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const element = ref.current;
    const style = document.createElement('style');
    const id = `shine-${Math.random().toString(36).substr(2, 9)}`;

    style.textContent = `
      .${id} {
        position: relative;
        overflow: hidden;
      }

      .${id}::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          ${angle}deg,
          transparent 0%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 100%
        );
        animation: shine-${id} ${duration}ms ease-in-out infinite;
        pointer-events: none;
      }

      @keyframes shine-${id} {
        0% {
          transform: translateX(-100%) translateY(-100%);
        }
        100% {
          transform: translateX(100%) translateY(100%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .${id}::before {
          animation: none;
        }
      }
    `;

    document.head.appendChild(style);
    element.classList.add(id);

    return () => {
      element.classList.remove(id);
      document.head.removeChild(style);
    };
  }, [enabled, duration, angle]);

  return ref;
}
