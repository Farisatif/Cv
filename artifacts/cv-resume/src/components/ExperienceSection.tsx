import { useState } from "react";
import { getExperience } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

function CompanyInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors: Record<string, string> = {
    Vercel: "bg-foreground text-background",
    Kitsys: "bg-blue-500 text-white",
    GitHub: "bg-[#1a1a1a] text-white dark:bg-[hsl(263_80%_68%/0.15)] dark:text-[hsl(263_80%_78%)]",
  };

  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 border border-border transition-all duration-300 ${colors[name] ?? "bg-muted text-foreground"}`}>
      {initials}
    </div>
  );
}

function durationLabel(period: string, lang: "en" | "ar"): string {
  const parts = period.replace("Present", String(new Date().getFullYear())).split(/\s*[–-]\s*/);
  if (parts.length < 2) return period;
  const start = parseInt(parts[0]);
  const end = parseInt(parts[1]);
  if (isNaN(start) || isNaN(end)) return period;
  const diff = end - start;
  if (diff === 0) return lang === "ar" ? "أقل من سنة" : "< 1 yr";
  return lang === "ar" ? `${diff} ${diff === 1 ? "سنة" : "سنوات"}` : `${diff} yr${diff > 1 ? "s" : ""}`;
}

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
      <div className={`mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.experience.title}</span>
        <h2 className="section-title">{t.experience.subtitle}</h2>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div
          className={`absolute top-0 bottom-0 w-px hidden sm:block ${isRTL ? "right-[19px]" : "left-[19px]"}`}
          style={{
            background: "linear-gradient(to bottom, hsl(var(--foreground)/0.2), hsl(var(--border)), transparent)",
            animation: "draw-line 1s ease-out forwards",
          }}
        />

        <div className="space-y-4">
          {experience.map((exp, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} className={`relative ${isRTL ? "sm:pr-14" : "sm:pl-14"}`} style={{ animationDelay: `${i * 100}ms` }}>
                {/* Timeline dot */}
                <div
                  className={`absolute hidden sm:flex top-5 w-[10px] h-[10px] rounded-full border-2 items-center justify-center transition-all duration-400 ${
                    isOpen
                      ? "border-foreground bg-foreground scale-125 timeline-dot-active"
                      : "border-border bg-background hover:border-foreground/40"
                  } ${isRTL ? "right-[15px]" : "left-[15px]"}`}
                  style={{ marginTop: -5 }}
                />

                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left group"
                  aria-expanded={isOpen}
                >
                  <div className={`cosmic-card rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "glow-border shadow-lg" : ""}`}>

                    {/* Header */}
                    <div className={`px-5 py-5 flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <CompanyInitials name={exp.company} />

                      <div className="flex-1 min-w-0">
                        <div className={`flex items-center gap-2 flex-wrap mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="font-bold text-[15px] tracking-tight">{exp.company}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted dark:bg-[hsl(263_80%_68%/0.08)] text-muted-foreground dark:text-[hsl(263_80%_75%)] font-mono border border-transparent dark:border-[hsl(263_80%_68%/0.12)]">
                            {exp.period}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-mono">
                            {durationLabel(exp.period, lang)}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="text-sm font-medium text-foreground/75">{exp.role}</span>
                          <span className="text-border hidden sm:block">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {exp.location}
                          </span>
                        </div>
                      </div>

                      <div className={`text-muted-foreground transition-all duration-300 flex-shrink-0 mt-1 ${
                        isOpen ? "rotate-90 text-foreground dark:text-[hsl(263_80%_68%)]" : "group-hover:text-foreground"
                      }`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <div
                      className="overflow-hidden"
                      style={{
                        maxHeight: isOpen ? "800px" : "0px",
                        opacity: isOpen ? 1 : 0,
                        transition: "max-height 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease",
                      }}
                    >
                      <div className={`px-5 pb-6 border-t border-border pt-5 ${isRTL ? "text-right" : ""}`}>
                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                          {exp.description}
                        </p>

                        {/* Key achievements label */}
                        <div className={`flex items-center gap-2 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            {lang === "ar" ? "الإنجازات الرئيسية" : "Key Achievements"}
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Highlights */}
                        <ul className="space-y-3">
                          {exp.highlights.map((h, hi) => (
                            <li key={hi} className={`flex items-start gap-3 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className={`mt-[3px] w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                                hi === 0
                                  ? "bg-foreground/10 dark:bg-[hsl(263_80%_68%/0.15)]"
                                  : "bg-foreground/6 dark:bg-[hsl(263_80%_68%/0.08)]"
                              }`}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                  className="dark:text-[hsl(263_80%_75%)] text-foreground/70">
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
