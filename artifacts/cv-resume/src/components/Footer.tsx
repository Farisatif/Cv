import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";

export default function Footer() {
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const year = new Date().getFullYear();
  const { data } = useResumeData();
  const personal = data.personal;
  const title = personal[lang].title;

  return (
    <footer className="border-t border-border py-8 max-w-5xl mx-auto px-4 sm:px-6 print:hidden">
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-background text-[9px] font-bold font-mono">
            {personal.name.charAt(0)}
          </div>
          <span className="text-sm font-medium">{personal.name}</span>
          <span className="text-border">·</span>
          <span className="text-xs text-muted-foreground font-mono">{title}</span>
        </div>

        <div className={`flex items-center gap-4 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
          <span>© {year}</span>
          <span className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>{t.footer.builtWith}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-foreground/60">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>React + TypeScript</span>
          </span>
          <a
            href="#about"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="hover:text-foreground transition-colors"
          >
            {t.footer.backToTop}
          </a>
          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="hover:text-foreground transition-colors opacity-40 hover:opacity-100"
            title="Admin"
          >
            ⚙
          </a>
        </div>
      </div>
    </footer>
  );
}
