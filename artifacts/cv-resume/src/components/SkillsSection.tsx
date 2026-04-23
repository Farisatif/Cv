import React, { useState, useEffect, useRef, useMemo } from "react";
import { getSkills } from "@/lib/resumeUtils";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Color palette ──────────────────────────────────────────────────────────
const PALETTE = [
  { h: 212, s: 100, l: 67 },
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
  { min: 65, max: 84,  en: "Advanced",     ar: "متقدم",  hsl: "212 100% 67%" },
  { min: 85, max: 100, en: "Expert",       ar: "خبير",   hsl: "160 82% 42%" },
];
function getLabel(n: number) {
  return LEVEL_LABELS.find(l => n >= l.min && n <= l.max) ?? LEVEL_LABELS[0];
}

interface Skill { id: string; name: string; level: number; category: string }

// ── Animated skill card ────────────────────────────────────────────────────
function SkillCard({
  skill, catIdx, lang, isRTL, animDelay,
  draggable, isDragging, isDragOver,
  onDragStart, onDragOver, onDragLeave, onDrop, onDragEnd,
}: {
  skill: Skill;
  catIdx: number;
  lang: "en" | "ar";
  isRTL: boolean;
  animDelay: number;
  draggable?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
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
    ? { borderRight: `2px solid ${hsl}` }
    : { borderLeft:  `2px solid ${hsl}` };

  return (
    <div
      ref={cardRef}
      className="skill-card"
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        ...accentBorder,
        opacity:    visible ? (isDragging ? 0.4 : 1) : 0,
        transform:  visible ? (isDragOver ? "translateY(-3px) scale(1.02)" : "translateY(0)") : "translateY(20px)",
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${animDelay}ms, transform 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.22s ease, box-shadow 0.25s ease`,
        cursor:     draggable ? "grab" : "default",
        boxShadow:  isDragOver ? `0 6px 18px ${hslFn("0.35")}` : undefined,
      }}
    >
      <div className="p-2">
        {/* Name + badge row */}
        <div className={`flex items-center justify-between gap-1.5 mb-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
            <div className="text-[11px] font-bold tracking-tight leading-tight truncate">
              {skill.name}
            </div>
          </div>
          <span
            className="text-[8px] font-bold px-1 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
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
        <div className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: hslFn("0.10") }}
          >
            <div
              ref={barRef}
              className="h-full rounded-full"
              style={{
                width:      `${skill.level}%`,
                background: `linear-gradient(${isRTL ? "270deg" : "90deg"}, ${hsl}, hsl(${color.h},${color.s}%,${Math.min(color.l + 18, 90)}%))`,
                boxShadow:  visible ? `0 0 6px ${hslFn("0.45")}` : "none",
                transform:  visible ? "scaleX(1)" : "scaleX(0)",
                transformOrigin: isRTL ? "right" : "left",
                transition: `transform 1.1s cubic-bezier(0.16,1,0.3,1) ${animDelay + 120}ms, box-shadow 0.4s ease`,
              }}
            />
          </div>
          <span
            className="text-[9px] font-mono text-muted-foreground/45 tabular-nums flex-shrink-0 w-6"
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
const ORDER_KEY = "cv-skills-order-v1";

function SkillGrid({
  skills, filter, allLabel, lang, isRTL,
}: {
  skills: Skill[];
  filter: string;
  allLabel: string;
  lang: "en" | "ar";
  isRTL: boolean;
}) {
  const cats = useMemo(() => Array.from(new Set(skills.map(s => s.category))), [skills]);

  // Load any saved custom order
  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Build the display list: sort by level desc, then apply user reorder
  const baseSorted = useMemo(
    () => [...skills].sort((a, b) => b.level - a.level),
    [skills],
  );

  const fullOrdered = useMemo(() => {
    const map = new Map(baseSorted.map(s => [s.id, s]));
    const seen = new Set<string>();
    const result: Skill[] = [];
    for (const id of order) {
      const s = map.get(id);
      if (s) { result.push(s); seen.add(id); }
    }
    for (const s of baseSorted) {
      if (!seen.has(s.id)) result.push(s);
    }
    return result;
  }, [baseSorted, order]);

  const visible = filter === allLabel
    ? fullOrdered
    : fullOrdered.filter(s => s.category === filter);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId]         = useState<string | null>(null);

  const persist = (next: string[]) => {
    setOrder(next);
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(next)); } catch {}
  };

  useEffect(() => {
    const reset = () => setOrder([]);
    window.addEventListener("cv-skills-order-reset", reset);
    return () => window.removeEventListener("cv-skills-order-reset", reset);
  }, []);

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const ids       = fullOrdered.map(s => s.id);
    const fromIdx   = ids.indexOf(draggingId);
    const toIdx     = ids.indexOf(targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    const next = [...ids];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    persist(next);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {visible.map((skill, i) => {
        const catIdx = Math.max(0, cats.indexOf(skill.category));
        return (
          <SkillCard
            key={skill.id}
            skill={skill}
            catIdx={catIdx}
            lang={lang}
            isRTL={isRTL}
            animDelay={Math.min(i * 35, 320)}
            draggable
            isDragging={draggingId === skill.id}
            isDragOver={overId === skill.id && draggingId !== skill.id}
            onDragStart={(e) => {
              setDraggingId(skill.id);
              e.dataTransfer.effectAllowed = "move";
              try { e.dataTransfer.setData("text/plain", skill.id); } catch {}
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overId !== skill.id) setOverId(skill.id);
            }}
            onDragLeave={() => {
              if (overId === skill.id) setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(skill.id);
              setOverId(null);
              setDraggingId(null);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
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

      {/* Drag hint */}
      <div className={`mb-3 flex items-center gap-2 text-[10px] text-muted-foreground/60 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
        <span>↔</span>
        <span>
          {lang === "ar"
            ? "يمكنك سحب وإفلات المهارات لإعادة ترتيبها"
            : "Drag and drop skills to reorder them"}
        </span>
        <button
          type="button"
          onClick={() => {
            try { localStorage.removeItem("cv-skills-order-v1"); } catch {}
            window.dispatchEvent(new Event("cv-skills-order-reset"));
          }}
          className={`${isRTL ? "mr-auto" : "ml-auto"} text-[10px] underline opacity-70 hover:opacity-100`}
        >
          {lang === "ar" ? "إعادة الترتيب" : "Reset order"}
        </button>
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
