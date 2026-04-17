import { useState } from "react";
import { getProjects } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANG_DOTS: Record<string, string> = {
  TypeScript: "bg-foreground",
  Python: "bg-foreground/70",
  Rust: "bg-foreground/50",
  Go: "bg-foreground/35",
};

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3"/>
      <circle cx="6" cy="6" r="3"/>
      <circle cx="18" cy="6" r="3"/>
      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/>
      <line x1="12" y1="12" x2="12" y2="15"/>
    </svg>
  );
}

export default function ProjectsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const projects = getProjects(lang, resumeData);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <section id="projects" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-20 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`mb-10 ${isRTL ? "text-right" : ""}`}>
        <div className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.projects.title}</h2>
        </div>
        <p className="text-muted-foreground text-sm">{t.projects.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project, i) => (
          <a
            key={project.name}
            href={`https://${project.url}`}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="group relative block border border-border rounded-xl bg-card p-5 card-hover hover:border-foreground/30"
            style={{
              transform: hovered === i ? "translateY(-3px)" : "translateY(0)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
              boxShadow: hovered === i ? "0 8px 30px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {/* Header */}
            <div className={`flex items-start justify-between mb-3 gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="font-mono text-sm font-semibold truncate">{project.name}</span>
              </div>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </div>

            {/* Description */}
            <p className={`text-sm text-muted-foreground mb-4 leading-relaxed line-clamp-3 break-words ${isRTL ? "text-right" : ""}`}>
              {project.description}
            </p>

            {/* Tags */}
            <div className={`flex flex-wrap gap-1.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-medium border border-border text-muted-foreground bg-muted/50">
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className={`flex items-center gap-4 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${LANG_DOTS[project.language] || "bg-foreground/40"}`} />
                {project.language}
              </span>
              <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                <StarIcon />
                {project.stars.toLocaleString()}
              </span>
              <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                <ForkIcon />
                {project.forks.toLocaleString()}
              </span>
            </div>

            {hovered === i && (
              <div className="absolute inset-0 rounded-xl pointer-events-none border border-foreground/15" />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
