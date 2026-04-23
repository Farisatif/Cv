import { useEffect, useRef, useCallback } from "react";

/**
 * useParallaxScroll
 * 
 * Advanced parallax effect based on scroll position.
 * Element moves at a different speed than viewport scroll.
 * 
 * @param offset - Parallax intensity (0.1-0.5 recommended)
 * @param direction - 'up' (moves slower), 'down' (moves faster)
 */

interface UseParallaxScrollOptions {
  offset?: number;
  direction?: "up" | "down";
  enableOnMobile?: boolean;
}

export function useParallaxScroll<T extends HTMLElement>(
  options: UseParallaxScrollOptions = {}
) {
  const {
    offset = 0.1,
    direction = "up",
    enableOnMobile = false,
  } = options;

  const ref = useRef<T>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Skip on mobile if disabled
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile && !enableOnMobile) return;

    // Check for prefers-reduced-motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let scrollY = window.scrollY;

    const updateParallax = () => {
      const elementTop = element.getBoundingClientRect().top;
      const distance = -scrollY;
      const movement = direction === "up" 
        ? distance * offset 
        : -distance * offset;

      element.style.transform = `translate3d(0, ${movement}px, 0)`;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
      
      // Use requestAnimationFrame for smooth animation
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [offset, direction, enableOnMobile]);

  return ref;
}

/**
 * useScaleParallax
 * 
 * Scale element based on scroll distance.
 * Useful for zoom-in effects as you scroll.
 */

export function useScaleParallax<T extends HTMLElement>(
  options: { minScale?: number; maxScale?: number; triggerDistance?: number } = {}
) {
  const {
    minScale = 0.95,
    maxScale = 1.05,
    triggerDistance = 500,
  } = options;

  const ref = useRef<T>(null);
  const rafId = useRef<number>(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let scrollY = window.scrollY;
    const elementTop = element.getBoundingClientRect().top + scrollY;

    const updateScale = () => {
      const viewportCenter = scrollY + window.innerHeight / 2;
      const distance = Math.abs(viewportCenter - elementTop);
      const progress = Math.max(0, 1 - distance / triggerDistance);
      const scale = minScale + (maxScale - minScale) * progress;

      element.style.transform = `scale3d(${scale}, ${scale}, 1)`;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
      
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(updateScale);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScale(); // Initial call

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [minScale, maxScale, triggerDistance]);

  return ref;
}
