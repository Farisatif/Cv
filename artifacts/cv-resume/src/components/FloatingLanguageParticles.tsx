import { useEffect, useRef, useCallback } from "react";

const LABELS = [
  "JavaScript", "TypeScript", "Python", "React",
  "Go", "SQL", "Node.js", "Docker",
  "Git", "Tailwind", "Linux", "Redis",
];

const CODE_LINES = [
  "const render = () => { ... }",
  "export default function App()",
  "SELECT * FROM users WHERE id =",
  "git commit -m 'feat: improve UI'",
  "interface Props { children: ReactNode }",
  "async function fetchData(url: string)",
  "const [state, setState] = useState()",
  "docker compose up --detach",
  "return <Component {...props} />",
  "useEffect(() => { /* side effects */ }",
  "const router = express.Router()",
  "await pool.query('SELECT NOW()')",
  "import { useMemo, useCallback } from",
  "flex-direction: row; align-items: center",
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
    bgAlpha:       0.03,
    borderAlpha:   0.09,
    opacityRange:  [0.025, 0.05],
    sizeRange:     [9, 12],
    rotSpeedRange: [0.000006, 0.000018],
    driftMultiplier: 0.5,
  },
  MID: {
    fontWeight:    "400",
    cornerRadius:  7,
    borderWidth:   0.8,
    bgAlpha:       0.04,
    borderAlpha:   0.11,
    opacityRange:  [0.035, 0.065],
    sizeRange:     [11, 16],
    rotSpeedRange: [0.000015, 0.000038],
    driftMultiplier: 0.85,
  },
  NEAR: {
    fontWeight:    "500",
    cornerRadius:  9,
    borderWidth:   1.0,
    bgAlpha:       0.035,
    borderAlpha:   0.10,
    opacityRange:  [0.030, 0.060],
    sizeRange:     [13, 19],
    rotSpeedRange: [0.000028, 0.000060],
    driftMultiplier: 1.2,
  },
};

const LEVEL_COLORS = {
  dark: {
    FAR:  { h: 213, s: 72, l: 66 },
    MID:  { h: 199, s: 68, l: 60 },
    NEAR: { h: 155, s: 65, l: 56 },
  },
  light: {
    FAR:  { h: 213, s: 50, l: 46 },
    MID:  { h: 199, s: 52, l: 38 },
    NEAR: { h: 155, s: 52, l: 34 },
  },
} as const;

interface Particle {
  label:        string;
  screenX:      number;
  depth:        number;
  depthLevel:   DepthLevel;
  size:         number;
  opacity:      number;
  phase:        number;
  phaseSpeed:   number;
  driftAmpX:    number;
  driftAmpY:    number;
  baseRotation: number;
  rotSpeed:     number;
  posY:         number;   // autonomous absolute Y (pixels)
  velY:         number;   // constant drift velocity (px/ms)
  // pre-computed box dimensions (filled on first draw)
  cachedBoxW:   number;
  cachedBoxH:   number;
  cachedPadX:   number;
  cachedPadY:   number;
}

interface CodeLine {
  text:    string;
  screenY: number;
  speed:   number;
  dir:     1 | -1;
  opacity: number;
  size:    number;
  x:       number;
  depth:   number;
  cachedW: number; // pre-computed text width (filled on first draw)
}

interface StarData {
  x: number;
  y: number;
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
    const st = LEVEL_STYLES[level];
    const levelT = level === "FAR"
      ? depth / 0.40
      : level === "MID"
        ? (depth - 0.40) / 0.30
        : (depth - 0.70) / 0.30;
    const opacity  = lerp(st.opacityRange[0], st.opacityRange[1], levelT);
    const size     = lerp(st.sizeRange[0], st.sizeRange[1], levelT);
    const rotSign  = rng() < 0.5 ? 1 : -1;
    const rotSpeed = lerp(st.rotSpeedRange[0], st.rotSpeedRange[1], rng()) * rotSign;

    // Edge-biased X: particles cluster in the outer 22% on each side, center is clear
    const side    = rng() < 0.5 ? "left" : "right";
    const edgeT   = rng() * rng(); // skewed toward the very edge (0 = deep edge)
    const screenX = side === "left" ? edgeT * 0.22 : 1 - edgeT * 0.22;

    // Autonomous vertical velocity — slow constant drift, independent of scroll
    // Spread: 0.010–0.030 px/ms  ≈  10–30 px/s (very gentle)
    const speed = (0.010 + rng() * 0.020) * st.driftMultiplier;
    const velY  = rng() < 0.5 ? speed : -speed;

    result.push({
      label:        LABELS[li],
      screenX,
      depth,
      depthLevel:   level,
      size,
      opacity,
      phase:        rng() * Math.PI * 2,
      phaseSpeed:   0.00020 + rng() * 0.00035,
      driftAmpX:    (5 + rng() * 9)  * st.driftMultiplier,
      driftAmpY:    (3 + rng() * 6)  * st.driftMultiplier,
      baseRotation: (rng() - 0.5) * 0.18,
      rotSpeed,
      posY:         rng(),   // normalised 0-1, converted to pixels on first draw
      velY,
      cachedBoxW:   0,
      cachedBoxH:   0,
      cachedPadX:   0,
      cachedPadY:   0,
    });
  }
  return result;
}

function createCodeLines(): CodeLine[] {
  const rng = seededRng(77);
  return CODE_LINES.map(text => ({
    text,
    screenY: 0.04 + rng() * 0.92,
    speed:   0.010 + rng() * 0.014,
    dir:     (rng() < 0.5 ? 1 : -1) as 1 | -1,
    opacity: 0.022 + rng() * 0.022,
    size:    9 + Math.floor(rng() * 4),
    x:       rng(),
    depth:   0.2 + rng() * 0.5,
    cachedW: 0,
  }));
}

function createStars(count: number): StarData[] {
  const rng = seededRng(99);
  return Array.from({ length: count }, () => ({
    x:           rng(),
    y:           rng(),
    r:           0.4 + rng() * 1.8,
    alpha:       0.04 + rng() * 0.20,
    twinkleSpeed: 0.0005 + rng() * 0.0015,
    phase:       rng() * Math.PI * 2,
    bright:      rng() > 0.88,
  }));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

// 24 edge-biased particles, 50 stars, 8 code lines (subtle background only)
const PARTICLES  = createParticles(24);
const CODE_CHIPS = createCodeLines().slice(0, 8);
const STARS      = createStars(50);

export default function FloatingLanguageParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    scrollVel:       0,
    animId:          0,
    width:           0,
    height:          0,
    isDark:          true,
    lastTime:        0,
    codeLines:       CODE_CHIPS.map(c => ({ ...c })),
    particlesInited: false,
    particles:       PARTICLES.map(p => ({ ...p })),
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
    // Reset cached widths so they get recomputed for new size
    stateRef.current.particlesInited = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let lastSY = window.scrollY;
    const onScroll = () => {
      const sy     = window.scrollY;
      const rawVel = sy - lastSY;
      // Only track velocity for the subtle X-wobble nudge — no Y pull
      state.scrollVel = Math.max(-30, Math.min(30, rawVel));
      lastSY = sy;
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

      const dt = state.lastTime === 0 ? 16 : Math.min(ts - state.lastTime, 50);
      state.lastTime = ts;

      ctx.clearRect(0, 0, width, height);
      const palette = isDark ? LEVEL_COLORS.dark : LEVEL_COLORS.light;

      // ── PRE-COMPUTE cached sizes + seed posY in pixels on first draw ────────
      if (!state.particlesInited) {
        state.particlesInited = true;
        state.particles.forEach(p => {
          const st  = LEVEL_STYLES[p.depthLevel];
          ctx.font  = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter',sans-serif`;
          const tw  = ctx.measureText(p.label).width;
          const padX = p.depthLevel === "FAR" ? 6 : p.depthLevel === "MID" ? 8 : 9;
          const padY = p.depthLevel === "FAR" ? 3 : p.depthLevel === "MID" ? 4 : 5;
          p.cachedBoxW = tw + padX * 2;
          p.cachedBoxH = p.size * 1.35 + padY * 2;
          p.cachedPadX = padX;
          p.cachedPadY = padY;
          // Convert normalised seed to actual pixels spread across the full height
          p.posY = p.posY * height;
        });
        state.codeLines.forEach(line => {
          ctx.font = `300 ${line.size}px 'JetBrains Mono','Fira Code',monospace`;
          line.cachedW = ctx.measureText(line.text).width;
        });
      }

      // ── STARS (no halo gradients — simple arcs only) ──────────────────────
      if (isDark) {
        STARS.forEach(star => {
          const tw = 0.55 + 0.45 * Math.sin(ts * star.twinkleSpeed + star.phase);
          const alpha = star.alpha * tw;
          const r = star.r * (star.bright ? 1.5 : 1);
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, r, 0, Math.PI * 2);
          ctx.fillStyle = star.bright
            ? `rgba(255,252,235,${alpha.toFixed(3)})`
            : `rgba(190,210,255,${alpha.toFixed(3)})`;
          ctx.fill();
          // Removed: expensive createRadialGradient halo for bright stars
        });
      } else {
        STARS.slice(0, 25).forEach(star => {
          const tw = 0.5 + 0.5 * Math.sin(ts * star.twinkleSpeed + star.phase);
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.r * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80,60,200,${(star.alpha * 0.10 * tw).toFixed(3)})`;
          ctx.fill();
        });
      }

      // ── CODE LINES (horizontal drift, no scroll dependency) ─────────────────
      state.codeLines.forEach(line => {
        line.x += line.dir * line.speed * dt / width;
        const textFrac = (line.cachedW + 40) / width;
        if (line.dir === 1  && line.x > 1 + textFrac) line.x = -textFrac;
        if (line.dir === -1 && line.x < -textFrac)     line.x = 1 + textFrac;

        const px = line.x * width;
        const py = line.screenY * height;

        const finalAlpha = line.opacity * (isDark ? 1 : 0.4);
        if (finalAlpha < 0.006) return;

        ctx.save();
        ctx.globalAlpha  = finalAlpha;
        ctx.fillStyle    = isDark ? "hsl(212,100%,70%)" : "hsl(212,93%,44%)";
        ctx.font         = `300 ${line.size}px 'JetBrains Mono','Fira Code',monospace`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(line.text, px, py);
        ctx.restore();
      });

      // ── PARTICLES — fully autonomous drift, no scroll anchoring ───────────
      // Fade zone: particles smoothly fade in/out over the top and bottom 15%
      const edgePad = Math.max(90, height * 0.14);
      const buf     = edgePad + 20;  // wrap buffer slightly larger than fade zone

      state.particles.forEach(p => {
        const st    = LEVEL_STYLES[p.depthLevel];
        const color = palette[p.depthLevel];
        const { h, s, l } = color;

        // Advance autonomous position
        p.posY += p.velY * dt;

        // Seamless wrap: disappears at one edge, re-enters at the other
        const span = height + buf * 2;
        if (p.posY < -buf)         p.posY += span;
        if (p.posY > height + buf) p.posY -= span;

        // Gentle sinusoidal wobble overlaid on the constant drift
        const driftX = Math.sin(ts * p.phaseSpeed + p.phase) * p.driftAmpX;
        const driftY = Math.sin(ts * p.phaseSpeed * 0.72 + p.phase + 1.2) * p.driftAmpY;

        const px = p.screenX * width + driftX;
        const py = p.posY + driftY;

        // Edge fade so particles glide in/out rather than pop
        let edgeFade = 1;
        if (py < edgePad)              edgeFade = Math.max(0, py / edgePad);
        else if (py > height - edgePad) edgeFade = Math.max(0, (height - py) / edgePad);

        const finalAlpha = p.opacity * edgeFade;
        if (finalAlpha < 0.004) return;

        const totalRot = p.baseRotation + ts * p.rotSpeed;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(totalRot);

        const boxW = p.cachedBoxW || 60;
        const boxH = p.cachedBoxH || 20;
        const bx = -boxW / 2;
        const by = -boxH / 2;

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
        ctx.font         = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter',sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.label, 0, 0);

        ctx.restore();
      });

      // Decay scroll velocity (only used for code-line colour pulse if ever needed)
      state.scrollVel *= 0.85;
    };

    state.animId = requestAnimationFrame(draw);

    // Pause animation when the browser tab is hidden — saves significant CPU
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(state.animId);
      } else {
        state.lastTime = 0; // reset dt so first resumed frame doesn't spike
        state.animId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
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
        transform:     "translateZ(0)",
      }}
    />
  );
}
