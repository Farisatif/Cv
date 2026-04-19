import { useState, useRef, useEffect, useCallback } from "react";
import Matter from "matter-js";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ─── level colours ──────────────────────────────────── */
const LEVELS = [
  { min: 0,  max: 39,  bar: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400",    dot: "bg-slate-400",   border: "border-slate-300 dark:border-slate-700"   },
  { min: 40, max: 64,  bar: "bg-blue-400",    text: "text-blue-500 dark:text-blue-400",      dot: "bg-blue-400",    border: "border-blue-200 dark:border-blue-900"      },
  { min: 65, max: 84,  bar: "bg-violet-500",  text: "text-violet-600 dark:text-violet-400",  dot: "bg-violet-500",  border: "border-violet-200 dark:border-violet-900"  },
  { min: 85, max: 100, bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400",dot: "bg-emerald-500", border: "border-emerald-200 dark:border-emerald-900" },
];
const getLevel = (n: number) => LEVELS.find(l => n >= l.min && n <= l.max) ?? LEVELS[0];

interface Skill { id: string; name: string; level: number; category: string }

/* pill dimensions */
const PILL_W = 130;
const PILL_H = 60;
const RADIUS  = 12;

/* ──────────────────────────────────────────────────────────── */
/*  PhysicsArena — remounts on filter / lang change via key=   */
/* ──────────────────────────────────────────────────────────── */
function PhysicsArena({ skills, lang }: { skills: Skill[]; lang: "en" | "ar" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillsRef     = useRef<Map<string, HTMLDivElement>>(new Map());
  const simRef       = useRef<{
    engine: Matter.Engine;
    runner: Matter.Runner;
    raf:    number;
  } | null>(null);

  /* arena height */
  const COLS    = Math.min(4, Math.max(1, skills.length));
  const ROWS    = Math.ceil(skills.length / COLS);
  const ARENA_H = Math.max(300, ROWS * (PILL_H + 18) + 100);

  /* register pill refs */
  const pillRef = useCallback((id: string) => (el: HTMLDivElement | null) => {
    if (el) pillsRef.current.set(id, el); else pillsRef.current.delete(id);
  }, []);

  /* start simulation */
  const start = useCallback(() => {
    const container = containerRef.current;
    if (!container || simRef.current) return;     // already running
    const W = container.clientWidth || 760;
    const H = ARENA_H;
    const T = 50;

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 2.4 } });

    /* static walls */
    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(W / 2, H + T / 2,     W + T * 2, T, { isStatic: true, friction: 0.6, restitution: 0.05 }),
      Matter.Bodies.rectangle(-T / 2,    H / 2, T, H * 2,         { isStatic: true }),
      Matter.Bodies.rectangle(W + T / 2, H / 2, T, H * 2,         { isStatic: true }),
    ]);

    const colW = W / COLS;

    /* drop each pill with stagger delay */
    skills.forEach((skill, i) => {
      const col    = i % COLS;
      const row    = Math.floor(i / COLS);
      const startX = colW * col + colW / 2 + (Math.random() - 0.5) * 24;
      const startY = -(row * (PILL_H + 20)) - PILL_H * 1.5;

      const body = Matter.Bodies.rectangle(startX, startY, PILL_W, PILL_H, {
        restitution: 0.32,
        friction:    0.65,
        frictionAir: 0.045,
        chamfer:     { radius: RADIUS },
        density:     0.0025,
        label:       skill.id,
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);

      setTimeout(() => {
        if (simRef.current) Matter.World.add(engine.world, body);
      }, i * 65);
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    /* sync DOM each frame */
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

  /* cleanup */
  const stop = useCallback(() => {
    if (!simRef.current) return;
    cancelAnimationFrame(simRef.current.raf);
    Matter.Runner.stop(simRef.current.runner);
    Matter.World.clear(simRef.current.engine.world, false);
    Matter.Engine.clear(simRef.current.engine);
    simRef.current = null;
  }, []);

  /* observe → start */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        setTimeout(start, 80);
      }
    }, { threshold: 0.12 });
    obs.observe(el);

    return () => { obs.disconnect(); stop(); };
  }, [start, stop]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-border/60 bg-card/30"
      style={{ height: ARENA_H }}
    >
      {skills.map(skill => {
        const lvl = getLevel(skill.level);
        return (
          <div
            key={skill.id}
            ref={pillRef(skill.id)}
            style={{ position: "absolute", top: 0, left: 0, width: PILL_W, height: PILL_H, opacity: 0, willChange: "transform" }}
          >
            <div className={`w-full h-full rounded-xl border bg-card flex flex-col items-start justify-between px-3 py-2 shadow-sm ${lvl.border}`}>
              <div className="flex items-center justify-between w-full gap-1">
                <span className="text-[11px] font-semibold font-mono text-foreground truncate leading-tight">{skill.name}</span>
                <span className={`text-[10px] font-mono font-bold tabular-nums flex-shrink-0 ${lvl.text}`}>{skill.level}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full ${lvl.bar}`} style={{ width: `${skill.level}%` }} />
              </div>
              <span className={`text-[8px] font-medium uppercase tracking-widest ${lvl.text}`}>{skill.category}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  SkillsSection                                              */
/* ──────────────────────────────────────────────────────────── */
const LEVELS_LEGEND = [
  { label_en: "Expert",       label_ar: "خبير",  dot: "bg-emerald-500", range: "85%+" },
  { label_en: "Advanced",     label_ar: "متقدم", dot: "bg-violet-500",  range: "65–84%" },
  { label_en: "Intermediate", label_ar: "متوسط", dot: "bg-blue-400",    range: "40–64%" },
  { label_en: "Learning",     label_ar: "متعلم", dot: "bg-slate-400",   range: "0–39%" },
];

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
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.skills.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-1">
          {lang === "ar" ? "مهاراتي التقنية" : "Technical Skills"}
        </h2>
        <p className="text-muted-foreground text-sm mt-2">{t.skills.subtitle}</p>
      </div>

      <div className={`flex flex-wrap gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
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

      {/* hint */}
      <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1.5">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
          <path d="M12 5v14M5 12l7 7 7-7"/>
        </svg>
        {lang === "ar"
          ? "تتساقط البطاقات بتأثير الجاذبية والاصطدام — مرر للأسفل لمشاهدتها"
          : "Badges fall with gravity & collision — scroll into view to watch them drop"}
      </p>

      {/* Physics arena — remounts cleanly on filter/lang change */}
      <PhysicsArena key={`${filter}-${lang}`} skills={filtered} lang={lang} />

      {/* Legend */}
      <div className={`mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {LEVELS_LEGEND.map(lvl => (
          <span key={lvl.label_en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${lvl.dot}`} />
            <span>{lang === "ar" ? lvl.label_ar : lvl.label_en}</span>
            <span className="font-mono opacity-60">{lvl.range}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
