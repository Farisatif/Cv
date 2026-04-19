import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ─────────────────────────────────────────────────────────
const PALETTE = [
  { h: 263, s: 78, l: 68 },
  { h: 217, s: 90, l: 66 },
  { h: 188, s: 88, l: 58 },
  { h: 43,  s: 95, l: 60 },
  { h: 155, s: 80, l: 50 },
  { h: 22,  s: 90, l: 62 },
  { h: 340, s: 80, l: 67 },
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

// ── Star field ────────────────────────────────────────────────────────────
interface StarData {
  x0: number; y0: number;
  r:  number;
  a:  number;
  vx: number; vy: number;
  twinkleSpeed: number;
  phase: number;
  bright: boolean;
}

function buildStarField(count: number): StarData[] {
  const rng = seededRng(42);
  return Array.from({ length: count }, () => ({
    x0:          rng(),
    y0:          rng(),
    r:           0.3 + rng() * 1.8,
    a:           0.05 + rng() * 0.35,
    vx:          (rng() - 0.5) * 0.000018,
    vy:          (rng() - 0.5) * 0.000013,
    twinkleSpeed: 0.0006 + rng() * 0.0016,
    phase:        rng() * Math.PI * 2,
    bright:       rng() > 0.91,
  }));
}

const STAR_FIELD = buildStarField(220);

// ── Skill data types ──────────────────────────────────────────────────────
interface Skill { id: string; name: string; level: number; category: string }

interface GNode extends Skill {
  bx: number; by: number;
  depth: number;
  phase: number; speed: number;
  color: typeof PALETTE[number];
  catIdx: number;
  orbPx: number;
  // dragged offset (in px, relative to canvas container)
  dragDx: number;
  dragDy: number;
}

// Build nodes scattered organically across full canvas
function buildNodes(skills: Skill[], cats: string[]): GNode[] {
  const numCats = Math.max(1, cats.length);
  return skills.map(sk => {
    const catIdx = Math.max(0, cats.indexOf(sk.category));
    const rng    = seededRng(strHash(sk.id));
    const [r1, r2, r3, r4, r5] = [rng(), rng(), rng(), rng(), rng()];

    // Weighted scatter: each category gets a soft zone but nodes spread wide
    const angle = (catIdx / numCats) * Math.PI * 2 + 0.42 * catIdx;
    // Center of gravity for this category (mild pull, not cage)
    const cx = 0.50 + 0.26 * Math.cos(angle);
    const cy = 0.48 + 0.22 * Math.sin(angle);
    // Wide spread with natural randomness
    const spread = 0.34;
    const bx = Math.max(0.04, Math.min(0.94, cx + (r1 - 0.5) * spread * 2.6));
    const by = Math.max(0.05, Math.min(0.92, cy + (r2 - 0.5) * spread * 2.2));

    return {
      ...sk,
      bx,
      by,
      depth:  0.08 + r3 * 0.84,
      phase:  r4 * Math.PI * 2,
      speed:  0.00018 + r5 * 0.00028,
      color:  PALETTE[catIdx % PALETTE.length],
      catIdx,
      orbPx:  sk.level >= 85 ? 16 : sk.level >= 70 ? 13 : sk.level >= 50 ? 10 : 8,
      dragDx: 0,
      dragDy: 0,
    };
  });
}

// ── Nebula centroids ──────────────────────────────────────────────────────
function getCatCentroids(nodes: GNode[]) {
  const map = new Map<number, GNode[]>();
  nodes.forEach(n => {
    if (!map.has(n.catIdx)) map.set(n.catIdx, []);
    map.get(n.catIdx)!.push(n);
  });
  return map;
}

// ── Canvas rendering ───────────────────────────────────────────────────────
function drawFrame(
  ctx:       CanvasRenderingContext2D,
  nodes:     GNode[],
  w:         number,
  h:         number,
  isDark:    boolean,
  ts:        number,
  scrollVel: number,
) {
  ctx.clearRect(0, 0, w, h);
  const byCat = getCatCentroids(nodes);

  if (isDark) {
    // ── Deep space base gradient ──────────────────────────────────────────
    const base = ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, Math.max(w, h) * 0.80);
    base.addColorStop(0,    "rgba(14,8,38,0.55)");
    base.addColorStop(0.55, "rgba(4,2,18,0.28)");
    base.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);

    // ── Category nebula clouds (large, diffuse, overlapping) ─────────────
    const breathe = 0.025 * Math.sin(ts * 0.00028);
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      // Large, very diffuse halos — no hard boundary
      const rad = 220 + catNodes.length * 32 + Math.sin(ts * 0.00024 + catIdx * 1.1) * 26;
      const a0  = Math.max(0, 0.17 + breathe);
      const a1  = Math.max(0, 0.06 + breathe * 0.4);

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0,    `hsla(${ch},${s}%,${l}%,${a0})`);
      g.addColorStop(0.40, `hsla(${ch},${s}%,${l}%,${a1})`);
      g.addColorStop(0.75, `hsla(${ch},${s}%,${l}%,${(a1 * 0.3).toFixed(3)})`);
      g.addColorStop(1,    `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Secondary offset nebula for volume
      const ox = cx + 60 * Math.cos(ts * 0.000095 + catIdx);
      const oy = cy + 45 * Math.sin(ts * 0.000075 + catIdx + 0.9);
      const g2 = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad * 0.65);
      g2.addColorStop(0, `hsla(${ch},${s}%,${Math.min(l + 10, 90)}%,${(a0 * 0.55).toFixed(3)})`);
      g2.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    });

    // ── Central galactic glow ─────────────────────────────────────────────
    const gx = w * (0.50 + 0.035 * Math.cos(ts * 0.000148));
    const gy = h * (0.44 + 0.025 * Math.sin(ts * 0.000188));
    const gc = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.min(w, h) * 0.72);
    gc.addColorStop(0,    "rgba(90,45,240,0.09)");
    gc.addColorStop(0.38, "rgba(38,20,160,0.04)");
    gc.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = gc;
    ctx.fillRect(0, 0, w, h);

    // ── Animated star field ───────────────────────────────────────────────
    const velAbs = Math.abs(scrollVel);
    const streak = Math.min(velAbs * 0.60, 18);

    STAR_FIELD.forEach(star => {
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const sx = nx * w;
      const sy = ny * h;
      const twinkle = 0.60 + 0.40 * Math.sin(ts * star.twinkleSpeed + star.phase);
      const alpha   = star.a * twinkle;
      const radius  = star.r * (star.bright ? 1.9 : 1);

      ctx.beginPath();
      if (streak > 1.5) {
        ctx.ellipse(sx, sy, radius, radius + streak * (0.45 + twinkle * 0.38), Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,215,255,${alpha * 0.48})`;
      } else {
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = star.bright
          ? `rgba(255,252,235,${alpha})`
          : `rgba(190,205,255,${alpha})`;
      }
      ctx.fill();

      if (star.bright && streak < 2) {
        const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius * 5.5);
        halo.addColorStop(0, `rgba(220,235,255,${alpha * 0.14})`);
        halo.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = halo;
        ctx.fillRect(sx - radius * 6, sy - radius * 6, radius * 12, radius * 12);
      }
    });

    // ── Constellation lines ───────────────────────────────────────────────
    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.07)`;
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([1.5, 22]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].bx * w, catNodes[i].by * h);
        ctx.lineTo(catNodes[i+1].bx * w, catNodes[i+1].by * h);
        ctx.stroke();
      }
      ctx.restore();
    });

  } else {
    // ── Light mode — warm auroras ─────────────────────────────────────────
    const breathe = 0.018 * Math.sin(ts * 0.00028);
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      const rad = 170 + catNodes.length * 24;
      const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `hsla(${ch},${s}%,${l}%,${Math.max(0, 0.07 + breathe)})`);
      g.addColorStop(0.6, `hsla(${ch},${s}%,${l}%,${Math.max(0, 0.025 + breathe * 0.4)})`);
      g.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    STAR_FIELD.slice(0, 70).forEach(star => {
      const nx = ((star.x0 + ts * star.vx) % 1 + 1) % 1;
      const ny = ((star.y0 + ts * star.vy) % 1 + 1) % 1;
      const tw = 0.55 + 0.45 * Math.sin(ts * star.twinkleSpeed + star.phase);
      ctx.beginPath();
      ctx.arc(nx * w, ny * h, star.r * 0.85, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,40,190,${(0.018 + star.a * 0.038) * tw})`;
      ctx.fill();
    });

    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.09)`;
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([1.5, 22]);
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

// ── Drag state ────────────────────────────────────────────────────────────
interface DragState {
  id:    string;
  startX: number;  // pointer start X (page)
  startY: number;  // pointer start Y (page)
  origDx: number;  // dragDx at drag start
  origDy: number;  // dragDy at drag start
}

// ── Galaxy component ──────────────────────────────────────────────────────
interface GalaxyProps {
  skills: Skill[];
  filter: string;
  allLabel: string;
  lang: "en" | "ar";
}

interface Spring { pos: number; vel: number; }

function SkillGalaxy({ skills, filter, allLabel, lang }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const dprRef       = useRef(1);
  const nodeEls      = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollTarget = useRef(0);
  const spring       = useRef<Spring>({ pos: 0, vel: 0 });
  const sectionMidY  = useRef(0);
  const prevScrollY  = useRef(0);
  const scrollVelRef = useRef(0);

  const animId       = useRef(0);
  const lastTsRef    = useRef(0);
  const isDarkRef    = useRef(true);
  const mouseRef     = useRef({ x: 0.5, y: 0.5 });

  // Dragging
  const dragRef      = useRef<DragState | null>(null);
  const [dragId, setDragId]   = useState<string | null>(null);
  const nodesRef     = useRef<GNode[]>([]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cw, setCw]               = useState(900);
  const [ch, setCh]               = useState(640);
  const [, forceUpdate]           = useState(0);

  const orderedCats = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);
  const baseNodes   = useMemo(() => buildNodes(skills, orderedCats), [skills, orderedCats]);

  // Sync nodes into ref, preserving drag offsets
  useEffect(() => {
    nodesRef.current = baseNodes.map(bn => {
      const existing = nodesRef.current.find(n => n.id === bn.id);
      return { ...bn, dragDx: existing?.dragDx ?? 0, dragDy: existing?.dragDy ?? 0 };
    });
    forceUpdate(n => n + 1);
  }, [baseNodes]);

  // ── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      // Tall enough to feel like open space — responsive but generous
      const h = Math.min(720, Math.max(500, w * 0.70));
      setCw(w); setCh(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas HiDPI setup ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    canvas.width   = Math.round(cw * dpr);
    canvas.height  = Math.round(ch * dpr);
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [cw, ch]);

  // ── Scroll & mouse ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const rawVel = window.scrollY - prevScrollY.current;
      scrollVelRef.current = scrollVelRef.current * 0.72 + rawVel * 0.28;
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
    window.addEventListener("scroll",    onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse,  { passive: true });
    return () => {
      window.removeEventListener("scroll",    onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const startDrag = useCallback((id: string, e: React.PointerEvent) => {
    e.preventDefault();
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    dragRef.current = {
      id,
      startX: e.pageX,
      startY: e.pageY,
      origDx: node.dragDx,
      origDy: node.dragDy,
    };
    setDragId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = e.pageX - ds.startX + ds.origDx;
    const dy = e.pageY - ds.startY + ds.origDy;
    const node = nodesRef.current.find(n => n.id === ds.id);
    if (node) { node.dragDx = dx; node.dragDy = dy; }
  }, []);

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragId(null);
  }, []);

  // ── Main animation loop ───────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMid = () => {
      const r = container.getBoundingClientRect();
      sectionMidY.current  = r.top + window.scrollY + ch * 0.5;
      scrollTarget.current = window.scrollY - sectionMidY.current;
    };
    updateMid();
    window.addEventListener("scroll", updateMid, { passive: true });
    window.addEventListener("resize", updateMid, { passive: true });

    // Critically damped spring (ζ=1)
    const STIFFNESS = 180;
    const DAMPING   = 26.8;

    const P_NEAR   = 0.28;
    const P_FAR    = 0.030;
    const DRIFT    = 20;      // px
    const MX_MOUSE = 16;      // px

    const tick = (ts: number) => {
      animId.current = requestAnimationFrame(tick);
      const dt = Math.min((ts - lastTsRef.current) / 1000, 0.050);
      lastTsRef.current = ts;
      if (dt <= 0) return;

      // Spring dynamics
      const sp  = spring.current;
      const err = scrollTarget.current - sp.pos;
      const acc = err * STIFFNESS - sp.vel * DAMPING;
      sp.vel += acc * dt;
      sp.pos += sp.vel * dt;

      // Canvas redraw
      const canvas = canvasRef.current;
      const ctx    = canvas?.getContext("2d");
      if (ctx && canvas) {
        const dpr = dprRef.current;
        const ew  = Math.round(cw * dpr);
        const eh  = Math.round(ch * dpr);
        if (canvas.width !== ew || canvas.height !== eh) {
          canvas.width  = ew;
          canvas.height = eh;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }
        isDarkRef.current = document.documentElement.classList.contains("dark");
        drawFrame(ctx, nodesRef.current, cw, ch, isDarkRef.current, ts, scrollVelRef.current);
      }

      scrollVelRef.current *= 0.86;

      // Node positioning
      const mx = mouseRef.current.x - 0.5;
      const my = mouseRef.current.y - 0.5;

      nodesRef.current.forEach(node => {
        const el = nodeEls.current.get(node.id);
        if (!el) return;
        const isDragging = dragRef.current?.id === node.id;

        // Organic float
        const dX = Math.sin(ts * node.speed + node.phase)        * DRIFT;
        const dY = Math.cos(ts * node.speed * 0.70 + node.phase + 1.3) * DRIFT * 0.68;

        // Parallax — suspended on scroll
        const pFactor = P_FAR + node.depth * (P_NEAR - P_FAR);
        const pY      = sp.pos * pFactor;

        // Mouse parallax
        const mxShift = mx * MX_MOUSE * (0.28 + node.depth * 0.72);
        const myShift = my * MX_MOUSE * (0.28 + node.depth * 0.72) * 0.52;

        if (isDragging) {
          // While dragging: float still, only drag offset applies
          el.style.transform = `translate(calc(-50% + ${node.dragDx.toFixed(1)}px), calc(-50% + ${node.dragDy.toFixed(1)}px))`;
        } else {
          el.style.transform =
            `translate(calc(-50% + ${(dX + mxShift + node.dragDx).toFixed(2)}px), calc(-50% + ${(dY + pY + myShift + node.dragDy).toFixed(2)}px))`;
        }
      });
    };

    spring.current.pos = window.scrollY - sectionMidY.current;
    spring.current.vel = 0;
    scrollTarget.current = spring.current.pos;

    animId.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener("scroll", updateMid);
      window.removeEventListener("resize", updateMid);
    };
  }, [ch, cw]);

  const nodeRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) nodeEls.current.set(id, el);
      else    nodeEls.current.delete(id);
    },
    [],
  );

  const nodes = nodesRef.current.length ? nodesRef.current : baseNodes;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: ch, overflow: "visible" }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* Full-bleed atmospheric canvas — no borders, no containers */}
      <div
        className="absolute pointer-events-none"
        aria-hidden="true"
        style={{
          // Extend canvas beyond the section boundary so nebulae bleed into adjacent sections
          inset: "-80px -40px",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: "80px",
            left: "40px",
            width:  cw,
            height: ch,
          }}
        />
        {/* Feathered edge dissolve — smooth atmospheric fade, no hard rect */}
        <div
          style={{
            position: "absolute",
            top: "80px", left: "40px",
            width: cw, height: ch,
            background: `
              radial-gradient(ellipse 108% 100% at 50% 50%,
                transparent 28%,
                hsl(var(--background)/0.38) 58%,
                hsl(var(--background)/0.72) 78%,
                hsl(var(--background)/0.94) 94%,
                hsl(var(--background)) 100%
              )
            `,
          }}
        />
      </div>

      {/* Floating skill nodes */}
      {nodes.map(node => {
        const hidden   = filter !== allLabel && node.category !== filter;
        const isHov    = hoveredId === node.id;
        const isDraggingThis = dragId === node.id;
        const { h, s, l } = node.color;
        const o = node.orbPx;
        const lbl = getLabel(node.level);
        const hlColor    = `hsl(${h},${Math.min(s + 12, 100)}%,${Math.min(l + 26, 95)}%)`;
        const glowInner  = `hsl(${h},${s}%,${l}%)`;
        const glowOuter  = `hsl(${h},${s}%,${l}%/0.38)`;
        const glowFarOut = `hsl(${h},${s}%,${l}%/0.12)`;

        return (
          <div
            key={node.id}
            ref={nodeRef(node.id)}
            style={{
              position:     "absolute",
              left:         `${node.bx * 100}%`,
              top:          `${node.by * 100}%`,
              willChange:   "transform",
              zIndex:       isDraggingThis ? 100 : isHov ? 50 : 4,
              opacity:      hidden ? 0 : 1,
              transition:   "opacity 0.42s ease",
              pointerEvents: hidden ? "none" : "auto",
              cursor:       isDraggingThis ? "grabbing" : "grab",
              touchAction:  "none",
            }}
            onPointerDown={e => startDrag(node.id, e)}
            onMouseEnter={() => !dragRef.current && setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className="flex items-center"
              style={{ gap: 10, userSelect: "none" }}
            >
              {/* Glowing orb */}
              <div
                style={{
                  width:        o,
                  height:       o,
                  borderRadius: "50%",
                  flexShrink:   0,
                  background:   `radial-gradient(circle at 32% 32%, ${hlColor} 0%, ${glowInner} 52%, hsl(${h},${s}%,${Math.max(l - 16, 16)}%) 100%)`,
                  boxShadow:    isHov || isDraggingThis
                    ? `0 0 ${o * 2.2}px ${glowInner}, 0 0 ${o * 5.5}px ${glowOuter}, 0 0 ${o * 14}px ${glowFarOut}`
                    : `0 0 ${o * 1.6}px ${glowInner}, 0 0 ${o * 4}px ${glowOuter}`,
                  transition:   "box-shadow 0.32s ease, transform 0.32s ease",
                  transform:    isHov || isDraggingThis ? "scale(2.0)" : "scale(1)",
                }}
              />

              {/* Pure glow label — no background, no pill */}
              <span
                style={{
                  fontSize:      node.level >= 72 ? "12.5px" : "11px",
                  fontWeight:    node.level >= 65 ? 700 : 600,
                  letterSpacing: "0.015em",
                  whiteSpace:    "nowrap",
                  background:    "none",
                  border:        "none",
                  padding:       0,
                  color:         isHov || isDraggingThis
                    ? `hsl(${h},${s}%,${Math.min(l + 20, 94)}%)`
                    : "hsl(var(--foreground)/0.80)",
                  textShadow:    isHov || isDraggingThis
                    ? `0 0 16px hsl(${h},${s}%,${l}%/0.90), 0 0 32px hsl(${h},${s}%,${l}%/0.42)`
                    : `0 0 10px hsl(${h},${s}%,${l}%/0.38)`,
                  transition:    "color 0.28s ease, text-shadow 0.28s ease",
                }}
              >
                {node.name}
              </span>
            </div>

            {/* Hover tooltip — glassmorphic, floating above orb */}
            {isHov && !isDraggingThis && (
              <div
                style={{
                  position:       "absolute",
                  bottom:         "calc(100% + 14px)",
                  left:           "50%",
                  transform:      "translateX(-50%)",
                  width:          "164px",
                  padding:        "10px 13px",
                  borderRadius:   "16px",
                  background:     "hsl(var(--card)/0.88)",
                  backdropFilter: "blur(24px)",
                  border:         `1px solid hsl(${h},${s}%,${l}%/0.28)`,
                  boxShadow:      `0 8px 44px rgba(0,0,0,0.40), 0 0 26px hsl(${h},${s}%,${l}%/0.12)`,
                  zIndex:         60,
                  pointerEvents:  "none",
                }}
              >
                <div style={{
                  fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.13em", opacity: 0.48, marginBottom: 7,
                }}>
                  {node.category}
                </div>
                <div style={{
                  width: "100%", height: 3, borderRadius: 3, overflow: "hidden",
                  background: `hsl(${h},${s}%,${l}%/0.15)`, marginBottom: 8,
                }}>
                  <div style={{
                    height: "100%", width: `${node.level}%`,
                    background: `linear-gradient(90deg, hsl(${h},${s}%,${l}%), hsl(${h},${s}%,${Math.min(l + 18, 90)}%))`,
                    borderRadius: 3,
                    boxShadow: `0 0 8px hsl(${h},${s}%,${l}%/0.80)`,
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: `hsl(${h},${s}%,${l}%)`,
                    textShadow: `0 0 9px hsl(${h},${s}%,${l}%/0.55)`,
                  }}>
                    {lang === "ar" ? lbl.ar : lbl.en}
                  </span>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", opacity: 0.52 }}>
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
            ? "مهاراتي التقنية تطفو في الفضاء المفتوح — مرر أو اسحب أي كوكب"
            : "Technical skills drifting in open space — hover or drag any star"}
        </p>
      </div>

      {/* Category filters */}
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

      {/* Galaxy — overflow visible so nebulae can bleed beyond the section */}
      <div style={{ overflow: "visible" }}>
        <SkillGalaxy key={lang} skills={skills} filter={filter} allLabel={allLabel} lang={lang} />
      </div>

      {/* Legend */}
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
        <span className={`flex items-center gap-1.5 opacity-40 ${isRTL ? "mr-auto" : "ml-auto"}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3"/>
          </svg>
          {lang === "ar" ? "تفاعلي مع التمرير والسحب" : "Reacts to scroll & drag"}
        </span>
      </div>
    </section>
  );
}
