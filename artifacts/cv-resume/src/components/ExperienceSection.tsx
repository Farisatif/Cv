import { useState } from "react";
import { getExperience } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ExperienceSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const experience = getExperience(lang, resumeData);
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="experience" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <div className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.experience.title}</h2>
        </div>
        <p className="text-muted-foreground text-sm">{t.experience.subtitle}</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className={`absolute top-2 bottom-2 w-px bg-gradient-to-b from-foreground/40 via-border to-transparent hidden sm:block ${isRTL ? "right-[15px]" : "left-[15px]"}`} />

        <div className="space-y-4">
          {experience.map((exp, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} className={`relative transition-all duration-200 ${isRTL ? "sm:pr-10" : "sm:pl-10"}`}>
                {/* Timeline dot */}
                <div
                  className={`absolute top-5 w-[9px] h-[9px] rounded-full border-2 hidden sm:block transition-all duration-200 ${
                    isOpen ? "border-foreground bg-foreground" : "border-border bg-background"
                  } ${isRTL ? "right-0" : "left-0"}`}
                  style={{ transform: `translateY(-50%) ${isOpen ? "scale(1.25)" : "scale(1)"}` }}
                />

                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left"
                >
                  <div className={`border border-border rounded-xl bg-card overflow-hidden transition-all duration-200 card-hover ${isOpen ? "border-foreground/30 shadow-sm" : ""}`}>
                    <div className={`px-5 py-4 flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 flex-wrap mb-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="font-semibold text-sm">{exp.company}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {exp.period}
                          </span>
                        </div>
                        <div className={`text-sm text-muted-foreground flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                          {exp.role}
                          <span className="text-border">·</span>
                          <span className="text-xs">{exp.location}</span>
                        </div>
                      </div>
                      <div className={`text-muted-foreground transition-transform duration-300 flex-shrink-0 mt-0.5 ${isOpen ? "rotate-90" : ""}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? "600px" : "0px" }}
                    >
                      <div className={`px-5 pb-5 border-t border-border pt-4 ${isRTL ? "text-right" : ""}`}>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed break-words">
                          {exp.description}
                        </p>
                        <ul className="space-y-2">
                          {exp.highlights.map((h, hi) => (
                            <li key={hi} className={`flex items-start gap-2.5 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/50 flex-shrink-0" />
                              <span className="text-foreground/80">{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
