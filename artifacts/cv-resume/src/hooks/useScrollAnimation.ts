import { useEffect, useRef, useCallback } from "react";

/**
 * useScrollAnimation
 * 
 * Triggers CSS class "in-view" when element enters viewport.
 * Uses IntersectionObserver for performance optimization.
 * Supports custom threshold and root margin.
 */

interface UseScrollAnimationOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean; // Remove observer after first trigger
}

export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
) {
  const { 
    threshold = 0.15,
    rootMargin = "0px 0px -100px 0px",
    triggerOnce = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            hasTriggered.current = true;
            
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            // Allow re-triggering on scroll back up if triggerOnce is false
            entry.target.classList.remove("in-view");
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return ref;
}

/**
 * useScrollAnimationGroup
 * 
 * For animating multiple child elements with staggered effects.
 * Adds "in-view" class to parent, which CSS rules then animate children.
 */

export function useScrollAnimationGroup(
  options: UseScrollAnimationOptions = {}
) {
  const { 
    threshold = 0.1,
    rootMargin = "0px 0px -80px 0px",
    triggerOnce = false,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            hasTriggered.current = true;
            
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            entry.target.classList.remove("in-view");
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return ref;
}
