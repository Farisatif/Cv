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

const FLOAT_ANIMS = [
  "sk-float-0","sk-float-1","sk-float-2","sk-float-3",
  "sk-float-4","sk-float-5","sk-float-6","sk-float-7",
];

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

    const cx = w / 2, cy = h / 2;
    const normDist = Math.hypot(x - cx, y - cy) / Math.hypot(cx, cy);
    if (normDist < 0.12 && rng() > 0.12) continue;

    if (pts.every(p => Math.hypot(p.x - x, p.y - y) >= minDist)) {
      pts.push({ x, y });
    }
  }

  return pts;
}

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

  const pool = [...skills].sort((a, b) => b.level - a.level).slice(0, MAX);
  const n    = pool.length;

  const nFg = Math.max(1, Math.round(n * 0.20));
  const nMg = Math.max(1, Math.round(n * 0.50));
  const layers: Layer[] = pool.map((_, i) =>
    i < nFg ? "fg" : i < nFg + nMg ? "mg" : "bg"
  );

  let pts = poissonDisc(n, cw, ch, MIN_DIST, MX, MY, 53);

  const shRng = seededRng(17);
  for (let i = pts.length - 1; i > 0; i--) {
    const j = Math.floor(shRng() * (i + 1));
    [pts[i], pts[j]] = [pts[j], pts[i]];
  }

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
  mood: string,
  ts: number,
  scrollVel: number,
) {
  ctx.clearRect(0, 0, w, h);

  const catMap = new Map<number, PlacedNode[]>();
  nodes.forEach(n => {
    if (!catMap.has(n.catIdx)) catMap.set(n.catIdx, []);
    catMap.get(n.catIdx)!.push(n);
  });

  if (isDark && mood === "cosmic") {
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
    });
  } else if (mood === "professional") {
    // Elegant professional background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, isDark ? "rgba(15, 23, 42, 0.05)" : "rgba(241, 245, 249, 0.05)");
    bg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  } else if (mood === "minimal") {
    // Clean minimal background
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, w, h);
  }

  // ── Edge Fade Gradient (Always applied but varies by mood) ────────────────
  const fadeColor = mood === "cosmic" ? "90, 45, 240" : mood === "professional" ? "51, 65, 85" : "148, 163, 184";
  const fadeOpacity = mood === "cosmic" ? 0.18 : 0.08;

  const edgeFade = ctx.createLinearGradient(0, 0, 0, h);
  edgeFade.addColorStop(0, `rgba(${fadeColor}, ${fadeOpacity})`);
  edgeFade.addColorStop(0.18, `rgba(${fadeColor}, 0)`);
  edgeFade.addColorStop(0.82, `rgba(${fadeColor}, 0)`);
  edgeFade.addColorStop(1, `rgba(${fadeColor}, ${fadeOpacity})`);
  ctx.fillStyle = edgeFade;
  ctx.fillRect(0, 0, w, h);

  const sideFade = ctx.createLinearGradient(0, 0, w, 0);
  sideFade.addColorStop(0, `rgba(${fadeColor}, ${fadeOpacity * 0.8})`);
  sideFade.addColorStop(0.12, `rgba(${fadeColor}, 0)`);
  sideFade.addColorStop(0.88, `rgba(${fadeColor}, 0)`);
  sideFade.addColorStop(1, `rgba(${fadeColor}, ${fadeOpacity * 0.8})`);
  ctx.fillStyle = sideFade;
  ctx.fillRect(0, 0, w, h);
}

export default function SkillsSection() {
  const { lang, isRTL } = useLanguage();
  const { data } = useResumeData();
  const t = translations[lang];
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { revealRef, isVisible } = useScrollReveal();

  const skills = useMemo(() => getSkills(data), [data]);
  const categories = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);

  const [nodes, setNodes] = useState<PlacedNode[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [currentMood, setCurrentMood] = useState("cosmic");

  const stateRef = useRef({
    ts: 0,
    scrollVel: 0,
    lastSY: 0,
    isDark: true,
    mood: "cosmic",
    width: 0,
    height: 0,
    animId: 0,
    smoothVel: 0,
  });

  useEffect(() => {
    const updateMood = () => {
      const mood = document.documentElement.getAttribute("data-mood") || "cosmic";
      stateRef.current.mood = mood;
      setCurrentMood(mood);
    };
    updateMood();
    const obs = new MutationObserver(updateMood);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mood"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = rect.width;
      const h = rect.height;
      
      canvasRef.current.width = w * dpr;
      canvasRef.current.height = h * dpr;
      canvasRef.current.style.width = `${w}px`;
      canvasRef.current.style.height = `${h}px`;
      
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      
      stateRef.current.width = w;
      stateRef.current.height = h;
      
      const isMobile = window.innerWidth < 768;
      setNodes(buildNodes(skills, categories, isMobile, w, h));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [skills, categories]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onScroll = () => {
      const sy = window.scrollY;
      stateRef.current.scrollVel = sy - stateRef.current.lastSY;
      stateRef.current.lastSY = sy;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const checkDark = () => {
      stateRef.current.isDark = document.documentElement.classList.contains("dark");
    };
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const loop = (time: number) => {
      stateRef.current.ts = time;
      stateRef.current.smoothVel += (stateRef.current.scrollVel - stateRef.current.smoothVel) * 0.12;
      
      drawFrame(
        ctx,
        nodes,
        stateRef.current.width,
        stateRef.current.height,
        stateRef.current.isDark,
        stateRef.current.mood,
        time,
        stateRef.current.smoothVel
      );
      
      stateRef.current.scrollVel *= 0.92;
      stateRef.current.animId = requestAnimationFrame(loop);
    };

    stateRef.current.animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
    };
  }, [nodes]);

  return (
    <section
      id="skills"
      ref={revealRef}
      className={`relative py-24 sm:py-32 overflow-hidden transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className={`mb-12 sm:mb-20 ${isRTL ? "text-right" : "text-left"}`}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-primary">
              {t.skills.title}
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">
            {lang === "ar" ? "مجرة المهارات" : "Skills Galaxy"}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-lg max-w-2xl leading-relaxed">
            {lang === "ar" 
              ? "استكشف مهاراتي التقنية الموزعة في فضاء الإبداع. كل عقدة تمثل خبرة تراكمت عبر سنوات من العمل."
              : "Explore my technical expertise distributed across a creative space. Each node represents experience accumulated over years of work."}
          </p>
        </div>

        <div
          ref={containerRef}
          className={`relative w-full aspect-[4/3] sm:aspect-[21/9] min-h-[450px] sm:min-h-[600px] rounded-3xl border border-border/50 backdrop-blur-sm overflow-hidden group shadow-2xl transition-all duration-500 ${
            currentMood === "cosmic" ? "bg-card/30" : currentMood === "professional" ? "bg-slate-50/50 dark:bg-slate-900/50" : "bg-background/40"
          }`}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {nodes.map((node) => {
            const label = getLabel(node.skill.level);
            const isActive = activeNode === node.skill.id;
            const parallaxY = stateRef.current.smoothVel * (node.cfg.parallaxSpeed - 1) * 0.4;

            return (
              <div
                key={node.skill.id}
                className="absolute transition-all duration-500 ease-out"
                style={{
                  left: `${(node.x / stateRef.current.width) * 100}%`,
                  top: `${(node.y / stateRef.current.height) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${node.scale}) translateY(${parallaxY}px)`,
                  zIndex: node.cfg.zIndex,
                  opacity: node.opacity,
                }}
              >
                <div
                  className={`relative group/node cursor-help animate-[${node.animName}_${node.animDur}s_ease-in-out_infinite]`}
                  style={{ animationDelay: `${node.animDelay}s` }}
                  onMouseEnter={() => setActiveNode(node.skill.id)}
                  onMouseLeave={() => setActiveNode(null)}
                >
                  <div
                    className="absolute inset-0 rounded-full blur-xl opacity-0 group-hover/node:opacity-40 transition-opacity duration-500"
                    style={{ backgroundColor: `hsl(${node.color.h}, ${node.color.s}%, ${node.color.l}%)` }}
                  />

                  <div
                    className={`relative flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all duration-300 ${
                      isActive 
                        ? "bg-background border-primary shadow-[0_0_20px_rgba(90,45,240,0.3)] scale-110" 
                        : "bg-background/80 border-border/50 backdrop-blur-md"
                    } ${currentMood === "professional" ? "rounded-lg" : "rounded-2xl"}`}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `hsl(${node.color.h}, ${node.color.s}%, ${node.color.l}%)` }}
                    />
                    <span className={`text-xs sm:text-sm font-semibold whitespace-nowrap ${currentMood === "minimal" ? "font-normal" : ""}`}>
                      {node.skill.name}
                    </span>
                  </div>

                  <div
                    className={`absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-[10px] font-bold whitespace-nowrap transition-all duration-300 pointer-events-none ${
                      isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: `hsl(${label.hsl})` }}>
                        {lang === "ar" ? label.ar : label.en}
                      </span>
                      <span className="opacity-50">|</span>
                      <span>{node.skill.level}%</span>
                    </div>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="absolute bottom-6 right-6 flex items-center gap-3 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest pointer-events-none">
            <div className="w-8 h-px bg-border/50" />
            {lang === "ar" ? "حرك الشاشة لرؤية التفاعل" : "Scroll to see interaction"}
          </div>
        </div>
      </div>
    </section>
  );
}
