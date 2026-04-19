import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        observer.disconnect();
        const duration = 1600;
        const startTime = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setVal(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums font-mono">
      {val.toLocaleString()}{suffix}
    </span>
  );
}

const IMPACT_ITEMS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    value: 1386, suffix: "+",
    label_en: "Git Commits",   label_ar: "commit جيت",
    glow: "263 80% 68%",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    value: 31, suffix: "",
    label_en: "GitHub Repos",  label_ar: "مستودع GitHub",
    glow: "220 100% 65%",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    value: 6, suffix: "",
    label_en: "GitHub Stars",  label_ar: "نجمة GitHub",
    glow: "192 100% 62%",
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    value: 7, suffix: " yrs",
    label_en: "Years Coding",  label_ar: "سنوات برمجة",
    glow: "142 76% 55%",
  },
];

export default function FeaturedImpact() {
  const { lang, isRTL } = useLanguage();
  const { data } = useResumeData();
  const containerRef = useRef<HTMLDivElement>(null);

  const items = IMPACT_ITEMS.map(item => ({
    ...item,
    value: item.label_en === "Git Commits"
      ? (data.personal.stats.commits ?? item.value)
      : item.label_en === "GitHub Repos"
        ? (data.personal.stats.repos ?? item.value)
        : item.label_en === "GitHub Stars"
          ? (data.personal.stats.stars ?? item.value)
          : item.value,
    suffix: lang === "ar" && item.label_en === "Years Coding" ? " سنوات" : item.suffix,
  }));

  return (
    <div
      ref={containerRef}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="group relative cosmic-card rounded-2xl px-5 py-4 flex flex-col gap-3 overflow-hidden"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* background glow on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at center, hsl(${item.glow} / 0.06) 0%, transparent 70%)`
              }}
            />

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-border dark:border-transparent transition-all group-hover:scale-110"
              style={{
                background: `hsl(${item.glow} / 0.1)`,
                color: `hsl(${item.glow})`,
              }}
            >
              {item.icon}
            </div>

            <div>
              <div
                className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none mb-1"
                style={{ color: `hsl(${item.glow})` }}
              >
                <AnimatedNumber target={item.value} suffix={item.suffix} />
              </div>
              <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {lang === "ar" ? item.label_ar : item.label_en}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
