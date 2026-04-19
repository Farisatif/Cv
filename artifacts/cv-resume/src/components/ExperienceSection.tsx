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
    <section
      id="experience"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.experience.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {t.experience.subtitle}
        </h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div
          className={`absolute top-0 bottom-0 w-px hidden sm:block ${
            isRTL ? "right-[19px]" : "left-[19px]"
          }`}
          style={{
            background: "linear-gradient(to bottom, hsl(var(--foreground)/0.3), hsl(var(--border)), transparent)"
          }}
        />

        <div className="space-y-3">
          {experience.map((exp, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} className={`relative ${isRTL ? "sm:pr-12" : "sm:pl-12"}`}>
                {/* Timeline dot */}
                <div
                  className={`absolute hidden sm:block top-5 w-[10px] h-[10px] rounded-full border-2 transition-all duration-300 ${
                    isOpen
                      ? "border-foreground bg-foreground scale-125 timeline-dot-active"
                      : "border-border bg-background"
                  } ${isRTL ? "right-[15px]" : "left-[15px]"}`}
                  style={{ transform: `translateY(-50%) ${isOpen ? "scale(1.3)" : "scale(1)"}` }}
                />

                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left group"
                  aria-expanded={isOpen}
                >
                  <div className={`cosmic-card rounded-2xl overflow-hidden ${isOpen ? "glow-border" : ""}`}>
                    <div className={`px-6 py-5 flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2.5 flex-wrap mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="font-semibold text-[15px] tracking-tight">{exp.company}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono tracking-wide">
                            {exp.period}
                          </span>
                        </div>
                        <div className={`text-sm text-muted-foreground flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium text-foreground/70">{exp.role}</span>
                          <span className="text-border">·</span>
                          <span className="text-xs flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {exp.location}
                          </span>
                        </div>
                      </div>
                      <div className={`text-muted-foreground transition-all duration-300 flex-shrink-0 mt-0.5 ${
                        isOpen ? "rotate-90 text-foreground dark:text-[hsl(263_80%_68%)]" : "group-hover:text-foreground"
                      }`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    <div
                      className="overflow-hidden"
                      style={{
                        maxHeight: isOpen ? "700px" : "0px",
                        opacity: isOpen ? 1 : 0,
                        transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease"
                      }}
                    >
                      <div className={`px-6 pb-6 border-t border-border pt-5 ${isRTL ? "text-right" : ""}`}>
                        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                          {exp.description}
                        </p>
                        <ul className="space-y-2.5">
                          {exp.highlights.map((h, hi) => (
                            <li key={hi} className={`flex items-start gap-3 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className="mt-1.5 w-4 h-4 rounded flex items-center justify-center bg-foreground/8 dark:bg-[hsl(263_80%_68%/0.1)] flex-shrink-0">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                  className="dark:text-[hsl(263_80%_75%)]">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                              <span className="text-foreground/75 leading-relaxed">{h}</span>
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
