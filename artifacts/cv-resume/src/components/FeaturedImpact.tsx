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
        const duration = 1500;
        const startTime = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setVal(Math.round(target * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString()}{suffix}
    </span>
  );
}

const IMPACT_ITEMS = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    value: 1386, suffix: "+",
    label_en: "Git Commits",   label_ar: "commit جيت",
    accent: "hsl(174 88% 52%)",
    accentDark: "hsl(174 88% 52%)",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    value: 31, suffix: "",
    label_en: "GitHub Repos",  label_ar: "مستودع GitHub",
    accent: "hsl(220 100% 60%)",
    accentDark: "hsl(220 100% 65%)",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    value: 6, suffix: "",
    label_en: "GitHub Stars",  label_ar: "نجمة GitHub",
    accent: "hsl(192 100% 50%)",
    accentDark: "hsl(192 100% 62%)",
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    value: 7, suffix: "",
    label_en: "Years Coding",  label_ar: "سنوات برمجة",
    accent: "hsl(142 76% 42%)",
    accentDark: "hsl(142 76% 55%)",
  },
];

export default function FeaturedImpact() {
  const { lang, isRTL } = useLanguage();
  const { data } = useResumeData();

  const items = IMPACT_ITEMS.map(item => ({
    ...item,
    value: item.label_en === "Git Commits"
      ? (data.personal.stats.commits ?? item.value)
      : item.label_en === "GitHub Repos"
        ? (data.personal.stats.repos ?? item.value)
        : item.label_en === "GitHub Stars"
          ? (data.personal.stats.stars ?? item.value)
          : new Date().getFullYear() - data.personal.stats.since,
    suffix: lang === "ar" && item.label_en === "Years Coding" ? "" : item.suffix,
  }));

  return (
    <div
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="group relative cosmic-card rounded-2xl p-5 overflow-hidden stagger-child"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Subtle background accent on hover */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 20% 80%, ${item.accent}0d 0%, transparent 65%)` }}
            />

            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }}
            />

            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `${item.accent}18`,
                color: item.accent,
                border: `1px solid ${item.accent}25`,
              }}
            >
              {item.icon}
            </div>

            <div
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none mb-1.5 font-mono"
              style={{ color: item.accent }}
            >
              <AnimatedNumber target={item.value} suffix={item.suffix} />
              {lang === "ar" && item.label_en === "Years Coding" && (
                <span className="text-lg ml-1"> سنوات</span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider leading-tight">
              {lang === "ar" ? item.label_ar : item.label_en}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
