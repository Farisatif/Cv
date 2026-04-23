import { useState, useMemo } from "react";
import { getProjects } from "@/data/resume";
import { useLanguage } from "@/context/LanguageContext";
import { useResumeData } from "@/context/ResumeDataContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const LANG_DOT: Record<string, string> = {
  TypeScript: "#3b82f6",
  JavaScript: "#eab308",
  Python:     "#22c55e",
  Rust:       "#f97316",
  Go:         "#06b6d4",
  "Next.js":  "#a855f7",
  "C++":      "#ec4899",
  Java:       "#ef4444",
};

// ── Featured (first) project card ────────────────────────────────────────
function FeaturedCard({
  project, isRTL, lang,
}: {
  project: ReturnType<typeof getProjects>[number];
  isRTL: boolean;
  lang: "en" | "ar";
}) {
  const color = LANG_DOT[project.language];

  return (
    <a
      href={`https://${project.url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative sm:col-span-2 cosmic-card rounded-2xl p-6 flex flex-col overflow-hidden"
      style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
    >
      {/* Top accent bar — always on for featured */}
      <div className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, hsl(174 88% 52% / 0.85), hsl(316 72% 55% / 0.45), transparent)` }}
      />

      {/* Featured label */}
      <div className={`flex items-center gap-2 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[hsl(174_72%_42%/0.10)] dark:bg-[hsl(174_88%_52%/0.10)] text-[hsl(263_62%_48%)] dark:text-[hsl(174_80%_68%)] border border-[hsl(174_72%_42%/0.2)] dark:border-[hsl(174_88%_52%/0.22)]">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          {lang === "ar" ? "المشروع المميز" : "Featured"}
        </span>

        {/* Arrow — top right */}
        <div className={`${isRTL ? "mr-auto" : "ml-auto"} text-muted-foreground opacity-0 group-hover:opacity-80 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className={`flex items-start gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="w-10 h-10 rounded-xl border border-border bg-muted/40 dark:bg-[hsl(174_88%_52%/0.06)] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:border-[hsl(174_72%_42%/0.3)] dark:group-hover:border-[hsl(174_88%_52%/0.28)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-[17px] tracking-tight leading-tight">{project.name}</h3>
          {project.stars > 0 && (
            <div className={`flex items-center gap-1 mt-0.5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-yellow-500/80">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="font-mono">{project.stars.toLocaleString()}</span>
              {lang === "ar" ? "نجمة" : "stars"}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className={`text-sm text-muted-foreground leading-[1.75] mb-5 flex-1 ${isRTL ? "text-right" : ""}`}>
        {project.description}
      </p>

      {/* Tags */}
      <div className={`flex flex-wrap gap-1.5 mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
        {project.tags.map(tag => (
          <span key={tag}
            className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-border text-muted-foreground bg-muted/40 dark:bg-[hsl(174_88%_52%/0.05)] dark:border-[hsl(174_88%_52%/0.12)] uppercase tracking-wider transition-colors group-hover:border-foreground/12 dark:group-hover:border-[hsl(174_88%_52%/0.22)]">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className={`flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50 ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color || "hsl(var(--muted-foreground)/0.4)" }} />
          <span className="font-mono">{project.language}</span>
        </span>
        {project.forks > 0 && (
          <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
              <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="12" x2="12" y2="15"/>
            </svg>
            <span className="font-mono">{project.forks.toLocaleString()}</span>
          </span>
        )}
        <span className={`${isRTL ? "mr-auto" : "ml-auto"} flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-55 transition-opacity`}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          GitHub
        </span>
      </div>
    </a>
  );
}

// ── Regular project card ───────────────────────────────────────────────────
function ProjectCard({
  project, idx, isRTL, lang,
}: {
  project: ReturnType<typeof getProjects>[number];
  idx: number;
  isRTL: boolean;
  lang: "en" | "ar";
}) {
  const color = LANG_DOT[project.language];

  return (
    <a
      href={`https://${project.url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col cosmic-card project-featured rounded-2xl p-5"
      style={{ animation: `fade-up 0.5s cubic-bezier(0.16,1,0.3,1) ${idx * 55}ms both` }}
    >
      <div className={`flex items-start justify-between mb-3.5 gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-3 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-9 h-9 rounded-xl border border-border bg-muted/40 dark:bg-[hsl(174_88%_52%/0.06)] flex items-center justify-center flex-shrink-0 transition-all group-hover:border-foreground/18 dark:group-hover:border-[hsl(174_88%_52%/0.24)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-[14px] tracking-tight block truncate">{project.name}</span>
            {project.stars > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-yellow-500/70">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {project.stars.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="text-muted-foreground opacity-0 group-hover:opacity-80 transition-all duration-200 flex-shrink-0 mt-0.5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7v10"/>
          </svg>
        </div>
      </div>

      <p className={`text-sm text-muted-foreground mb-4 leading-[1.7] flex-1 line-clamp-3 ${isRTL ? "text-right" : ""}`}>
        {project.description}
      </p>

      <div className={`flex flex-wrap gap-1.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        {project.tags.map(tag => (
          <span key={tag}
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-border text-muted-foreground bg-muted/40 dark:bg-[hsl(174_88%_52%/0.05)] dark:border-[hsl(174_88%_52%/0.12)] uppercase tracking-wide transition-colors group-hover:border-foreground/12 dark:group-hover:border-[hsl(174_88%_52%/0.2)]">
            {tag}
          </span>
        ))}
      </div>

      <div className={`flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border/50 ${isRTL ? "flex-row-reverse" : ""}`}>
        <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="w-2 h-2 rounded-full" style={{ background: color || "hsl(var(--muted-foreground)/0.35)" }} />
          <span className="font-mono text-[11px]">{project.language}</span>
        </span>
        {project.forks > 0 && (
          <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
              <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="12" x2="12" y2="15"/>
            </svg>
            <span className="font-mono">{project.forks.toLocaleString()}</span>
          </span>
        )}
        <span className={`${isRTL ? "mr-auto" : "ml-auto"} flex items-center gap-1 text-[10px] opacity-0 group-hover:opacity-55 transition-opacity`}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          GitHub
        </span>
      </div>
    </a>
  );
}

// ── Section ───────────────────────────────────────────────────────────────
export default function ProjectsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const { data: resumeData } = useResumeData();
  const t = translations[lang];
  const projects = getProjects(lang, resumeData);
  const [activeTag, setActiveTag] = useState<string>("all");

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach(p => p.tags.forEach(tag => tags.add(tag)));
    return ["all", ...Array.from(tags)];
  }, [projects]);

  const filtered = useMemo(() =>
    activeTag === "all" ? projects : projects.filter(p => p.tags.includes(activeTag)),
    [projects, activeTag]
  );

  const [featured, ...rest] = filtered;

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
        <p className="text-muted-foreground text-[14.5px] mb-7 mt-2">
          {lang === "ar"
            ? `${filtered.length} مشروع${filtered.length !== projects.length ? ` من ${projects.length}` : ""}`
            : `${filtered.length} project${filtered.length !== 1 ? "s" : ""}${filtered.length !== projects.length ? ` of ${projects.length}` : ""}`}
        </p>

        {/* Tag filters — horizontal scroll on mobile, flex-wrap on desktop */}
        <div className={`hidden sm:flex flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`tag-filter ${activeTag === tag ? "active" : ""}`}
            >
              {tag === "all" ? (lang === "ar" ? "الكل" : "All") : tag}
            </button>
          ))}
        </div>
        <div className="filters-scroll sm:hidden">
          {allTags.map(tag => (
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

      {filtered.length === 0 ? (
        <div className="cosmic-card rounded-2xl p-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === "ar" ? "لا مشاريع في هذه الفئة" : "No projects in this category"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featured && <FeaturedCard project={featured} isRTL={isRTL} lang={lang} />}
          {rest.map((project, idx) => (
            <ProjectCard key={project.name} project={project} idx={idx + 1} isRTL={isRTL} lang={lang} />
          ))}
        </div>
      )}
    </section>
  );
}
