import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Skill type ─────────────────────────────────────────────────────────────
interface Skill { id: string; name: string; level: number; category: string }

// ── Level labels ───────────────────────────────────────────────────────────
const LEVEL_LABELS = [
  { min: 0,  max: 39,  en: "Learning",    ar: "متعلم",  hsl: "220 15% 55%" },
  { min: 40, max: 64,  en: "Intermediate",ar: "متوسط",  hsl: "220 90% 60%" },
  { min: 65, max: 84,  en: "Advanced",    ar: "متقدم",  hsl: "263 80% 65%" },
  { min: 85, max: 100, en: "Expert",      ar: "خبير",   hsl: "160 80% 45%" },
];
const getLabel = (n: number) => LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0];

// ── Category color palette ─────────────────────────────────────────────────
const PALETTE = [
  { h: 263, s: 78, l: 65 }, // violet
  { h: 217, s: 85, l: 63 }, // blue
  { h: 188, s: 85, l: 55 }, // cyan
  { h: 43,  s: 92, l: 58 }, // amber
  { h: 158, s: 78, l: 48 }, // emerald
  { h: 22,  s: 88, l: 60 }, // orange
  { h: 340, s: 78, l: 65 }, // rose
];

// ── Deterministic PRNG seeded by string ────────────────────────────────────
function strHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) || 1;
}
function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Galaxy node: base position + animation params ─────────────────────────
interface GalaxyNode extends Skill {
  bx: number;     // base X fraction (0–1)
  by: number;     // base Y fraction (0–1)
  depth: number;  // parallax depth (0=fast, 1=slow)
  phase: number;  // drift oscillation phase
  speed: number;  // drift oscillation speed
  color: typeof PALETTE[0];
  catIdx: number;
  showBelow: boolean; // tooltip direction
}

function buildNodes(skills: Skill[], orderedCats: string[]): GalaxyNode[] {
  const numCats = Math.max(1, orderedCats.length);
  return skills.map(skill => {
    const catIdx = Math.max(0, orderedCats.indexOf(skill.category));
    const rng    = seededRng(strHash(skill.id));
    const r1 = rng(), r2 = rng(), r3 = rng(), r4 = rng(), r5 = rng();

    // Spread categories around an ellipse
    const catAngle = (catIdx / numCats) * Math.PI * 2 - Math.PI / 2 + 0.25;
    const catCX    = 0.50 + 0.34 * Math.cos(catAngle);
    const catCY    = 0.48 + 0.26 * Math.sin(catAngle);

    const scatter = numCats <= 2 ? 0.32 : numCats <= 3 ? 0.25 : 0.20;
    const bx = Math.max(0.06, Math.min(0.94, catCX + (r1 - 0.5) * scatter * 2.1));
    const by = Math.max(0.08, Math.min(0.88, catCY + (r2 - 0.5) * scatter * 1.7));

    return {
      ...skill,
      bx, by,
      depth: 0.2 + r3 * 0.6,
      phase: r4 * Math.PI * 2,
      speed: 0.00030 + r5 * 0.00038,
      color: PALETTE[catIdx % PALETTE.length],
      catIdx,
      showBelow: by < 0.28,
    };
  });
}

// ── Static canvas background: nebulas + star dust ─────────────────────────
function renderBackground(
  ctx: CanvasRenderingContext2D,
  nodes: GalaxyNode[],
  w: number, h: number,
  isDark: boolean,
) {
  ctx.clearRect(0, 0, w, h);

  if (!isDark) {
    // Light mode: very subtle tinted dots only
    const rng = seededRng(99);
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.arc(rng() * w, rng() * h, 0.6 + rng() * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(60,50,120,${0.04 + rng() * 0.06})`;
      ctx.fill();
    }
    return;
  }

  // Dark mode: category nebula blobs
  const byCategory = new Map<number, GalaxyNode[]>();
  nodes.forEach(n => {
    if (!byCategory.has(n.catIdx)) byCategory.set(n.catIdx, []);
    byCategory.get(n.catIdx)!.push(n);
  });

  byCategory.forEach((catNodes, catIdx) => {
    const { h: ch, s: cs, l: cl } = PALETTE[catIdx % PALETTE.length];
    const cx  = catNodes.reduce((a, n) => a + n.bx, 0) / catNodes.length * w;
    const cy  = catNodes.reduce((a, n) => a + n.by, 0) / catNodes.length * h;
    const rad = 100 + catNodes.length * 14;

    const blob = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    blob.addColorStop(0, `hsla(${ch},${cs}%,${cl}%,0.09)`);
    blob.addColorStop(0.55, `hsla(${ch},${cs}%,${cl}%,0.04)`);
    blob.addColorStop(1, `hsla(${ch},${cs}%,${cl}%,0)`);
    ctx.fillStyle = blob;
    ctx.fillRect(0, 0, w, h);
  });

  // Subtle connection lines within each category
  byCategory.forEach((catNodes, catIdx) => {
    if (catNodes.length < 2) return;
    const { h: ch, s: cs, l: cl } = PALETTE[catIdx % PALETTE.length];
    ctx.strokeStyle = `hsla(${ch},${cs}%,${cl}%,0.10)`;
    ctx.lineWidth   = 0.8;
    ctx.setLineDash([3, 10]);
    for (let i = 0; i < catNodes.length - 1; i++) {
      ctx.beginPath();
      ctx.moveTo(catNodes[i].bx * w, catNodes[i].by * h);
      ctx.lineTo(catNodes[i + 1].bx * w, catNodes[i + 1].by * h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  });

  // Star particles
  const rng = seededRng(42);
  for (let i = 0; i < 90; i++) {
    const x = rng() * w, y = rng() * h;
    const r = 0.35 + rng() * 1.3;
    const a = 0.05 + rng() * 0.22;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(195,205,255,${a})`;
    ctx.fill();
  }

  // Central very soft glow
  const center = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.min(w, h) * 0.55);
  center.addColorStop(0, "rgba(140,100,255,0.04)");
  center.addColorStop(1, "rgba(140,100,255,0)");
  ctx.fillStyle = center;
  ctx.fillRect(0, 0, w, h);
}

// ── Galaxy canvas + floating nodes ────────────────────────────────────────
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
  const smoothSY     = useRef(0);
  const sectionMidY  = useRef(0);
  const animId       = useRef(0);
  const hoveredRef   = useRef<string | null>(null);
  const isDarkRef    = useRef(true);

  const [hoveredId,  setHoveredId]  = useState<string | null>(null);
  const [cw, setCw]                 = useState(800);
  const [ch, setCh]                 = useState(480);

  const orderedCats = useMemo(
    () => Array.from(new Set(skills.map(s => s.category))),
    [skills],
  );
  const nodes = useMemo(
    () => buildNodes(skills, orderedCats),
    [skills, orderedCats],
  );

  // ── Resize ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      const h = Math.min(540, Math.max(360, w * 0.58));
      setCw(w); setCh(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Canvas redraw ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = cw * dpr;
    canvas.height = ch * dpr;
    ctx.scale(dpr, dpr);
    isDarkRef.current = document.documentElement.classList.contains("dark");
    renderBackground(ctx, nodes, cw, ch, isDarkRef.current);
  }, [nodes, cw, ch]);

  // Dark-mode change redraws canvas
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      isDarkRef.current = document.documentElement.classList.contains("dark");
      renderBackground(ctx, nodes, cw, ch, isDarkRef.current);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [nodes, cw, ch]);

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => { scrollYRef.current = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Animation loop ───────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateMid = () => {
      const rect = container.getBoundingClientRect();
      sectionMidY.current = rect.top + window.scrollY + ch * 0.5;
    };
    updateMid();
    window.addEventListener("scroll", updateMid, { passive: true });
    window.addEventListener("resize", updateMid, { passive: true });

    const DRIFT   = 10;   // px amplitude
    const PARALLX = 0.07; // px per scroll-px per depth unit

    const tick = (ts: number) => {
      animId.current = requestAnimationFrame(tick);

      // Smooth scroll with inertia
      smoothSY.current += (scrollYRef.current - smoothSY.current) * 0.055;
      const scrollDelta = smoothSY.current - sectionMidY.current;

      nodes.forEach(node => {
        const el = nodeEls.current.get(node.id);
        if (!el) return;

        const driftX  = Math.sin(ts * node.speed + node.phase) * DRIFT;
        const driftY  = Math.cos(ts * node.speed * 0.68 + node.phase + 1.1) * DRIFT * 0.65;
        const parallY = scrollDelta * (node.depth - 0.5) * PARALLX;

        // Scale for hover — read from ref (no re-render needed)
        const scale = hoveredRef.current === node.id ? 1.15 : 1;

        el.style.transform =
          `translate(calc(-50% + ${driftX.toFixed(2)}px), calc(-50% + ${(driftY + parallY).toFixed(2)}px)) scale(${scale})`;
      });
    };

    animId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId.current);
      window.removeEventListener("scroll", updateMid);
      window.removeEventListener("resize", updateMid);
    };
  }, [nodes, ch]);

  // ── Node ref callback ────────────────────────────────────────────────────
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
      className="relative w-full rounded-2xl border border-border dark:border-[hsl(263_78%_65%/0.12)] bg-card/20 dark:bg-[hsl(240_28%_4%/0.6)]"
      style={{ height: ch, overflow: "visible" }}
    >
      {/* Clipping mask wrapper so star field is clipped but tooltips aren't */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* Edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 95% 92% at 50% 50%, transparent 52%, hsl(var(--background)) 100%)",
          }}
        />
      </div>

      {/* Floating skill nodes */}
      {nodes.map(node => {
        const isFiltered = filter !== allLabel && node.category !== filter;
        const isHovered  = hoveredId === node.id;
        const lbl  = getLabel(node.level);
        const { h, s, l } = node.color;

        // Size tiers by level
        const tier =
          node.level >= 85 ? "lg"
          : node.level >= 65 ? "md"
          : "sm";

        const padX  = tier === "lg" ? "14px" : tier === "md" ? "12px" : "10px";
        const padY  = tier === "lg" ? "10px" : tier === "md" ? "8px"  : "7px";
        const fSize = tier === "lg" ? "12px" : tier === "md" ? "11px" : "10px";
        const dotSz = tier === "lg" ? "7px"  : tier === "md" ? "6px"  : "5px";

        const tooltipDown = node.showBelow;

        return (
          <div
            key={node.id}
            ref={nodeRef(node.id)}
            style={{
              position: "absolute",
              left:     `${node.bx * 100}%`,
              top:      `${node.by * 100}%`,
              willChange: "transform",
              zIndex:   isHovered ? 40 : 3,
              opacity:  isFiltered ? 0.06 : 1,
              transition: "opacity 0.4s ease",
              pointerEvents: isFiltered ? "none" : "auto",
            }}
          >
            <div
              onMouseEnter={() => onHover(node.id)}
              onMouseLeave={() => onHover(null)}
              onTouchStart={e => { e.stopPropagation(); onHover(node.id); }}
              onTouchEnd={() => setTimeout(() => onHover(null), 1500)}
              className="relative cursor-default select-none rounded-xl border backdrop-blur-[8px]"
              style={{
                padding: `${padY} ${padX}`,
                background:  `hsla(${h},${s}%,${l}%,${isHovered ? 0.16 : 0.08})`,
                borderColor: `hsla(${h},${s}%,${l}%,${isHovered ? 0.55 : 0.22})`,
                boxShadow:   isHovered
                  ? `0 0 28px hsla(${h},${s}%,${l}%,0.40), 0 8px 28px rgba(0,0,0,0.40)`
                  : `0 0 12px hsla(${h},${s}%,${l}%,0.12), 0 2px 8px rgba(0,0,0,0.18)`,
                transition: "border-color 0.25s, box-shadow 0.25s, background 0.25s",
              }}
            >
              {/* Dot + name + percentage */}
              <div className="flex items-center gap-1.5">
                <span
                  style={{
                    display: "block",
                    width: dotSz, height: dotSz,
                    borderRadius: "50%",
                    background:  `hsl(${h},${s}%,${l}%)`,
                    boxShadow:   `0 0 6px hsl(${h},${s}%,${l}%)`,
                    flexShrink:  0,
                  }}
                />
                <span
                  className="font-semibold font-mono text-foreground whitespace-nowrap"
                  style={{ fontSize: fSize }}
                >
                  {node.name}
                </span>
                <span
                  className="font-mono tabular-nums font-bold"
                  style={{
                    fontSize: "10px",
                    color:       `hsl(${h},${s}%,${l}%)`,
                    textShadow:  `0 0 6px hsl(${h},${s}%,${l}%/0.5)`,
                  }}
                >
                  {node.level}%
                </span>
              </div>

              {/* Tooltip */}
              {isHovered && (
                <div
                  className={`absolute z-50 left-1/2 -translate-x-1/2 w-44 rounded-xl border
                    bg-card/95 backdrop-blur-xl p-3 shadow-2xl pointer-events-none
                    ${tooltipDown ? "top-full mt-2.5" : "bottom-full mb-2.5"}`}
                  style={{ borderColor: `hsla(${h},${s}%,${l}%,0.35)` }}
                >
                  {/* Tooltip arrow */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${tooltipDown ? "bottom-full" : "top-full"}`}
                    style={tooltipDown
                      ? { borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: `5px solid hsla(${h},${s}%,${l}%,0.35)` }
                      : { borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop:    `5px solid hsla(${h},${s}%,${l}%,0.35)` }
                    }
                  />

                  {/* Category label */}
                  <div
                    className="text-[10px] font-semibold uppercase tracking-widest mb-2 opacity-60"
                  >
                    {node.category}
                  </div>

                  {/* Level bar */}
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden mb-2"
                    style={{ background: `hsla(${h},${s}%,${l}%,0.15)` }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${node.level}%`,
                        background: `linear-gradient(90deg, hsl(${h},${s}%,${l}%), hsl(${h},${s}%,${Math.min(l + 14, 85)}%))`,
                        boxShadow:  `0 0 8px hsl(${h},${s}%,${l}%/0.7)`,
                      }}
                    />
                  </div>

                  {/* Level label + % */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: `hsl(${h},${s}%,${l}%)` }}
                    >
                      {lang === "ar" ? lbl.ar : lbl.en}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/70">
                      {node.level}%
                    </span>
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

// ── Section ────────────────────────────────────────────────────────────────
export default function SkillsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];

  const skills      = getSkills(lang, resumeData) as Skill[];
  const [filter, setFilter] = useState("All");

  const allLabel   = t.skills.all;
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
            ? "مهاراتي التقنية تطفو في الفضاء — مرر فوق أي مهارة لمزيد من التفاصيل"
            : "Technical skills floating in orbit — hover any node to explore"}
        </p>
      </div>

      {/* Category filter chips */}
      <div className={`flex flex-wrap gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
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

      {/* Galaxy canvas */}
      <SkillGalaxy
        key={lang}
        skills={skills}
        filter={filter}
        allLabel={allLabel}
        lang={lang}
      />

      {/* Legend */}
      <div className={`mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {LEVEL_LABELS.map(lvl => (
          <span key={lvl.en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: `hsl(${lvl.hsl})`,
                boxShadow:  `0 0 5px hsl(${lvl.hsl} / 0.5)`,
              }}
            />
            <span>{lang === "ar" ? lvl.ar : lvl.en}</span>
          </span>
        ))}

        <span className={`flex items-center gap-1.5 opacity-50 ${isRTL ? "mr-auto" : "ml-auto"}`}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
            <path d="M12 8v4l3 3"/>
          </svg>
          {lang === "ar" ? "يتحرك مع التمرير" : "Reacts to scroll"}
        </span>
      </div>
    </section>
  );
}
