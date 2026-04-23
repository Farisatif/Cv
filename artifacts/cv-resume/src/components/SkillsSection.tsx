import React, { useState, useEffect, useRef, useMemo } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ──────────────────────────────────────────────────────────
const PALETTE = [
  { h: 174, s: 88, l: 52 },
  { h: 199, s: 92, l: 56 },
  { h: 38,  s: 96, l: 58 },
  { h: 155, s: 80, l: 46 },
  { h: 22,  s: 90, l: 58 },
  { h: 266, s: 78, l: 64 },
  { h: 340, s: 80, l: 62 },
] as const;

// ── Level labels ───────────────────────────────────────────────────────────
const LEVEL_LABELS = [
  { min: 0,  max: 39,  en: "Learning",     ar: "متعلم",  hsl: "220 15% 55%" },
  { min: 40, max: 64,  en: "Intermediate", ar: "متوسط",  hsl: "199 88% 56%" },
  { min: 65, max: 84,  en: "Advanced",     ar: "متقدم",  hsl: "174 80% 50%" },
  { min: 85, max: 100, en: "Expert",       ar: "خبير",   hsl: "160 82% 42%" },
];
function getLabel(n: number) {
  return LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0];
}

interface Skill { id: string; name: string; level: number; category: string }

// ── Animated skill card ────────────────────────────────────────────────────
function SkillCard({
  skill, catIdx, lang, isRTL, animDelay,
}: {
  skill: Skill;
  catIdx: number;
  lang: "en" | "ar";
  isRTL: boolean;
  animDelay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const barRef  = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const color  = PALETTE[catIdx % PALETTE.length];
  const label  = getLabel(skill.level);
  const hsl    = `hsl(${color.h},${color.s}%,${color.l}%)`;
  const hslFn  = (a: string) => `hsl(${color.h},${color.s}%,${color.l}%/${a})`;

  const accentBorder = isRTL
    ? { borderRight: `3px solid ${hsl}` }
    : { borderLeft:  `3px solid ${hsl}` };

  return (
    <div
      ref={cardRef}
      className="skill-card"
      style={{
        ...accentBorder,
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms, border-color 0.22s ease, box-shadow 0.25s ease`,
      }}
    >
      <div className="p-3.5">
        {/* Name + badge row */}
        <div className={`flex items-start justify-between gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
            <div className="text-[13px] font-bold tracking-tight leading-tight truncate">
              {skill.name}
            </div>
            <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest mt-0.5 truncate">
              {skill.category}
            </div>
          </div>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 whitespace-nowrap"
            style={{
              color: hsl,
              background: hslFn("0.10"),
              border: `1px solid ${hslFn("0.20")}`,
            }}
          >
            {lang === "ar" ? label.ar : label.en}
          </span>
        </div>

        {/* Progress bar + % */}
        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: hslFn("0.10") }}
          >
            <div
              ref={barRef}
              className="h-full rounded-full"
              style={{
                width:      `${skill.level}%`,
                background: `linear-gradient(${isRTL ? "270deg" : "90deg"}, ${hsl}, hsl(${color.h},${color.s}%,${Math.min(color.l + 18, 90)}%))`,
                boxShadow:  visible ? `0 0 8px ${hslFn("0.55")}` : "none",
                transform:  visible ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: isRTL ? "right" : "left",
                transition: `transform 1.1s cubic-bezier(0.16,1,0.3,1) ${animDelay + 120}ms, box-shadow 0.4s ease`,
              }}
            />
          </div>
          <span
            className="text-[10px] font-mono text-muted-foreground/45 tabular-nums flex-shrink-0 w-7"
            style={{ textAlign: isRTL ? "left" : "right" }}
          >
            {skill.level}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Skills grid ────────────────────────────────────────────────────────────
function SkillGrid({
  skills, filter, allLabel, lang, isRTL,
}: {
  skills: Skill[];
  filter: string;
  allLabel: string;
  lang: "en" | "ar";
  isRTL: boolean;
}) {
  const cats    = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);
  const visible = filter === allLabel ? skills : skills.filter(s => s.category === filter);
  const sorted  = [...visible].sort((a, b) => b.level - a.level);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
      {sorted.map((skill, i) => {
        const catIdx = Math.max(0, cats.indexOf(skill.category));
        return (
          <SkillCard
            key={skill.id}
            skill={skill}
            catIdx={catIdx}
            lang={lang}
            isRTL={isRTL}
            animDelay={Math.min(i * 45, 380)}
          />
        );
      })}
    </div>
  );
}

// ── Stats bar ──────────────────────────────────────────────────────────────
function SkillStats({ skills, lang }: { skills: Skill[]; lang: "en" | "ar" }) {
  const counts = LEVEL_LABELS.map(lvl => ({
    ...lvl,
    count: skills.filter(s => s.level >= lvl.min && s.level <= lvl.max).length,
  })).filter(l => l.count > 0);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {counts.map(lvl => (
        <span key={lvl.en} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: `hsl(${lvl.hsl})`, boxShadow: `0 0 6px hsl(${lvl.hsl}/0.55)` }}
          />
          <span className="tabular-nums font-semibold">{lvl.count}</span>
          <span className="opacity-60">{lang === "ar" ? lvl.ar : lvl.en}</span>
        </span>
      ))}
      <span className="ml-auto tabular-nums opacity-45 font-mono text-[10px]">
        {skills.length}{lang === "ar" ? " مهارة" : " skills"}
      </span>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────
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

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 640,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const h  = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    setIsMobile(mq.matches);
    return () => mq.removeEventListener("change", h);
  }, []);

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
        <h2 className="section-title mb-2">
          {lang === "ar" ? "مصفوفة التقنيات" : "Technical Skills"}
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {lang === "ar"
            ? "جميع مهاراتي التقنية مرتبة حسب المستوى والفئة"
            : "All technical skills sorted by proficiency level and category"}
        </p>
      </div>

      {/* Category filters */}
      <div
        className={`mb-8 ${
          isMobile
            ? "filters-scroll"
            : `flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`
        }`}
      >
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

      {/* Skills grid */}
      <SkillGrid
        skills={skills}
        filter={filter}
        allLabel={allLabel}
        lang={lang}
        isRTL={isRTL}
      />

      {/* Stats legend */}
      <div className="mt-6">
        <SkillStats skills={skills} lang={lang} />
      </div>
    </section>
  );
}
