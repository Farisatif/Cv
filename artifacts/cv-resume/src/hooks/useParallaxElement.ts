import { useEffect, useRef } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  offset?: number;
}

export function useParallaxElement<T extends HTMLElement>(
  options: ParallaxOptions = {}
) {
  const {
    speed = 0.5,
    direction = 'up',
    offset = 0,
  } = options;

  const ref = useRef<T>(null);
  const isReducedMotion = useRef(false);

  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    isReducedMotion.current = prefersReduced;

    if (isReducedMotion.current || !ref.current) return;

    const handleScroll = () => {
      if (!ref.current) return;

      const element = ref.current;
      const rect = element.getBoundingClientRect();
      const scrollY = window.scrollY;
      const elementTop = rect.top + scrollY;
      const elementHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // Only apply parallax when element is in view
      if (elementTop + elementHeight < scrollY || elementTop > scrollY + viewportHeight) {
        return;
      }

      const distanceFromCenter = scrollY + viewportHeight / 2 - (elementTop + elementHeight / 2);
      const parallaxOffset = distanceFromCenter * speed;

      let transform = '';
      switch (direction) {
        case 'up':
          transform = `translateY(${parallaxOffset + offset}px)`;
          break;
        case 'down':
          transform = `translateY(${-parallaxOffset + offset}px)`;
          break;
        case 'left':
          transform = `translateX(${parallaxOffset + offset}px)`;
          break;
        case 'right':
          transform = `translateX(${-parallaxOffset + offset}px)`;
          break;
      }

      element.style.transform = transform;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed, direction, offset]);

  return ref;
}
