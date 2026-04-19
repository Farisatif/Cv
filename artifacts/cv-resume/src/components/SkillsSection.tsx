import { useState, useRef, useEffect, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ──────────────────────────────────────────────────────────
const PALETTE = [
  { h: 263, s: 78, l: 68 },
  { h: 217, s: 90, l: 66 },
  { h: 188, s: 88, l: 58 },
  { h: 43,  s: 95, l: 60 },
  { h: 155, s: 80, l: 50 },
  { h: 22,  s: 90, l: 62 },
  { h: 340, s: 80, l: 67 },
] as const;

// ── Level labels ──────────────────────────────────────────────────────────
const LEVEL_LABELS = [
  { min: 0,  max: 39,  en: "Learning",     ar: "متعلم",  hsl: "220 15% 55%" },
  { min: 40, max: 64,  en: "Intermediate", ar: "متوسط",  hsl: "220 90% 60%" },
  { min: 65, max: 84,  en: "Advanced",     ar: "متقدم",  hsl: "263 80% 65%" },
  { min: 85, max: 100, en: "Expert",       ar: "خبير",   hsl: "160 80% 45%" },
];
function getLabel(n: number) {
  return LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0];
}

// ── PRNG ──────────────────────────────────────────────────────────────────
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) || 1;
}
function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Depth system ──────────────────────────────────────────────────────────
type Layer = "fg" | "mg" | "bg";

interface DepthConfig {
  scaleMin: number; scaleMax: number;
  opacityMin: number; opacityMax: number;
  blurMin: number; blurMax: number;
  parallaxSpeed: number;
  durMin: number; durMax: number;
  zIndex: number;
}

const DEPTH: Record<Layer, DepthConfig> = {
  fg: { scaleMin: 1.00, scaleMax: 1.20, opacityMin: 1.00, opacityMax: 1.00, blurMin: 0,   blurMax: 0,   parallaxSpeed: 1.2, durMin: 6,  durMax: 9,  zIndex: 3 },
  mg: { scaleMin: 0.70, scaleMax: 0.90, opacityMin: 0.60, opacityMax: 0.80, blurMin: 0,   blurMax: 0,   parallaxSpeed: 0.7, durMin: 8,  durMax: 11, zIndex: 2 },
  bg: { scaleMin: 0.40, scaleMax: 0.60, opacityMin: 0.30, opacityMax: 0.50, blurMin: 2.0, blurMax: 6.0, parallaxSpeed: 0.4, durMin: 10, durMax: 14, zIndex: 1 },
};

// 8 CSS float animation names (defined in index.css)
const FLOAT_ANIMS = [
  "sk-float-0","sk-float-1","sk-float-2","sk-float-3",
  "sk-float-4","sk-float-5","sk-float-6","sk-float-7",
];

// ── Poisson disc placement ────────────────────────────────────────────────
function poissonDisc(
  count: number,
  w: number, h: number,
  minDist: number,
  mX: number, mY: number,
  seed: number,
): Array<{ x: number; y: number }> {
  const rng = seededRng(seed);
  const pts: Array<{ x: number; y: number }> = [];

  for (let t = 0; t < count * 120 && pts.length < count; t++) {
    const x = mX + rng() * (w - mX * 2);
    const y = mY + rng() * (h - mY * 2);

    // Penalize dead center (< 12% of max radius) — avoid clustering
    const cx = w / 2, cy = h / 2;
    const normDist = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    if (normDist < 0.12 && rng() > 0.12) continue;

    // Minimum distance check
    if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) {
      pts.push({ x, y });
    }
  }

  return pts;
}

// ── Data types ────────────────────────────────────────────────────────────
interface Skill { id: string; name: string; level: number; category: string }

interface PlacedNode {
  skill: Skill;
  layer: Layer;
  cfg: DepthConfig;
  x: number;
  y: number;
  scale: number;
  opacity: number;
  blur: number;
  animName: string;
  animDur: number;
  animDelay: number;
  color: typeof PALETTE[number];
  catIdx: number;
}

function buildNodes(
  skills: Skill[],
  cats: string[],
  isMobile: boolean,
  cw: number, ch: number,
): PlacedNode[] {
  if (cw < 50 || ch < 50) return [];

  const MAX      = isMobile ? 14 : 24;
  const MIN_DIST = isMobile ? 60 : 100;
  const MX       = isMobile ? 24 : 48;
  const MY       = isMobile ? 24 : 48;

  // Sort by level desc, cap to MAX
  const pool = [...skills].sort((a, b) => b.level - a.level).slice(0, MAX);
  const n    = pool.length;

  // Assign depth layers: fg=20%, mg=50%, bg=30%
  const nFg = Math.max(1, Math.round(n * 0.20));
  const nMg = Math.max(1, Math.round(n * 0.50));
  const layers: Layer[] = pool.map((_, i) =>
    i < nFg ? "fg" : i < nFg + nMg ? "mg" : "bg"
  );

  // Generate spread positions
  let pts = poissonDisc(n, cw, ch, MIN_DIST, MX, MY, 53);

  // Shuffle positions (don't let highest-level always get edge, etc.)
  const shRng = seededRng(17);
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(shRng() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

  // Fallback grid if Poisson under-fills
  while (pts.length < n) {
    const i   = pts.length;
    const col = i % 5, row = Math.floor(i / 5);
    pts.push({
      x: MX + col * ((cw - MX * 2) / 4) + (col % 2) * 30,
      y: MY + row * ((ch - MY * 2) / 3),
    });
  }

  return pool.map((skill, i) => {
    const layer = layers[i];
    const cfg   = DEPTH[layer];
    const rng   = seededRng(strHash(skill.id));
    const [r1, r2, r3, r4, r5] = [rng(), rng(), rng(), rng(), rng()];

    const catIdx = Math.max(0, cats.indexOf(skill.category));

    return {
      skill,
      layer,
      cfg,
      x:         pts[i]?.x ?? MX + (i % 6) * 110,
      y:         pts[i]?.y ?? MY + Math.floor(i / 6) * 75,
      scale:     cfg.scaleMin + r1 * (cfg.scaleMax - cfg.scaleMin),
      opacity:   cfg.opacityMin + r2 * (cfg.opacityMax - cfg.opacityMin),
      blur:      cfg.blurMin + r3 * (cfg.blurMax - cfg.blurMin),
      animName:  FLOAT_ANIMS[Math.floor(r4 * FLOAT_ANIMS.length)],
      animDur:   cfg.durMin + r1 * (cfg.durMax - cfg.durMin),
      animDelay: r5 * 5,
      color:     PALETTE[catIdx % PALETTE.length],
      catIdx,
    };
  });
}

// ── Star field ────────────────────────────────────────────────────────────
interface StarData { x0: number; y0: number; r: number; a: number; vx: number; vy: number; twinkleSpeed: number; phase: number; bright: boolean }

function buildStars(count: number): StarData[] {
  const rng = seededRng(42);
  return Array.from({ length: count }, () => ({
    x0: rng(), y0: rng(),
    r: 0.3 + rng() * 1.8,
    a: 0.05 + rng() * 0.35,
    vx: (rng() - 0.5) * 0.000018,
    vy: (rng() - 0.5) * 0.000013,
    twinkleSpeed: 0.0006 + rng() * 0.0016,
    phase: rng() * Math.PI * 2,
    bright: rng() > 0.91,
  }));
}
const STARS = buildStars(200);

function drawFrame(
  ctx: CanvasRenderingContext2D,
  nodes: PlacedNode[],
  w: number, h: number,
  isDark: boolean,
  ts: number,
  scrollVel: number,
) {
  ctx.clearRect(0, 0, w, h);

  // ── Nebula by category centroid ──────────────────────────────────────────
  const catMap = new Map<number, PlacedNode[]>();
  nodes.forEach(n => {
    if (!catMap.has(n.catIdx)) catMap.set(n.catIdx, []);
    catMap.get(n.catIdx)!.push(n);
  });

  if (isDark) {
    // Deep space overlay
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.82);
    bg.addColorStop(0,    "rgba(14,8,38,0.50)");
    bg.addColorStop(0.55, "rgba(4,2,18,0.24)");
    bg.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    const breathe = 0.022 * Math.sin(ts * 0.00027);
    catMap.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx = catNodes.reduce((a, n) => a + n.x, 0) / catNodes.length;
      const cy = catNodes.reduce((a, n) => a + n.y, 0) / catNodes.length;
      const rad = 180 + catNodes.length * 26 + Math.sin(ts * 0.00022 + catIdx) * 18;
      const a0 = Math.max(0, 0.14 + breathe);
      const a1 = Math.max(0, 0.05 + breathe * 0.3);

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0,    `hsla(${ch},${s}%,${l}%,${a0})`);
      g.addColorStop(0.45, `hsla(${ch},${s}%,${l}%,${a1})`);
      g.addColorStop(0.80, `hsla(${ch},${s}%,${l}%,${(a1 * 0.22).toFixed(3)})`);
      g.addColorStop(1,    `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // Secondary offset bloom
      const ox = cx + 50 * Math.cos(ts * 0.000085 + catIdx);
      const oy = cy + 40 * Math.sin(ts * 0.000068 + catIdx + 0.8);
      const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad * 0.55);
      g2.addColorStop(0, `hsla(${ch},${s}%,${Math.min(l + 10, 90)}%,${(a0 * 0.45).toFixed(3)})`);
      g2.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
    });

    // Purple core glow
    const gx = w * (0.50 + 0.032 * Math.cos(ts * 0.000142));
    const gy = h * (0.44 + 0.022 * Math.sin(ts * 0.000182));
    const gc = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.min(w, h) * 0.70);
    gc.addColorStop(0,    "rgba(90,45,240,0.07)");
    gc.addColorStop(0.40, "rgba(38,20,160,0.03)");
    gc.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = gc; ctx.fillRect(0, 0, w, h);

    // Stars
    const velAbs = Math.abs(scrollVel);
    const streak = Math.min(velAbs * 0.55, 16);
    STARS.forEach(star => {
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const tw = 0.62 + 0.38 * Math.sin(ts * star.twinkleSpeed + star.phase);
      const alpha = star.a * tw;
      const r = star.r * (star.bright ? 1.85 : 1);

      ctx.beginPath();
      if (streak > 1.5) {
        ctx.ellipse(nx * w, ny * h, r, r + streak * (0.40 + tw * 0.36), Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,215,255,${(alpha * 0.46).toFixed(3)})`;
      } else {
        ctx.arc(nx * w, ny * h, r, 0, Math.PI * 2);
        ctx.fillStyle = star.bright ? `rgba(255,252,235,${alpha.toFixed(3)})` : `rgba(190,205,255,${alpha.toFixed(3)})`;
      }
      ctx.fill();

      if (star.bright && streak < 2) {
        const halo = ctx.createRadialGradient(nx * w, ny * h, 0, nx * w, ny * h, r * 5);
        halo.addColorStop(0, `rgba(220,235,255,${(alpha * 0.12).toFixed(3)})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(nx * w - r * 6, ny * h - r * 6, r * 12, r * 12);
      }
    });

    // Subtle category connection lines
    catMap.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.060)`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 24]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].x, catNodes[i].y);
        ctx.lineTo(catNodes[i + 1].x, catNodes[i + 1].y);
        ctx.stroke();
      }
      ctx.restore();
    });

  } else {
    // Light mode — subtle blooms only
    const breathe = 0.015 * Math.sin(ts * 0.00027);
    catMap.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx = catNodes.reduce((a, n) => a + n.x, 0) / catNodes.length;
      const cy = catNodes.reduce((a, n) => a + n.y, 0) / catNodes.length;
      const rad = 140 + catNodes.length * 20;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `hsla(${ch},${s}%,${l}%,${Math.max(0, 0.058 + breathe)})`);
      g.addColorStop(0.6, `hsla(${ch},${s}%,${l}%,${Math.max(0, 0.018 + breathe * 0.35)})`);
      g.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    });

    STARS.slice(0, 50).forEach(star => {
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const tw = 0.55 + 0.45 * Math.sin(ts * star.twinkleSpeed + star.phase);
      ctx.beginPath();
      ctx.arc(nx * w, ny * h, star.r * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,40,190,${((0.015 + star.a * 0.03) * tw).toFixed(3)})`;
      ctx.fill();
    });

    catMap.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.075)`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 22]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].x, catNodes[i].y);
        ctx.lineTo(catNodes[i + 1].x, catNodes[i + 1].y);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
}

// ── Galaxy props ──────────────────────────────────────────────────────────
interface GalaxyProps {
  skills: Skill[];
  filter: string;
  allLabel: string;
  lang: "en" | "ar";
  isMobile: boolean;
}

// ── Galaxy component ──────────────────────────────────────────────────────
function SkillGalaxy({ skills, filter, allLabel, lang, isMobile }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const wrapperEls   = useRef<Map<string, HTMLDivElement>>(new Map());
  const dprRef       = useRef(1);
  const animRef      = useRef(0);
  const isDarkRef    = useRef(true);

  const scrollRef = useRef({ vel: 0, prevY: 0, relOffset: 0 });

  const [cw, setCw] = useState(880);
  const [ch, setCh] = useState(520);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const orderedCats = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);

  const nodes = useMemo(
    () => buildNodes(skills, orderedCats, isMobile, cw, ch),
    [skills, orderedCats, isMobile, cw, ch],
  );

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const minH = isMobile ? 380 : 480;
      const maxH = isMobile ? 480 : 580;
      const ratio = isMobile ? 0.82 : 0.60;
      setCw(w);
      setCh(Math.min(maxH, Math.max(minH, Math.round(w * ratio))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  // ── HiDPI canvas ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    dprRef.current = dpr;
    canvas.width  = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [cw, ch, isMobile]);

  // ── RAF: canvas + parallax ────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const raw = window.scrollY - scrollRef.current.prevY;
      scrollRef.current.vel = scrollRef.current.vel * 0.72 + raw * 0.28;
      scrollRef.current.prevY = window.scrollY;
      const rect = container.getBoundingClientRect();
      scrollRef.current.relOffset = -(rect.top + window.scrollY - window.scrollY) + window.scrollY - (window.scrollY - rect.top);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    let lastTs = 0;

    const tick = (ts: number) => {
      animRef.current = requestAnimationFrame(tick);
      if (lastTs === 0) { lastTs = ts; return; }
      lastTs = ts;

      // ── Canvas draw ──────────────────────────────────────────────────────
      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext("2d");
      if (ctx && canvas) {
        const dpr = dprRef.current;
        const ew  = Math.round(cw * dpr);
        const eh  = Math.round(ch * dpr);
        if (canvas.width !== ew || canvas.height !== eh) {
          canvas.width = ew; canvas.height = eh;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        isDarkRef.current = document.documentElement.classList.contains("dark");
        drawFrame(ctx, nodes, cw, ch, isDarkRef.current, ts, scrollRef.current.vel);
      }

      // ── Parallax on wrapper divs ─────────────────────────────────────────
      const rect     = container.getBoundingClientRect();
      const vis      = -rect.top / ch; // 0 = top of section at viewport top
      const vel      = scrollRef.current.vel;
      const velAbs   = Math.abs(vel);
      const isStretch = velAbs > 6;
      const stretchSign = vel > 0 ? 1 : -1;

      nodes.forEach(node => {
        const el = wrapperEls.current.get(node.skill.id);
        if (!el) return;

        const parallaxY = vis * ch * 0.18 * node.cfg.parallaxSpeed;
        const stretchY  = isStretch
          ? stretchSign * Math.min(velAbs * 0.55, 30) * node.cfg.parallaxSpeed
          : 0;

        el.style.transform = `translateY(${(parallaxY + stretchY).toFixed(2)}px)`;
        el.style.transition = isStretch
          ? "transform 0.25s cubic-bezier(0.4,0,0.2,1)"
          : "none";
      });

      // Decay velocity
      scrollRef.current.vel *= 0.85;
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("scroll", onScroll);
    };
  }, [nodes, cw, ch]);

  const wrapRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) wrapperEls.current.set(id, el);
    else wrapperEls.current.delete(id);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: ch, overflow: "hidden" }}
    >
      {/* Atmospheric canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ width: cw, height: ch, top: 0, left: 0 }}
      />

      {/* Feathered edge */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%,
            transparent 28%,
            hsl(var(--background)/0.22) 52%,
            hsl(var(--background)/0.60) 74%,
            hsl(var(--background)/0.88) 90%,
            hsl(var(--background)) 100%
          )`,
        }}
      />

      {/* Skill nodes */}
      {nodes.map(node => {
        const { h: ch, s, l } = node.color;
        const hidden  = filter !== allLabel && node.skill.category !== filter;
        const isHov   = hoveredId === node.skill.id;
        const label   = getLabel(node.skill.level);

        // Base font size per layer before scale
        const baseFontPx = node.layer === "fg" ? 13 : node.layer === "mg" ? 12 : 11;
        const baseOrbPx  = node.layer === "fg" ? 10 : node.layer === "mg" ? 8 : 7;
        const basePadV   = node.layer === "fg" ? 6 : 5;
        const basePadH   = node.layer === "fg" ? 12 : 10;

        const glowBase  = `hsl(${ch},${s}%,${l}%)`;
        const glowOuter = `hsl(${ch},${s}%,${l}%/0.35)`;
        const glowFar   = `hsl(${ch},${s}%,${l}%/0.12)`;

        return (
          <div
            key={node.skill.id}
            ref={wrapRef(node.skill.id)}
            aria-hidden={hidden}
            style={{
              position:    "absolute",
              left:        node.x,
              top:         node.y,
              willChange:  "transform",
              zIndex:      node.cfg.zIndex,
            }}
          >
            {/* Floating inner — CSS @keyframes, no JS transform conflict */}
            <div
              style={{
                animation: `${node.animName} ${node.animDur.toFixed(1)}s ease-in-out infinite ${node.animDelay.toFixed(1)}s both`,
                willChange: "transform",
              }}
            >
              {/* Chip */}
              <div
                role="button"
                tabIndex={hidden ? -1 : 0}
                aria-label={`${node.skill.name} — ${lang === "ar" ? label.ar : label.en} ${node.skill.level}%`}
                onMouseEnter={() => !isMobile && setHoveredId(node.skill.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(node.skill.id)}
                onBlur={() => setHoveredId(null)}
                onTouchStart={() => isMobile && setHoveredId(node.skill.id)}
                onTouchEnd={() => isMobile && setTimeout(() => setHoveredId(null), 700)}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  gap:            `${6 * node.scale}px`,
                  padding:        `${basePadV}px ${basePadH}px`,
                  borderRadius:   999,
                  transform:      `translate(-50%, -50%) scale(${isHov ? node.scale * 1.10 : node.scale})`,
                  opacity:        hidden ? 0 : node.opacity,
                  filter:         node.blur > 0 ? `blur(${node.blur.toFixed(1)}px)` : undefined,
                  background:     isHov
                    ? `hsl(${ch},${s}%,${l}%/0.18)`
                    : `hsl(${ch},${s}%,${l}%/0.08)`,
                  border:         `1px solid hsl(${ch},${s}%,${l}%/${isHov ? "0.48" : "0.20"})`,
                  boxShadow:      isHov
                    ? `0 0 ${14 * node.scale}px ${glowBase}/0.55, 0 0 ${30 * node.scale}px ${glowOuter}, 0 0 ${50 * node.scale}px ${glowFar}`
                    : `0 0 ${8 * node.scale}px ${glowBase}/0.28, 0 0 ${18 * node.scale}px ${glowOuter}`,
                  backdropFilter: "blur(6px)",
                  transition:     "transform 0.2s ease-in-out, opacity 0.35s ease-in-out, box-shadow 0.2s ease-in-out, background 0.2s ease-in-out, border-color 0.2s ease-in-out",
                  pointerEvents:  hidden ? "none" : "auto",
                  cursor:         "default",
                  userSelect:     "none",
                  whiteSpace:     "nowrap",
                }}
              >
                {/* Glow orb */}
                <div
                  aria-hidden="true"
                  style={{
                    width:        `${baseOrbPx}px`,
                    height:       `${baseOrbPx}px`,
                    borderRadius: "50%",
                    flexShrink:   0,
                    background:   `radial-gradient(circle at 34% 34%, hsl(${ch},${s}%,${Math.min(l + 26, 95)}%), ${glowBase})`,
                    boxShadow:    isHov
                      ? `0 0 ${baseOrbPx * 2.2}px ${glowBase}, 0 0 ${baseOrbPx * 5}px ${glowOuter}`
                      : `0 0 ${baseOrbPx * 1.4}px ${glowBase}, 0 0 ${baseOrbPx * 3}px ${glowOuter}`,
                    transition:   "box-shadow 0.2s ease-in-out",
                  }}
                />

                {/* Label */}
                <span
                  style={{
                    fontSize:      `${baseFontPx}px`,
                    fontWeight:    node.skill.level >= 70 ? 700 : 600,
                    letterSpacing: "0.012em",
                    color:         isHov
                      ? `hsl(${ch},${s}%,${Math.min(l + 22, 95)}%)`
                      : "hsl(var(--foreground)/0.82)",
                    textShadow:    isHov
                      ? `0 0 14px hsl(${ch},${s}%,${l}%/0.85), 0 0 30px hsl(${ch},${s}%,${l}%/0.35)`
                      : `0 0 9px hsl(${ch},${s}%,${l}%/0.32)`,
                    transition:    "color 0.2s ease-in-out, text-shadow 0.2s ease-in-out",
                  }}
                >
                  {node.skill.name}
                </span>
              </div>

              {/* Hover tooltip */}
              {isHov && (
                <div
                  aria-hidden="true"
                  style={{
                    position:       "absolute",
                    bottom:         "calc(100% + 14px)",
                    left:           "50%",
                    transform:      "translateX(-50%) translateY(-4px)",
                    width:          156,
                    padding:        "10px 12px",
                    borderRadius:   14,
                    background:     "hsl(var(--card)/0.92)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    border:         `1px solid hsl(${ch},${s}%,${l}%/0.22)`,
                    boxShadow:      `0 8px 40px rgba(0,0,0,0.32), 0 0 22px hsl(${ch},${s}%,${l}%/0.10)`,
                    zIndex:         60,
                    pointerEvents:  "none",
                    animation:      "fade-up 0.15s ease-out forwards",
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.13em", opacity: 0.42, marginBottom: 7 }}>
                    {node.skill.category}
                  </div>
                  <div style={{ height: 3, borderRadius: 3, overflow: "hidden", background: `hsl(${ch},${s}%,${l}%/0.14)`, marginBottom: 8 }}>
                    <div style={{
                      height: "100%", width: `${node.skill.level}%`,
                      background: `linear-gradient(90deg, hsl(${ch},${s}%,${l}%), hsl(${ch},${s}%,${Math.min(l + 18, 90)}%))`,
                      borderRadius: 3, boxShadow: `0 0 8px hsl(${ch},${s}%,${l}%/0.70)`,
                    }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: `hsl(${ch},${s}%,${l}%)`, textShadow: `0 0 9px hsl(${ch},${s}%,${l}%/0.55)` }}>
                      {lang === "ar" ? label.ar : label.en}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: "monospace", opacity: 0.48 }}>{node.skill.level}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────
export default function SkillsSection() {
  const sectionRef      = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data }        = useResumeData();
  const t               = translations[lang];

  const skills   = getSkills(lang, data) as Skill[];
  const [filter, setFilter] = useState("All");
  const allLabel = t.skills.all;

  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const h  = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, []);

  const categories = useMemo(
    () => [allLabel, ...Array.from(new Set(skills.map(s => s.category)))],
    [skills, allLabel],
  );

  useEffect(() => { setFilter(allLabel); }, [lang, allLabel]);

  return (
    <section
      id="skills"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.skills.title}</span>
        <h2 className="section-title mb-3">
          {lang === "ar" ? "مجرة المهارات" : "Skill Galaxy"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {lang === "ar"
            ? "مهاراتي التقنية موزّعة في فضاء مفتوح — مرّر فوق أي نجمة لاستكشافها"
            : "Technical skills distributed across open space — hover any star to explore"}
        </p>
      </div>

      {/* Category filters */}
      <div className={`mb-8 ${isMobile ? "filters-scroll" : `flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}`}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`tag-filter ${filter === cat ? "active" : ""}`}
          >
            {cat === allLabel ? allLabel : cat}
          </button>
        ))}
      </div>

      {/* Galaxy */}
      <div className="galaxy-wrapper">
        <SkillGalaxy
          key={`${lang}-${isMobile}`}
          skills={skills}
          filter={filter}
          allLabel={allLabel}
          lang={lang}
          isMobile={isMobile}
        />
      </div>

      {/* Legend */}
      <div className={`mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {LEVEL_LABELS.map(lvl => (
          <span key={lvl.en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `hsl(${lvl.hsl})`, boxShadow: `0 0 6px hsl(${lvl.hsl}/0.55)` }} />
            {lang === "ar" ? lvl.ar : lvl.en}
          </span>
        ))}
        <span className={`flex items-center gap-1.5 opacity-40 ${isRTL ? "mr-auto" : "ml-auto"}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
          </svg>
          {lang === "ar" ? "يتفاعل مع التمرير" : "Reacts to scroll"}
        </span>
      </div>
    </section>
  );
}
