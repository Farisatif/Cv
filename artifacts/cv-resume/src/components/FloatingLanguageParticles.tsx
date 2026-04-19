import { useEffect, useRef, useCallback, useMemo } from "react";

// ── Language labels ────────────────────────────────────────────────────────
const LABELS = [
  "JavaScript", "TypeScript", "Python", "React", "Rust", "Go",
  "C++", "Java", "SQL", "Node.js", "Linux", "C#", "Next.js",
  "Flutter", "CSS", "HTML", "API", "WebAssembly", "Kotlin",
  "GraphQL", "Figma", "Git", "Docker", "Redis", "MySQL",
  "JSON", "Bash", "Swift", "PHP", "Tailwind",
];

// ── Depth levels — three distinct visual planes ────────────────────────────
type DepthLevel = "FAR" | "MID" | "NEAR";

interface LevelStyle {
  fontWeight: string;
  cornerRadius: number;
  borderWidth: number;
  bgAlpha: number;
  borderAlpha: number;
  opacityRange: [number, number];
  sizeRange: [number, number];
  rotSpeedRange: [number, number]; // rad / ms
  driftMultiplier: number;
}

const LEVEL_STYLES: Record<DepthLevel, LevelStyle> = {
  FAR: {
    fontWeight:    "300",
    cornerRadius:  5,
    borderWidth:   0.5,
    bgAlpha:       0.04,
    borderAlpha:   0.12,
    opacityRange:  [0.045, 0.09],
    sizeRange:     [9, 12],
    rotSpeedRange: [0.000008, 0.000022],
    driftMultiplier: 0.6,
  },
  MID: {
    fontWeight:    "400",
    cornerRadius:  7,
    borderWidth:   0.8,
    bgAlpha:       0.065,
    borderAlpha:   0.18,
    opacityRange:  [0.065, 0.12],
    sizeRange:     [11, 16],
    rotSpeedRange: [0.000018, 0.000045],
    driftMultiplier: 1.0,
  },
  NEAR: {
    fontWeight:    "500",
    cornerRadius:  9,
    borderWidth:   1.0,
    bgAlpha:       0.055,
    borderAlpha:   0.15,
    opacityRange:  [0.05, 0.10],
    sizeRange:     [13, 19],
    rotSpeedRange: [0.000035, 0.000075],
    driftMultiplier: 1.4,
  },
};

const LEVEL_COLORS = {
  dark: {
    FAR:  { h: 216, s: 88, l: 72 }, // cool blue — deep space
    MID:  { h: 264, s: 78, l: 74 }, // violet — floating
    NEAR: { h: 184, s: 90, l: 66 }, // cyan-teal — atmosphere
  },
  light: {
    FAR:  { h: 248, s: 60, l: 46 }, // indigo
    MID:  { h: 282, s: 62, l: 50 }, // violet-purple
    NEAR: { h: 322, s: 66, l: 48 }, // rose-magenta
  },
} as const;

interface Particle {
  label:          string;
  x:              number;   // viewport fraction 0–1
  baseScrollFrac: number;
  depth:          number;   // 0–1
  depthLevel:     DepthLevel;
  size:           number;
  opacity:        number;
  phase:          number;
  phaseSpeed:     number;
  driftAmpX:      number;
  driftAmpY:      number;
  baseRotation:   number;   // initial tilt
  rotSpeed:       number;   // rad/ms, signed (CW or CCW)
}

function getDepthLevel(d: number): DepthLevel {
  if (d < 0.40) return "FAR";
  if (d < 0.70) return "MID";
  return "NEAR";
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// Use a deterministic PRNG for stable distribution
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

    const rotSign  = rng() < 0.5 ? 1 : -1;
    const rotSpeed = lerp(st.rotSpeedRange[0], st.rotSpeedRange[1], rng()) * rotSign;

    result.push({
      label:          LABELS[li],
      x:              0.02 + rng() * 0.96,
      baseScrollFrac: rng(),
      depth,
      depthLevel:     level,
      size,
      opacity,
      phase:          rng() * Math.PI * 2,
      phaseSpeed:     0.00025 + rng() * 0.00040,
      driftAmpX:      (10 + rng() * 16) * st.driftMultiplier,
      driftAmpY:      (6  + rng() * 10) * st.driftMultiplier,
      baseRotation:   (rng() - 0.5) * 0.30,
      rotSpeed,
    });
  }
  return result;
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

export default function FloatingLanguageParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({
    particles:     [] as Particle[],
    targetScrollY: 0,
    smoothScrollY: 0,
    scrollVel:     0,
    animId:        0,
    width:         0,
    height:        0,
    isDark:        true,
    docHeight:     0,
    lastTime:      0,
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

    const state      = stateRef.current;
    // Increase particle count and ensure regular distribution
    state.particles  = createParticles(45);
    state.docHeight  = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);

    resize();
    window.addEventListener("resize", resize, { passive: true });

    let lastSY = window.scrollY;
    const onScroll = () => {
      const sy        = window.scrollY;
      // Clamp velocity to avoid extreme jumps
      const rawVel    = sy - lastSY;
      state.scrollVel = Math.max(-60, Math.min(60, rawVel));
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
      
      const { width, height, isDark, docHeight } = state;
      if (width === 0) return;

      // Smoother scroll interpolation
      state.smoothScrollY += (state.targetScrollY - state.smoothScrollY) * 0.08;
      const scrollFrac = state.smoothScrollY / Math.max(1, docHeight - height);

      ctx.clearRect(0, 0, width, height);
      const palette = isDark ? LEVEL_COLORS.dark : LEVEL_COLORS.light;

      state.particles.forEach(p => {
        const st    = LEVEL_STYLES[p.depthLevel];
        const color = palette[p.depthLevel];
        const { h, s, l } = color;

        // ── Position ──
        const parallaxFactor = 1 - p.depth * 0.85;
        // Extended scroll range for better distribution
        const scrollOffset   = (p.baseScrollFrac - scrollFrac) * height * 4.0 * parallaxFactor;

        const driftX = Math.sin(ts * p.phaseSpeed + p.phase) * p.driftAmpX;
        const driftY = Math.sin(ts * p.phaseSpeed * 0.68 + p.phase + 1.1) * p.driftAmpY;
        
        // Velocity effect is more subtle and smooth
        const velBoost = state.scrollVel * (1 - p.depth) * 0.25;

        const px = p.x * width + driftX;
        const py = height * 0.5 + scrollOffset + driftY + velBoost;

        // Wrap around vertically if needed or just skip if too far out
        if (py < -120 || py > height + 120) return;

        // ── Edge fade ──
        const edgePad = 120;
        let edgeFade  = 1;
        if (py < edgePad)              edgeFade = Math.max(0, py / edgePad);
        else if (py > height - edgePad) edgeFade = Math.max(0, (height - py) / edgePad);

        const velOpacity = Math.min(0.4, Math.abs(state.scrollVel) * 0.003);
        const finalAlpha = (p.opacity + velOpacity * (1 - p.depth)) * edgeFade;
        if (finalAlpha < 0.004) return;

        // ── Rotation ──
        const totalRot = p.baseRotation + ts * p.rotSpeed;

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(totalRot);

        // ── Render ──
        ctx.font = `${st.fontWeight} ${p.size}px 'Space Grotesk','Inter',sans-serif`;
        const textW   = ctx.measureText(p.label).width;
        const padX    = p.depthLevel === "FAR" ? 6 : p.depthLevel === "MID" ? 8 : 9;
        const padY    = p.depthLevel === "FAR" ? 3 : p.depthLevel === "MID" ? 4 : 5;
        const boxW    = textW + padX * 2;
        const boxH    = p.size * 1.35 + padY * 2;
        const bx      = -boxW / 2;
        const by      = -boxH / 2;
        const cr      = st.cornerRadius;

        ctx.globalAlpha = finalAlpha * st.bgAlpha * (1 / p.opacity);
        ctx.fillStyle   = `hsl(${h},${s}%,${l}%)`;
        roundRect(ctx, bx, by, boxW, boxH, cr);
        ctx.fill();

        ctx.globalAlpha = finalAlpha * st.borderAlpha * (1 / p.opacity);
        ctx.strokeStyle = `hsl(${h},${s}%,${l}%)`;
        ctx.lineWidth   = st.borderWidth;
        roundRect(ctx, bx, by, boxW, boxH, cr);
        ctx.stroke();

        ctx.globalAlpha  = finalAlpha;
        ctx.fillStyle    = `hsl(${h},${s}%,${l}%)`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(p.label, 0, 0);

        ctx.restore();
      });

      // Velocity decay - slower for smoother motion
      state.scrollVel *= 0.92;
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
