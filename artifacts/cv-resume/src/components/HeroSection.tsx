import { useEffect, useRef, useState } from "react";
import { useTypewriter } from "@/hooks/useTypewriter";
import { getPersonal } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { downloadPDF } from "@/lib/downloadPDF";
import { useGitHubStats } from "@/hooks/useGitHubStats";
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
    <div ref={ref} className="text-center p-4 group">
      <div className="text-xl font-bold font-mono stat-number tabular-nums tracking-tight transition-all group-hover:scale-105">
        {count.toLocaleString()}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-widest">{label}</div>
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
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
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
  const { stats: ghStats, loading: ghLoading } = useGitHubStats();
  const t = translations[lang];
  const personal = getPersonal(lang, resumeData);

  const liveRepos     = ghStats?.repos     ?? resumeData.personal.stats.repos;
  const liveFollowers = ghStats?.followers ?? resumeData.personal.stats.followers;
  const liveStars     = ghStats?.stars     ?? resumeData.personal.stats.stars;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const typeText = useTypewriter(personal.taglines, 75, 35, 2000);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await downloadPDF(lang); }
    finally { setPdfLoading(false); }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; twinkle: number; twinkleSpeed: number;
    }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.8 + 0.3,
        opacity: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains("dark");

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += p.twinkleSpeed;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const twinkleOpacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinkle));

        if (isDark) {
          // Cosmic colored stars
          const colors = [
            `rgba(180,140,255,${twinkleOpacity})`,
            `rgba(120,200,255,${twinkleOpacity})`,
            `rgba(255,255,255,${twinkleOpacity})`,
          ];
          ctx.fillStyle = colors[Math.floor(p.twinkle * 0.3) % 3];
        } else {
          ctx.fillStyle = `rgba(0,0,0,${twinkleOpacity * 0.5})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines for nearby particles
        if (isDark) {
          particles.forEach((p2) => {
            const dx = p.x - p2.x, dy = p.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80 && dist > 0) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(140,100,255,${0.05 * (1 - dist / 80)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="about" className="relative min-h-screen flex items-center overflow-hidden print:min-h-0 print:pt-8">
      {/* Background layers */}
      <div className="absolute inset-0 grid-pattern opacity-40 print:hidden" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none print:hidden" />

      {/* Cosmic nebula orbs */}
      <div className="nebula-orb w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-0 dark:opacity-100 print:hidden"
        style={{ background: "radial-gradient(circle, hsl(263 80% 68% / 0.12) 0%, transparent 70%)" }} />
      <div className="nebula-orb w-[400px] h-[400px] bottom-[-80px] right-[-60px] opacity-0 dark:opacity-100 print:hidden"
        style={{ background: "radial-gradient(circle, hsl(192 100% 62% / 0.08) 0%, transparent 70%)", animationDelay: "3s" }} />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80 pointer-events-none print:hidden" />

      <div
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-28 sm:py-32 w-full print:py-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className={`flex flex-col gap-10 lg:gap-16 ${isRTL ? "lg:flex-row-reverse" : "lg:flex-row"} items-start`}>

          {/* Left: main content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className={`flex flex-wrap items-center gap-2 mb-7 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ animation: "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {t.hero.openToOpportunities}
              </div>
              <VisitorBadge label={t.hero.visitors} />
            </div>

            {/* Name */}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-none mb-5 glow-text ${isRTL ? "text-right" : ""}`}
              style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.05s both" }}
            >
              {personal.name}
            </h1>

            {/* Typewriter */}
            <div
              className={`h-9 flex items-center mb-5 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
            >
              <span className={`font-mono text-base sm:text-lg terminal-cursor ${isRTL ? "text-right" : ""}`}>
                {typeText}
              </span>
            </div>
            <div className="hidden print:block text-lg text-muted-foreground mb-4 font-mono">
              {personal.title}
            </div>

            {/* Bio */}
            <p
              className={`text-muted-foreground leading-relaxed max-w-md mb-8 text-[15px] ${isRTL ? "text-right" : ""}`}
              style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
            >
              {personal.bio}
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-wrap gap-2.5 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}
            >
              <button onClick={() => scrollTo("contact")} className="btn-primary">
                {t.hero.getInTouch}
              </button>
              <button onClick={() => scrollTo("projects")} className="btn-secondary">
                {t.hero.viewProjects}
              </button>
              <button onClick={handleDownloadPDF} disabled={pdfLoading} className="btn-secondary flex items-center gap-2 disabled:opacity-50">
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
            <div
              className={`flex items-center gap-3 mt-8 print:hidden ${isRTL ? "flex-row-reverse" : ""}`}
              style={{ animation: "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both" }}
            >
              {[
                { label: "GitHub", href: `https://${resumeData.personal.github}`,
                  icon: <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/> },
                { label: "LinkedIn", href: `https://${resumeData.personal.linkedin}`,
                  icon: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></> },
                { label: "WhatsApp", href: `https://wa.me/${resumeData.personal.whatsapp}`,
                  icon: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/> },
              ].map(({ label, href, icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="icon-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Right: Stats panel */}
          <div
            className="w-full sm:w-80 lg:w-72 flex-shrink-0 print:hidden"
            style={{ animation: "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s both" }}
          >
            <div className="cosmic-card rounded-2xl overflow-hidden glow-border">
              <div className={`p-5 border-b border-border ${isRTL ? "text-right" : ""}`}>
                <div className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-12 h-12 rounded-full border-2 border-border overflow-hidden flex-shrink-0 transition-all hover:scale-105">
                    <img src="/Fares.jpg" alt={personal.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm tracking-tight truncate">{personal.name}</div>
                    <div className="text-xs text-muted-foreground font-mono truncate">{resumeData.personal.github}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {personal.location}
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-y divide-border">
                <StatCard value={resumeData.personal.stats.commits} label={t.stats.commits} />
                <div className={`transition-opacity ${ghLoading ? "opacity-50" : ""}`}>
                  <StatCard value={liveRepos} label={t.stats.repos} />
                </div>
                <div className={`transition-opacity ${ghLoading ? "opacity-50" : ""}`}>
                  <StatCard value={liveFollowers} label={t.stats.followers} />
                </div>
                <div className={`transition-opacity ${ghLoading ? "opacity-50" : ""}`}>
                  <StatCard value={liveStars} label={t.stats.stars} />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-border">
                <div className={`text-[11px] text-muted-foreground font-mono flex items-center justify-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span>{t.hero.since} {resumeData.personal.stats.since} · {new Date().getFullYear() - resumeData.personal.stats.since} {t.hero.yearsCoding}</span>
                  {ghLoading && (
                    <svg className="animate-spin opacity-40" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  )}
                  {!ghLoading && ghStats && (
                    <span className="inline-flex items-center gap-1 opacity-40" title="Live GitHub data">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                      </svg>
                      live
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce opacity-20 print:hidden">
          <span className="text-[10px] tracking-[0.2em] uppercase font-mono">Scroll</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </section>
  );
}
