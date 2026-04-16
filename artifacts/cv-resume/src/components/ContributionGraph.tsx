import { useRef, useState, useEffect } from "react";
import { contributionData } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function getShade(count: number): string {
  if (count === 0)  return "bg-muted";
  if (count <= 2)   return "bg-foreground/20";
  if (count <= 5)   return "bg-foreground/40";
  if (count <= 8)   return "bg-foreground/65";
  return "bg-foreground";
}

export default function ContributionGraph() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];

  const MONTHS = lang === "ar" ? MONTHS_AR : MONTHS_EN;

  const [tooltip, setTooltip] = useState<{ x: number; y: number; count: number; visible: boolean }>({
    x: 0, y: 0, count: 0, visible: false,
  });
  const [revealed, setRevealed] = useState<boolean[][]>(
    contributionData.map((w) => w.map(() => false))
  );
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = graphRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          let delay = 0;
          contributionData.forEach((week, w) => {
            week.forEach((_, d) => {
              setTimeout(() => {
                setRevealed((prev) => {
                  const next = prev.map((row) => [...row]);
                  next[w][d] = true;
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
  }, []);

  const totalContributions = contributionData.flat().reduce((a, b) => a + b, 0);

  const tooltipText = (count: number) => {
    if (lang === "ar") return count === 0 ? "لا مساهمات" : `${count} مساهمة`;
    return count === 0 ? "No contributions" : `${count} contribution${count !== 1 ? "s" : ""}`;
  };

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-10 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className={`px-6 py-4 border-b border-border flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="text-sm font-semibold">
            {totalContributions.toLocaleString()} {t.contributions.subtitle}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{t.contributions.title}</span>
        </div>

        <div className="px-4 py-5 overflow-x-auto">
          <div ref={graphRef} className={`flex gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] pr-1 pt-5 flex-shrink-0">
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
                {contributionData.map((_, w) => {
                  const monthIndex = Math.floor((w / contributionData.length) * 12);
                  const showMonth = w % Math.floor(contributionData.length / 12) === 0;
                  return (
                    <div key={w} className="w-[10px] text-[8px] text-muted-foreground whitespace-nowrap" style={{ marginRight: "3px" }}>
                      {showMonth ? MONTHS[monthIndex] : ""}
                    </div>
                  );
                })}
              </div>

              {/* Cells */}
              <div className={`flex gap-[3px] ${isRTL ? "flex-row-reverse" : ""}`}>
                {contributionData.map((week, w) => (
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
