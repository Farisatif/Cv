import { useEffect, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { resumeData } from "@/data/resume";

const { personal } = resumeData;

function StatCard({ value, label }: { value: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let start = 0;
          const end = value;
          const duration = 1500;
          const step = Math.ceil(end / (duration / 16));
          const timer = setInterval(() => {
            start += step;
            if (start >= end) {
              setCount(end);
              clearInterval(timer);
            } else {
              setCount(start);
            }
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center group">
      <div className="text-2xl font-bold font-mono tabular-nums tracking-tight group-hover:text-foreground transition-colors">
        {count.toLocaleString()}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

export default function HeroSection() {
  const typeText = useTypewriter(personal.taglines, 80, 40, 2200);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");
      const particleColor = isDark ? "255,255,255" : "0,0,0";

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor},${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particleColor},${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="about" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Grid pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-40" />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 w-full">
        <div className="flex flex-col lg:flex-row items-start gap-16">
          {/* Left: Main info */}
          <div className="flex-1 min-w-0">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/80 text-xs text-muted-foreground mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-pulse" />
              Open to opportunities
            </div>

            {/* Name */}
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-none mb-4">
              {personal.name}
            </h1>

            {/* Typewriter role */}
            <div className="h-10 flex items-center mb-6">
              <span className="font-mono text-xl text-muted-foreground terminal-cursor">
                {typeText}
              </span>
            </div>

            {/* Bio */}
            <p className="text-muted-foreground leading-relaxed max-w-lg mb-8 text-[15px]">
              {personal.bio}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollToSection("contact")}
                className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150"
              >
                Get in touch
              </button>
              <button
                onClick={() => scrollToSection("projects")}
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all duration-150 active:scale-95"
              >
                View projects
              </button>
              <a
                href="#"
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all duration-150 active:scale-95 flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download CV
              </a>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-4 mt-8">
              {[
                {
                  label: "GitHub",
                  icon: (
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  ),
                },
                {
                  label: "LinkedIn",
                  icon: (
                    <>
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                      <rect x="2" y="9" width="4" height="12"/>
                      <circle cx="4" cy="4" r="2"/>
                    </>
                  ),
                },
                {
                  label: "Website",
                  icon: (
                    <>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </>
                  ),
                },
              ].map(({ label, icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Stats panel */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="border border-border rounded-xl bg-card/60 backdrop-blur-sm overflow-hidden">
              {/* Profile header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-foreground/20 to-foreground/5 border-2 border-border flex items-center justify-center text-2xl font-bold font-mono text-foreground">
                    {personal.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{personal.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{personal.github}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {personal.location}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 divide-x divide-y divide-border">
                <div className="p-4">
                  <StatCard value={personal.stats.commits} label="Commits" />
                </div>
                <div className="p-4">
                  <StatCard value={personal.stats.repos} label="Repos" />
                </div>
                <div className="p-4">
                  <StatCard value={personal.stats.followers} label="Followers" />
                </div>
                <div className="p-4">
                  <StatCard value={personal.stats.stars} label="Stars" />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <div className="text-xs text-muted-foreground text-center font-mono">
                  Since 2013 · {new Date().getFullYear() - 2013} years coding
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce opacity-40">
          <span className="text-xs text-muted-foreground">Scroll</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
