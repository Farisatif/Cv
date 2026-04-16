import { useState, useRef, useEffect, useCallback } from "react";
import { resumeData } from "@/data/resume";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SKILL_LEVELS = [
  { label: "Beginner", min: 0, max: 39, color: "bg-foreground/15" },
  { label: "Intermediate", min: 40, max: 64, color: "bg-foreground/30" },
  { label: "Advanced", min: 65, max: 84, color: "bg-foreground/60" },
  { label: "Expert", min: 85, max: 100, color: "bg-foreground" },
];

function getLevelInfo(level: number) {
  return SKILL_LEVELS.find((l) => level >= l.min && level <= l.max) || SKILL_LEVELS[0];
}

interface SkillBadgeProps {
  skill: typeof resumeData.skills[0];
  index: number;
}

function SkillBadge({ skill, index }: SkillBadgeProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dropped, setDropped] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(skill.level);
  const [showLevel, setShowLevel] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const levelInfo = getLevelInfo(currentLevel);

  const snapBack = useCallback(() => {
    setDragging(false);
    setDropped(true);

    // Reduce level when dropped (simulate gravity damage)
    const drop = Math.floor(Math.random() * 25) + 10;
    const newLevel = Math.max(10, skill.level - drop);
    setCurrentLevel(newLevel);
    setShowLevel(true);

    // Animate snap back
    setPosition({ x: 0, y: 0 });

    // Recover after a delay
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
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
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
      if (dist > 60) {
        snapBack();
      } else {
        setDragging(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, position, snapBack]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      setPosition({ x: dragRef.current.startPosX + dx, y: dragRef.current.startPosY + dy });
    };

    const handleTouchEnd = () => {
      const dist = Math.sqrt(position.x ** 2 + position.y ** 2);
      if (dist > 60) {
        snapBack();
      } else {
        setDragging(false);
        setPosition({ x: 0, y: 0 });
      }
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
      ref={badgeRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`skill-badge relative inline-flex flex-col items-start gap-1.5 px-3 py-2.5 rounded-lg border transition-all select-none ${
        dragging
          ? "border-foreground/50 shadow-2xl scale-105 z-50 bg-card"
          : dropped
          ? "border-foreground/20 bg-muted/50 scale-95"
          : "border-border bg-card hover:border-foreground/30 hover:shadow-md"
      }`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px) ${dragging ? "scale(1.05) rotate(2deg)" : dropped ? "scale(0.95)" : ""}`,
        transition: dragging ? "box-shadow 0.1s" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s, border-color 0.2s",
        zIndex: dragging ? 9999 : undefined,
        animationDelay: `${index * 60}ms`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground font-mono">{skill.name}</span>
        <span className="text-[10px] text-muted-foreground">{skill.category}</span>
      </div>

      {/* Level bar */}
      <div className="w-full h-1 rounded-full bg-muted overflow-hidden" style={{ width: "90px" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${levelInfo.color}`}
          style={{ width: `${currentLevel}%` }}
        />
      </div>

      {/* Dropped feedback */}
      {showLevel && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-mono animate-bounce">
          {currentLevel}% — recovering...
        </div>
      )}

      {/* Drag hint */}
      {!dragging && !dropped && (
        <div className="absolute inset-0 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

export default function SkillsSection() {
  const sectionRef = useScrollReveal();
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(resumeData.skills.map((s) => s.category)))];
  const filtered = filter === "All" ? resumeData.skills : resumeData.skills.filter((s) => s.category === filter);

  return (
    <section id="skills" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-24 max-w-5xl mx-auto px-6">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Skills</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Drag the badges around — drop them to see what happens.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
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

      {/* Skill badges */}
      <div className="flex flex-wrap gap-3 relative min-h-32">
        {filtered.map((skill, i) => (
          <SkillBadge key={skill.id} skill={skill} index={i} />
        ))}
      </div>

      {/* Hint */}
      <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-foreground" />
          Expert (85%+)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-foreground/60" />
          Advanced
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-foreground/30" />
          Intermediate
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-foreground/15" />
          Learning
        </span>
      </div>
    </section>
  );
}
