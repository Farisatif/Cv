import { useEffect, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { getPersonal } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { downloadPDF } from "@/lib/downloadPDF";
import { useGetVisitorCount, useTrackVisit, getGetVisitorCountQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

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
          const duration = 1400;
          const step = Math.max(1, Math.ceil(end / (duration / 16)));
          const timer = setInterval(() => {
            start = Math.min(start + step, end);
            setCount(start);
            if (start >= end) clearInterval(timer);
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
      <div className="text-2xl font-bold font-mono tabular-nums tracking-tight group-hover:scale-105 transition-transform">
        {count.toLocaleString()}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function VisitorBadge({ label }: { label: string }) {
  const { data: visitorData } = useGetVisitorCount();
  const trackVisit = useTrackVisit();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sessionStorage.getItem("cv-visited")) return;
    sessionStorage.setItem("cv-visited", "1");
    trackVisit.mutateAsync().then(() => {
      queryClient.invalidateQueries({ queryKey: getGetVisitorCountQueryKey() });
    }).catch(() => {});
  }, []);

  const count = visitorData?.count ?? null;
  if (count === null) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground shadow-sm">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
      <span className="font-mono tabular-nums font-semibold">{count.toLocaleString()}</span>
      <span>{label}</span>
    </div>
  );
}

export default function HeroSection() {
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const personal = getPersonal(lang, resumeData);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const typeText = useTypewriter(personal.taglines, 80, 40, 2200);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF(lang);
    } finally {
      setPdfLoading(false);
    }
  };

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

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.35 + 0.08,
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

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${particleColor},${0.07 * (1 - dist / 90)})`;
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

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="about" className="relative min-h-screen flex items-center overflow-hidden print:min-h-0 print:pt-8">
      <div className="absolute inset-0 grid-pattern opacity-50 print:hidden" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none print:hidden" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none print:hidden" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-28 sm:py-32 w-full print:py-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className={`flex flex-col gap-10 lg:gap-16 ${isRTL ? "lg:flex-row-reverse" : "lg:flex-row"} items-start`}>

          {/* Left content */}
          <div className="flex-1 min-w-0">
            {/* Status badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6 print:hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {t.hero.openToOpportunities}
              </div>
              <VisitorBadge label={t.hero.visitors} />
            </div>

            {/* Name */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-none mb-4">
              {personal.name}
            </h1>

            {/* Typewriter */}
            <div className="h-10 flex items-center mb-6 print:hidden">
              <span className={`font-mono text-lg sm:text-xl text-muted-foreground terminal-cursor ${isRTL ? "text-right" : ""}`}>
                {typeText}
              </span>
            </div>
            <div className="hidden print:block text-lg text-muted-foreground mb-4 font-mono">
              {personal.title}
            </div>

            {/* Bio */}
            <p className="text-muted-foreground leading-relaxed max-w-lg mb-8 text-[15px] break-words">
              {personal.bio}
            </p>

            {/* CTA buttons */}
            <div className={`flex flex-wrap gap-3 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}>
              <button
                onClick={() => scrollTo("contact")}
                className="px-5 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-95 transition-all duration-150 shadow-sm"
              >
                {t.hero.getInTouch}
              </button>
              <button
                onClick={() => scrollTo("projects")}
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all duration-150 active:scale-95 shadow-sm"
              >
                {t.hero.viewProjects}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="px-5 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-all duration-150 active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-60"
              >
                {pdfLoading ? (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                )}
                {t.hero.downloadCV}
              </button>
            </div>

            {/* Print-only contact */}
            <div className="hidden print:flex flex-col gap-1 text-sm text-muted-foreground mt-4">
              <span>{personal.email}</span>
              <span>{personal.phone}</span>
              <span>{personal.location}</span>
            </div>

            {/* Social links */}
            <div className={`flex items-center gap-4 mt-8 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}>
              {[
                {
                  label: "GitHub",
                  href: `https://${resumeData.personal.github}`,
                  icon: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>,
                },
                {
                  label: "LinkedIn",
                  href: `https://${resumeData.personal.linkedin}`,
                  icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
                },
                {
                  label: "WhatsApp",
                  href: `https://wa.me/${resumeData.personal.whatsapp}`,
                  icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>,
                },
              ].map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 transform"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Stats panel */}
          <div className="w-full sm:w-80 lg:w-72 flex-shrink-0 print:hidden">
            <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
              {/* Profile header */}
              <div className="p-5 border-b border-border bg-muted/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full border-2 border-border overflow-hidden flex-shrink-0">
                    <img
                      src="/Fares.jpg"
                      alt={personal.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{personal.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{resumeData.personal.github}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {personal.location}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 divide-x divide-y divide-border">
                <div className="p-4"><StatCard value={resumeData.personal.stats.commits}   label={t.stats.commits} /></div>
                <div className="p-4"><StatCard value={resumeData.personal.stats.repos}     label={t.stats.repos} /></div>
                <div className="p-4"><StatCard value={resumeData.personal.stats.followers} label={t.stats.followers} /></div>
                <div className="p-4"><StatCard value={resumeData.personal.stats.stars}     label={t.stats.stars} /></div>
              </div>

              <div className="p-3 border-t border-border bg-muted/20">
                <div className="text-[11px] text-muted-foreground text-center font-mono">
                  {t.hero.since} {resumeData.personal.stats.since} · {new Date().getFullYear() - resumeData.personal.stats.since} {t.hero.yearsCoding}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-30 print:hidden">
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Scroll</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
