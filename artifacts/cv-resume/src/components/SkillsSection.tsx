import { useState, useRef, useEffect, useCallback } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SKILL_LEVELS = [
  {
    label_en: "Learning",
    label_ar: "متعلم",
    min: 0,
    max: 39,
    bar: "bg-slate-400",
    glow: "",
    dot: "bg-slate-400",
    text: "text-slate-500 dark:text-slate-400",
  },
  {
    label_en: "Intermediate",
    label_ar: "متوسط",
    min: 40,
    max: 64,
    bar: "bg-blue-400",
    glow: "shadow-[0_0_6px_0px_rgba(96,165,250,0.6)]",
    dot: "bg-blue-400",
    text: "text-blue-500 dark:text-blue-400",
  },
  {
    label_en: "Advanced",
    label_ar: "متقدم",
    min: 65,
    max: 84,
    bar: "bg-violet-500",
    glow: "shadow-[0_0_8px_0px_rgba(139,92,246,0.65)]",
    dot: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    label_en: "Expert",
    label_ar: "خبير",
    min: 85,
    max: 100,
    bar: "bg-emerald-500",
    glow: "shadow-[0_0_10px_0px_rgba(16,185,129,0.7)]",
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
];

function getLevelInfo(level: number) {
  return SKILL_LEVELS.find((l) => level >= l.min && level <= l.max) || SKILL_LEVELS[0];
}

interface SkillItem { id: string; name: string; level: number; category: string }

function SkillBadge({ skill, index }: { skill: SkillItem; index: number }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const levelInfo = getLevelInfo(currentLevel);

  useEffect(() => {
    const delay = setTimeout(() => {
      setMounted(true);
      setCurrentLevel(skill.level);
    }, index * 60 + 120);
    return () => clearTimeout(delay);
  }, [index, skill.level]);

  const snapBack = useCallback(() => {
    setDragging(false);
    setDropped(true);
    const drop = Math.floor(Math.random() * 25) + 10;
    const newLevel = Math.max(10, skill.level - drop);
    setCurrentLevel(newLevel);
    setShowLevel(true);
    setPosition({ x: 0, y: 0 });
    setTimeout(() => {
      setDropped(false);
      setShowLevel(false);
      let lvl = newLevel;
      const recover = setInterval(() => {
        lvl = Math.min(skill.level, lvl + 2);
        setCurrentLevel(lvl);
        if (lvl >= skill.level) clearInterval(recover);
      }, 40);
    }, 1800);
  }, [skill.level]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: position.x, startPosY: position.y };
    setDragging(true);
    setShowLevel(false);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
    };
    const handleMouseUp = () => {
      const dist = Math.sqrt(position.x ** 2 + position.y ** 2);
      if (dist > 60) snapBack();
      else { setDragging(false); setPosition({ x: 0, y: 0 }); }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, position, snapBack]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { startX: touch.clientX, startY: touch.clientY, startPosX: position.x, startPosY: position.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      setPosition({ x: dragRef.current.startPosX + touch.clientX - dragRef.current.startX, y: dragRef.current.startPosY + touch.clientY - dragRef.current.startY });
    };
    const handleTouchEnd = () => {
      const dist = Math.sqrt(position.x ** 2 + position.y ** 2);
      if (dist > 60) snapBack();
      else { setDragging(false); setPosition({ x: 0, y: 0 }); }
    };
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [dragging, position, snapBack]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`skill-badge relative inline-flex flex-col items-start gap-2 px-3 py-2.5 rounded-lg border transition-all select-none ${
        dragging
          ? `border-foreground/50 shadow-2xl z-50 bg-card ${levelInfo.glow}`
          : dropped
          ? "border-foreground/20 bg-muted/50 scale-95"
          : hovered
          ? `border-foreground/30 shadow-lg bg-card ${levelInfo.glow}`
          : "border-border bg-card"
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)${dragging ? " scale(1.06) rotate(2deg)" : dropped ? " scale(0.95)" : ""}`,
        transition: dragging ? "box-shadow 0.1s" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, border-color 0.2s",
        zIndex: dragging ? 9999 : undefined,
        opacity: mounted ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <span className="text-xs font-semibold text-foreground font-mono">{skill.name}</span>
        <span className={`text-[10px] font-mono font-medium ${levelInfo.text}`}>{currentLevel}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden" style={{ width: "100px" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${levelInfo.bar}`}
          style={{ width: `${currentLevel}%` }}
        />
      </div>

      <span className={`text-[9px] font-medium uppercase tracking-wide ${levelInfo.text}`}>
        {skill.category}
      </span>

      {showLevel && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-mono animate-bounce">
          -{skill.level - currentLevel}%
        </div>
      )}
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

  useEffect(() => {
    setFilter(allLabel);
  }, [lang]);

  return (
    <section
      id="skills"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
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

      {/* Category filters */}
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

      {/* Skill badges frame */}
      <div className="border border-border/60 rounded-xl p-5 bg-card/40 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap gap-3 relative min-h-24">
          {filtered.map((skill, i) => (
            <SkillBadge key={skill.id} skill={skill} index={i} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-5 flex flex-wrap items-center gap-5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
        {SKILL_LEVELS.slice().reverse().map((lvl) => (
          <span key={lvl.label_en} className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${lvl.dot}`} />
            <span>{lang === "ar" ? lvl.label_ar : lvl.label_en}</span>
            <span className="font-mono opacity-60">
              {lvl.min === 85 ? "85%+" : `${lvl.min}–${lvl.max}%`}
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
