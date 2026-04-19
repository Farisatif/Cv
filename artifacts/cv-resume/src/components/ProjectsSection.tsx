import { useState, useMemo } from "react";
import { getProjects } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANG_COLOR: Record<string, string> = {
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-400",
  Rust: "bg-orange-400",
  Go: "bg-cyan-400",
  Nextjs: "bg-foreground",
};

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7M17 7H7M17 7v10" />
    </svg>
  );
}

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
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.projects.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6">
          {t.projects.subtitle}
        </h2>

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
        {filtered.map((project) => (
          <a
            key={project.name}
            href={`https://${project.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col border border-border rounded-2xl bg-card p-5 card-hover hover:border-foreground/20 transition-all"
          >
            <div className={`flex items-start justify-between mb-3 gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className={`flex items-center gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="font-semibold text-sm tracking-tight">{project.name}</span>
              </div>
              <div className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowIcon />
              </div>
            </div>

            <p className={`text-sm text-muted-foreground mb-4 leading-relaxed flex-1 line-clamp-3 ${isRTL ? "text-right" : ""}`}>
              {project.description}
            </p>

            <div className={`flex flex-wrap gap-1.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border text-muted-foreground bg-muted/50"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className={`flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/60 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className={`w-2 h-2 rounded-full ${LANG_COLOR[project.language] || "bg-foreground/40"}`} />
                <span className="font-mono text-[11px]">{project.language}</span>
              </span>
              <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-mono">{project.stars.toLocaleString()}</span>
              </span>
              <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                  <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/>
                  <line x1="12" y1="12" x2="12" y2="15"/>
                </svg>
                <span className="font-mono">{project.forks.toLocaleString()}</span>
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
