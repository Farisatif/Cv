import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  mass: number;
  opacity: number;
  rotationSpeed: number;
  rotation: number;
}

interface TitleBackgroundAnimationProps {
  mood: 'dark' | 'light';
}

export default function TitleBackgroundAnimation({ mood }: TitleBackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { antialias: true });
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    updateCanvasSize();

    // Initialize physics-based particles
    if (particlesRef.current.length === 0) {
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width * 0.8 + canvas.width * 0.1,
          y: Math.random() * canvas.height * 0.6 + canvas.height * 0.1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 60 + 30,
          mass: Math.random() * 1.5 + 1,
          opacity: Math.random() * 0.5 + 0.15,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          rotation: Math.random() * Math.PI * 2,
        });
      }
    }

    const gravity = 0.0015;
    const friction = 0.98;
    const bounceElasticity = 0.7;
    const repulsionForce = 0.8;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear canvas with semi-transparent background
      ctx.fillStyle = mood === 'dark' 
        ? 'rgba(0, 0, 0, 0.1)' 
        : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;

      // Physics simulation
      particles.forEach((p, i) => {
        // Apply gravity
        p.vy += gravity * p.mass;

        // Apply friction
        p.vx *= friction;
        p.vy *= friction;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Rotation
        p.rotation += p.rotationSpeed;

        // Boundary conditions
        if (p.x - p.size < 0) {
          p.x = p.size;
          p.vx *= -bounceElasticity;
        }
        if (p.x + p.size > width) {
          p.x = width - p.size;
          p.vx *= -bounceElasticity;
        }
        if (p.y - p.size < 0) {
          p.y = p.size;
          p.vy *= -bounceElasticity;
        }
        if (p.y + p.size > height) {
          p.y = height - p.size;
          p.vy *= -bounceElasticity;
        }

        // Repulsion between particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = p.size + other.size;

          if (dist < minDist && dist > 0) {
            const angle = Math.atan2(dy, dx);
            const force = (minDist - dist) * repulsionForce * 0.01;
            p.vx -= Math.cos(angle) * force;
            p.vy -= Math.sin(angle) * force;
            other.vx += Math.cos(angle) * force;
            other.vy += Math.sin(angle) * force;
          }
        }
      });

      // Draw particles
      particles.forEach((p) => {
        // Draw glowing orb
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

        if (mood === 'dark') {
          gradient.addColorStop(0, `hsla(210, 100%, 50%, ${p.opacity * 0.9})`);
          gradient.addColorStop(0.5, `hsla(280, 100%, 50%, ${p.opacity * 0.4})`);
          gradient.addColorStop(1, `hsla(210, 100%, 50%, 0)`);
        } else {
          gradient.addColorStop(0, `hsla(215, 70%, 45%, ${p.opacity * 0.6})`);
          gradient.addColorStop(0.5, `hsla(280, 85%, 45%, ${p.opacity * 0.2})`);
          gradient.addColorStop(1, `hsla(215, 70%, 45%, 0)`);
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw secondary glow
        ctx.strokeStyle = mood === 'dark'
          ? `hsla(210, 100%, 50%, ${p.opacity * 0.2})`
          : `hsla(215, 70%, 45%, ${p.opacity * 0.1})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw connecting lines between nearby particles
      ctx.strokeStyle = mood === 'dark'
        ? 'hsla(210, 100%, 50%, 0.08)'
        : 'hsla(215, 70%, 45%, 0.05)';
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 200 && dist > 0) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.globalAlpha = (1 - dist / 200) * 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Handle resize
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [mood]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-96"
      style={{
        background: mood === 'dark' 
          ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,5,30,0.9) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(245,250,255,0.95) 100%)',
        display: 'block',
      }}
    />
  );
}
