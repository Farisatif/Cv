import { useEffect, useState } from 'react';

interface CountOptions {
  end: number;
  duration?: number;
  start?: number;
  decimals?: number;
  triggerOnVisible?: boolean;
}

export function useCountAnimation(options: CountOptions) {
  const {
    end,
    duration = 2000,
    start = 0,
    decimals = 0,
    triggerOnVisible = false,
  } = options;

  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(!triggerOnVisible);

  useEffect(() => {
    if (!isVisible) return;

    let animationFrameId: number;
    let startTime: number | null = null;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const currentCount = start + (end - start) * progress;
      setCount(
        decimals > 0
          ? parseFloat(currentCount.toFixed(decimals))
          : Math.floor(currentCount)
      );

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration, start, decimals, isVisible]);

  return {
    count,
    setIsVisible,
  };
}
