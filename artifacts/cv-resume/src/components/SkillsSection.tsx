import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ─────────────────────────────────────────────────────────
const PALETTE = [
  { h: 263, s: 78, l: 65 },
  { h: 217, s: 90, l: 63 },
  { h: 188, s: 88, l: 55 },
  { h: 43,  s: 95, l: 58 },
  { h: 155, s: 80, l: 48 },
  { h: 22,  s: 90, l: 60 },
  { h: 340, s: 80, l: 65 },
] as const;

const LEVEL_LABELS = [
  { min: 0,  max: 39,  en: "Learning",     ar: "متعلم",  hsl: "220 15% 55%" },
  { min: 40, max: 64,  en: "Intermediate", ar: "متوسط",  hsl: "220 90% 60%" },
  { min: 65, max: 84,  en: "Advanced",     ar: "متقدم",  hsl: "263 80% 65%" },
  { min: 85, max: 100, en: "Expert",       ar: "خبير",   hsl: "160 80% 45%" },
];
function getLabel(n: number) {
  return LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0];
}

// ── PRNG ─────────────────────────────────────────────────────────────────
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) || 1;
}
function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// ── Star field (built once, animated per frame) ───────────────────────────
interface StarData {
  x0: number; y0: number;   // base normalized position [0,1]
  r:  number;               // radius px
  a:  number;               // base alpha
  vx: number; vy: number;   // drift velocity (normalized per ms)
  twinkleSpeed: number;
  phase: number;
  bright: boolean;
}

function buildStarField(count: number): StarData[] {
  const rng = seededRng(42);
  return Array.from({ length: count }, () => ({
    x0:          rng(),
    y0:          rng(),
    r:           0.28 + rng() * 1.65,
    a:           0.04 + rng() * 0.30,
    vx:          (rng() - 0.5) * 0.000022,   // very slow, anywhere on screen
    vy:          (rng() - 0.5) * 0.000017,
    twinkleSpeed: 0.0007 + rng() * 0.0018,
    phase:        rng() * Math.PI * 2,
    bright:       rng() > 0.93,
  }));
}

const STAR_FIELD = buildStarField(160);

// ── Skill data types ──────────────────────────────────────────────────────
interface Skill { id: string; name: string; level: number; category: string }

interface GNode extends Skill {
  bx: number; by: number;
  depth: number;
  phase: number; speed: number;
  color: typeof PALETTE[number];
  catIdx: number;
  orbPx: number;
}

function buildNodes(skills: Skill[], cats: string[]): GNode[] {
  const numCats = Math.max(1, cats.length);
  return skills.map(sk => {
    const catIdx = Math.max(0, cats.indexOf(sk.category));
    const rng    = seededRng(strHash(sk.id));
    const [r1, r2, r3, r4, r5] = [rng(), rng(), rng(), rng(), rng()];
    const angle = (catIdx / numCats) * Math.PI * 2 - Math.PI * 0.55;
    const cx = 0.50 + 0.38 * Math.cos(angle);
    const cy = 0.50 + 0.30 * Math.sin(angle);
    const sc = 0.20;
    return {
      ...sk,
      bx:     Math.max(0.06, Math.min(0.92, cx + (r1 - 0.5) * sc * 2.2)),
      by:     Math.max(0.08, Math.min(0.89, cy + (r2 - 0.5) * sc * 1.9)),
      depth:  0.10 + r3 * 0.80,
      phase:  r4 * Math.PI * 2,
      speed:  0.00022 + r5 * 0.00032,
      color:  PALETTE[catIdx % PALETTE.length],
      catIdx,
      orbPx:  sk.level >= 80 ? 14 : sk.level >= 60 ? 11 : sk.level >= 40 ? 9 : 7,
    };
  });
}

// ── Nebula category centroid clusters ─────────────────────────────────────
function getCatCentroids(nodes: GNode[]) {
  const map = new Map<number, GNode[]>();
  nodes.forEach(n => {
    if (!map.has(n.catIdx)) map.set(n.catIdx, []);
    map.get(n.catIdx)!.push(n);
  });
  return map;
}

// ── Canvas draw — called every animation frame ─────────────────────────────
function drawFrame(
  ctx:      CanvasRenderingContext2D,
  nodes:    GNode[],
  w:        number,
  h:        number,
  isDark:   boolean,
  ts:       number,   // timestamp ms
  scrollVel: number,  // px/frame
) {
  ctx.clearRect(0, 0, w, h);

  const byCat = getCatCentroids(nodes);

  if (isDark) {
    // Slowly breathing nebula clouds
    const breathe = 0.028 * Math.sin(ts * 0.00032);   // ±2.8% opacity pulse
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      const rad = 145 + catNodes.length * 24 + Math.sin(ts * 0.00028 + catIdx) * 18;
      const a0  = Math.max(0, 0.20 + breathe);
      const a1  = Math.max(0, 0.08 + breathe * 0.5);
      const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0,    `hsla(${ch},${s}%,${l}%,${a0})`);
      g.addColorStop(0.48, `hsla(${ch},${s}%,${l}%,${a1})`);
      g.addColorStop(1,    `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    // Deep central glow — slow rotation
    const gx = w * (0.5 + 0.04 * Math.cos(ts * 0.00018));
    const gy = h * (0.46 + 0.03 * Math.sin(ts * 0.00022));
    const gc = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.min(w, h) * 0.66);
    gc.addColorStop(0,    "rgba(100,58,255,0.07)");
    gc.addColorStop(0.45, "rgba(48,28,180,0.035)");
    gc.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = gc;
    ctx.fillRect(0, 0, w, h);

    // Animated star field — stars drift and wrap across entire screen
    const velAbs = Math.abs(scrollVel);
    const streak = Math.min(velAbs * 0.55, 14); // light-speed trails on fast scroll

    STAR_FIELD.forEach(star => {
      // Wrap position so stars move across the full canvas
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const sx = nx * w;
      const sy = ny * h;

      // Twinkle: smooth sinusoidal brightness
      const twinkle = 0.65 + 0.35 * Math.sin(ts * star.twinkleSpeed + star.phase);
      const alpha   = star.a * twinkle;
      const radius  = star.r * (star.bright ? 1.8 : 1);

      ctx.beginPath();
      if (streak > 1.2) {
        // Elongate stars in scroll direction — cinematic light-speed effect
        ctx.ellipse(sx, sy, radius, radius + streak * (0.4 + twinkle * 0.4), Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(205,215,255,${alpha * 0.5})`;
      } else {
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = star.bright
          ? `rgba(255,252,240,${alpha})`
          : `rgba(195,205,255,${alpha})`;
      }
      ctx.fill();

      // Bright stars get a soft halo
      if (star.bright && streak < 2) {
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 5);
        halo.addColorStop(0, `rgba(220,230,255,${alpha * 0.12})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(sx - radius * 5, sy - radius * 5, radius * 10, radius * 10);
      }
    });

    // Constellation lines within categories
    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.09)`;
      ctx.lineWidth   = 0.55;
      ctx.setLineDash([2, 18]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].bx * w, catNodes[i].by * h);
        ctx.lineTo(catNodes[i+1].bx * w, catNodes[i+1].by * h);
        ctx.stroke();
      }
      ctx.restore();
    });

  } else {
    // Light mode: warm drifting particles
    STAR_FIELD.slice(0, 60).forEach(star => {
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const tw = 0.6 + 0.4 * Math.sin(ts * star.twinkleSpeed + star.phase);
      ctx.beginPath();
      ctx.arc(nx * w, ny * h, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,50,200,${(0.022 + star.a * 0.04) * tw})`;
      ctx.fill();
    });

    // Soft nebula halos
    const breathe = 0.02 * Math.sin(ts * 0.00030);
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      const rad = 100 + catNodes.length * 18;
      const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `hsla(${ch},${s}%,${l}%,${Math.max(0, 0.06 + breathe)})`);
      g.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    // Light mode constellation lines
    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.11)`;
      ctx.lineWidth   = 0.55;
      ctx.setLineDash([2, 18]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].bx * w, catNodes[i].by * h);
        ctx.lineTo(catNodes[i+1].bx * w, catNodes[i+1].by * h);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
}

// ── Galaxy component ──────────────────────────────────────────────────────
interface GalaxyProps {
  skills: Skill[];
  filter: string;
  allLabel: string;
  lang: "en" | "ar";
}

// Spring state for physically accurate, critically-damped scroll
interface Spring {
  pos: number;
  vel: number;
}

function SkillGalaxy({ skills, filter, allLabel, lang }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const dprRef       = useRef(1);
  const nodeEls      = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll spring — second order dynamics for physically correct smoothing
  const scrollTarget  = useRef(0);
  const spring        = useRef<Spring>({ pos: 0, vel: 0 });
  const sectionMidY   = useRef(0);
  const prevScrollY   = useRef(0);
  const scrollVelRef  = useRef(0);

  const animId        = useRef(0);
  const lastTsRef     = useRef(0);
  const hoveredRef    = useRef<string | null>(null);
  const isDarkRef     = useRef(true);
  const mouseRef      = useRef({ x: 0.5, y: 0.5 });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cw, setCw]               = useState(800);
  const [ch, setCh]               = useState(520);

  const orderedCats = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);
  const nodes       = useMemo(() => buildNodes(skills, orderedCats), [skills, orderedCats]);

  // ── Resize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => {
      const w = e[0].contentRect.width;
      const h = Math.min(620, Math.max(440, w * 0.62));
      setCw(w); setCh(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas setup (resize only) ───────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width  = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, [cw, ch]);

  // ── Scroll + mouse listeners ─────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const rawVel = window.scrollY - prevScrollY.current;
      // Exponential moving average for scroll velocity
      scrollVelRef.current = scrollVelRef.current * 0.75 + rawVel * 0.25;
      prevScrollY.current  = window.scrollY;
      scrollTarget.current = window.scrollY - sectionMidY.current;
    };
    const onMouse = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top)  / r.height,
      };
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  // ── Main animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMid = () => {
      const r = container.getBoundingClientRect();
      sectionMidY.current = r.top + window.scrollY + ch * 0.5;
      // Re-sync scroll target immediately
      scrollTarget.current = window.scrollY - sectionMidY.current;
    };
    updateMid();
    window.addEventListener("scroll", updateMid, { passive: true });
    window.addEventListener("resize", updateMid, { passive: true });

    // Spring constants — critically damped (no overshoot)
    // stiffness=200, damping=2*sqrt(200)≈28.3 → exactly critical
    const STIFFNESS = 200;
    const DAMPING   = 28.6;

    // Node motion config
    const P_NEAR    = 0.30;   // parallax factor for depth=1 (near)
    const P_FAR     = 0.036;  // parallax factor for depth=0 (far)
    const DRIFT     = 18;     // px float amplitude
    const MX_MOUSE  = 14;     // px max mouse influence

    const tick = (ts: number) => {
      animId.current = requestAnimationFrame(tick);

      // Stable dt capped at 50ms (handles tab switching, slow machines)
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.050);
      lastTsRef.current = ts;
      if (dt <= 0) return;

      // ── Spring integration — second-order dynamics ─────────────────────
      const sp = spring.current;
      const err = scrollTarget.current - sp.pos;
      const acc = err * STIFFNESS - sp.vel * DAMPING;
      sp.vel += acc * dt;
      sp.pos += sp.vel * dt;

      // ── Canvas redraw every frame (stars drift independently) ──────────
      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext("2d");
      if (ctx && canvas) {
        const dpr = dprRef.current;
        // Only reset scale if canvas was resized
        const expectedW = Math.round(cw * dpr);
        const expectedH = Math.round(ch * dpr);
        if (canvas.width !== expectedW || canvas.height !== expectedH) {
          canvas.width  = expectedW;
          canvas.height = expectedH;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        isDarkRef.current = document.documentElement.classList.contains("dark");
        drawFrame(ctx, nodes, cw, ch, isDarkRef.current, ts, scrollVelRef.current);
      }

      // Decay scroll velocity toward zero
      scrollVelRef.current *= 0.88;

      // ── Skill node positioning ─────────────────────────────────────────
      const mx = mouseRef.current.x - 0.5;
      const my = mouseRef.current.y - 0.5;

      nodes.forEach(node => {
        const el = nodeEls.current.get(node.id);
        if (!el) return;

        // Organic drift
        const dX = Math.sin(ts * node.speed + node.phase) * DRIFT;
        const dY = Math.cos(ts * node.speed * 0.72 + node.phase + 1.4) * DRIFT * 0.72;

        // Parallax from spring position
        const pFactor = P_FAR + node.depth * (P_NEAR - P_FAR);
        const pY      = sp.pos * pFactor;

        // Mouse parallax (deeper = more affected)
        const mxShift = mx * MX_MOUSE * (0.3 + node.depth * 0.7);
        const myShift = my * MX_MOUSE * (0.3 + node.depth * 0.7) * 0.55;

        el.style.transform =
          `translate(calc(-50% + ${(dX + mxShift).toFixed(2)}px), calc(-50% + ${(dY + pY + myShift).toFixed(2)}px))`;
      });
    };

    // Sync spring initial pos to current scroll
    spring.current.pos = window.scrollY - sectionMidY.current;
    spring.current.vel = 0;
    scrollTarget.current = spring.current.pos;

    animId.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener("scroll", updateMid);
      window.removeEventListener("resize", updateMid);
    };
  }, [nodes, ch, cw]);

  const nodeRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) nodeEls.current.set(id, el);
      else    nodeEls.current.delete(id);
    },
    [],
  );

  const onHover = (id: string | null) => {
    hoveredRef.current = id;
    setHoveredId(id);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: ch, overflow: "visible" }}
    >
      {/* Nebula canvas — clipped, dissolves into page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        {/* Atmospheric edge fade */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(ellipse 100% 95% at 50% 50%, transparent 36%, hsl(var(--background)/0.52) 66%, hsl(var(--background)/0.86) 84%, hsl(var(--background)) 100%)",
        }} />
      </div>

      {/* Floating skill orbs */}
      {nodes.map(node => {
        const hidden = filter !== allLabel && node.category !== filter;
        const isHov  = hoveredId === node.id;
        const { h, s, l } = node.color;
        const o = node.orbPx;
        const lbl = getLabel(node.level);
        const hlColor     = `hsl(${h},${Math.min(s+10,100)}%,${Math.min(l+22,94)}%)`;
        const glowInner   = `hsl(${h},${s}%,${l}%)`;
        const glowOuter   = `hsl(${h},${s}%,${l}%/0.35)`;
        const glowFarOut  = `hsl(${h},${s}%,${l}%/0.12)`;

        return (
          <div
            key={node.id}
            ref={nodeRef(node.id)}
            style={{
              position:    "absolute",
              left:        `${node.bx * 100}%`,
              top:         `${node.by * 100}%`,
              willChange:  "transform",
              zIndex:      isHov ? 50 : 4,
              opacity:     hidden ? 0 : 1,
              transition:  "opacity 0.45s ease",
              pointerEvents: hidden ? "none" : "auto",
            }}
          >
            <div
              className="flex items-center"
              style={{ gap: 9, cursor: "default", userSelect: "none" }}
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onTouchStart={e => { e.stopPropagation(); onHover(node.id); }}
              onTouchEnd={() => setTimeout(() => onHover(null), 1800)}
            >
              {/* Glowing orb — sphere of light, no rectangle */}
              <div
                style={{
                  width:        o,
                  height:       o,
                  borderRadius: "50%",
                  flexShrink:   0,
                  background:   `radial-gradient(circle at 33% 33%, ${hlColor} 0%, ${glowInner} 55%, hsl(${h},${s}%,${Math.max(l-14,18)}%) 100%)`,
                  boxShadow:    isHov
                    ? `0 0 ${o*2}px ${glowInner}, 0 0 ${o*5}px ${glowOuter}, 0 0 ${o*12}px ${glowFarOut}`
                    : `0 0 ${o*1.4}px ${glowInner}, 0 0 ${o*3.5}px ${glowOuter}`,
                  transition:   "box-shadow 0.35s ease, transform 0.35s ease",
                  transform:    isHov ? "scale(1.75)" : "scale(1)",
                }}
              />

              {/* Floating text label — no background, pure glow */}
              <span
                style={{
                  fontSize:      node.level >= 72 ? "12px" : "11px",
                  fontWeight:    node.level >= 65 ? 700 : 600,
                  letterSpacing: "0.01em",
                  whiteSpace:    "nowrap",
                  color:         isHov
                    ? `hsl(${h},${s}%,${Math.min(l+16,92)}%)`
                    : "hsl(var(--foreground)/0.82)",
                  textShadow:    isHov
                    ? `0 0 14px hsl(${h},${s}%,${l}%/0.85), 0 0 28px hsl(${h},${s}%,${l}%/0.40)`
                    : `0 0 8px hsl(${h},${s}%,${l}%/0.35)`,
                  transition:    "color 0.3s ease, text-shadow 0.3s ease",
                }}
              >
                {node.name}
              </span>
            </div>

            {/* Hover panel */}
            {isHov && (
              <div
                style={{
                  position:       "absolute",
                  bottom:         "calc(100% + 16px)",
                  left:           "50%",
                  transform:      "translateX(-50%)",
                  width:          "168px",
                  padding:        "10px 13px",
                  borderRadius:   "14px",
                  background:     "hsl(var(--card)/0.90)",
                  backdropFilter: "blur(20px)",
                  border:         `1px solid hsl(${h},${s}%,${l}%/0.32)`,
                  boxShadow:      `0 8px 40px rgba(0,0,0,0.38), 0 0 24px hsl(${h},${s}%,${l}%/0.14)`,
                  zIndex:         60,
                  pointerEvents:  "none",
                }}
              >
                <div style={{
                  fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.12em", opacity: 0.5, marginBottom: 7,
                }}>
                  {node.category}
                </div>
                <div style={{
                  width: "100%", height: 3, borderRadius: 3, overflow: "hidden",
                  background: `hsl(${h},${s}%,${l}%/0.14)`, marginBottom: 7,
                }}>
                  <div style={{
                    height: "100%", width: `${node.level}%`,
                    background: `linear-gradient(90deg, hsl(${h},${s}%,${l}%), hsl(${h},${s}%,${Math.min(l+16,88)}%))`,
                    borderRadius: 3,
                    boxShadow: `0 0 7px hsl(${h},${s}%,${l}%/0.75)`,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: `hsl(${h},${s}%,${l}%)`, textShadow: `0 0 8px hsl(${h},${s}%,${l}%/0.5)` }}>
                    {lang === "ar" ? lbl.ar : lbl.en}
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", opacity: 0.55 }}>
                    {node.level}%
                  </span>
                </div>
              </div>
            )}
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
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.skills.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-2">
          {lang === "ar" ? "مجرة المهارات" : "Skill Galaxy"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {lang === "ar"
            ? "مهاراتي التقنية تطفو في الفضاء المفتوح — مرر فوق أي كوكب لمزيد من التفاصيل"
            : "Technical skills orbiting in open space — hover any star to explore"}
        </p>
      </div>

      <div className={`flex flex-wrap gap-2 mb-8 ${isRTL ? "flex-row-reverse" : ""}`}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`tag-filter ${filter === cat ? "active" : ""}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <SkillGalaxy key={lang} skills={skills} filter={filter} allLabel={allLabel} lang={lang} />

      <div className={`mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {LEVEL_LABELS.map(lvl => (
          <span key={lvl.en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: `hsl(${lvl.hsl})`, boxShadow: `0 0 6px hsl(${lvl.hsl}/0.55)` }}
            />
            {lang === "ar" ? lvl.ar : lvl.en}
          </span>
        ))}
        <span className={`flex items-center gap-1.5 opacity-45 ${isRTL ? "mr-auto" : "ml-auto"}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          {lang === "ar" ? "يتفاعل مع التمرير والفأرة" : "Reacts to scroll & mouse"}
        </span>
      </div>
    </section>
  );
}
