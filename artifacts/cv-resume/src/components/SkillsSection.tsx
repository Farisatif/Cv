import { useState, useRef, useEffect, useCallback } from "react";
import { getSkills } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SKILL_LEVELS = [
  { label_en: "Learning", label_ar: "متعلم", min: 0, max: 39, bar: "bg-slate-400", glow: "", dot: "bg-slate-400", text: "text-slate-500 dark:text-slate-400" },
  { label_en: "Intermediate", label_ar: "متوسط", min: 40, max: 64, bar: "bg-blue-400", glow: "shadow-[0_0_10px_2px_rgba(96,165,250,0.5)]", dot: "bg-blue-400", text: "text-blue-500 dark:text-blue-400" },
  { label_en: "Advanced", label_ar: "متقدم", min: 65, max: 84, bar: "bg-violet-500", glow: "shadow-[0_0_12px_2px_rgba(139,92,246,0.55)]", dot: "bg-violet-500", text: "text-violet-600 dark:text-violet-400" },
  { label_en: "Expert", label_ar: "خبير", min: 85, max: 100, bar: "bg-emerald-500", glow: "shadow-[0_0_14px_3px_rgba(16,185,129,0.6)]", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
];

function getLevelInfo(level: number) {
  return SKILL_LEVELS.find((l) => level >= l.min && level <= l.max) || SKILL_LEVELS[0];
}

interface SkillItem { id: string; name: string; level: number; category: string }
interface Vec2 { x: number; y: number }

function SkillBadge({ skill, index, containerRef }: { skill: SkillItem; index: number; containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState<Vec2>({ x: 0, y: 0 });
  const [vel, setVel] = useState<Vec2>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [settled, setSettled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [falling, setFalling] = useState(false);
  const [displayLevel, setDisplayLevel] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [showDelta, setShowDelta] = useState<number | null>(null);

  const dragStart = useRef<{ mx: number; my: number; px: number; py: number }>({ mx: 0, my: 0, px: 0, py: 0 });
  const lastMouse = useRef<Vec2>({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const settleRef = useRef<number>(0);
  const badgeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  const velRef = useRef(vel);

  posRef.current = pos;
  velRef.current = vel;

  const levelInfo = getLevelInfo(displayLevel);

  useEffect(() => {
    const delay = setTimeout(() => {
      setMounted(true);
      setFalling(true);
      setDisplayLevel(skill.level);
      setTimeout(() => setSettled(true), 600 + index * 40);
    }, index * 55 + 80);
    return () => clearTimeout(delay);
  }, [index, skill.level]);

  const runPhysics = useCallback(() => {
    const p = { ...posRef.current };
    const v = { ...velRef.current };

    const GRAVITY = 0.55;
    const FRICTION = 0.88;
    const BOUNCE = 0.38;
    const REST_THRESHOLD = 0.8;

    const container = containerRef.current;
    const badge = badgeRef.current;
    if (!container || !badge) return;

    const containerH = container.clientHeight;
    const badgeH = badge.offsetHeight;
    const floorY = containerH - badgeH - 4;

    v.y += GRAVITY;
    v.x *= FRICTION;
    p.x += v.x;
    p.y += v.y;

    if (p.y >= floorY) {
      p.y = floorY;
      v.y *= -BOUNCE;
      v.x *= FRICTION;
      if (Math.abs(v.y) < REST_THRESHOLD) {
        v.y = 0;
        if (Math.abs(v.x) < 0.1) v.x = 0;
      }
    }

    setPos({ ...p });
    setVel({ ...v });
    posRef.current = p;
    velRef.current = v;

    if (Math.abs(v.y) > 0.05 || Math.abs(v.x) > 0.05 || p.y < floorY - 1) {
      animRef.current = requestAnimationFrame(runPhysics);
    }
  }, [containerRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    cancelAnimationFrame(animRef.current);
    clearTimeout(settleRef.current);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    setShowDelta(null);
  }, [pos]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    cancelAnimationFrame(animRef.current);
    dragStart.current = { mx: touch.clientX, my: touch.clientY, px: pos.x, py: pos.y };
    lastMouse.current = { x: touch.clientX, y: touch.clientY };
    setDragging(true);
    setShowDelta(null);
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const vx = e.clientX - lastMouse.current.x;
      const vy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setVel({ x: vx * 0.9, y: vy * 0.9 });
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };

    const onUp = () => {
      setDragging(false);
      const thrown = Math.abs(velRef.current.x) > 4 || Math.abs(velRef.current.y) > 4;
      if (thrown) {
        const delta = Math.round((Math.abs(velRef.current.x) + Math.abs(velRef.current.y)) * 1.5);
        const newLevel = Math.max(5, skill.level - Math.min(delta, 25));
        setDisplayLevel(newLevel);
        setShowDelta(-(skill.level - newLevel));
        settleRef.current = window.setTimeout(() => {
          setDisplayLevel(skill.level);
          setShowDelta(null);
        }, 2500);
      }
      animRef.current = requestAnimationFrame(runPhysics);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, skill.level, runPhysics]);

  useEffect(() => {
    if (!dragging) return;

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.mx;
      const dy = touch.clientY - dragStart.current.my;
      const vx = touch.clientX - lastMouse.current.x;
      const vy = touch.clientY - lastMouse.current.y;
      lastMouse.current = { x: touch.clientX, y: touch.clientY };
      setVel({ x: vx * 0.9, y: vy * 0.9 });
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };

    const onTouchEnd = () => {
      setDragging(false);
      animRef.current = requestAnimationFrame(runPhysics);
    };

    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging, runPhysics]);

  useEffect(() => {
    if (!mounted || dragging) return;
    if (falling && !settled) {
      animRef.current = requestAnimationFrame(runPhysics);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [mounted, falling, settled, dragging, runPhysics]);

  useEffect(() => () => {
    cancelAnimationFrame(animRef.current);
    clearTimeout(settleRef.current);
  }, []);

  const rotate = dragging ? `${vel.x * 1.2}deg` : "0deg";

  return (
    <div
      ref={badgeRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`absolute select-none inline-flex flex-col items-start gap-2 px-3 py-2.5 rounded-xl border cursor-grab active:cursor-grabbing transition-[box-shadow,border-color,opacity] ${
        dragging
          ? `border-foreground/50 shadow-2xl z-[9999] bg-card ${levelInfo.glow}`
          : hovered
          ? `border-foreground/30 shadow-lg bg-card ${levelInfo.glow} z-10`
          : "border-border bg-card z-[1]"
      }`}
      style={{
        transform: `translate(${pos.x}px, ${pos.y}px) rotate(${rotate}) scale(${dragging ? 1.06 : 1})`,
        opacity: mounted ? 1 : 0,
        willChange: "transform",
        transition: dragging
          ? "box-shadow 0.1s, border-color 0.1s, opacity 0.3s"
          : settled
          ? "box-shadow 0.2s, border-color 0.2s, opacity 0.4s"
          : "opacity 0.4s",
      }}
    >
      <div className="flex items-center justify-between w-full gap-2">
        <span className="text-xs font-semibold text-foreground font-mono whitespace-nowrap">{skill.name}</span>
        <span className={`text-[10px] font-mono font-medium tabular-nums ${levelInfo.text}`}>{displayLevel}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-muted overflow-hidden" style={{ width: "100px" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${levelInfo.bar}`}
          style={{ width: `${displayLevel}%` }}
        />
      </div>

      <span className={`text-[9px] font-medium uppercase tracking-wide ${levelInfo.text}`}>
        {skill.category}
      </span>

      {showDelta !== null && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-mono font-bold animate-bounce pointer-events-none">
          {showDelta}%
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerH, setContainerH] = useState(280);

  const allLabel = t.skills.all;
  const categories = [allLabel, ...Array.from(new Set(skills.map((s) => s.category)))];
  const filtered = filter === allLabel ? skills : skills.filter((s) => s.category === filter);

  useEffect(() => { setFilter(allLabel); }, [lang]);

  useEffect(() => {
    const needed = Math.max(240, Math.ceil(filtered.length / 3) * 90 + 40);
    setContainerH(needed);
  }, [filtered.length]);

  const BADGE_W = 144;
  const BADGE_H = 74;
  const COLS = 3;
  const GAP_X = 16;
  const GAP_Y = 12;

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

      <div className="border border-border/60 rounded-xl bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden"
          style={{ height: `${containerH}px`, minHeight: "220px" }}
        >
          {filtered.map((skill, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const startX = col * (BADGE_W + GAP_X) + GAP_X;
            const startY = -(BADGE_H * 2) - row * (BADGE_H + GAP_Y);
            return (
              <div
                key={skill.id + filter}
                style={{ position: "absolute", left: startX, top: startY }}
              >
                <SkillBadge skill={skill} index={i} containerRef={containerRef} />
              </div>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-border/40 bg-muted/20 flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M7 11V7a5 5 0 0 1 10 0v4M12 17v.01"/><rect x="3" y="11" width="18" height="11" rx="2"/>
          </svg>
          <span className="text-[10px] text-muted-foreground">
            {lang === "ar" ? "اسحب القطع وألقِها بقوة لترى تأثير الفيزياء" : "Drag and throw the badges to see physics in action"}
          </span>
        </div>
      </div>

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
