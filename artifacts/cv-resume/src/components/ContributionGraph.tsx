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
  if (count <= 2)   return "bg-emerald-300/60 dark:bg-emerald-900/70";
  if (count <= 5)   return "bg-emerald-400/70 dark:bg-emerald-700/80";
  if (count <= 8)   return "bg-emerald-500/80 dark:bg-emerald-500/90";
  return "bg-emerald-600 dark:bg-emerald-400";
}

export default function ContributionGraph() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];

  const MONTHS = lang === "ar" ? MONTHS_AR : MONTHS_EN;

  const [graphData, setGraphData] = useState<number[][]>(contributionData);
  const [ghStats, setGhStats] = useState<{ followers: number; public_repos: number; stars: number } | null>(null);
  const [loadingGH, setLoadingGH] = useState(true);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; count: number; visible: boolean }>({
    x: 0, y: 0, count: 0, visible: false,
  });
  const [revealed, setRevealed] = useState<boolean[][]>(
    graphData.map((w) => w.map(() => false))
  );
  const graphRef = useRef<HTMLDivElement>(null);

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

  const totalContributions = graphData.flat().reduce((a, b) => a + b, 0);

  const tooltipText = (count: number) => {
    if (lang === "ar") return count === 0 ? "لا مساهمات" : `${count} مساهمة`;
    return count === 0 ? "No contributions" : `${count} contribution${count !== 1 ? "s" : ""}`;
  };

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-10 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
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
              {totalContributions.toLocaleString()} {t.contributions.subtitle}
            </span>
            <span className="text-xs text-muted-foreground font-mono">{t.contributions.title}</span>
          </div>
        </div>

        <div className="px-4 py-5 overflow-x-auto">
          <div ref={graphRef} className={`flex gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Day labels */}
            <div className={`flex flex-col gap-[3px] pt-5 flex-shrink-0 ${isRTL ? "pl-1" : "pr-1"}`}>
              {t.contributions.days.map((day, i) => (
                <div key={i} className="h-[10px] text-[9px] text-muted-foreground leading-none flex items-center" style={{ marginBottom: i === 0 ? "15px" : "3px" }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Graph */}
            <div className="flex flex-col gap-1 flex-1">
              {/* Month labels */}
              <div className={`flex gap-[3px] ${isRTL ? "flex-row-reverse" : ""}`}>
                {graphData.map((_, w) => {
                  const monthIndex = Math.floor((w / graphData.length) * 12);
                  const showMonth = w % Math.floor(graphData.length / 12) === 0;
                  return (
                    <div key={w} className="w-[10px] text-[8px] text-muted-foreground whitespace-nowrap" style={{ marginRight: isRTL ? 0 : "3px", marginLeft: isRTL ? "3px" : 0 }}>
                      {showMonth ? MONTHS[monthIndex] : ""}
                    </div>
                  );
                })}
              </div>

              {/* Cells */}
              <div className={`flex gap-[3px] ${isRTL ? "flex-row-reverse" : ""}`}>
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
          <div className={`flex items-center gap-1.5 mt-3 ${isRTL ? "justify-start flex-row-reverse" : "justify-end"}`}>
            <span className="text-[10px] text-muted-foreground">{t.contributions.less}</span>
            {[0, 2, 5, 8, 12].map((n) => (
              <div key={n} className={`w-[10px] h-[10px] rounded-[2px] ${getShade(n)}`} />
            ))}
            <span className="text-[10px] text-muted-foreground">{t.contributions.more}</span>
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
