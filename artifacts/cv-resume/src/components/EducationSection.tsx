import { getEducation } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function EducationSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const education = getEducation(lang, resumeData);

  return (
    <section
      id="education"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.education.title}</span>
        <h2 className="section-title">
          {lang === "ar" ? "المسيرة الأكاديمية" : "Academic Background"}
        </h2>
      </div>

      <div className="space-y-4">
        {education.map((edu, i) => (
          <div key={i} className="premium-card rounded-2xl p-6 stagger-child" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-3 mb-3 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-9 h-9 rounded-xl border border-border bg-muted/50 dark:bg-[hsl(174_88%_52%/0.07)] flex items-center justify-center flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground dark:text-[hsl(174_80%_65%)]">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-[15px] tracking-tight block">{edu.school}</span>
                    <span className="text-xs text-muted-foreground font-mono">{edu.period}</span>
                  </div>
                </div>

                <div className={`text-sm text-muted-foreground mb-4 font-medium ${isRTL ? "text-right" : ""}`}>
                  {edu.degree}
                </div>

                <ul className={`space-y-2.5 ${isRTL ? "text-right" : ""}`}>
                  {edu.highlights.map((h, hi) => (
                    <li key={hi} className={`flex items-start gap-3 text-sm text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/30 dark:bg-[hsl(174_88%_52%/0.5)] flex-shrink-0" />
                      <span className="leading-relaxed">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* GPA badge */}
              <div className="flex-shrink-0 text-center px-5 py-4 rounded-2xl border border-border dark:border-[hsl(174_88%_52%/0.18)] dark:bg-[hsl(174_88%_52%/0.05)] bg-muted/40">
                <div className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mb-1 whitespace-nowrap">{t.education.gpa}</div>
                <div className="font-mono font-extrabold text-2xl tracking-tight dark:text-[hsl(174_80%_68%)]">{edu.gpa}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
