import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ─────────────────────────────────────────────────────────
const PALETTE = [
  { h: 263, s: 78, l: 65 }, // violet
  { h: 217, s: 90, l: 63 }, // blue
  { h: 188, s: 88, l: 55 }, // cyan
  { h: 43,  s: 95, l: 58 }, // amber
  { h: 155, s: 80, l: 48 }, // emerald
  { h: 22,  s: 90, l: 60 }, // orange
  { h: 340, s: 80, l: 65 }, // rose
] as const;

// ── Level labels ──────────────────────────────────────────────────────────
const LEVEL_LABELS = [
  { min: 0,  max: 39,  en: "Learning",     ar: "متعلم",  hsl: "220 15% 55%" },
  { min: 40, max: 64,  en: "Intermediate", ar: "متوسط",  hsl: "220 90% 60%" },
  { min: 65, max: 84,  en: "Advanced",     ar: "متقدم",  hsl: "263 80% 65%" },
  { min: 85, max: 100, en: "Expert",       ar: "خبير",   hsl: "160 80% 45%" },
];
function getLabel(n: number) { return LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0]; }

// ── Deterministic seeded PRNG ─────────────────────────────────────────────
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) || 1;
}
function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

interface Skill { id: string; name: string; level: number; category: string }

interface GNode extends Skill {
  bx: number; by: number;        // base position [0–1]
  depth: number;                  // 0=far/slow … 1=near/fast
  phase: number; speed: number;   // orbital drift
  color: typeof PALETTE[number];
  catIdx: number;
  orbPx: number;                  // orb diameter in px
}

// ── Build galaxy nodes ────────────────────────────────────────────────────
function buildNodes(skills: Skill[], cats: string[]): GNode[] {
  const numCats = Math.max(1, cats.length);
  return skills.map(sk => {
    const catIdx = Math.max(0, cats.indexOf(sk.category));
    const rng    = seededRng(strHash(sk.id));
    const [r1, r2, r3, r4, r5] = [rng(), rng(), rng(), rng(), rng()];

    // Arrange clusters on an ellipse
    const angle = (catIdx / numCats) * Math.PI * 2 - Math.PI * 0.55;
    const cx = 0.50 + 0.38 * Math.cos(angle);
    const cy = 0.50 + 0.30 * Math.sin(angle);
    const sc = 0.20;
    const bx = Math.max(0.06, Math.min(0.92, cx + (r1 - 0.5) * sc * 2.2));
    const by = Math.max(0.08, Math.min(0.89, cy + (r2 - 0.5) * sc * 1.9));

    // Orb size by skill level
    const orbPx = sk.level >= 80 ? 14 : sk.level >= 60 ? 11 : sk.level >= 40 ? 9 : 7;

    return {
      ...sk,
      bx, by,
      depth: 0.10 + r3 * 0.80,
      phase: r4 * Math.PI * 2,
      speed: 0.00022 + r5 * 0.00032,
      color: PALETTE[catIdx % PALETTE.length],
      catIdx, orbPx,
    };
  });
}

// ── Canvas nebula background ──────────────────────────────────────────────
function drawBg(
  ctx: CanvasRenderingContext2D,
  nodes: GNode[],
  w: number, h: number,
  isDark: boolean,
  scrollVel: number,
) {
  ctx.clearRect(0, 0, w, h);

  const byCat = new Map<number, GNode[]>();
  nodes.forEach(n => {
    if (!byCat.has(n.catIdx)) byCat.set(n.catIdx, []);
    byCat.get(n.catIdx)!.push(n);
  });

  if (isDark) {
    // Large, vivid nebula clouds per category
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      const rad = 140 + catNodes.length * 22;

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0,    `hsla(${ch},${s}%,${l}%,0.22)`);
      g.addColorStop(0.45, `hsla(${ch},${s}%,${l}%,0.09)`);
      g.addColorStop(1,    `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    // Deep central cosmic glow
    const center = ctx.createRadialGradient(w*0.5, h*0.46, 0, w*0.5, h*0.46, Math.min(w,h)*0.65);
    center.addColorStop(0,    "rgba(100,60,255,0.08)");
    center.addColorStop(0.45, "rgba(50,30,180,0.04)");
    center.addColorStop(1,    "rgba(0,0,0,0)");
    ctx.fillStyle = center;
    ctx.fillRect(0, 0, w, h);

    // Star field with light-speed streak effect on fast scroll
    const rng   = seededRng(42);
    const speed = Math.abs(scrollVel);
    const stretch = Math.min(speed * 0.8, 18); // max 18px streaks

    for (let i = 0; i < 150; i++) {
      const sx = rng() * w;
      const sy = rng() * h;
      const sr = 0.28 + rng() * 1.6;
      const sa = 0.04 + rng() * 0.30;
      const bright = rng() > 0.93; // occasional bright star

      ctx.beginPath();
      if (stretch > 1.5) {
        ctx.ellipse(sx, sy, sr, sr + stretch * (0.5 + rng() * 0.5), Math.PI / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,220,255,${sa * 0.55})`;
      } else {
        ctx.arc(sx, sy, bright ? sr * 2.2 : sr, 0, Math.PI * 2);
        ctx.fillStyle = bright
          ? `rgba(255,255,255,${sa * 1.4})`
          : `rgba(195,205,255,${sa})`;
      }
      ctx.fill();
    }

    // Faint constellation lines within categories
    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.10)`;
      ctx.lineWidth   = 0.55;
      ctx.setLineDash([2, 16]);
      for (let i = 0; i < catNodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(catNodes[i].bx * w, catNodes[i].by * h);
        ctx.lineTo(catNodes[i+1].bx * w, catNodes[i+1].by * h);
        ctx.stroke();
      }
      ctx.restore();
    });

  } else {
    // Light mode: delicate warm haze only
    const rng = seededRng(99);
    for (let i = 0; i < 60; i++) {
      ctx.beginPath();
      ctx.arc(rng() * w, rng() * h, 0.5 + rng() * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(70,50,200,${0.02 + rng() * 0.04})`;
      ctx.fill();
    }
    byCat.forEach((catNodes, catIdx) => {
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
      const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
      const rad = 100 + catNodes.length * 18;
      const g   = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `hsla(${ch},${s}%,${l}%,0.07)`);
      g.addColorStop(1, `hsla(${ch},${s}%,${l}%,0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    // Light mode constellation lines
    byCat.forEach((catNodes, catIdx) => {
      if (catNodes.length < 2) return;
      const { h: ch, s, l } = PALETTE[catIdx % PALETTE.length];
      ctx.save();
      ctx.strokeStyle = `hsla(${ch},${s}%,${l}%,0.12)`;
      ctx.lineWidth   = 0.55;
      ctx.setLineDash([2, 16]);
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

function SkillGalaxy({ skills, filter, allLabel, lang }: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const nodeEls      = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollYRef   = useRef(0);
  const prevScrollY  = useRef(0);
  const scrollVelRef = useRef(0);
  const smoothSY     = useRef(0);
  const sectionMidY  = useRef(0);
  const animId       = useRef(0);
  const bgDirtyRef   = useRef(true);
  const hoveredRef   = useRef<string | null>(null);
  const isDarkRef    = useRef(true);
  const mouseRef     = useRef({ x: 0.5, y: 0.5 });

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cw, setCw]               = useState(800);
  const [ch, setCh]               = useState(520);

  const orderedCats = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);
  const nodes       = useMemo(() => buildNodes(skills, orderedCats), [skills, orderedCats]);

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(e => {
      const w = e[0].contentRect.width;
      const h = Math.min(620, Math.max(440, w * 0.62));
      setCw(w); setCh(h);
      bgDirtyRef.current = true;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Redraw canvas helper
  const redrawBg = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
    isDarkRef.current = document.documentElement.classList.contains("dark");
    drawBg(ctx, nodes, cw, ch, isDarkRef.current, scrollVelRef.current);
  }, [nodes, cw, ch]);

  useEffect(() => { redrawBg(); }, [redrawBg]);

  // Dark-mode change
  useEffect(() => {
    const obs = new MutationObserver(() => { bgDirtyRef.current = true; });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Scroll + mouse listeners
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    const onMouse  = (e: MouseEvent) => {
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

  // Animation loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMid = () => {
      const r = container.getBoundingClientRect();
      sectionMidY.current = r.top + window.scrollY + ch * 0.5;
    };
    updateMid();
    window.addEventListener("scroll", updateMid, { passive: true });
    window.addEventListener("resize", updateMid, { passive: true });

    // Parallax config: near = 0.30 px/px-scroll, far = 0.035
    const P_NEAR = 0.30;
    const P_FAR  = 0.035;
    const DRIFT  = 18;     // organic float amplitude px
    const MX_MOUSE = 14;   // max mouse influence px

    let lastTs = 0;

    const tick = (ts: number) => {
      animId.current = requestAnimationFrame(tick);
      const dt = ts - lastTs;
      lastTs = ts;
      if (dt === 0) return;

      // Velocity
      const rawVel = scrollYRef.current - prevScrollY.current;
      scrollVelRef.current += (rawVel - scrollVelRef.current) * 0.18;
      prevScrollY.current = scrollYRef.current;

      // Smooth scroll
      smoothSY.current += (scrollYRef.current - smoothSY.current) * 0.048;
      const delta = smoothSY.current - sectionMidY.current;

      // Redraw bg on dirty or fast scroll
      if (bgDirtyRef.current || Math.abs(scrollVelRef.current) > 2) {
        bgDirtyRef.current = false;
        const canvas = canvasRef.current;
        const ctx    = canvas?.getContext("2d");
        if (ctx && canvas) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
            canvas.width  = cw * dpr;
            canvas.height = ch * dpr;
            ctx.scale(dpr, dpr);
          }
          isDarkRef.current = document.documentElement.classList.contains("dark");
          drawBg(ctx, nodes, cw, ch, isDarkRef.current, scrollVelRef.current);
        }
      }

      const mx = mouseRef.current.x - 0.5;
      const my = mouseRef.current.y - 0.5;

      nodes.forEach(node => {
        const el = nodeEls.current.get(node.id);
        if (!el) return;

        const dX = Math.sin(ts * node.speed + node.phase) * DRIFT;
        const dY = Math.cos(ts * node.speed * 0.72 + node.phase + 1.4) * DRIFT * 0.72;

        // Parallax: depth 0=far, 1=near
        const pFactor = P_FAR + node.depth * (P_NEAR - P_FAR);
        const pY = delta * pFactor;

        // Mouse parallax (stronger for near objects)
        const mxShift = mx * MX_MOUSE * (0.3 + node.depth * 0.7);
        const myShift = my * MX_MOUSE * (0.3 + node.depth * 0.7) * 0.55;

        el.style.transform =
          `translate(calc(-50% + ${(dX + mxShift).toFixed(2)}px), calc(-50% + ${(dY + pY + myShift).toFixed(2)}px))`;
      });
    };

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
    // NO card, NO box, NO border — open space
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: ch, overflow: "visible" }}
    >
      {/* Nebula canvas — clipped to bounds, blends into page */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* Atmospheric edge fade — dissolves into the page background */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(ellipse 100% 95% at 50% 50%, transparent 38%, hsl(var(--background)/0.55) 68%, hsl(var(--background)/0.88) 86%, hsl(var(--background)) 100%)",
        }} />
      </div>

      {/* Skill orbs — overflow freely into the page atmosphere */}
      {nodes.map(node => {
        const hidden   = filter !== allLabel && node.category !== filter;
        const isHov    = hoveredId === node.id;
        const { h, s, l } = node.color;
        const o  = node.orbPx;
        const lbl = getLabel(node.level);

        // Orb inner highlight position
        const hlColor = `hsl(${h},${Math.min(s+10,100)}%,${Math.min(l+22,94)}%)`;
        const glowInner  = `hsl(${h},${s}%,${l}%)`;
        const glowOuter  = `hsl(${h},${s}%,${l}%/0.35)`;
        const glowFarOuter = `hsl(${h},${s}%,${l}%/0.12)`;

        return (
          <div
            key={node.id}
            ref={nodeRef(node.id)}
            style={{
              position:  "absolute",
              left:      `${node.bx * 100}%`,
              top:       `${node.by * 100}%`,
              willChange: "transform",
              zIndex:    isHov ? 50 : 4,
              opacity:   hidden ? 0 : 1,
              transition: "opacity 0.45s ease",
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
              {/* ── THE ORB: a sphere of pure light, no rectangle ── */}
              <div
                style={{
                  width:        o,
                  height:       o,
                  borderRadius: "50%",
                  flexShrink:   0,
                  position:     "relative",
                  // Radial gradient = 3D sphere illusion
                  background:   `radial-gradient(circle at 33% 33%, ${hlColor} 0%, ${glowInner} 55%, hsl(${h},${s}%,${Math.max(l-14,18)}%) 100%)`,
                  // Layered box-shadow = soft corona
                  boxShadow: isHov
                    ? `0 0 ${o*2}px ${glowInner}, 0 0 ${o*5}px ${glowOuter}, 0 0 ${o*12}px ${glowFarOuter}`
                    : `0 0 ${o*1.4}px ${glowInner}, 0 0 ${o*3.5}px ${glowOuter}`,
                  transition:  "box-shadow 0.35s ease, transform 0.35s ease",
                  transform:   isHov ? "scale(1.75)" : "scale(1)",
                }}
              />

              {/* ── Floating label: no background, no border, just text in space ── */}
              <span
                style={{
                  fontSize:      node.level >= 72 ? "12px" : "11px",
                  fontWeight:    node.level >= 65 ? 700 : 600,
                  letterSpacing: "0.01em",
                  whiteSpace:    "nowrap",
                  color: isHov
                    ? `hsl(${h},${s}%,${Math.min(l+16, 92)}%)`
                    : "hsl(var(--foreground)/0.82)",
                  textShadow: isHov
                    ? `0 0 14px hsl(${h},${s}%,${l}%/0.85), 0 0 28px hsl(${h},${s}%,${l}%/0.40)`
                    : `0 0 8px hsl(${h},${s}%,${l}%/0.35)`,
                  transition: "color 0.3s ease, text-shadow 0.3s ease",
                }}
              >
                {node.name}
              </span>
            </div>

            {/* ── Hover info panel — ethereal card floating above ── */}
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
                {/* Category */}
                <div style={{
                  fontSize: "9px", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.12em", opacity: 0.5, marginBottom: 7,
                }}>
                  {node.category}
                </div>
                {/* Level bar */}
                <div style={{
                  width: "100%", height: 3, borderRadius: 3, overflow: "hidden",
                  background: `hsl(${h},${s}%,${l}%/0.14)`, marginBottom: 7,
                }}>
                  <div style={{
                    height: "100%",
                    width:  `${node.level}%`,
                    background: `linear-gradient(90deg, hsl(${h},${s}%,${l}%), hsl(${h},${s}%,${Math.min(l+16,88)}%))`,
                    borderRadius: 3,
                    boxShadow: `0 0 7px hsl(${h},${s}%,${l}%/0.75)`,
                  }} />
                </div>
                {/* Label + pct */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    color: `hsl(${h},${s}%,${l}%)`,
                    textShadow: `0 0 8px hsl(${h},${s}%,${l}%/0.5)`,
                  }}>
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

  const skills  = getSkills(lang, data) as Skill[];
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
      {/* Header */}
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

      {/* Galaxy — open space, no box */}
      <SkillGalaxy key={lang} skills={skills} filter={filter} allLabel={allLabel} lang={lang} />

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
