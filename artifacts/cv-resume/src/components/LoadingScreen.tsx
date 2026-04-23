import { useEffect, useState, useRef } from "react";

interface Props { onDone: () => void }

const TECH_WORDS = [
  "React", "TypeScript", "Node.js", "Python", "Docker",
  "PostgreSQL", "Git", "Linux", "Redis", "Tailwind",
  "GraphQL", "REST API", "CI/CD", "AWS", "Nginx",
  "JavaScript", "SQL", "Bash", "Webpack", "Vite",
];

const AR_WORDS = [
  "مطور", "برمجة", "تصميم", "واجهات", "قواعد البيانات",
  "خوادم", "شبكات", "ذكاء اصطناعي", "مفتوح المصدر",
];

function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

interface FloatingWord {
  text: string;
  x: number;
  y: number;
  opacity: number;
  size: number;
  delay: number;
  duration: number;
  dx: number;
  dy: number;
}

const rng = seededRng(31415);
const ALL_WORDS = [...TECH_WORDS, ...AR_WORDS];
const FLOATING_WORDS: FloatingWord[] = ALL_WORDS.map((text, i) => ({
  text,
  x: 5 + rng() * 90,
  y: 5 + rng() * 90,
  opacity: 0.045 + rng() * 0.07,
  size: 10 + rng() * 8,
  delay: rng() * 2000,
  duration: 3000 + rng() * 4000,
  dx: (rng() - 0.5) * 22,
  dy: (rng() - 0.5) * 18,
}));

export default function LoadingScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [wordsVisible, setWordsVisible] = useState(false);
  const [msgVisible, setMsgVisible] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  const mood = (() => {
    try {
      const stored = localStorage.getItem("cv-mood");
      if (stored === "dark" || stored === "light") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch { return "dark"; }
  })();

  const isDark = mood === "dark";

  const colors = isDark ? {
    bg: "hsl(216, 28%, 7%)",
    bgGrad: "radial-gradient(ellipse 80% 55% at 50% -10%, hsl(212,100%,67%/0.06) 0%, transparent 60%)",
    ring: "hsl(212, 100%, 67%)",
    ringGlow: "hsl(212,100%,67%/0.18)",
    cyan: "hsl(155, 77%, 58%)",
    center: "hsl(215, 28%, 10%)",
    textColor: "hsl(212, 100%, 76%)",
    trackColor: "hsl(215, 16%, 20%)",
    wordColor: "hsl(213, 27%, 70%)",
    wordBg: "hsl(215,28%,12%/0.7)",
    wordBorder: "hsl(215,16%,22%)",
    msgColor: "hsl(213, 27%, 84%)",
    msgMuted: "hsl(213, 18%, 52%)",
    logoBg: "hsl(215, 28%, 10%)",
    logoBorder: "hsl(212,100%,67%/0.22)",
  } : {
    bg: "hsl(220, 16%, 95%)",
    bgGrad: "radial-gradient(ellipse 80% 55% at 50% -10%, hsl(212,93%,44%/0.07) 0%, transparent 60%)",
    ring: "hsl(212, 93%, 44%)",
    ringGlow: "hsl(212,93%,44%/0.14)",
    cyan: "hsl(155, 70%, 40%)",
    center: "hsl(0, 0%, 100%)",
    textColor: "hsl(212, 93%, 36%)",
    trackColor: "hsl(215, 18%, 82%)",
    wordColor: "hsl(213, 18%, 42%)",
    wordBg: "hsl(0,0%,100%/0.85)",
    wordBorder: "hsl(215,18%,86%)",
    msgColor: "hsl(213, 18%, 14%)",
    msgMuted: "hsl(215, 14%, 42%)",
    logoBg: "hsl(0, 0%, 100%)",
    logoBorder: "hsl(212,93%,44%/0.25)",
  };

  useEffect(() => {
    const t0 = setTimeout(() => setWordsVisible(true), 150);
    const t1 = setTimeout(() => setMsgVisible(true), 380);
    const t2 = setTimeout(() => setPhase("hold"), 300);
    const t3 = setTimeout(() => {
      let w = 0;
      const step = setInterval(() => {
        w = Math.min(100, w + 1.4);
        setProgressWidth(w);
        if (w >= 100) clearInterval(step);
      }, 11);
    }, 400);
    const t4 = setTimeout(() => setPhase("out"), 1800);
    const t5 = setTimeout(onDone, 2300);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: colors.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
        transition: "opacity 0.5s cubic-bezier(0.16,1,0.3,1)",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "all",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: colors.bgGrad,
        pointerEvents: "none",
      }} />

      {/* Floating language/tech words */}
      {FLOATING_WORDS.map((word, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${word.x}%`,
            top: `${word.y}%`,
            opacity: wordsVisible ? word.opacity : 0,
            fontSize: word.size,
            fontFamily: "'Space Grotesk', 'Inter', sans-serif",
            fontWeight: 400,
            color: colors.wordColor,
            background: colors.wordBg,
            border: `1px solid ${colors.wordBorder}`,
            borderRadius: 6,
            padding: "2px 7px",
            whiteSpace: "nowrap",
            backdropFilter: "blur(4px)",
            transition: `opacity 0.8s ease ${word.delay * 0.001}s`,
            animation: wordsVisible ? `float-word-${i % 3} ${word.duration}ms ease-in-out ${word.delay}ms infinite` : "none",
            transform: "translate(-50%, -50%)",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {word.text}
        </div>
      ))}

      {/* Center content */}
      <div style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        opacity: msgVisible ? 1 : 0,
        transform: msgVisible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Logo / Avatar ring */}
        <div style={{ position: "relative", width: 80, height: 80 }}>
          {/* Outer pulsing ring */}
          <div style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: `1px solid ${colors.ring}`,
            opacity: 0.18,
            animation: "splash-ring-pulse 2s ease-in-out infinite",
          }} />
          {/* Main ring orbit */}
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `1.5px solid ${colors.ring}22`,
            animation: "orbit 3.5s linear infinite",
          }}>
            <div style={{
              position: "absolute", top: -3.5, left: "50%", marginLeft: -3.5,
              width: 7, height: 7, borderRadius: "50%",
              background: colors.ring,
              boxShadow: `0 0 10px ${colors.ring}, 0 0 20px ${colors.ring}66`,
            }} />
          </div>
          {/* Inner orbit (reverse) */}
          <div style={{
            position: "absolute", inset: 12, borderRadius: "50%",
            border: `1px solid ${colors.cyan}28`,
            animation: "orbit 2s linear infinite reverse",
          }}>
            <div style={{
              position: "absolute", top: -2.5, left: "50%", marginLeft: -2.5,
              width: 5, height: 5, borderRadius: "50%",
              background: colors.cyan,
              boxShadow: `0 0 8px ${colors.cyan}`,
            }} />
          </div>
          {/* Center initials */}
          <div style={{
            position: "absolute", inset: 22, borderRadius: "50%",
            background: colors.logoBg,
            border: `1.5px solid ${colors.logoBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 24px ${colors.ringGlow}`,
          }}>
            <span style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.04em",
              color: colors.textColor,
            }}>FA</span>
          </div>
        </div>

        {/* Welcome message */}
        <div style={{ textAlign: "center", maxWidth: 260 }}>
          <div style={{
            fontSize: 11,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.textColor,
            marginBottom: 8,
            opacity: 0.8,
          }}>
            Welcome
          </div>
          <div style={{
            fontSize: 15,
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            color: colors.msgColor,
            lineHeight: 1.5,
            marginBottom: 4,
          }}>
            Fares Alshehri
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: "'Noto Sans Arabic', sans-serif",
            fontWeight: 500,
            color: colors.msgMuted,
            lineHeight: 1.7,
            letterSpacing: 0,
          }}>
            مرحباً · Full Stack Developer
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: 100, height: 2, borderRadius: 2,
          background: colors.trackColor,
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${colors.ring}, ${colors.cyan})`,
            width: `${progressWidth}%`,
            transition: "width 0.1s linear",
            boxShadow: `0 0 8px ${colors.ring}66`,
          }} />
        </div>
      </div>

      <style>{`
        @keyframes splash-ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.06); opacity: 0.32; }
        }
        @keyframes float-word-0 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(-1deg); }
          50% { transform: translate(-50%, -50%) translateY(-8px) rotate(1deg); }
        }
        @keyframes float-word-1 {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px) rotate(1deg); }
          50% { transform: translate(-50%, -50%) translateY(7px) rotate(-1deg); }
        }
        @keyframes float-word-2 {
          0%, 100% { transform: translate(-50%, -50%) translateY(-4px); }
          50% { transform: translate(-50%, -50%) translateY(5px); }
        }
      `}</style>
    </div>
  );
}
