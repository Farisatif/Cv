import { useEffect, useRef } from "react";

/**
 * ScrollProgress — slim gradient bar fixed at the very top of the viewport
 * that fills as the visitor scrolls through the page. Premium, always-on
 * orientation cue used by most modern agency / SaaS sites.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${pct})`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none print:hidden"
      style={{ background: "hsl(var(--border) / 0.25)" }}
    >
      <div
        ref={barRef}
        className="h-full origin-left"
        style={{
          transform: "scaleX(0)",
          transition: "transform 120ms linear",
          background:
            "linear-gradient(90deg, hsl(var(--glow-primary)) 0%, hsl(var(--glow-secondary)) 60%, hsl(var(--glow-amber)) 100%)",
          boxShadow: "0 0 12px hsl(var(--glow-primary) / 0.45)",
        }}
      />
    </div>
  );
}
