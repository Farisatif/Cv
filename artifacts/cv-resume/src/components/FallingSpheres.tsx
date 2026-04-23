import { useEffect, useRef } from "react";

/**
 * FallingSpheres — agency-grade physics scene.
 * Soft 3D-looking spheres drop from above with gravity, slight drift,
 * realistic bounce on a virtual floor, and basic inter-ball collisions.
 *
 * Performance: single <canvas>, devicePixelRatio-aware, throttled to rAF,
 * paused when off-screen / tab hidden, honours prefers-reduced-motion,
 * fewer particles on mobile.
 */

type Sphere = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;        // base hue, very narrow palette
  alpha: number;
  spawnDelay: number; // ms before this sphere becomes active
  born: number;       // timestamp activated
  settled: boolean;
};

interface Props {
  /** CSS class for absolute positioning inside the parent (the parent must be relative). */
  className?: string;
  /** Approx ball count on desktop; halved on mobile. */
  count?: number;
  /** Light vs dark palette automatically follows theme. */
}

export default function FallingSpheres({ className = "", count = 18 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      canvas.style.display = "none";
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    const N = Math.max(6, Math.round(isMobile ? count * 0.55 : count));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let spheres: Sphere[] = [];
    let rafId = 0;
    let running = true;
    let startTs = performance.now();

    const isDark = () =>
      document.documentElement.classList.contains("dark") ||
      document.documentElement.dataset.mood === "dark";

    /** Tasteful, narrow palette — blues / cyans / soft amber accents. */
    const PALETTE_LIGHT = [212, 199, 218, 212, 195, 38];
    const PALETTE_DARK  = [212, 199, 218, 212, 195, 38];

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width  = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function init() {
      resize();
      const palette = isDark() ? PALETTE_DARK : PALETTE_LIGHT;
      spheres = Array.from({ length: N }, (_, i) => {
        const r = rand(isMobile ? 7 : 9, isMobile ? 16 : 22);
        return {
          x: rand(r + 6, Math.max(W - r - 6, r + 8)),
          y: -rand(20, 220),
          vx: rand(-0.25, 0.25),
          vy: rand(0.2, 0.6),
          r,
          hue: palette[Math.floor(Math.random() * palette.length)],
          alpha: rand(0.78, 0.95),
          spawnDelay: i * rand(120, 280) + rand(0, 250),
          born: 0,
          settled: false,
        };
      });
      startTs = performance.now();
    }

    /** Resolve overlap & exchange velocities between two circles. */
    function collide(a: Sphere, b: Sphere) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (dist === 0 || dist >= min) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (min - dist) * 0.5;

      // separate
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      // velocity along normal
      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const ma = a.r * a.r;
      const mb = b.r * b.r;

      // 1D elastic exchange (with mild damping)
      const damp = 0.82;
      const newVa = ((va * (ma - mb)) + 2 * mb * vb) / (ma + mb) * damp;
      const newVb = ((vb * (mb - ma)) + 2 * ma * va) / (ma + mb) * damp;

      a.vx += (newVa - va) * nx;
      a.vy += (newVa - va) * ny;
      b.vx += (newVb - vb) * nx;
      b.vy += (newVb - vb) * ny;
    }

    /** Render one sphere with depth: shadow → core gradient → soft highlight → rim. */
    function drawSphere(s: Sphere, dark: boolean) {
      const { x, y, r, hue, alpha } = s;

      // Drop shadow on virtual floor (softer when settled, sharper mid-air)
      const floorY = H - 6;
      const distToFloor = Math.max(0, floorY - y);
      const shadowScale = Math.max(0.35, 1 - distToFloor / (H * 0.9));
      const shadowAlpha = (dark ? 0.32 : 0.18) * shadowScale;
      ctx!.save();
      ctx!.globalAlpha = shadowAlpha;
      ctx!.fillStyle = "#000";
      ctx!.beginPath();
      ctx!.ellipse(x, floorY + 2, r * (0.85 + shadowScale * 0.4), r * 0.28 * shadowScale, 0, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      // Core radial gradient — gives the 3D ball look
      const grd = ctx!.createRadialGradient(
        x - r * 0.35, y - r * 0.4, r * 0.15,
        x, y, r,
      );
      if (dark) {
        grd.addColorStop(0,   `hsla(${hue}, 90%, 78%, ${alpha})`);
        grd.addColorStop(0.55,`hsla(${hue}, 80%, 52%, ${alpha * 0.9})`);
        grd.addColorStop(1,   `hsla(${hue}, 65%, 22%, ${alpha * 0.85})`);
      } else {
        grd.addColorStop(0,   `hsla(${hue}, 95%, 86%, ${alpha})`);
        grd.addColorStop(0.55,`hsla(${hue}, 85%, 60%, ${alpha * 0.9})`);
        grd.addColorStop(1,   `hsla(${hue}, 70%, 38%, ${alpha * 0.85})`);
      }
      ctx!.fillStyle = grd;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();

      // Specular highlight
      const hg = ctx!.createRadialGradient(
        x - r * 0.4, y - r * 0.5, 0,
        x - r * 0.4, y - r * 0.5, r * 0.7,
      );
      hg.addColorStop(0, `hsla(0, 0%, 100%, ${dark ? 0.55 : 0.75})`);
      hg.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx!.fillStyle = hg;
      ctx!.beginPath();
      ctx!.arc(x - r * 0.4, y - r * 0.5, r * 0.7, 0, Math.PI * 2);
      ctx!.fill();

      // Subtle rim light
      ctx!.save();
      ctx!.globalAlpha = dark ? 0.35 : 0.25;
      ctx!.strokeStyle = `hsla(${hue}, 100%, 80%, 1)`;
      ctx!.lineWidth = 0.6;
      ctx!.beginPath();
      ctx!.arc(x, y, r - 0.4, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.restore();
    }

    const GRAVITY = 0.32;
    const FLOOR_RESTITUTION = 0.52;
    const WALL_RESTITUTION  = 0.62;
    const FRICTION = 0.992;
    const SETTLE_THRESHOLD = 0.18;

    function step(now: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);
      const dark = isDark();
      const elapsed = now - startTs;
      const floorY = H - 6;

      // Update
      for (const s of spheres) {
        if (s.spawnDelay > elapsed) continue;
        if (s.born === 0) s.born = now;

        s.vy += GRAVITY;
        // gentle horizontal drift (very slight)
        s.vx += (Math.sin((now * 0.0006) + s.r) * 0.004);
        s.vx *= FRICTION;
        s.x += s.vx;
        s.y += s.vy;

        // walls
        if (s.x - s.r < 0) {
          s.x = s.r;
          s.vx = -s.vx * WALL_RESTITUTION;
        } else if (s.x + s.r > W) {
          s.x = W - s.r;
          s.vx = -s.vx * WALL_RESTITUTION;
        }

        // floor
        if (s.y + s.r > floorY) {
          s.y = floorY - s.r;
          if (Math.abs(s.vy) < SETTLE_THRESHOLD * 4) {
            s.vy = 0;
            s.vx *= 0.86;
            if (Math.abs(s.vx) < SETTLE_THRESHOLD) {
              s.vx = 0;
              s.settled = true;
            }
          } else {
            s.vy = -s.vy * FLOOR_RESTITUTION;
          }
        }
      }

      // Pairwise collisions (O(n²) but n is small)
      for (let i = 0; i < spheres.length; i++) {
        const a = spheres[i];
        if (a.spawnDelay > elapsed) continue;
        for (let j = i + 1; j < spheres.length; j++) {
          const b = spheres[j];
          if (b.spawnDelay > elapsed) continue;
          collide(a, b);
        }
      }

      // Render — sort by y so back ones draw first (gives some depth)
      const visible = spheres
        .filter((s) => s.spawnDelay <= elapsed)
        .sort((a, b) => a.y - b.y);
      for (const s of visible) drawSphere(s, dark);

      rafId = requestAnimationFrame(step);
    }

    function start() {
      if (rafId) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    init();
    start();

    const onResize = () => init();
    const onVis = () => (document.hidden ? stop() : start());

    // Pause when scrolled fully out of view
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);

    // React to theme toggles
    const themeObs = new MutationObserver(() => { /* re-render uses live isDark() each frame */ });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-mood"] });

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      themeObs.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`absolute inset-0 w-full h-full pointer-events-none print:hidden ${className}`}
    />
  );
}
