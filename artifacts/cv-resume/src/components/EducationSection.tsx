import { getEducation } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function EducationSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const education = getEducation(lang);

  return (
    <section id="education" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6">
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <div className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.education.title}</h2>
        </div>
      </div>

      <div className="space-y-4">
        {education.map((edu, i) => (
          <div key={i} className="border border-border rounded-xl bg-card p-5 card-hover hover:border-foreground/25 hover:shadow-sm transition-all">
            <div className={`flex items-start justify-between gap-4 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={isRTL ? "text-right" : ""}>
                <div className={`flex items-center gap-2 mb-1 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="font-semibold text-sm">{edu.school}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{edu.period}</span>
                </div>
                <div className="text-sm text-muted-foreground">{edu.degree}</div>
              </div>
              <div className={`flex-shrink-0 ${isRTL ? "text-left" : "text-right"}`}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t.education.gpa}</div>
                <div className="font-mono font-bold text-xl">{edu.gpa}</div>
              </div>
            </div>

            <ul className={`mt-4 space-y-1.5 ${isRTL ? "text-right" : ""}`}>
              {edu.highlights.map((h, hi) => (
                <li key={hi} className={`flex items-start gap-2.5 text-sm text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/40 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
