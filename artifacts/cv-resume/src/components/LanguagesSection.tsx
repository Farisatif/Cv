import { useEffect, useRef, useState } from "react";
import { useResumeData } from "@/context/ResumeDataContext";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const COLORS = [
  { bar: "hsl(160 80% 45%)", light: "hsl(160 80% 45% / 0.15)", border: "hsl(160 80% 45% / 0.4)" },
  { bar: "hsl(220 90% 60%)", light: "hsl(220 90% 60% / 0.15)", border: "hsl(220 90% 60% / 0.4)" },
  { bar: "hsl(263 80% 65%)", light: "hsl(263 80% 65% / 0.15)", border: "hsl(263 80% 65% / 0.4)" },
  { bar: "hsl(38 95% 55%)",  light: "hsl(38 95% 55% / 0.15)",  border: "hsl(38 95% 55% / 0.4)"  },
  { bar: "hsl(0 85% 62%)",   light: "hsl(0 85% 62% / 0.15)",   border: "hsl(0 85% 62% / 0.4)"   },
  { bar: "hsl(192 100% 52%)",light: "hsl(192 100% 52% / 0.15)",border: "hsl(192 100% 52% / 0.4)" },
];
function getColor(i: number) { return COLORS[i % COLORS.length]; }

export default function LanguagesSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const { data } = useResumeData();
  const languages = data.languages;

  const [started, setStarted]   = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [widths, setWidths]     = useState(languages.map(l => l.percent));
  const containerRef  = useRef<HTMLDivElement>(null);
  const barRef        = useRef<HTMLDivElement>(null);
  const dragStartRef  = useRef({ x: 0, startWidth: 0, index: 0 });

  useEffect(() => { setWidths(languages.map(l => l.percent)); }, [data]);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setTimeout(() => setStarted(true), 200); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, startWidth: widths[index], index };
    setDragging(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragging === null || !containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const rawDx = e.clientX - dragStartRef.current.x;
    const dx = isRTL ? -rawDx : rawDx;
    const delta = (dx / containerWidth) * 100;
    
    const newWidth = Math.max(5, Math.min(80, dragStartRef.current.startWidth + delta));
    const diff = newWidth - dragStartRef.current.startWidth;
    
    setWidths(prev => {
      const next = [...prev];
      next[dragging] = newWidth;
      if (dragging + 1 < next.length) {
        next[dragging + 1] = Math.max(3, prev[dragging + 1] - diff);
      }
      const sum = next.reduce((a, b) => a + b, 0);
      return next.map(w => (w / sum) * 100);
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragging !== null) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDragging(null);
    }
  };

  const reset = () => setWidths(languages.map(l => l.percent));

  return (
    <section
      id="languages-bar"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-6 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="cosmic-card glow-border rounded-2xl overflow-hidden">
        <div className={`px-6 py-4 border-b border-border flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className={`flex items-center gap-2.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="icon-btn w-8 h-8 rounded-lg flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <span className="text-sm font-semibold">{t.languages.title}</span>
          </div>
          <button
            onClick={reset}
            className={`text-xs text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""} hover:dark:text-[hsl(263_80%_75%)]`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            {t.languages.reset}
          </button>
        </div>

        <div className="px-6 py-5">
          <div className={`flex items-center gap-1.5 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/60 flex-shrink-0">
              <path d="M5 9l4-4 4 4M5 15l4 4 4-4"/>
            </svg>
            <p className={`text-xs text-muted-foreground/70 ${isRTL ? "text-right" : ""}`}>
              {t.languages.subtitle}
            </p>
          </div>

          {/* Segmented bar */}
          <div
            ref={containerRef}
            className="relative flex h-6 rounded-xl overflow-hidden mb-5 select-none cursor-col-resize border border-border/50 dark:border-[hsl(263_80%_68%/0.12)]"
          >
            {languages.map((language, i) => {
              const color = getColor(i);
              return (
                <div
                  key={language.name}
                  className="relative h-full transition-opacity"
                  style={{
                    width: `${started ? widths[i] : 0}%`,
                    background: color.bar,
                    transition: started && dragging === null ? "width 0.6s cubic-bezier(0.16,1,0.3,1)" : "none",
                    opacity: dragging === i || dragging === null ? 1 : 0.7,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)`,
                  }}
                >
                  {i < languages.length - 1 && (
                    <div
                      onPointerDown={(e) => handlePointerDown(e, i)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className={`absolute ${isRTL ? "left-0" : "right-0"} top-0 bottom-0 w-4 z-10 cursor-col-resize flex items-center justify-center group touch-none`}
                      style={{ transform: isRTL ? "translateX(-50%)" : "translateX(50%)" }}
                    >
                      <div className={`w-0.5 h-full bg-background/80 transition-all ${dragging === i ? "opacity-100 scale-x-150" : "opacity-60 group-hover:opacity-100 group-hover:scale-x-150"}`} />
                      <div className={`absolute w-4 h-4 rounded-full bg-background border-2 shadow-md transition-transform ${dragging === i ? "scale-100" : "scale-0 group-hover:scale-100"}`}
                        style={{ borderColor: color.bar }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div ref={barRef} />

          {/* Legend with individual cards */}
          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${isRTL ? "direction-rtl" : ""}`}>
            {languages.map((language, i) => {
              const color = getColor(i);
              return (
                <div
                  key={language.name}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${isRTL ? "flex-row-reverse" : ""}`}
                  style={{
                    background: color.light,
                    borderColor: color.border,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ background: color.bar, boxShadow: `0 0 6px ${color.bar}` }}
                  />
                  <div className={`min-w-0 ${isRTL ? "text-right" : ""}`}>
                    <div className="text-xs font-semibold truncate">{language.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{widths[i].toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
