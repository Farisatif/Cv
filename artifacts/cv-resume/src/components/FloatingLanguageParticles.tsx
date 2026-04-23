import { useEffect, useRef, useCallback } from "react";

// ── Tech labels (with language-specific hue for color coding) ──────────────
const TECH_LABELS: { text: string; hue: number; icon?: string }[] = [
  { text: "JavaScript",  hue: 48  },
  { text: "TypeScript",  hue: 213 },
  { text: "React",       hue: 198 },
  { text: "Python",      hue: 210 },
  { text: "Node.js",     hue: 130 },
  { text: "Tailwind",    hue: 187 },
  { text: "Docker",      hue: 207 },
  { text: "PostgreSQL",  hue: 220 },
  { text: "Redis",       hue: 0   },
  { text: "GraphQL",     hue: 316 },
  { text: "Git",         hue: 20  },
  { text: "Linux",       hue: 38  },
  { text: "Go",          hue: 196 },
  { text: "Rust",        hue: 25  },
  { text: "Next.js",     hue: 0   },
  { text: "Prisma",      hue: 213 },
  { text: "SQL",         hue: 225 },
  { text: "AWS",         hue: 32  },
  { text: "Vite",        hue: 270 },
  { text: "Zod",         hue: 195 },
  // Arabic tech words
  { text: "واجهة",       hue: 212 },
  { text: "برمجة",       hue: 155 },
  { text: "بيانات",      hue: 199 },
  { text: "خوارزمية",    hue: 38  },
  { text: "مطوّر",       hue: 270 },
  { text: "حوسبة",       hue: 196 },
];

// ── Code snippets drifting across the screen ─────────────────────────────
const CODE_LINES = [
  "const render = () => { ... }",
  "export default function App()",
  "SELECT * FROM users WHERE id =",
  "git commit -m 'feat: upgrade UI'",
  "interface Props { children: ReactNode }",
  "async function fetchData(url: string)",
  "const [state, setState] = useState()",
  "docker compose up --detach",
  "return <Component {...props} />",
  "useEffect(() => { /* effects */ }, [])",
  "const router = express.Router()",
  "await pool.query('SELECT NOW()')",
  "import { useMemo } from 'react'",
  "flex-direction: row; gap: 1rem;",
  "type User = { id: string; name: string }",
  "pnpm install && pnpm run dev",
];

// ── Particle depth system ─────────────────────────────────────────────────
type DepthLevel = "FAR" | "MID" | "NEAR";
function getDepthLevel(d: number): DepthLevel {
  if (d < 0.38) return "FAR";
  if (d < 0.68) return "MID";
  return "NEAR";
}

interface LevelStyle {
  fontWeight:     string;
  cornerRadius:   number;
  borderWidth:    number;
  bgAlpha:        number;
  borderAlpha:    number;
  glowAlpha:      number;
  opacityRange:   [number, number];
  sizeRange:      [number, number];
  rotSpeedRange:  [number, number];
  driftMul:       number;
  dotRadius:      number;
}

const LEVEL_STYLES: Record<DepthLevel, LevelStyle> = {
  FAR: {
    fontWeight:    "300",
    cornerRadius:  6,
    borderWidth:   0.6,
    bgAlpha:       0.045,
    borderAlpha:   0.13,
    glowAlpha:     0,
    opacityRange:  [0.040, 0.075],
    sizeRange:     [9.5, 12.5],
    rotSpeedRange: [0.000006, 0.000018],
    driftMul:      0.55,
    dotRadius:     1.5,
  },
  MID: {
    fontWeight:    "400",
    cornerRadius:  8,
    borderWidth:   0.9,
    bgAlpha:       0.055,
    borderAlpha:   0.16,
    glowAlpha:     0.06,
    opacityRange:  [0.055, 0.095],
    sizeRange:     [12, 16],
    rotSpeedRange: [0.000012, 0.000035],
    driftMul:      0.9,
    dotRadius:     2,
  },
  NEAR: {
    fontWeight:    "500",
    cornerRadius:  10,
    borderWidth:   1.1,
    bgAlpha:       0.065,
    borderAlpha:   0.20,
    glowAlpha:     0.10,
    opacityRange:  [0.070, 0.115],
    sizeRange:     [13.5, 19],
    rotSpeedRange: [0.000025, 0.000055],
    driftMul:      1.25,
    dotRadius:     2.5,
  },
};

// ── Color extraction for dark / light per depth ───────────────────────────
function getColor(hue: number, depthLevel: DepthLevel, isDark: boolean) {
  if (isDark) {
    const s = depthLevel === "FAR" ? 62 : depthLevel === "MID" ? 68 : 75;
    const l = depthLevel === "FAR" ? 62 : depthLevel === "MID" ? 66 : 72;
    return { h: hue, s, l };
  } else {
    const s = depthLevel === "FAR" ? 50 : depthLevel === "MID" ? 56 : 62;
    const l = depthLevel === "FAR" ? 36 : depthLevel === "MID" ? 34 : 30;
    return { h: hue, s, l };
  }
}

// ── Particle interface ────────────────────────────────────────────────────
interface Particle {
  label:        string;
  hue:          number;
  screenX:      number;
  depth:        number;
  depthLevel:   DepthLevel;
  size:         number;
  opacity:      number;
  phase:        number;
  phaseSpeed:   number;
  driftAmpX:    number;
  driftAmpY:    number;
  baseRot:      number;
  rotSpeed:     number;
  posY:         number;
  velY:         number;
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
  cachedW: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  phase: number;
  bright: boolean;
  hue: number;
}

// ── Seeded RNG for deterministic layout ──────────────────────────────────
function seededRng(seed: number) {
  let s = (seed % 2147483647) || 1;
  return (): number => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

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

// ── Factory functions ─────────────────────────────────────────────────────
function createParticles(count: number): Particle[] {
  const rng = seededRng(42);
  const result: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const entry = TECH_LABELS[i % TECH_LABELS.length];
    const depth = 0.08 + rng() * 0.88;
    const level = getDepthLevel(depth);
    const st    = LEVEL_STYLES[level];
    const levelT = level === "FAR"
      ? depth / 0.38
      : level === "MID"
        ? (depth - 0.38) / 0.30
        : (depth - 0.68) / 0.32;

    const opacity  = lerp(st.opacityRange[0], st.opacityRange[1], levelT);
    const size     = lerp(st.sizeRange[0],    st.sizeRange[1],    levelT);
    const rotSign  = rng() < 0.5 ? 1 : -1;
    const rotSpeed = lerp(st.rotSpeedRange[0], st.rotSpeedRange[1], rng()) * rotSign;

    // Full-width distribution: 25% pure-edge, 55% within 20% of edges, 20% anywhere
    let screenX: number;
    const roll = rng();
    if (roll < 0.25) {
      // Very edge (0-8%)
      screenX = rng() < 0.5 ? rng() * 0.08 : 1 - rng() * 0.08;
    } else if (roll < 0.80) {
      // Near edge (0-22%)
      const t = rng() * rng();
      screenX = rng() < 0.5 ? t * 0.22 : 1 - t * 0.22;
    } else {
      // Middle band (22%-78%)
      screenX = 0.22 + rng() * 0.56;
    }

    const speed = (0.008 + rng() * 0.022) * st.driftMul;
    const velY  = rng() < 0.5 ? speed : -speed;

    result.push({
      label:        entry.text,
      hue:          entry.hue,
      screenX,
      depth,
      depthLevel:   level,
      size,
      opacity,
      phase:        rng() * Math.PI * 2,
      phaseSpeed:   0.00018 + rng() * 0.00030,
      driftAmpX:    (4 + rng() * 10) * st.driftMul,
      driftAmpY:    (3 + rng() * 7)  * st.driftMul,
      baseRot:      (rng() - 0.5) * 0.16,
      rotSpeed,
      posY:         rng(),
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
    speed:   0.008 + rng() * 0.014,
    dir:     (rng() < 0.5 ? 1 : -1) as 1 | -1,
    opacity: 0.026 + rng() * 0.028,
    size:    9 + Math.floor(rng() * 5),
    x:       rng(),
    cachedW: 0,
  }));
}

function createStars(count: number): Star[] {
  const rng = seededRng(99);
  const starHues = [200, 220, 240, 260, 280, 45, 0];
  return Array.from({ length: count }, () => ({
    x:      rng(),
    y:      rng(),
    r:      0.35 + rng() * 2.0,
    alpha:  0.045 + rng() * 0.22,
    speed:  0.0004 + rng() * 0.0014,
    phase:  rng() * Math.PI * 2,
    bright: rng() > 0.85,
    hue:    starHues[Math.floor(rng() * starHues.length)],
  }));
}

// ── Pre-created instances ─────────────────────────────────────────────────
const PARTICLES_PROTO  = createParticles(38);
const CODE_LINES_PROTO = createCodeLines();
const STARS_PROTO      = createStars(65);

// ── Component ─────────────────────────────────────────────────────────────
export default function FloatingLanguageParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef  = useRef({ x: 0.5, y: 0.5, active: false });

  const stateRef = useRef({
    animId:          0,
    width:           0,
    height:          0,
    isDark:          true,
    lastTime:        0,
    inited:          false,
    particles:       PARTICLES_PROTO.map(p => ({ ...p })),
    codeLines:       CODE_LINES_PROTO.map(c => ({ ...c })),
    stars:           STARS_PROTO.map(s => ({ ...s })),
  });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w   = window.innerWidth;
    const h   = window.innerHeight;
    canvas.width        = w * dpr;
    canvas.height       = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    stateRef.current.width  = w;
    stateRef.current.height = h;
    stateRef.current.inited = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = stateRef.current;

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Mouse parallax
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
      mouseRef.current.active = true;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Detect theme changes (class + data-mood)
    const checkDark = () => {
      state.isDark = document.documentElement.classList.contains("dark");
    };
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-mood"] });

    const draw = (ts: number) => {
      state.animId = requestAnimationFrame(draw);
      const { width, height, isDark, particles, codeLines, stars } = state;
      if (width === 0) return;

      const dt = state.lastTime === 0 ? 16 : Math.min(ts - state.lastTime, 50);
      state.lastTime = ts;

      ctx.clearRect(0, 0, width, height);

      // ── ONE-TIME INIT: measure text widths + seed Y positions ──────────
      if (!state.inited) {
        state.inited = true;
        particles.forEach(p => {
          const st   = LEVEL_STYLES[p.depthLevel];
          ctx.font   = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter',sans-serif`;
          const tw   = ctx.measureText(p.label).width;
          const padX = p.depthLevel === "FAR" ? 7 : p.depthLevel === "MID" ? 9 : 11;
          const padY = p.depthLevel === "FAR" ? 4 : p.depthLevel === "MID" ? 5 : 6;
          p.cachedBoxW = tw + padX * 2;
          p.cachedBoxH = p.size * 1.4 + padY * 2;
          p.cachedPadX = padX;
          p.cachedPadY = padY;
          p.posY       = p.posY * height;
        });
        codeLines.forEach(line => {
          ctx.font     = `300 ${line.size}px 'JetBrains Mono','Fira Code',monospace`;
          line.cachedW = ctx.measureText(line.text).width;
        });
      }

      const mx = mouseRef.current.active ? mouseRef.current.x - 0.5 : 0;
      const my = mouseRef.current.active ? mouseRef.current.y - 0.5 : 0;

      // ── STARS (dark only) ──────────────────────────────────────────────
      if (isDark) {
        stars.forEach(star => {
          const tw    = 0.50 + 0.50 * Math.sin(ts * star.speed + star.phase);
          const alpha = star.alpha * tw;
          if (alpha < 0.005) return;
          const r = star.r * (star.bright ? 1.6 : 1);
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, r, 0, Math.PI * 2);
          if (star.bright) {
            ctx.fillStyle = `hsla(${star.hue},80%,90%,${alpha.toFixed(3)})`;
          } else {
            ctx.fillStyle = `rgba(185,210,255,${alpha.toFixed(3)})`;
          }
          ctx.fill();
        });
      } else {
        // Light mode: subtle soft orbs instead of stars
        stars.slice(0, 18).forEach(star => {
          const tw    = 0.5 + 0.5 * Math.sin(ts * star.speed * 0.6 + star.phase);
          const alpha = star.alpha * 0.10 * tw;
          if (alpha < 0.004) return;
          ctx.beginPath();
          ctx.arc(star.x * width, star.y * height, star.r * 5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(212,80%,65%,${alpha.toFixed(3)})`;
          ctx.fill();
        });
      }

      // ── CODE LINES ────────────────────────────────────────────────────
      codeLines.forEach(line => {
        line.x += line.dir * line.speed * dt / width;
        const textFrac = (line.cachedW + 40) / width;
        if (line.dir === 1  && line.x > 1 + textFrac) line.x = -textFrac;
        if (line.dir === -1 && line.x < -textFrac)     line.x = 1 + textFrac;

        const alpha = line.opacity * (isDark ? 1.0 : 0.45);
        if (alpha < 0.005) return;

        ctx.save();
        ctx.globalAlpha  = alpha;
        ctx.fillStyle    = isDark
          ? "hsl(212,85%,72%)"
          : "hsl(212,80%,38%)";
        ctx.font         = `300 ${line.size}px 'JetBrains Mono','Fira Code',monospace`;
        ctx.textAlign    = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(line.text, line.x * width, line.screenY * height);
        ctx.restore();
      });

      // ── COMPUTE PARTICLE SCREEN POSITIONS (for connection lines) ───────
      const edgePad = Math.max(100, height * 0.13);
      const buf     = edgePad + 24;

      type PosEntry = { x: number; y: number; p: Particle; finalAlpha: number };
      const positions: PosEntry[] = [];

      particles.forEach(p => {
        p.posY += p.velY * dt;
        const span = height + buf * 2;
        if (p.posY < -buf)         p.posY += span;
        if (p.posY > height + buf) p.posY -= span;

        const driftX = Math.sin(ts * p.phaseSpeed + p.phase) * p.driftAmpX;
        const driftY = Math.sin(ts * p.phaseSpeed * 0.70 + p.phase + 1.3) * p.driftAmpY;
        // Subtle mouse parallax (near particles move more)
        const parallaxStrength = p.depthLevel === "NEAR" ? 18 : p.depthLevel === "MID" ? 9 : 4;
        const px = p.screenX * width + driftX + mx * parallaxStrength;
        const py = p.posY   + driftY + my * parallaxStrength * 0.6;

        let edgeFade = 1;
        if (py < edgePad)              edgeFade = Math.max(0, py / edgePad);
        else if (py > height - edgePad) edgeFade = Math.max(0, (height - py) / edgePad);

        const finalAlpha = p.opacity * edgeFade;
        positions.push({ x: px, y: py, p, finalAlpha });
      });

      // ── CONSTELLATION LINES (between nearby NEAR+MID particles) ───────
      const conLineAlpha = isDark ? 0.055 : 0.040;
      const maxDist      = 140;
      const nearPositions = positions.filter(e =>
        (e.p.depthLevel === "NEAR" || e.p.depthLevel === "MID") && e.finalAlpha > 0.04
      );
      for (let i = 0; i < nearPositions.length; i++) {
        for (let j = i + 1; j < nearPositions.length; j++) {
          const a = nearPositions[i];
          const b = nearPositions[j];
          const dx  = a.x - b.x;
          const dy  = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > maxDist) continue;
          const t = 1 - dist / maxDist;
          const lineAlpha = conLineAlpha * t * Math.min(a.finalAlpha, b.finalAlpha) * 12;
          if (lineAlpha < 0.004) continue;
          ctx.save();
          ctx.globalAlpha = lineAlpha;
          ctx.strokeStyle = isDark ? "hsl(212,70%,72%)" : "hsl(212,60%,50%)";
          ctx.lineWidth   = 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── DRAW PARTICLES ────────────────────────────────────────────────
      positions.forEach(({ x: px, y: py, p, finalAlpha }) => {
        if (finalAlpha < 0.006) return;
        const st        = LEVEL_STYLES[p.depthLevel];
        const { h, s, l } = getColor(p.hue, p.depthLevel, isDark);
        const totalRot  = p.baseRot + ts * p.rotSpeed;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(totalRot);

        const boxW = p.cachedBoxW || 60;
        const boxH = p.cachedBoxH || 22;
        const bx   = -boxW / 2;
        const by   = -boxH / 2;

        // Glow (NEAR + MID, dark mode only)
        if (isDark && st.glowAlpha > 0 && finalAlpha > 0.05) {
          const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, boxW * 0.8);
          glow.addColorStop(0, `hsla(${h},${s}%,${l}%,${(finalAlpha * st.glowAlpha).toFixed(3)})`);
          glow.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(bx - 12, by - 10, boxW + 24, boxH + 20);
        }

        // Badge background
        ctx.globalAlpha = finalAlpha;
        const bgL  = isDark ? l + 12 : l + 28;
        const bgS  = isDark ? s * 0.30 : s * 0.18;
        ctx.fillStyle = `hsla(${h},${bgS}%,${bgL}%,${st.bgAlpha})`;
        roundRect(ctx, bx, by, boxW, boxH, st.cornerRadius);
        ctx.fill();

        // Badge border — colored
        ctx.strokeStyle = `hsla(${h},${s}%,${l}%,${st.borderAlpha})`;
        ctx.lineWidth   = st.borderWidth;
        roundRect(ctx, bx, by, boxW, boxH, st.cornerRadius);
        ctx.stroke();

        // Colored accent dot (left of text)
        const dotX = bx + p.cachedPadX * 0.55 + st.dotRadius;
        const dotY = 0;
        ctx.beginPath();
        ctx.arc(dotX, dotY, st.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h},${s}%,${l}%,${0.65})`;
        ctx.fill();

        // Label text
        ctx.fillStyle    = `hsl(${h},${s}%,${l}%)`;
        ctx.font         = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter','Cairo',sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.label, st.dotRadius * 1.5, 0);

        ctx.restore();
      });
    };

    state.animId = requestAnimationFrame(draw);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        cancelAnimationFrame(state.animId);
      } else {
        state.lastTime = 0;
        state.animId   = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      obs.disconnect();
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
        willChange:    "transform",
      }}
    />
  );
}
