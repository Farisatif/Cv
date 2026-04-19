import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";
import { downloadPDF } from "@/lib/downloadPDF";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({ darkMode, onToggleDark }: NavbarProps) {
  const { lang, setLang, isRTL } = useLanguage();
  const t = translations[lang];
  const { data } = useResumeData();
  const personalName = data?.personal?.name ?? "Fares";

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
      setScrolled(window.scrollY > 24);
      const sections = NAV_ITEMS.map((item) => item.href.slice(1));
      for (const section of [...sections].reverse()) {
        const el = document.getElementById(section);
        if (el && el.getBoundingClientRect().top <= 130) {
          setActiveSection(section);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lang]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await downloadPDF(lang); }
    finally { setPdfLoading(false); }
  };

  const scrollTo = (href: string) => {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 print:hidden nav-blur transition-all duration-300 ${
          scrolled
            ? "border-b border-border dark:border-border bg-background/90 dark:bg-background/80 shadow-sm dark:shadow-[0_1px_0_hsl(263_80%_68%/0.1)]"
            : "bg-transparent"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <a
            href="#about"
            className={`flex items-center gap-2.5 group flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            <div className="w-7 h-7 rounded-full border border-border overflow-hidden group-hover:ring-2 group-hover:ring-foreground/20 dark:group-hover:ring-[hsl(263_80%_68%/0.4)] transition-all flex-shrink-0">
              <img src="/Fares.jpg" alt={personalName} className="w-full h-full object-cover object-top" />
            </div>
            <span className="text-sm font-semibold hidden sm:block tracking-tight">
              {personalName.split(" ")[0]}
            </span>
          </a>

          {/* Desktop Nav */}
          <ul className={`hidden xl:flex items-center gap-0.5 flex-1 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
            {NAV_ITEMS.map((item) => {
              const sectionId = item.href.slice(1);
              const isActive = activeSection === sectionId;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(item.href); }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap relative ${
                      isActive
                        ? "bg-foreground text-background dark:bg-[hsl(263_80%_68%)] dark:text-[hsl(240_25%_3.5%)] dark:shadow-[0_0_16px_hsl(263_80%_68%/0.4)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Right actions */}
          <div className={`flex items-center gap-1 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex h-8 px-2.5 rounded-lg items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 font-mono border border-border/60 dark:border-border dark:hover:border-[hsl(263_80%_68%/0.3)] dark:hover:shadow-[0_0_10px_hsl(263_80%_68%/0.15)]"
              aria-label="Toggle language"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="hidden sm:flex h-8 w-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-40"
              aria-label={t.nav.downloadCV}
              title={t.nav.downloadCV}
            >
              {pdfLoading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
            </button>

            <button
              onClick={onToggleDark}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            <button
              className="xl:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen
                  ? <path d="M18 6 6 18M6 6l12 12"/>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 xl:hidden print:hidden" dir={isRTL ? "rtl" : "ltr"} onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-background/70 dark:bg-background/80 backdrop-blur-md" />
          <div
            className="absolute top-14 left-0 right-0 bottom-0 bg-background dark:bg-[hsl(240_28%_4%)] border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-5xl mx-auto px-4 pt-4 pb-8">
              <ul className="space-y-0.5">
                {NAV_ITEMS.map((item) => {
                  const sectionId = item.href.slice(1);
                  const isActive = activeSection === sectionId;
                  return (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          setMenuOpen(false);
                          setTimeout(() => scrollTo(item.href), 100);
                        }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all ${isRTL ? "flex-row-reverse text-right" : ""} ${
                          isActive
                            ? "bg-foreground text-background dark:bg-[hsl(263_80%_68%)] dark:text-[hsl(240_25%_3.5%)] font-semibold dark:shadow-[0_0_20px_hsl(263_80%_68%/0.3)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-border mt-4 pt-4">
                <button
                  onClick={() => { setMenuOpen(false); handleDownloadPDF(); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isRTL ? "flex-row-reverse text-right" : ""}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  {t.nav.downloadCV}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
