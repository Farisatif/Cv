import { useState } from "react";
import { getExperience } from "@/lib/resumeUtils";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// ── Company brand colours ─────────────────────────────────────────────────
const COMPANY_THEMES: Record<string, { bg: string; text: string; border: string }> = {
  Vercel:     { bg: "hsl(0 0% 6%)",            text: "hsl(0 0% 96%)",       border: "hsl(0 0% 18%)" },
  Kitsys:     { bg: "hsl(217 91% 52% / 0.12)", text: "hsl(217 80% 60%)",   border: "hsl(217 80% 60% / 0.22)" },
  GitHub:     { bg: "hsl(174 88% 52% / 0.10)", text: "hsl(174 80% 65%)",   border: "hsl(174 88% 52% / 0.20)" },
};
const DEFAULT_THEME = { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))", border: "hsl(var(--border))" };

function CompanyBadge({ name }: { name: string }) {
  const theme = COMPANY_THEMES[name] ?? DEFAULT_THEME;
  const initials = name.split(/\s+/).map(w => w[0] ?? "").join("").toUpperCase().slice(0, 2);
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      style={{ background: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
    >
      {initials}
    </div>
  );
}

function durationLabel(period: string, lang: "en" | "ar"): string {
  const parts = period.replace("Present", String(new Date().getFullYear())).split(/\s*[–-]\s*/);
  if (parts.length < 2) return period;
  const start = parseInt(parts[0]);
  const end   = parseInt(parts[1]);
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
        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md">
          {lang === "ar"
            ? "رحلة مهنية تجمع بين البناء، والتعلم، والأثر الحقيقي."
            : "A professional journey built on shipping, learning, and making an impact."}
        </p>
      </div>

      <div className="relative">
        {/* Timeline spine */}
        <div
          className={`absolute top-5 bottom-5 w-px hidden sm:block ${isRTL ? "right-[19px]" : "left-[19px]"}`}
          style={{
            background: "linear-gradient(to bottom, hsl(var(--foreground)/0.18) 0%, hsl(var(--border)) 60%, transparent 100%)",
            animation: "draw-line 1.2s cubic-bezier(0.16,1,0.3,1) forwards",
          }}
        />

        <div className="space-y-3">
          {experience.map((exp, i) => {
            const isOpen = expanded === i;
            return (
              <div key={i} className={`relative ${isRTL ? "sm:pr-14" : "sm:pl-14"}`}>

                {/* Timeline node */}
                <div
                  className={`absolute hidden sm:block top-[22px] transition-all duration-300 ${isRTL ? "right-[13px]" : "left-[13px]"}`}
                >
                  {isOpen ? (
                    <div className="w-[14px] h-[14px] rounded-full border-2 border-foreground bg-foreground timeline-dot-active dark:border-[hsl(174_88%_52%)] dark:bg-[hsl(174_88%_52%)] shadow-sm" />
                  ) : (
                    <div className="w-[10px] h-[10px] rounded-full border-2 border-border bg-background hover:border-foreground/40 transition-colors duration-200 mt-[2px]" />
                  )}
                </div>

                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left group focus-visible:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className={`cosmic-card rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? "glow-border ring-0" : ""}`}>

                    {/* Header */}
                    <div className={`px-5 py-5 flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                      <CompanyBadge name={exp.company} />

                      <div className="flex-1 min-w-0">
                        {/* Company + period */}
                        <div className={`flex items-center gap-2 flex-wrap mb-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="font-bold text-[15px] tracking-tight">{exp.company}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted dark:bg-[hsl(174_88%_52%/0.08)] text-muted-foreground dark:text-[hsl(174_80%_66%)] font-mono border border-transparent dark:border-[hsl(174_88%_52%/0.12)]">
                            {exp.period}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground font-medium">
                            {durationLabel(exp.period, lang)}
                          </span>
                        </div>
                        {/* Role + location */}
                        <div className={`flex items-center gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="text-sm font-semibold text-foreground/80">{exp.role}</span>
                          <span className="hidden sm:block text-border">·</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            {exp.location}
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className={`text-muted-foreground transition-all duration-300 flex-shrink-0 mt-1 ${
                        isOpen ? "rotate-90 text-foreground dark:text-[hsl(174_88%_52%)]" : "group-hover:text-foreground"
                      }`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    </div>

                    {/* Expandable body */}
                    <div
                      className="overflow-hidden"
                      style={{
                        maxHeight: isOpen ? "900px" : "0px",
                        opacity: isOpen ? 1 : 0,
                        transition: "max-height 0.48s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease",
                      }}
                    >
                      <div className={`px-5 pb-6 border-t border-border/60 pt-5 ${isRTL ? "text-right" : ""}`}>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground mb-6 leading-[1.75]">
                          {exp.description}
                        </p>

                        {/* Key achievements header */}
                        <div className={`flex items-center gap-2 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                            {lang === "ar" ? "أبرز الإنجازات" : "Key Achievements"}
                          </span>
                          <div className="flex-1 h-px bg-border/50" />
                        </div>

                        {/* Highlights list */}
                        <ul className="space-y-3.5">
                          {exp.highlights.map((h, hi) => (
                            <li key={hi} className={`flex items-start gap-3 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
                              <span className={`mt-[2px] w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 ${
                                hi === 0
                                  ? "bg-foreground/10 dark:bg-[hsl(174_88%_52%/0.14)]"
                                  : "bg-foreground/6 dark:bg-[hsl(174_88%_52%/0.07)]"
                              }`}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                  className="dark:text-[hsl(174_80%_66%)] text-foreground/65">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </span>
                              <span className="text-foreground/75 leading-[1.65]">{h}</span>
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
