import { useRef, useCallback } from 'react';

interface MicroInteractionConfig {
  onHover?: boolean;
  onPress?: boolean;
  scale?: number;
  duration?: number;
}

export function useMicroInteractions<T extends HTMLElement>(
  config: MicroInteractionConfig = {}
) {
  const {
    onHover = true,
    onPress = true,
    scale = 1.02,
    duration = 300,
  } = config;

  const ref = useRef<T>(null);
  const isPressingRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    if (!onHover || !ref.current) return;
    ref.current.style.transition = `all ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    ref.current.style.transform = `scale(${scale})`;
  }, [onHover, scale, duration]);

  const handleMouseLeave = useCallback(() => {
    if (!onHover || !ref.current) return;
    ref.current.style.transform = 'scale(1)';
  }, [onHover]);

  const handleMouseDown = useCallback(() => {
    if (!onPress || !ref.current) return;
    isPressingRef.current = true;
    ref.current.style.transform = `scale(${scale * 0.98})`;
  }, [onPress, scale]);

  const handleMouseUp = useCallback(() => {
    if (!onPress || !ref.current) return;
    isPressingRef.current = false;
    ref.current.style.transform = isPressingRef.current ? `scale(${scale * 0.98})` : `scale(${scale})`;
  }, [onPress, scale]);

  return {
    ref,
    handlers: {
      onMouseEnter: onHover ? handleMouseEnter : undefined,
      onMouseLeave: onHover ? handleMouseLeave : undefined,
      onMouseDown: onPress ? handleMouseDown : undefined,
      onMouseUp: onPress ? handleMouseUp : undefined,
    },
  };
}
