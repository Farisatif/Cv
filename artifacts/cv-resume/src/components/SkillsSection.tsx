import { useState, useRef, useEffect, useCallback } from "react";
import Matter from "matter-js";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── level config ─────────────────────────────────────────── */
const LEVELS = [
  {
    min: 0,  max: 39,
    bar: "var(--sl-color, hsl(220 15% 55%))",
    textClass: "text-slate-400 dark:text-slate-400",
    glow: "220 15% 55%",
    label_en: "Learning",
    label_ar: "متعلم",
  },
  {
    min: 40, max: 64,
    bar: "var(--sl-color, hsl(220 90% 60%))",
    textClass: "text-blue-500 dark:text-blue-400",
    glow: "220 90% 60%",
    label_en: "Intermediate",
    label_ar: "متوسط",
  },
  {
    min: 65, max: 84,
    bar: "var(--sl-color, hsl(263 80% 65%))",
    textClass: "text-violet-500 dark:text-violet-400",
    glow: "263 80% 65%",
    label_en: "Advanced",
    label_ar: "متقدم",
  },
  {
    min: 85, max: 100,
    bar: "var(--sl-color, hsl(160 80% 45%))",
    textClass: "text-emerald-500 dark:text-emerald-400",
    glow: "160 80% 50%",
    label_en: "Expert",
    label_ar: "خبير",
  },
];
const getLevel = (n: number) => LEVELS.find(l => n >= l.min && n <= l.max) ?? LEVELS[0];

interface Skill { id: string; name: string; level: number; category: string }

const PILL_W = 132;
const PILL_H = 64;

/* ─────────────────────────────────────────────────────────── */
function PhysicsArena({ skills, lang }: { skills: Skill[]; lang: "en" | "ar" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillsRef     = useRef<Map<string, HTMLDivElement>>(new Map());
  const simRef       = useRef<{ engine: Matter.Engine; runner: Matter.Runner; raf: number } | null>(null);

  const COLS    = Math.min(4, Math.max(1, skills.length));
  const ROWS    = Math.ceil(skills.length / COLS);
  const ARENA_H = Math.max(320, ROWS * (PILL_H + 20) + 110);

  const pillRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) pillsRef.current.set(id, el); else pillsRef.current.delete(id);
  }, []);

  const start = useCallback(() => {
    const container = containerRef.current;
    if (!container || simRef.current) return;
    const W = container.clientWidth || 760;
    const H = ARENA_H;
    const T = 50;

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 2.4 } });

    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(W / 2, H + T / 2, W + T * 2, T, { isStatic: true, friction: 0.6, restitution: 0.04 }),
      Matter.Bodies.rectangle(-T / 2, H / 2, T, H * 2, { isStatic: true }),
      Matter.Bodies.rectangle(W + T / 2, H / 2, T, H * 2, { isStatic: true }),
    ]);

    const colW = W / COLS;
    skills.forEach((skill, i) => {
      const col    = i % COLS;
      const row    = Math.floor(i / COLS);
      const startX = colW * col + colW / 2 + (Math.random() - 0.5) * 20;
      const startY = -(row * (PILL_H + 24)) - PILL_H * 1.5;

      const body = Matter.Bodies.rectangle(startX, startY, PILL_W, PILL_H, {
        restitution: 0.28,
        friction:    0.62,
        frictionAir: 0.05,
        chamfer:     { radius: 12 },
        density:     0.0025,
        label:       skill.id,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);

      setTimeout(() => {
        if (simRef.current) Matter.World.add(engine.world, body);
      }, i * 60);
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    const allBodies = () => Matter.Composite.allBodies(engine.world).filter(b => !b.isStatic);
    const tick = () => {
      allBodies().forEach(body => {
        const el = pillsRef.current.get(body.label);
        if (!el) return;
        const { x, y } = body.position;
        el.style.transform = `translate(${x - PILL_W / 2}px,${y - PILL_H / 2}px) rotate(${body.angle}rad)`;
        el.style.opacity   = "1";
      });
      simRef.current!.raf = requestAnimationFrame(tick);
    };
    simRef.current = { engine, runner, raf: requestAnimationFrame(tick) };
  }, [skills, ARENA_H, COLS]);

  const stop = useCallback(() => {
    if (!simRef.current) return;
    cancelAnimationFrame(simRef.current.raf);
    Matter.Runner.stop(simRef.current.runner);
    Matter.World.clear(simRef.current.engine.world, false);
    Matter.Engine.clear(simRef.current.engine);
    simRef.current = null;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        setTimeout(start, 80);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => { obs.disconnect(); stop(); };
  }, [start, stop]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-border dark:border-[hsl(263_80%_68%/0.12)] bg-card/30 dark:bg-[hsl(240_28%_4.5%)]"
      style={{ height: ARENA_H }}
    >
      {/* Subtle grid lines in dark mode */}
      <div className="absolute inset-0 grid-pattern opacity-30 dark:opacity-100 pointer-events-none rounded-2xl" />

      {skills.map(skill => {
        const lvl = getLevel(skill.level);
        const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

        return (
          <div
            key={skill.id}
            ref={pillRef(skill.id)}
            style={{
              position: "absolute", top: 0, left: 0,
              width: PILL_W, height: PILL_H,
              opacity: 0, willChange: "transform",
            }}
          >
            <div
              className="w-full h-full rounded-xl flex flex-col items-start justify-between px-3 py-2.5 border transition-all duration-200 hover:scale-105 cursor-default"
              style={{
                background: `hsl(${lvl.glow} / ${isDark ? "0.07" : "0.05"})`,
                borderColor: `hsl(${lvl.glow} / ${isDark ? "0.25" : "0.18"})`,
                boxShadow: isDark ? `0 0 20px hsl(${lvl.glow} / 0.08)` : "none",
              }}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className="text-[11px] font-semibold font-mono text-foreground truncate leading-tight">{skill.name}</span>
                <span
                  className={`text-[10px] font-mono font-bold tabular-nums flex-shrink-0 ${lvl.textClass}`}
                  style={{ textShadow: isDark ? `0 0 8px hsl(${lvl.glow} / 0.6)` : "none" }}
                >
                  {skill.level}%
                </span>
              </div>

              <div className="w-full h-1 rounded-full bg-foreground/8 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${skill.level}%`,
                    background: `linear-gradient(90deg, hsl(${lvl.glow}), hsl(${lvl.glow} / 0.7))`,
                    boxShadow: isDark ? `0 0 8px hsl(${lvl.glow} / 0.6)` : "none",
                  }}
                />
              </div>

              <span
                className={`text-[8px] font-semibold uppercase tracking-[0.12em] ${lvl.textClass}`}
              >
                {skill.category}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function SkillsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const skills = getSkills(lang, resumeData) as Skill[];
  const [filter, setFilter] = useState("All");

  const allLabel   = t.skills.all;
  const categories = [allLabel, ...Array.from(new Set(skills.map(s => s.category)))];
  const filtered   = filter === allLabel ? skills : skills.filter(s => s.category === filter);

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
          {lang === "ar" ? "مهاراتي التقنية" : "Technical Skills"}
        </h2>
        <p className="text-muted-foreground text-sm">{t.skills.subtitle}</p>
      </div>

      {/* Filter chips */}
      <div className={`flex flex-wrap gap-2 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
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

      {/* Gravity hint */}
      <div className={`flex items-center gap-1.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-40">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
        <p className="text-[11px] text-muted-foreground/60">
          {lang === "ar"
            ? "تتساقط البطاقات بتأثير الجاذبية — مرر للأسفل لمشاهدتها"
            : "Badges drop with physics — scroll into view to watch"}
        </p>
      </div>

      {/* Physics arena */}
      <PhysicsArena key={`${filter}-${lang}`} skills={filtered} lang={lang} />

      {/* Legend */}
      <div className={`mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {LEVELS.map(lvl => (
          <span key={lvl.label_en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: `hsl(${lvl.glow})`, boxShadow: `0 0 5px hsl(${lvl.glow} / 0.5)` }}
            />
            <span>{lang === "ar" ? lvl.label_ar : lvl.label_en}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
