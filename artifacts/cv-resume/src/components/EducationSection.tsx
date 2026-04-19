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
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.education.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {lang === "ar" ? "المسيرة الأكاديمية" : "Academic Background"}
        </h2>
      </div>

      <div className="space-y-4">
        {education.map((edu, i) => (
          <div key={i} className="cosmic-card rounded-2xl p-6">
            <div className={`flex items-start justify-between gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-2.5 mb-1.5 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="icon-btn w-8 h-8 rounded-lg flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-[15px] tracking-tight">{edu.school}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted dark:bg-[hsl(263_80%_68%/0.1)] text-muted-foreground dark:text-[hsl(263_80%_75%/0.8)] font-mono border border-transparent dark:border-[hsl(263_80%_68%/0.15)]">
                    {edu.period}
                  </span>
                </div>
                <div className={`text-sm text-muted-foreground mb-4 ${isRTL ? "text-right" : ""}`}>
                  {edu.degree}
                </div>
                <ul className={`space-y-2 ${isRTL ? "text-right" : ""}`}>
                  {edu.highlights.map((h, hi) => (
                    <li key={hi} className={`flex items-start gap-2.5 text-sm text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/40 dark:bg-[hsl(263_80%_68%/0.6)] flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`flex-shrink-0 text-center px-4 py-3 rounded-xl border border-border dark:border-[hsl(263_80%_68%/0.2)] dark:bg-[hsl(263_80%_68%/0.06)] bg-muted/40`}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 whitespace-nowrap">{t.education.gpa}</div>
                <div className="font-mono font-bold text-2xl tracking-tight dark:text-[hsl(263_80%_75%)]">{edu.gpa}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
