import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { resumeJSON } from "@/data/resume";
import { downloadPDF } from "@/lib/downloadPDF";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const { lang, setLang, isRTL } = useLanguage();
  const t = translations[lang];

  const NAV_ITEMS = [
    { label: t.nav.about,      href: "#about" },
    { label: t.nav.skills,     href: "#skills" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.projects,   href: "#projects" },
    { label: t.nav.education,  href: "#education" },
    { label: t.nav.contact,    href: "#contact" },
    { label: t.nav.guestbook,  href: "#comments" },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = NAV_ITEMS.map((item) => item.href.slice(1));
      for (const section of [...sections].reverse()) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveSection(section);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lang]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      await downloadPDF(lang);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 nav-blur print:hidden ${
        scrolled
          ? "border-b border-border bg-background/90 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Logo */}
        <a
          href="#about"
          className="flex items-center gap-2 group flex-shrink-0"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="w-7 h-7 rounded-full border border-border overflow-hidden group-hover:scale-110 transition-transform flex-shrink-0">
            <img src="/Fares.jpg" alt={resumeJSON.personal.name} className="w-full h-full object-cover object-top" />
          </div>
          <span className="text-sm font-semibold hidden sm:block">
            {resumeJSON.personal.name.split(" ")[0]}
          </span>
        </a>

        {/* Desktop Nav */}
        <ul className="hidden xl:flex items-center gap-0.5 flex-1 justify-center">
          {NAV_ITEMS.map((item) => {
            const sectionId = item.href.slice(1);
            const isActive = activeSection === sectionId;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* Right Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Language toggle — always visible */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="flex h-8 px-2.5 rounded-md items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 font-mono border border-border/50"
            aria-label="Toggle language"
          >
            {lang === "en" ? "عربي" : "EN"}
          </button>

          {/* PDF Download */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="hidden sm:flex h-8 w-8 rounded-md items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50"
            aria-label={t.nav.downloadCV}
            title={t.nav.downloadCV}
          >
            {pdfLoading ? (
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            )}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {/* Mobile menu */}
          <button
            className="xl:hidden h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <path d="M18 6 6 18M6 6l12 12"/>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="xl:hidden border-t border-border bg-background/98 nav-blur">
          <div className="max-w-5xl mx-auto px-4 py-2">
            <ul className="flex flex-col">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      setMenuOpen(false);
                      document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="block py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-2 pb-1">
              <button
                onClick={() => { setMenuOpen(false); handleDownloadPDF(); }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                {t.nav.downloadCV}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
