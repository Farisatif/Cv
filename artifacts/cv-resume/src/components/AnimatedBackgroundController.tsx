import { useEffect, useRef } from 'react';

interface AnimatedBackgroundControllerProps {
  mood: 'dark' | 'light';
}

export default function AnimatedBackgroundController({ mood }: AnimatedBackgroundControllerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Ensure proper z-index management for background layers
    const updateBackgroundLayers = () => {
      const background = document.getElementById('bg-aurora');
      const grid = document.getElementById('bg-grid');
      
      if (background) {
        background.style.zIndex = '0';
        background.style.pointerEvents = 'none';
        background.style.position = 'fixed';
        background.style.inset = '0';
      }
      if (grid) {
        grid.style.zIndex = '1';
        grid.style.pointerEvents = 'none';
        grid.style.position = 'fixed';
        grid.style.inset = '0';
      }
    };

    updateBackgroundLayers();

    // Handle theme change detection
    const handleMoodChange = () => {
      const html = document.documentElement;
      
      // Update CSS variables for color inversion
      if (mood === 'dark') {
        html.setAttribute('data-mood', 'dark');
        html.classList.add('dark');
      } else {
        html.removeAttribute('data-mood');
        html.classList.remove('dark');
      }

      // Force repaint of background elements
      updateBackgroundLayers();
    };

    handleMoodChange();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      updateBackgroundLayers();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [mood]);

  return (
    <>
      {/* Fixed background layer - never disappears */}
      <div
        id="bg-aurora"
        className="aurora"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
      {/* Grid overlay - persistent */}
      <div
        id="bg-grid"
        className="bg-grid"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Content will sit above this layer */}
      <div ref={containerRef} style={{ position: 'relative', zIndex: 2 }} />
    </>
  );
}
