import { useRef, useState, useEffect } from "react";
import { contributionData } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchGitHubContributions, fetchGitHubStats } from "@/lib/github";

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function getShade(count: number): string {
  if (count === 0)  return "bg-muted";
  if (count <= 2)   return "bg-emerald-400/60 dark:bg-emerald-800";
  if (count <= 5)   return "bg-emerald-500/70 dark:bg-emerald-600";
  if (count <= 8)   return "bg-emerald-600/85 dark:bg-emerald-500";
  return "bg-emerald-700 dark:bg-emerald-400";
}

export default function ContributionGraph() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];

  const MONTHS = lang === "ar" ? MONTHS_AR : MONTHS_EN;

  const [graphData, setGraphData] = useState<number[][]>(contributionData);
  const [ghStats, setGhStats] = useState<{ followers: number; public_repos: number; stars: number } | null>(null);
  const [loadingGH, setLoadingGH] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; count: number; visible: boolean }>({
    x: 0, y: 0, count: 0, visible: false,
  });
  const [revealed, setRevealed] = useState<boolean[][]>(
    graphData.map((w) => w.map(() => false))
  );
  const graphRef = useRef<HTMLDivElement>(null);

  // ── Circular glow state ───────────────────────────────────────────────────
  const wrapperRef = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el   = wrapperRef.current;
      const glow = glowRef.current;
      if (!el || !glow) return;

      const rect = el.getBoundingClientRect();
      const vh   = window.innerHeight;

      // Progress: 0 when section is outside, peaks when section center aligns with viewport center
      const sectionMid = rect.top + rect.height / 2;
      const viewMid    = vh / 2;
      const maxDist    = vh * 0.75;
      const dist       = Math.abs(sectionMid - viewMid);
      const progress   = Math.max(0, Math.min(1, 1 - dist / maxDist));

      const scale   = 0.3 + progress * 1.0;
      const opacity = progress * 0.75;

      glow.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      glow.style.opacity   = opacity.toFixed(3);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Run once on mount to set initial state
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingGH(true);
    Promise.all([fetchGitHubContributions(), fetchGitHubStats()]).then(([contributions, stats]) => {
      if (cancelled) return;
      if (contributions && contributions.length > 0) {
        setGraphData(contributions);
        setRevealed(contributions.map((w) => w.map(() => false)));
      }
      if (stats) setGhStats(stats);
      setLoadingGH(false);
    }).catch(() => {
      if (!cancelled) setLoadingGH(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setRevealed(graphData.map((w) => w.map(() => false)));
  }, [graphData]);

  useEffect(() => {
    const el = graphRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let delay = 0;
          graphData.forEach((week, w) => {
            week.forEach((_, d) => {
              setTimeout(() => {
                setRevealed((prev) => {
                  const next = prev.map((row) => [...row]);
                  if (next[w]) next[w][d] = true;
                  return next;
                });
              }, delay);
              delay += 3;
            });
          });
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [graphData]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => setCanScrollLeft(el.scrollLeft > 10);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const totalContributions = graphData.flat().reduce((a, b) => a + b, 0);

  const tooltipText = (count: number) => {
    if (lang === "ar") return count === 0 ? "لا مساهمات" : `${count} مساهمة`;
    return count === 0 ? "No contributions" : `${count} contribution${count !== 1 ? "s" : ""}`;
  };

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-10 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Wrapper holds the glow + card */}
      <div ref={wrapperRef} className="relative">

        {/* ── Circular glow ──────────────────────────────────────────────── */}
        <div
          ref={glowRef}
          aria-hidden="true"
          style={{
            position:      "absolute",
            top:           "50%",
            left:          "50%",
            width:         "140%",
            aspectRatio:   "1",
            borderRadius:  "50%",
            background:    `radial-gradient(circle,
              hsl(152 72% 50% / 0.13) 0%,
              hsl(152 72% 50% / 0.07) 30%,
              hsl(160 80% 42% / 0.04) 55%,
              transparent 72%)`,
            transform:     "translate(-50%, -50%) scale(0.3)",
            opacity:       0,
            transition:    "transform 0.35s ease, opacity 0.35s ease",
            pointerEvents: "none",
            zIndex:        0,
          }}
        />

        {/* ── Contribution card ──────────────────────────────────────────── */}
        <div className="relative z-[1] border border-border rounded-xl bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 border-b border-border flex items-center justify-between gap-4 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <a
                href="https://github.com/Farisatif"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden group-hover:border-foreground/40 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                </div>
                <span className="text-sm font-semibold group-hover:underline">Farisatif</span>
              </a>
              {loadingGH && (
                <span className="text-[10px] text-muted-foreground font-mono animate-pulse">
                  {lang === "ar" ? "جاري التحميل..." : "Loading..."}
                </span>
              )}
              {ghStats && !loadingGH && (
                <div className={`flex items-center gap-3 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="font-mono">{ghStats.public_repos ?? 0} {lang === "ar" ? "مستودع" : "repos"}</span>
                  <span className="text-border">·</span>
                  <span className="font-mono">{ghStats.followers} {lang === "ar" ? "متابع" : "followers"}</span>
                  <span className="text-border">·</span>
                  <span className="font-mono">★ {ghStats.stars}</span>
                </div>
              )}
            </div>
            <div className={`flex flex-col ${isRTL ? "items-end" : "items-start"}`}>
              <span className="text-sm font-semibold">
                {totalContributions.toLocaleString(lang === "ar" ? "ar-SA" : "en-US")} {t.contributions.subtitle}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{t.contributions.title}</span>
            </div>
          </div>

          {/* Scrollable graph */}
          <div className="relative">
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card to-transparent z-10 pointer-events-none rounded-bl-xl" />
            )}
            <div
              ref={scrollRef}
              className="px-4 py-5 overflow-x-auto"
              dir="ltr"
              style={{ scrollbarWidth: "thin" }}
            >
              <div ref={graphRef} className="flex gap-2" style={{ minWidth: "max-content" }}>
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] pt-5 flex-shrink-0 pr-1">
                  {t.contributions.days.map((day, i) => (
                    <div
                      key={i}
                      className="h-[10px] text-[9px] text-muted-foreground leading-none flex items-center"
                      style={{ marginBottom: i === 0 ? "15px" : "3px" }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Graph columns */}
                <div className="flex flex-col gap-1 flex-1">
                  {/* Month labels */}
                  <div className="flex gap-[3px]">
                    {graphData.map((_, w) => {
                      const monthIndex = Math.floor((w / graphData.length) * 12);
                      const showMonth = w % Math.floor(graphData.length / 12) === 0;
                      return (
                        <div key={w} className="w-[10px] text-[8px] text-muted-foreground whitespace-nowrap mr-[3px]">
                          {showMonth ? MONTHS[monthIndex] : ""}
                        </div>
                      );
                    })}
                  </div>

                  {/* Cells */}
                  <div className="flex gap-[3px]">
                    {graphData.map((week, w) => (
                      <div key={w} className="flex flex-col gap-[3px]">
                        {week.map((count, d) => (
                          <div
                            key={d}
                            className={`contribution-cell w-[10px] h-[10px] rounded-[2px] cursor-pointer ${
                              revealed[w]?.[d] ? getShade(count) : "bg-transparent"
                            }`}
                            style={{ transition: revealed[w]?.[d] ? "all 0.3s ease" : "none" }}
                            onMouseEnter={(e) => {
                              const rect = (e.target as HTMLElement).getBoundingClientRect();
                              setTooltip({ x: rect.left, y: rect.top, count, visible: true });
                            }}
                            onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1.5 mt-3 justify-end">
                <span className="text-[10px] text-muted-foreground">{t.contributions.less}</span>
                {[0, 2, 5, 8, 12].map((n) => (
                  <div key={n} className={`w-[10px] h-[10px] rounded-[2px] ${getShade(n)}`} />
                ))}
                <span className="text-[10px] text-muted-foreground">{t.contributions.more}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded bg-foreground text-background text-[11px] font-mono shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x + 5, top: tooltip.y - 6 }}
        >
          {tooltipText(tooltip.count)}
        </div>
      )}
    </section>
  );
}
