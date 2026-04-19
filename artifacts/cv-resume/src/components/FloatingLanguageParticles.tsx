import { useEffect, useRef, useCallback } from "react";

const LABELS = [
  "JavaScript", "TypeScript", "Python", "React", "Rust", "Go",
  "C++", "Java", "SQL", "Node.js", "Linux", "C#", "Next.js",
  "Flutter", "CSS", "HTML", "API", "WebAssembly", "Kotlin",
  "GraphQL", "Figma", "Git", "Docker", "Redis", "MySQL",
  "JSON", "XML", "Bash", "Swift", "PHP",
];

interface Particle {
  label: string;
  x: number;         // viewport fraction 0–1
  baseScrollFrac: number; // position in page scroll space 0–1
  depth: number;     // 0–1, deeper = slower parallax + lower opacity
  size: number;      // font-size px
  opacity: number;   // base opacity
  phase: number;     // drift phase offset
  phaseSpeed: number;// drift oscillation speed
  driftAmpX: number; // horizontal drift amplitude px
  driftAmpY: number; // vertical drift amplitude px
  rotation: number;  // slight tilt in radians
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  const used = new Set<number>();

  for (let i = 0; i < count; i++) {
    let labelIdx: number;
    do { labelIdx = Math.floor(Math.random() * LABELS.length); }
    while (used.has(labelIdx) && used.size < LABELS.length);
    used.add(labelIdx);

    const depth = 0.15 + Math.random() * 0.85;           // deeper = larger depth number = moves less

    // Clamp label depth: very distant labels are most transparent
    const opacityBase = depth < 0.35
      ? 0.04 + depth * 0.06                              // far layer: 4–8%
      : depth < 0.65
        ? 0.07 + (depth - 0.35) * 0.10                  // mid layer: 7–10%
        : 0.04 + (1 - depth) * 0.14;                    // near layer: fades slightly

    particles.push({
      label: LABELS[labelIdx],
      x: 0.03 + Math.random() * 0.94,
      baseScrollFrac: Math.random(),
      depth,
      size: depth < 0.35 ? 9 + Math.random() * 4 : depth < 0.65 ? 11 + Math.random() * 6 : 13 + Math.random() * 7,
      opacity: opacityBase,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.0003 + Math.random() * 0.0005,
      driftAmpX: 12 + Math.random() * 18,
      driftAmpY: 8 + Math.random() * 12,
      rotation: (Math.random() - 0.5) * 0.22,
    });
  }
  return particles;
}

export default function FloatingLanguageParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    particles: [] as Particle[],
    scrollY: 0,
    targetScrollY: 0,
    smoothScrollY: 0,
    scrollVelocity: 0,
    time: 0,
    animId: 0,
    width: 0,
    height: 0,
    isDark: true,
    documentHeight: 0,
  });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    stateRef.current.width  = w;
    stateRef.current.height = h;
  }, []);

  const getDocumentHeight = () =>
    Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
    );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    state.particles = createParticles(28);

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Scroll tracking with velocity
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const sy = window.scrollY;
      state.scrollVelocity = sy - lastScrollY;
      lastScrollY = sy;
      state.targetScrollY = sy;
      state.documentHeight = getDocumentHeight();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    state.documentHeight = getDocumentHeight();

    // Check dark mode periodically
    const checkDark = () => {
      state.isDark = document.documentElement.classList.contains("dark");
    };
    checkDark();
    const darkObserver = new MutationObserver(checkDark);
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const draw = (timestamp: number) => {
      state.animId = requestAnimationFrame(draw);
      state.time = timestamp;

      const { width, height, isDark, documentHeight } = state;
      if (width === 0) return;

      // Smooth scroll interpolation
      state.smoothScrollY += (state.targetScrollY - state.smoothScrollY) * 0.055;

      const scrollable = Math.max(1, documentHeight - height);
      const scrollFrac = state.smoothScrollY / scrollable;

      ctx.clearRect(0, 0, width, height);

      state.particles.forEach((p) => {
        // ── Parallax position ──────────────────────────────────────────
        // Each particle "belongs" at a certain scroll fraction.
        // As you scroll, it moves at a rate proportional to its depth.
        // depth close to 1 → slow (far away), depth close to 0 → fast (close)

        const parallaxFactor = 1 - p.depth * 0.85;   // near=0.15 far=0.98 movement
        const scrollOffset = (p.baseScrollFrac - scrollFrac) * height * 3.2 * parallaxFactor;

        // Drift oscillation
        const driftX = Math.sin(timestamp * p.phaseSpeed + p.phase)            * p.driftAmpX;
        const driftY = Math.sin(timestamp * p.phaseSpeed * 0.7 + p.phase + 1)  * p.driftAmpY;

        // Scroll-velocity tilt/boost
        const velocityBoost = state.scrollVelocity * (1 - p.depth) * 0.4;

        const px = p.x * width + driftX;
        const py = height * 0.5 + scrollOffset + driftY + velocityBoost;

        // Only draw if visible within generous margins
        if (py < -60 || py > height + 60) return;

        // ── Edge fade: particles near top/bottom fade out ───────────────
        const edgePad = 80;
        let edgeFade = 1;
        if (py < edgePad)          edgeFade = Math.max(0, py / edgePad);
        else if (py > height - edgePad) edgeFade = Math.max(0, (height - py) / edgePad);

        // ── Scroll-velocity opacity boost ───────────────────────────────
        const velOpacity = Math.min(0.6, Math.abs(state.scrollVelocity) * 0.006);
        const finalOpacity = (p.opacity + velOpacity * (1 - p.depth)) * edgeFade;

        if (finalOpacity < 0.005) return;

        // ── Render ──────────────────────────────────────────────────────
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rotation + Math.sin(timestamp * p.phaseSpeed * 0.3) * 0.04);
        ctx.globalAlpha = finalOpacity;
        ctx.font = `${p.depth < 0.4 ? "300" : "400"} ${p.size}px 'Space Grotesk', 'Inter', sans-serif`;

        if (isDark) {
          // In dark mode: use purple-cyan gradient tones
          const purpleWeight = p.depth < 0.5 ? 0.7 : 0.3;
          if (Math.random() < 0.001) {
            // Rare glow re-roll for sparkle effect (very infrequent)
          }
          const r = Math.round(160 + purpleWeight * 60);
          const g = Math.round(130 + (1 - purpleWeight) * 100);
          const b = Math.round(220 + (1 - purpleWeight) * 35);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          // In light mode: subtle dark ink
          ctx.fillStyle = `rgb(20,18,40)`;
        }

        ctx.fillText(p.label, 0, 0);
        ctx.restore();
      });

      // Decay scroll velocity
      state.scrollVelocity *= 0.88;
    };

    state.animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      darkObserver.disconnect();
    };
  }, [resize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        mixBlendMode: "normal",
      }}
    />
  );
}
