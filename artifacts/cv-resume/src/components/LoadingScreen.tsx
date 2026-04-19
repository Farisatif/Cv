import { useEffect, useState } from "react";

interface Props { onDone: () => void }

export default function LoadingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 200);
    const t2 = setTimeout(() => setPhase("out"),  1400);
    const t3 = setTimeout(onDone, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "hsl(240, 25%, 3.5%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "24px",
        transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
      }}
    >
      {/* Orbit rings */}
      <div style={{ position: "relative", width: 96, height: 96 }}>
        {/* outer ring */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px solid hsl(263 80% 68% / 0.15)",
          animation: "orbit 3s linear infinite",
        }}>
          <div style={{
            position: "absolute", top: -3, left: "50%", marginLeft: -3,
            width: 6, height: 6, borderRadius: "50%",
            background: "hsl(263, 80%, 68%)",
            boxShadow: "0 0 8px hsl(263 80% 68% / 0.8)",
          }} />
        </div>

        {/* middle ring */}
        <div style={{
          position: "absolute", inset: 14, borderRadius: "50%",
          border: "1px solid hsl(192 100% 62% / 0.2)",
          animation: "orbit 2s linear infinite reverse",
        }}>
          <div style={{
            position: "absolute", top: -2.5, left: "50%", marginLeft: -2.5,
            width: 5, height: 5, borderRadius: "50%",
            background: "hsl(192, 100%, 62%)",
            boxShadow: "0 0 6px hsl(192 100% 62% / 0.8)",
          }} />
        </div>

        {/* center initials */}
        <div style={{
          position: "absolute", inset: 28, borderRadius: "50%",
          background: "hsl(240 28% 7%)",
          border: "1px solid hsl(263 80% 68% / 0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 30px hsl(263 80% 68% / 0.2)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1)",
          opacity: phase !== "in" ? 1 : 0,
          transform: phase !== "in" ? "scale(1)" : "scale(0.8)",
        }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.05em",
            color: "hsl(263, 80%, 78%)",
          }}>FA</span>
        </div>
      </div>

      {/* loading bar */}
      <div style={{
        width: 80, height: 1.5, borderRadius: 2,
        background: "hsl(240 30% 14%)",
        overflow: "hidden",
        opacity: phase !== "in" ? 1 : 0,
        transition: "opacity 0.4s ease 0.2s",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, hsl(263 80% 68%), hsl(192 100% 62%))",
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
