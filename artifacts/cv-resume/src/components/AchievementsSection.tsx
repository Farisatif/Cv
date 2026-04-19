import { useLanguage } from "@/context/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Achievement {
  icon: React.ReactNode;
  title_en: string;
  title_ar: string;
  desc_en: string;
  desc_ar: string;
  badge_en: string;
  badge_ar: string;
  accent: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    title_en: "2,847 Git Commits",
    title_ar: "٢٨٤٧ commit جيت",
    desc_en: "Consistent contributor with a strong open source presence across multiple active projects.",
    desc_ar: "مساهم نشط بسجل حافل في مشاريع متعددة مفتوحة المصدر.",
    badge_en: "Open Source",
    badge_ar: "مفتوح المصدر",
    accent: "263 80% 68%",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    title_en: "73% Latency Reduction",
    title_ar: "تخفيض الاستجابة ٧٣٪",
    desc_en: "Optimized Edge Runtime cold start performance through WASM compilation strategies.",
    desc_ar: "تحسين أداء وقت الاستجابة الأولي في Edge Runtime بتقنيات WASM.",
    badge_en: "Performance",
    badge_ar: "الأداء",
    accent: "142 76% 55%",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title_en: "1,204 GitHub Followers",
    title_ar: "١٢٠٤ متابع على GitHub",
    desc_en: "Growing developer community and open source reputation built through meaningful contributions.",
    desc_ar: "مجتمع متنامٍ من المطورين بُني من خلال مساهمات فعّالة ومؤثرة.",
    badge_en: "Community",
    badge_ar: "المجتمع",
    accent: "220 100% 65%",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    title_en: "Multi-Stack Engineer",
    title_ar: "مهندس متعدد المنصات",
    desc_en: "Proficient across frontend, backend, mobile, and systems — from React to C++ to Flutter.",
    desc_ar: "إلمام بالواجهة الأمامية، الخوادم، الجوال، والأنظمة من React إلى C++ وFlutter.",
    badge_en: "Full Stack",
    badge_ar: "متكامل",
    accent: "192 100% 52%",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    title_en: "50k+ Projects Using My Work",
    title_ar: "أكثر من ٥٠٠٠٠ مشروع",
    desc_en: "Edge Middleware system adopted globally, serving billions of requests across 100+ regions.",
    desc_ar: "نظام Edge Middleware مُعتمد عالميًا يخدم مليارات الطلبات في أكثر من 100 منطقة.",
    badge_en: "Scale",
    badge_ar: "نطاق واسع",
    accent: "38 95% 55%",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title_en: "5+ Years Building",
    title_ar: "أكثر من ٥ سنوات بناء",
    desc_en: "Started coding in middle school. Now building infrastructure at global scale for world-class companies.",
    desc_ar: "بدأت البرمجة في المرحلة الإعدادية، والآن أبني بنية تحتية عالمية لشركات رائدة.",
    badge_en: "Journey",
    badge_ar: "المسيرة",
    accent: "328 80% 60%",
  },
];

export default function AchievementsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();

  return (
    <section
      id="achievements"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">
          {lang === "ar" ? "الإنجازات" : "Highlights"}
        </span>
        <h2 className="section-title">
          {lang === "ar" ? "لحظات تستحق التوقف" : "What I'm proud of"}
        </h2>
        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md">
          {lang === "ar"
            ? "إنجازات تكنيكية وبشرية شكّلت مسيرتي."
            : "Technical and human milestones that shaped who I am as an engineer."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACHIEVEMENTS.map((item, i) => (
          <div
            key={i}
            className="highlight-card rounded-2xl p-5 group stagger-child"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 border"
              style={{
                background: `hsl(${item.accent} / 0.1)`,
                color: `hsl(${item.accent})`,
                borderColor: `hsl(${item.accent} / 0.2)`,
              }}
            >
              {item.icon}
            </div>

            {/* Title */}
            <h3 className={`font-bold text-[14px] tracking-tight mb-2 ${isRTL ? "text-right" : ""}`}>
              {lang === "ar" ? item.title_ar : item.title_en}
            </h3>

            {/* Description */}
            <p className={`text-sm text-muted-foreground leading-relaxed mb-4 ${isRTL ? "text-right" : ""}`}>
              {lang === "ar" ? item.desc_ar : item.desc_en}
            </p>

            {/* Badge */}
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                background: `hsl(${item.accent} / 0.08)`,
                color: `hsl(${item.accent})`,
                borderColor: `hsl(${item.accent} / 0.2)`,
              }}
            >
              {lang === "ar" ? item.badge_ar : item.badge_en}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
