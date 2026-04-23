import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";

const QUICK_LINKS = [
  { href: "#skills",       en: "Skills",      ar: "المهارات" },
  { href: "#experience",   en: "Experience",  ar: "الخبرة" },
  { href: "#projects",     en: "Projects",    ar: "المشاريع" },
  { href: "#achievements", en: "Highlights",  ar: "الإنجازات" },
  { href: "#contact",      en: "Contact",     ar: "التواصل" },
];

export default function Footer() {
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const year = new Date().getFullYear();
  const { data } = useResumeData();
  const personal = data.personal;
  const title = personal[lang]?.title ?? "";

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="print:hidden mt-6 border-t border-border" dir={isRTL ? "rtl" : "ltr"}>
      {/* Glow line */}
      <div className="glow-divider" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">

        {/* Main footer grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10 ${isRTL ? "text-right" : ""}`}>

          {/* Brand / persona */}
          <div className={isRTL ? "sm:col-span-1 sm:order-3" : ""}>
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-9 h-9 rounded-full border-2 border-border overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-foreground/20 dark:hover:ring-[hsl(174_88%_52%/0.35)] transition-all">
                <img src="/Fares.jpg" alt={personal.name} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="font-bold text-sm leading-none mb-0.5">{personal.name}</div>
                <div className="text-[11px] text-muted-foreground">{title}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              {lang === "ar"
                ? "مطور شغوف ببناء منتجات رائعة ومشاركة المعرفة مع مجتمع المطورين."
                : "Passionate builder creating elegant software and sharing knowledge with the developer community."}
            </p>
          </div>

          {/* Quick links */}
          <div className={isRTL ? "sm:col-span-1 sm:order-2" : ""}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
              {lang === "ar" ? "روابط سريعة" : "Quick Links"}
            </h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => scrollTo(link.href)}
                    className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-[hsl(174_80%_68%)] transition-colors duration-150"
                  >
                    {lang === "ar" ? link.ar : link.en}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className={isRTL ? "sm:col-span-1 sm:order-1" : ""}>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-3">
              {lang === "ar" ? "تواصل" : "Connect"}
            </h4>
            <div className="space-y-2.5">
              {[
                { href: `https://${personal.github}`,   label: "GitHub" },
                { href: `https://${personal.linkedin}`, label: "LinkedIn" },
                { href: `mailto:${personal.email}`,     label: personal.email },
              ].map(({ href, label }) => (
                <a key={href} href={href} target={href.startsWith("mailto") ? undefined : "_blank"} rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground dark:hover:text-[hsl(174_80%_68%)] transition-colors flex items-center gap-1.5 group"
                  dir="ltr" style={{ justifyContent: isRTL ? "flex-end" : "flex-start" }}>
                  {label}
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="opacity-0 group-hover:opacity-60 transition-opacity">
                    <path d="M7 17L17 7M17 7H7M17 7v10"/>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={`border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
          <div className={`text-xs text-muted-foreground flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="font-mono">© {year}</span>
            <span className="opacity-30">·</span>
            <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
              {t.footer.builtWith}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-foreground/35 dark:text-[hsl(174_88%_52%/0.65)]">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="font-mono dark:text-[hsl(174_80%_65%/0.7)]">React + Tailwind</span>
            </span>
          </div>

          <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-xs text-muted-foreground hover:text-foreground dark:hover:text-[hsl(174_80%_68%)] transition-colors flex items-center gap-1"
            >
              {t.footer.backToTop}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>

            <span className="opacity-20 text-xs">·</span>

            <a
              href="/admin"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/admin");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="text-muted-foreground/25 hover:text-muted-foreground/60 transition-colors"
              title="Admin"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93A10 10 0 0 0 19.07 19.07"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
