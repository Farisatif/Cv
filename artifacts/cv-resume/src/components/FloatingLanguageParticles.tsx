import { useEffect, useRef, useCallback } from "react";

// ── Language labels ────────────────────────────────────────────────────────
const LABELS = [
  "JavaScript", "TypeScript", "Python", "React", "Rust", "Go",
  "C++", "Java", "SQL", "Node.js", "Linux", "C#", "Next.js",
  "Flutter", "CSS", "HTML", "API", "WebAssembly", "Kotlin",
  "GraphQL", "Figma", "Git", "Docker", "Redis", "MySQL",
  "JSON", "Bash", "Swift", "PHP", "Tailwind", "Vue", "Svelte",
];

// ── Code snippets for the drifting code lines ──────────────────────────────
const CODE_LINES = [
  "const render = () => { ... }",
  "export default function App()",
  "SELECT * FROM users WHERE id =",
  "git commit -m 'feat: improve UI'",
  "npm install && npm run build",
  "interface Props { children: ReactNode }",
  "async function fetchData(url: string)",
  "const [state, setState] = useState()",
  "docker compose up --detach",
  "return <Component {...props} />",
  "useEffect(() => { /* side effects */ }",
  "const router = express.Router()",
  "await pool.query('SELECT NOW()')",
  "transform: translateY(-50%) scale(1.1)",
  "border-radius: 9999px; overflow: hidden",
  "@keyframes float { 0%, 100% { ... } }",
  "const PORT = process.env.PORT || 3000",
  "import { useMemo, useCallback } from",
  "flex-direction: row; align-items: center",
  "fs.readFileSync('./data.json', 'utf-8')",
];

type DepthLevel = "FAR" | "MID" | "NEAR";

interface LevelStyle {
  fontWeight: string;
  cornerRadius: number;
  borderWidth: number;
  bgAlpha: number;
  borderAlpha: number;
  opacityRange: [number, number];
  sizeRange: [number, number];
  rotSpeedRange: [number, number];
  driftMultiplier: number;
}

const LEVEL_STYLES: Record<DepthLevel, LevelStyle> = {
  FAR: {
    fontWeight:    "300",
    cornerRadius:  5,
    borderWidth:   0.5,
    bgAlpha:       0.04,
    borderAlpha:   0.12,
    opacityRange:  [0.04, 0.08],
    sizeRange:     [9, 12],
    rotSpeedRange: [0.000006, 0.000018],
    driftMultiplier: 0.5,
  },
  MID: {
    fontWeight:    "400",
    cornerRadius:  7,
    borderWidth:   0.8,
    bgAlpha:       0.055,
    borderAlpha:   0.16,
    opacityRange:  [0.055, 0.10],
    sizeRange:     [11, 16],
    rotSpeedRange: [0.000015, 0.000038],
    driftMultiplier: 0.85,
  },
  NEAR: {
    fontWeight:    "500",
    cornerRadius:  9,
    borderWidth:   1.0,
    bgAlpha:       0.050,
    borderAlpha:   0.14,
    opacityRange:  [0.045, 0.09],
    sizeRange:     [13, 19],
    rotSpeedRange: [0.000028, 0.000060],
    driftMultiplier: 1.2,
  },
};

const LEVEL_COLORS = {
  dark: {
    FAR:  { h: 216, s: 88, l: 72 },
    MID:  { h: 264, s: 78, l: 74 },
    NEAR: { h: 184, s: 90, l: 66 },
  },
  light: {
    FAR:  { h: 248, s: 60, l: 46 },
    MID:  { h: 282, s: 62, l: 50 },
    NEAR: { h: 322, s: 66, l: 48 },
  },
} as const;

interface Particle {
  label:       string;
  screenX:     number; // 0-1 of viewport width
  screenY:     number; // 0-1 of viewport height — home position
  depth:       number; // 0-1
  depthLevel:  DepthLevel;
  size:        number;
  opacity:     number;
  phase:       number;
  phaseSpeed:  number;
  driftAmpX:   number;
  driftAmpY:   number;
  baseRotation: number;
  rotSpeed:    number;
  // wrapping zone: particles that go off-screen re-enter from opposite side
  wrapOffsetY: number;
}

interface CodeLine {
  text:      string;
  screenY:   number; // 0-1 of viewport height
  speed:     number; // px per ms (horizontal drift)
  dir:       1 | -1; // 1 = left-to-right, -1 = right-to-left
  opacity:   number;
  size:      number;
  x:         number; // current x position
  depth:     number; // 0-1 for parallax
}

interface StarData {
  x: number; // 0-1
  y: number; // 0-1
  r: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
  bright: boolean;
}

function getDepthLevel(d: number): DepthLevel {
  if (d < 0.40) return "FAR";
  if (d < 0.70) return "MID";
  return "NEAR";
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function createParticles(count: number): Particle[] {
  const rng = seededRng(42);
  const result: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const li = i % LABELS.length;
    const depth = 0.08 + rng() * 0.88;
    const level = getDepthLevel(depth);
    const st    = LEVEL_STYLES[level];

    const levelT = level === "FAR"
      ? depth / 0.40
      : level === "MID"
        ? (depth - 0.40) / 0.30
        : (depth - 0.70) / 0.30;

    const opacity = lerp(st.opacityRange[0], st.opacityRange[1], levelT);
    const size    = lerp(st.sizeRange[0],    st.sizeRange[1],    levelT);
    const rotSign = rng() < 0.5 ? 1 : -1;
    const rotSpeed = lerp(st.rotSpeedRange[0], st.rotSpeedRange[1], rng()) * rotSign;

    result.push({
      label:        LABELS[li],
      screenX:      0.03 + rng() * 0.94,
      screenY:      rng(),                // spread across full height 0–1
      depth,
      depthLevel:   level,
      size,
      opacity,
      phase:        rng() * Math.PI * 2,
      phaseSpeed:   0.00020 + rng() * 0.00035,
      driftAmpX:    (8 + rng() * 14) * st.driftMultiplier,
      driftAmpY:    (5 + rng() * 9) * st.driftMultiplier,
      baseRotation: (rng() - 0.5) * 0.25,
      rotSpeed,
      wrapOffsetY:  0,
    });
  }
  return result;
}

function createCodeLines(): CodeLine[] {
  const rng = seededRng(77);
  return CODE_LINES.map((text, i) => ({
    text,
    screenY: 0.04 + rng() * 0.92,
    speed:   0.012 + rng() * 0.018,  // very slow
    dir:     (rng() < 0.5 ? 1 : -1) as 1 | -1,
    opacity: 0.025 + rng() * 0.025,
    size:    9 + Math.floor(rng() * 4),
    x:       rng(),  // initial x fraction 0-1
    depth:   0.2 + rng() * 0.5,
  }));
}

function createStars(count: number): StarData[] {
  const rng = seededRng(99);
  return Array.from({ length: count }, () => ({
    x:           rng(),
    y:           rng(),
    r:           0.4 + rng() * 2.0,
    alpha:       0.04 + rng() * 0.22,
    twinkleSpeed: 0.0005 + rng() * 0.0015,
    phase:       rng() * Math.PI * 2,
    bright:      rng() > 0.88,
  }));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const minR = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + minR, y);
  ctx.lineTo(x + w - minR, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + minR);
  ctx.lineTo(x + w, y + h - minR);
  ctx.quadraticCurveTo(x + w, y + h, x + w - minR, y + h);
  ctx.lineTo(x + minR, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - minR);
  ctx.lineTo(x, y + minR);
  ctx.quadraticCurveTo(x, y, x + minR, y);
  ctx.closePath();
}

const PARTICLES  = createParticles(55);
const CODE_CHIPS = createCodeLines();
const STARS      = createStars(120);

export default function FloatingLanguageParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    targetScrollY: 0,
    smoothScrollY: 0,
    scrollVel:     0,
    animId:        0,
    width:         0,
    height:        0,
    isDark:        true,
    docHeight:     0,
    lastTime:      0,
    codeLines:     CODE_CHIPS.map(c => ({ ...c })), // mutable copies
  });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width         = w * dpr;
    canvas.height        = h * dpr;
    canvas.style.width   = `${w}px`;
    canvas.style.height  = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    stateRef.current.width  = w;
    stateRef.current.height = h;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    state.docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let lastSY = window.scrollY;
    const onScroll = () => {
      const sy        = window.scrollY;
      const rawVel    = sy - lastSY;
      state.scrollVel = Math.max(-50, Math.min(50, rawVel));
      lastSY          = sy;
      state.targetScrollY = sy;
      state.docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const checkDark = () => {
      state.isDark = document.documentElement.classList.contains("dark");
    };
    checkDark();
    const darkObs = new MutationObserver(checkDark);
    darkObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const draw = (ts: number) => {
      state.animId = requestAnimationFrame(draw);

      const { width, height, isDark } = state;
      if (width === 0) return;

      const dt = state.lastTime === 0 ? 16 : ts - state.lastTime;
      state.lastTime = ts;

      // Smooth scroll interpolation
      state.smoothScrollY += (state.targetScrollY - state.smoothScrollY) * 0.06;
      const scrollFrac = state.smoothScrollY / Math.max(1, state.docHeight - height);

      ctx.clearRect(0, 0, width, height);
      const palette = isDark ? LEVEL_COLORS.dark : LEVEL_COLORS.light;

      // ── STARS ────────────────────────────────────────────────────────────
      if (isDark) {
        STARS.forEach(star => {
          const tw = 0.55 + 0.45 * Math.sin(ts * star.twinkleSpeed + star.phase);
          const alpha = star.alpha * tw;
          const sx = star.x * width;
          const sy = star.y * height;
          const r  = star.r * (star.bright ? 1.6 : 1);

          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = star.bright
            ? `rgba(255,252,235,${alpha.toFixed(3)})`
            : `rgba(190,210,255,${alpha.toFixed(3)})`;
          ctx.fill();

          if (star.bright && r > 1.8) {
            const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 5);
            halo.addColorStop(0, `rgba(220,235,255,${(alpha * 0.15).toFixed(3)})`);
            halo.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = halo;
            ctx.fillRect(sx - r * 6, sy - r * 6, r * 12, r * 12);
          }
        });
      } else {
        STARS.slice(0, 30).forEach(star => {
          const tw = 0.5 + 0.5 * Math.sin(ts * star.twinkleSpeed + star.phase);
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80,60,200,${(star.alpha * 0.12 * tw).toFixed(3)})`;
          ctx.fill();
        });
      }

      // ── SLOW CODE LINES ──────────────────────────────────────────────────
      ctx.font = "300 10px 'JetBrains Mono','Fira Code',monospace";
      state.codeLines.forEach(line => {
        // Advance position
        line.x += line.dir * line.speed * dt / width;

        // Wrap around
        const textFrac = (ctx.measureText(line.text).width + 40) / width;
        if (line.dir === 1 && line.x > 1 + textFrac) line.x = -textFrac;
        if (line.dir === -1 && line.x < -textFrac)   line.x = 1 + textFrac;

        const px = line.x * width;
        const py = line.screenY * height;

        // parallax — only tiny shift based on scroll
        const parallaxShift = scrollFrac * height * 0.08 * (1 - line.depth);

        const finalAlpha = line.opacity * (isDark ? 1 : 0.5);
        if (finalAlpha < 0.008) return;

        ctx.save();
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = isDark ? "hsl(263,70%,75%)" : "hsl(248,55%,40%)";
        ctx.font = `300 ${line.size}px 'JetBrains Mono','Fira Code',monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(line.text, px, py + parallaxShift);
        ctx.restore();
      });

      // ── LANGUAGE PARTICLES ───────────────────────────────────────────────
      PARTICLES.forEach(p => {
        const st    = LEVEL_STYLES[p.depthLevel];
        const color = palette[p.depthLevel];
        const { h, s, l } = color;

        // Home position spread across full viewport height
        const homeY = p.screenY * height;

        // Tiny parallax: deeper particles shift less
        const parallaxShift = scrollFrac * height * 0.20 * (1 - p.depth * 0.7);

        // Drift
        const driftX = Math.sin(ts * p.phaseSpeed + p.phase) * p.driftAmpX;
        const driftY = Math.sin(ts * p.phaseSpeed * 0.68 + p.phase + 1.1) * p.driftAmpY;

        // Velocity effect — very subtle
        const velBoost = state.scrollVel * (1 - p.depth) * 0.15;

        const px = p.screenX * width + driftX;
        const py = homeY + parallaxShift + driftY + velBoost;

        // Wrap vertically with buffer
        const buf = 100;
        const range = height + buf * 2;
        const wrappedPy = ((py + buf) % range + range) % range - buf;

        // Edge fade
        const edgePad = 80;
        let edgeFade = 1;
        if (wrappedPy < edgePad)              edgeFade = Math.max(0, wrappedPy / edgePad);
        else if (wrappedPy > height - edgePad) edgeFade = Math.max(0, (height - wrappedPy) / edgePad);

        const velOpacity = Math.min(0.3, Math.abs(state.scrollVel) * 0.003);
        const finalAlpha = (p.opacity + velOpacity * (1 - p.depth)) * edgeFade;
        if (finalAlpha < 0.005) return;

        const totalRot = p.baseRotation + ts * p.rotSpeed;

        ctx.save();
        ctx.translate(px, wrappedPy);
        ctx.rotate(totalRot);

        ctx.font = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter',sans-serif`;
        const textW = ctx.measureText(p.label).width;
        const padX  = p.depthLevel === "FAR" ? 6 : p.depthLevel === "MID" ? 8 : 9;
        const padY  = p.depthLevel === "FAR" ? 3 : p.depthLevel === "MID" ? 4 : 5;
        const boxW  = textW + padX * 2;
        const boxH  = p.size * 1.35 + padY * 2;
        const bx    = -boxW / 2;
        const by    = -boxH / 2;

        ctx.globalAlpha = finalAlpha * st.bgAlpha * (1 / p.opacity);
        ctx.fillStyle   = `hsl(${h},${s}%,${l}%)`;
        roundRect(ctx, bx, by, boxW, boxH, st.cornerRadius);
        ctx.fill();

        ctx.globalAlpha = finalAlpha * st.borderAlpha * (1 / p.opacity);
        ctx.strokeStyle = `hsl(${h},${s}%,${l}%)`;
        ctx.lineWidth   = st.borderWidth;
        roundRect(ctx, bx, by, boxW, boxH, st.cornerRadius);
        ctx.stroke();

        ctx.globalAlpha  = finalAlpha;
        ctx.fillStyle    = `hsl(${h},${s}%,${l}%)`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.label, 0, 0);

        ctx.restore();
      });

      // Velocity decay
      state.scrollVel *= 0.90;
    };

    state.animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      darkObs.disconnect();
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        0,
      }}
    />
  );
}
