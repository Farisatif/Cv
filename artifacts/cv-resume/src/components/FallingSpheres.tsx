import { useEffect, useRef } from "react";

/**
 * FallingSpheres — agency-grade physics scene.
 *
 * Soft, 3D-looking spheres drift down from above with realistic gravity,
 * subtle lateral drift, gentle bouncing, and basic inter-sphere collisions.
 * Render is a single <canvas> for performance, with theme-aware palette,
 * IntersectionObserver pause, devicePixelRatio scaling, and full
 * `prefers-reduced-motion` support.
 */

type Sphere = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  sat: number;
  light: number;
  alpha: number;
  spawnDelay: number;
  born: number;
  settled: boolean;
  bounces: number;
  driftSeed: number;
};

interface Props {
  className?: string;
  /** Approx count on desktop; halved on mobile. Keep small for elegance. */
  count?: number;
}

export default function FallingSpheres({ className = "", count = 14 }: Props) {
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
    const N = Math.max(5, Math.round(isMobile ? count * 0.55 : count));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0;
    let spheres: Sphere[] = [];
    let rafId = 0;
    let running = true;
    let startTs = performance.now();

    const isDark = () =>
      document.documentElement.classList.contains("dark") ||
      document.documentElement.dataset.mood === "dark";

    /** Restrained, sophisticated palette — closer to a brand system than a toy. */
    function pickColor(dark: boolean) {
      // Mostly neutral / cool; one warm accent (amber) appears rarely
      const swatches = dark
        ? [
            { h: 212, s: 80, l: 58 }, // brand blue
            { h: 199, s: 70, l: 56 }, // cyan-blue
            { h: 218, s: 30, l: 70 }, // soft slate
            { h: 220, s: 8,  l: 80 }, // near white
            { h: 38,  s: 88, l: 60 }, // amber accent (rare)
          ]
        : [
            { h: 212, s: 75, l: 52 },
            { h: 199, s: 65, l: 50 },
            { h: 218, s: 18, l: 62 },
            { h: 220, s: 6,  l: 76 },
            { h: 38,  s: 85, l: 55 },
          ];
      // weighted: neutrals/blues 92%, amber accent 8%
      const r = Math.random();
      const idx = r < 0.32 ? 0
                : r < 0.55 ? 1
                : r < 0.78 ? 2
                : r < 0.92 ? 3
                : 4;
      return swatches[idx];
    }

    function rand(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width  = Math.floor(W * dpr);
      canvas!.height = Math.floor(H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      resize();
      const dark = isDark();
      // Spread spheres across width with a small jitter; avoid centre stacking
      const slots = N;
      spheres = Array.from({ length: N }, (_, i) => {
        const slotX = (W * (i + 0.5)) / slots + rand(-W / (slots * 2.2), W / (slots * 2.2));
        const r = rand(isMobile ? 6 : 9, isMobile ? 13 : 18);
        const c = pickColor(dark);
        return {
          x: Math.max(r + 4, Math.min(W - r - 4, slotX)),
          y: -rand(40, 280),
          vx: rand(-0.18, 0.18),
          vy: rand(0.1, 0.45),
          r,
          hue: c.h,
          sat: c.s,
          light: c.l,
          alpha: rand(0.78, 0.92),
          spawnDelay: i * rand(160, 320) + rand(0, 200),
          born: 0,
          settled: false,
          bounces: 0,
          driftSeed: Math.random() * 1000,
        };
      });
      startTs = performance.now();
    }

    function collide(a: Sphere, b: Sphere) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const min = a.r + b.r;
      if (dist === 0 || dist >= min) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = (min - dist) * 0.5;

      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const va = a.vx * nx + a.vy * ny;
      const vb = b.vx * nx + b.vy * ny;
      const ma = a.r * a.r;
      const mb = b.r * b.r;

      // soft elastic exchange — agency feel, not arcade
      const damp = 0.78;
      const newVa = ((va * (ma - mb)) + 2 * mb * vb) / (ma + mb) * damp;
      const newVb = ((vb * (mb - ma)) + 2 * ma * va) / (ma + mb) * damp;

      a.vx += (newVa - va) * nx;
      a.vy += (newVa - va) * ny;
      b.vx += (newVb - vb) * nx;
      b.vy += (newVb - vb) * ny;
    }

    function drawSphere(s: Sphere, dark: boolean) {
      const { x, y, r, hue, sat, light, alpha } = s;
      const floorY = H - 4;

      // Soft elliptical ground shadow — sharper near floor, diffuse mid-air
      const distToFloor = Math.max(0, floorY - y);
      const closeness = Math.max(0.18, 1 - distToFloor / (H * 0.85));
      const shadowAlpha = (dark ? 0.30 : 0.16) * closeness;
      ctx!.save();
      ctx!.globalAlpha = shadowAlpha;
      ctx!.fillStyle = "#000";
      ctx!.beginPath();
      ctx!.ellipse(
        x,
        floorY + 2,
        r * (0.80 + closeness * 0.55),
        r * 0.22 * closeness + 1.5,
        0, 0, Math.PI * 2,
      );
      ctx!.fill();
      ctx!.restore();

      // Core sphere — radial gradient gives depth
      const grd = ctx!.createRadialGradient(
        x - r * 0.32, y - r * 0.38, r * 0.10,
        x, y, r,
      );
      const topL = Math.min(96, light + (dark ? 22 : 28));
      const midL = light;
      const botL = Math.max(12, light - (dark ? 30 : 26));
      grd.addColorStop(0,    `hsla(${hue}, ${sat}%, ${topL}%, ${alpha})`);
      grd.addColorStop(0.55, `hsla(${hue}, ${sat}%, ${midL}%, ${alpha * 0.95})`);
      grd.addColorStop(1,    `hsla(${hue}, ${Math.max(40, sat - 15)}%, ${botL}%, ${alpha * 0.88})`);
      ctx!.fillStyle = grd;
      ctx!.beginPath();
      ctx!.arc(x, y, r, 0, Math.PI * 2);
      ctx!.fill();

      // Specular highlight (top-left)
      const hg = ctx!.createRadialGradient(
        x - r * 0.42, y - r * 0.5, 0,
        x - r * 0.42, y - r * 0.5, r * 0.65,
      );
      hg.addColorStop(0, `hsla(0, 0%, 100%, ${dark ? 0.45 : 0.6})`);
      hg.addColorStop(1, "hsla(0, 0%, 100%, 0)");
      ctx!.fillStyle = hg;
      ctx!.beginPath();
      ctx!.arc(x - r * 0.42, y - r * 0.5, r * 0.65, 0, Math.PI * 2);
      ctx!.fill();

      // Faint rim light — premium, restrained
      ctx!.save();
      ctx!.globalAlpha = dark ? 0.28 : 0.18;
      ctx!.strokeStyle = `hsla(${hue}, 100%, ${dark ? 78 : 70}%, 1)`;
      ctx!.lineWidth = 0.6;
      ctx!.beginPath();
      ctx!.arc(x, y, r - 0.4, 0, Math.PI * 2);
      ctx!.stroke();
      ctx!.restore();
    }

    // Tuned for elegance: slow gravity, soft bounce, quick settle.
    const GRAVITY            = 0.24;
    const FLOOR_RESTITUTION  = 0.42;
    const WALL_RESTITUTION   = 0.55;
    const AIR_FRICTION       = 0.994;
    const SETTLE_THRESHOLD   = 0.22;
    const MAX_BOUNCES        = 4;

    function step(now: number) {
      if (!running) return;
      ctx!.clearRect(0, 0, W, H);
      const dark = isDark();
      const elapsed = now - startTs;
      const floorY = H - 4;

      for (const s of spheres) {
        if (s.spawnDelay > elapsed) continue;
        if (s.born === 0) s.born = now;

        if (!s.settled) {
          s.vy += GRAVITY;
          // Very subtle horizontal drift while airborne (per-sphere phase)
          if (s.y + s.r < floorY - 2) {
            s.vx += Math.sin((now * 0.0005) + s.driftSeed) * 0.0035;
          }
          s.vx *= AIR_FRICTION;
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
            s.bounces++;
            if (Math.abs(s.vy) < SETTLE_THRESHOLD * 4 || s.bounces >= MAX_BOUNCES) {
              s.vy = 0;
              s.vx *= 0.78;
              if (Math.abs(s.vx) < SETTLE_THRESHOLD) {
                s.vx = 0;
                s.settled = true;
              }
            } else {
              s.vy = -s.vy * FLOOR_RESTITUTION;
            }
          }
        }
      }

      // Pairwise collisions — n is small, O(n²) is fine
      for (let i = 0; i < spheres.length; i++) {
        const a = spheres[i];
        if (a.spawnDelay > elapsed) continue;
        for (let j = i + 1; j < spheres.length; j++) {
          const b = spheres[j];
          if (b.spawnDelay > elapsed) continue;
          collide(a, b);
        }
      }

      // Render back-to-front for stacking depth
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

    const themeObs = new MutationObserver(() => { /* live isDark() per frame */ });
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
