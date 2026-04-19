import { useState, useMemo } from "react";
import { getProjects } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANG_DOT: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-400",
  Rust: "bg-orange-400",
  Go: "bg-cyan-400",
  Nextjs: "bg-purple-500",
  "C++": "bg-pink-400",
  Java: "bg-red-400",
};

export default function ProjectsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const projects = getProjects(lang, resumeData);
  const [activeTag, setActiveTag] = useState<string>("all");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags.forEach((tag) => tags.add(tag)));
    return ["all", ...Array.from(tags)];
  }, [projects]);

  const filtered = useMemo(() =>
    activeTag === "all" ? projects : projects.filter((p) => p.tags.includes(activeTag)),
    [projects, activeTag]
  );

  return (
    <section
      id="projects"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.projects.title}</span>
        <h2 className="section-title mb-2">{t.projects.subtitle}</h2>
        <p className="text-muted-foreground text-[14px] mb-7">
          {lang === "ar"
            ? `${filtered.length} مشروع${filtered.length !== projects.length ? ` من ${projects.length}` : ""}`
            : `${filtered.length} project${filtered.length !== 1 ? "s" : ""}${filtered.length !== projects.length ? ` of ${projects.length}` : ""}`}
        </p>

        {/* Tag filters */}
        <div className={`flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`tag-filter ${activeTag === tag ? "active" : ""}`}
            >
              {tag === "all" ? (lang === "ar" ? "الكل" : "All") : tag}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((project, idx) => {
          const isFeatured = project.stars > 100 || idx === 0;
          return (
            <a
              key={project.name}
              href={`https://${project.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col cosmic-card project-featured rounded-2xl p-5 ${isFeatured && idx === 0 ? "sm:col-span-2" : ""}`}
              style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 60}ms both` }}
            >
              <div className={`flex items-start justify-between mb-4 gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className={`flex items-center gap-3 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <div className="w-9 h-9 rounded-xl border border-border bg-muted/50 dark:bg-[hsl(263_80%_68%/0.06)] flex items-center justify-center flex-shrink-0 transition-all group-hover:border-foreground/20 dark:group-hover:border-[hsl(263_80%_68%/0.25)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[14px] tracking-tight block truncate">{project.name}</span>
                    {isFeatured && project.stars > 0 && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {project.stars.toLocaleString()} {lang === "ar" ? "نجمة" : "stars"}
                      </span>
                    )}
                  </div>
                </div>
                {/* Arrow icon */}
                <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 mt-1 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </div>
              </div>

              <p className={`text-sm text-muted-foreground mb-4 leading-relaxed flex-1 ${idx === 0 ? "line-clamp-4" : "line-clamp-3"} ${isRTL ? "text-right" : ""}`}>
                {project.description}
              </p>

              {/* Tags */}
              <div className={`flex flex-wrap gap-1.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-border text-muted-foreground bg-muted/40 dark:bg-[hsl(263_80%_68%/0.05)] dark:border-[hsl(263_80%_68%/0.12)] transition-colors group-hover:border-foreground/12 dark:group-hover:border-[hsl(263_80%_68%/0.2)] uppercase tracking-wider`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer stats */}
              <div className={`flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`w-2 h-2 rounded-full ${LANG_DOT[project.language] || "bg-foreground/30"}`} />
                  <span className="font-mono text-[11px]">{project.language}</span>
                </span>
                {project.stars > 0 && (
                  <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-yellow-500/80">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    <span className="font-mono">{project.stars.toLocaleString()}</span>
                  </span>
                )}
                {project.forks > 0 && (
                  <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                      <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/>
                      <line x1="12" y1="12" x2="12" y2="15"/>
                    </svg>
                    <span className="font-mono">{project.forks.toLocaleString()}</span>
                  </span>
                )}
                {/* External link indicator */}
                <span className={`ml-auto flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-60 transition-opacity ${isRTL ? "mr-auto ml-0 flex-row-reverse" : ""}`}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  GitHub
                </span>
              </div>
            </a>
          );
        })}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 cosmic-card rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "لا مشاريع في هذه الفئة" : "No projects in this category"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
