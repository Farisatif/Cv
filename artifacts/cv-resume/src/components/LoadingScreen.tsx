import { useEffect, useState } from "react";

interface Props { onDone: () => void }

export default function LoadingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  const mood = (() => {
    try {
      const stored = localStorage.getItem("cv-mood");
      if (stored === "dark" || stored === "light" || stored === "cosmic") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "cosmic" : "light";
    } catch { return "cosmic"; }
  })();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("out"),  1400);
    const t3 = setTimeout(onDone, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const themes = {
    cosmic: {
      bg: "hsl(218, 90%, 2.5%)",    ring: "hsl(174, 88%, 52%)",
      cyan: "hsl(199, 94%, 58%)",   center: "hsl(218, 80%, 4%)",
      textColor: "hsl(174, 80%, 65%)", trackColor: "hsl(210, 55%, 9%)",
    },
    dark: {
      bg: "hsl(216, 28%, 7%)",      ring: "hsl(212, 100%, 67%)",
      cyan: "hsl(155, 77%, 58%)",   center: "hsl(215, 28%, 10%)",
      textColor: "hsl(212, 100%, 72%)", trackColor: "hsl(215, 16%, 20%)",
    },
    light: {
      bg: "hsl(220, 16%, 95%)",     ring: "hsl(212, 93%, 44%)",
      cyan: "hsl(174, 78%, 38%)",   center: "hsl(0, 0%, 100%)",
      textColor: "hsl(212, 93%, 36%)", trackColor: "hsl(215, 18%, 87%)",
    },
  };

  const t = themes[mood];
  const bg = t.bg; const ring = t.ring; const cyan = t.cyan;
  const center = t.center; const textColor = t.textColor; const trackColor = t.trackColor;
  const bar1 = ring; const bar2 = cyan;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "24px",
        transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Radial glow behind the spinner */}
      <div style={{
        position: "absolute",
        width: 280, height: 280,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${ring}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Orbit rings */}
      <div style={{ position: "relative", width: 96, height: 96 }}>
        {/* outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `1px solid ${ring}26`,
          animation: "orbit 3s linear infinite",
        }}>
          <div style={{
            position: "absolute", top: -3, left: "50%", marginLeft: -3,
            width: 6, height: 6, borderRadius: "50%",
            background: ring,
            boxShadow: `0 0 8px ${ring}cc, 0 0 16px ${ring}66`,
          }} />
        </div>

        {/* middle ring */}
        <div style={{
          position: "absolute", inset: 14, borderRadius: "50%",
          border: `1px solid ${cyan}33`,
          animation: "orbit 2s linear infinite reverse",
        }}>
          <div style={{
            position: "absolute", top: -2.5, left: "50%", marginLeft: -2.5,
            width: 5, height: 5, borderRadius: "50%",
            background: cyan,
            boxShadow: `0 0 6px ${cyan}cc`,
          }} />
        </div>

        {/* center initials */}
        <div style={{
          position: "absolute", inset: 28, borderRadius: "50%",
          background: center,
          border: `1px solid ${ring}4d`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 30px ${ring}33`,
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          opacity: phase !== "in" ? 1 : 0,
          transform: phase !== "in" ? "scale(1)" : "scale(0.8)",
        }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
            color: textColor,
          }}>FA</span>
        </div>
      </div>

      {/* loading bar */}
      <div style={{
        width: 80, height: 1.5, borderRadius: 2,
        background: trackColor,
        overflow: "hidden",
        opacity: phase !== "in" ? 1 : 0,
        transition: "opacity 0.4s ease 0.2s",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: `linear-gradient(90deg, ${bar1}, ${bar2})`,
          animation: phase === "out" ? "none" : "load-bar 1.2s cubic-bezier(0.16,1,0.3,1) forwards",
          width: phase === "out" ? "100%" : undefined,
        }} />
      </div>

      <style>{`
        @keyframes load-bar {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
