import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";

export default function Footer() {
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const year = new Date().getFullYear();
  const { data } = useResumeData();
  const personal = data.personal;
  const title = personal[lang]?.title ?? "";

  return (
    <footer className="border-t border-border py-10 max-w-5xl mx-auto px-4 sm:px-6 print:hidden" dir={isRTL ? "rtl" : "ltr"}>
      <div className={`flex flex-col sm:flex-row items-center justify-between gap-6 ${isRTL ? "sm:flex-row-reverse" : ""}`}>
        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <div className="w-7 h-7 rounded-full overflow-hidden border border-border flex-shrink-0">
            <img src="/Fares.jpg" alt={personal.name} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none mb-0.5">{personal.name}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{title}</div>
          </div>
        </div>

        <div className={`flex items-center gap-5 text-xs text-muted-foreground ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className="font-mono">© {year}</span>

          <span className={`flex items-center gap-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <span>{t.footer.builtWith}</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-foreground/50">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="font-mono">React + TS</span>
          </span>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            {t.footer.backToTop}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>

          <a
            href="/admin"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/admin");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="hover:text-foreground transition-colors opacity-30 hover:opacity-80"
            title="Admin"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93A10 10 0 0 0 4.93 19.07M4.93 4.93A10 10 0 0 0 19.07 19.07"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
