import { useState } from "react";
import { resumeData } from "@/data/resume";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ExperienceSection() {
  const sectionRef = useScrollReveal();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section id="experience" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-24 max-w-5xl mx-auto px-6">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Experience</h2>
        </div>
        <p className="text-muted-foreground text-sm">Where I've built things.</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-foreground/40 via-border to-transparent hidden sm:block" />

        <div className="space-y-4">
          {resumeData.experience.map((exp, i) => {
            const isOpen = expanded === i;
            return (
              <div
                key={i}
                className={`relative sm:pl-10 transition-all duration-200`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 top-5 w-[9px] h-[9px] rounded-full border-2 hidden sm:block transition-all duration-200 ${
                  isOpen ? "border-foreground bg-foreground scale-125" : "border-border bg-background"
                }`} style={{ transform: `translateY(-50%) ${isOpen ? "scale(1.25)" : "scale(1)"}` }} />

                <button
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left"
                >
                  <div
                    className={`border border-border rounded-xl bg-card overflow-hidden transition-all duration-200 hover:border-foreground/30 ${
                      isOpen ? "border-foreground/40 shadow-sm" : ""
                    }`}
                  >
                    {/* Header */}
                    <div className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{exp.company}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                            {exp.period}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
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

                    {/* Expandable content */}
                    <div
                      className="overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? "500px" : "0px" }}
                    >
                      <div className="px-5 pb-5 border-t border-border pt-4">
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {exp.description}
                        </p>
                        <ul className="space-y-2">
                          {exp.highlights.map((h, hi) => (
                            <li key={hi} className="flex items-start gap-2.5 text-sm">
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
