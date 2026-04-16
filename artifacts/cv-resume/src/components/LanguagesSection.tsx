import { useEffect, useRef, useState } from "react";
import { resumeData } from "@/data/resume";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANGUAGE_SHADES = [
  "bg-foreground",
  "bg-foreground/75",
  "bg-foreground/55",
  "bg-foreground/38",
  "bg-foreground/22",
];

export default function LanguagesSection() {
  const sectionRef = useScrollReveal();
  const [started, setStarted] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [widths, setWidths] = useState(resumeData.languages.map((l) => l.percent));
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, startWidth: 0, index: 0 });

  const startObserver = useRef<IntersectionObserver | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    startObserver.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setStarted(true), 200);
          startObserver.current?.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    startObserver.current.observe(el);
    return () => startObserver.current?.disconnect();
  }, []);

  const handleDividerMouseDown = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, startWidth: widths[index], index };
    setDragging(index);
  };

  useEffect(() => {
    if (dragging === null) return;

    const total = widths.reduce((a, b) => a + b, 0);

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const dx = e.clientX - dragStartRef.current.x;
      const deltaPercent = (dx / containerWidth) * 100;
      const newWidth = Math.max(5, Math.min(80, dragStartRef.current.startWidth + deltaPercent));
      const diff = newWidth - dragStartRef.current.startWidth;

      setWidths((prev) => {
        const next = [...prev];
        next[dragging] = newWidth;
        // Adjust next item to compensate
        if (dragging + 1 < next.length) {
          next[dragging + 1] = Math.max(3, prev[dragging + 1] - diff);
        }
        // Normalize to 100%
        const sum = next.reduce((a, b) => a + b, 0);
        return next.map((w) => (w / sum) * 100);
      });
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, widths]);

  const resetWidths = () => {
    setWidths(resumeData.languages.map((l) => l.percent));
  };

  return (
    <section id="languages-bar" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-16 max-w-5xl mx-auto px-6">
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
            <span className="text-sm font-semibold">Languages</span>
          </div>
          <button
            onClick={resetWidths}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-xs text-muted-foreground mb-4">
            Drag the dividers to resize — this is interactive.
          </p>

          {/* Language bar */}
          <div
            ref={containerRef}
            className="relative flex h-3 rounded-full overflow-hidden mb-5 cursor-col-resize select-none"
          >
            {resumeData.languages.map((lang, i) => (
              <div
                key={lang.name}
                className={`relative h-full flex items-center justify-center ${LANGUAGE_SHADES[i]} transition-all duration-150 ${dragging === i ? "" : ""}`}
                style={{ width: `${started ? widths[i] : 0}%`, transition: started && dragging === null ? "width 0.5s cubic-bezier(0.25, 1, 0.5, 1)" : "none" }}
              >
                {/* Divider handle */}
                {i < resumeData.languages.length - 1 && (
                  <div
                    onMouseDown={(e) => handleDividerMouseDown(e, i)}
                    className={`absolute right-0 top-0 bottom-0 w-1 z-10 cursor-col-resize group flex items-center justify-center`}
                    style={{ transform: "translateX(50%)" }}
                  >
                    <div className={`w-0.5 h-full bg-background opacity-80 hover:opacity-100 ${dragging === i ? "opacity-100" : ""}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div ref={barRef} />

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {resumeData.languages.map((lang, i) => (
              <div key={lang.name} className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-sm ${LANGUAGE_SHADES[i]}`}
                />
                <span className="text-xs text-foreground font-medium">{lang.name}</span>
                <span className="text-xs text-muted-foreground font-mono">
                  {widths[i].toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
