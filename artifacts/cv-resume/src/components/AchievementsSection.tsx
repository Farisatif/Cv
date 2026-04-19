import { useLanguage } from "@/context/LanguageContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useResumeData } from "@/context/ResumeDataContext";
import { AchievementIcon } from "@/lib/achievementIcons";

export default function AchievementsSection() {
  const sectionRef      = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data }        = useResumeData();
  const achievements    = data.achievements ?? [];

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

      {achievements.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-10">
          {lang === "ar" ? "لا توجد إنجازات بعد." : "No achievements added yet."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((item, i) => (
            <div
              key={item.id ?? i}
              className="highlight-card rounded-2xl p-5 group stagger-child"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 border"
                style={{
                  background:  `hsl(${item.accent} / 0.1)`,
                  color:       `hsl(${item.accent})`,
                  borderColor: `hsl(${item.accent} / 0.2)`,
                }}
              >
                <AchievementIcon name={item.icon} />
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
                  background:  `hsl(${item.accent} / 0.08)`,
                  color:       `hsl(${item.accent})`,
                  borderColor: `hsl(${item.accent} / 0.2)`,
                }}
              >
                {lang === "ar" ? item.badge_ar : item.badge_en}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
