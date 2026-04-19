import { useState, useEffect } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SKILL_LEVELS = [
  { label_en: "Learning",     label_ar: "متعلم", min: 0,  max: 39,  bar: "bg-slate-400",   dot: "bg-slate-400",   text: "text-slate-500 dark:text-slate-400"   },
  { label_en: "Intermediate", label_ar: "متوسط", min: 40, max: 64,  bar: "bg-blue-400",    dot: "bg-blue-400",    text: "text-blue-500 dark:text-blue-400"    },
  { label_en: "Advanced",     label_ar: "متقدم", min: 65, max: 84,  bar: "bg-violet-500",  dot: "bg-violet-500",  text: "text-violet-600 dark:text-violet-400" },
  { label_en: "Expert",       label_ar: "خبير",  min: 85, max: 100, bar: "bg-emerald-500", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
];

function getLevelInfo(level: number) {
  return SKILL_LEVELS.find((l) => level >= l.min && level <= l.max) || SKILL_LEVELS[0];
}

function SkillCard({ skill, index }: { skill: { id: string; name: string; level: number; category: string }; index: number }) {
  const [visible, setVisible] = useState(false);
  const levelInfo = getLevelInfo(skill.level);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 40 + 60);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-border bg-card hover:border-foreground/25 hover:shadow-sm transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.35s ease, transform 0.35s ease, box-shadow 0.2s, border-color 0.2s",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground font-mono truncate">{skill.name}</span>
        <span className={`text-[10px] font-mono font-medium tabular-nums flex-shrink-0 ${levelInfo.text}`}>
          {skill.level}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${levelInfo.bar}`}
          style={{ width: `${visible ? skill.level : 0}%` }}
        />
      </div>

      <span className={`text-[9px] font-medium uppercase tracking-wide ${levelInfo.text}`}>
        {skill.category}
      </span>
    </div>
  );
}

export default function SkillsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const skills = getSkills(lang, resumeData);
  const [filter, setFilter] = useState("All");

  const allLabel = t.skills.all;
  const categories = [allLabel, ...Array.from(new Set(skills.map((s) => s.category)))];
  const filtered = filter === allLabel ? skills : skills.filter((s) => s.category === filter);

  useEffect(() => { setFilter(allLabel); }, [lang]);

  return (
    <section
      id="skills"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <div className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.skills.title}</h2>
        </div>
        <p className="text-muted-foreground text-sm">{t.skills.subtitle}</p>
      </div>

      {/* Category filter */}
      <div className={`flex flex-wrap gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
              filter === cat
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Skills grid */}
      <div className="border border-border/60 rounded-xl bg-card/40 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((skill, i) => (
            <SkillCard key={skill.id + filter} skill={skill} index={i} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {SKILL_LEVELS.slice().reverse().map((lvl) => (
          <span key={lvl.label_en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${lvl.dot}`} />
            <span>{lang === "ar" ? lvl.label_ar : lvl.label_en}</span>
            <span className="font-mono opacity-60">{lvl.min === 85 ? "85%+" : `${lvl.min}–${lvl.max}%`}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
