import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";
import { downloadPDF } from "@/lib/downloadPDF";
import type { Mood } from "@/App";

interface NavbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  mood: Mood;
  onSetMood: (m: Mood) => void;
}

const MOOD_OPTIONS: { value: Mood; icon: React.ReactNode; label: string; label_ar: string }[] = [
  {
    value: "cosmic",
    label: "Cosmic",
    label_ar: "كوني",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
  {
    value: "minimal",
    label: "Minimal",
    label_ar: "مينيمال",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      </svg>
    ),
  },
  {
    value: "professional",
    label: "Pro",
    label_ar: "احترافي",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
  },
];

export default function Navbar({ darkMode, onToggleDark, mood, onSetMood }: NavbarProps) {
  const { lang, setLang, isRTL } = useLanguage();
  const t = translations[lang];
  const { data } = useResumeData();
  const personalName = data?.personal?.name ?? "Fares";

  const NAV_ITEMS = [
    { label: t.nav.about,      href: "#about" },
    { label: t.nav.skills,     href: "#skills" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.projects,   href: "#projects" },
    { label: lang === "ar" ? "الإنجازات" : "Highlights", href: "#achievements" },
    { label: t.nav.education,  href: "#education" },
    { label: t.nav.contact,    href: "#contact" },
    { label: t.nav.guestbook,  href: "#comments" },
  ];

  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const moodRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (moodRef.current && !moodRef.current.contains(e.target as Node)) {
        setMoodOpen(false);
      }
    };
    if (moodOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moodOpen]);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { await downloadPDF(lang); }
    finally { setPdfLoading(false); }
  };

  const scrollTo = (href: string) => {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  };

  const currentMood = MOOD_OPTIONS.find(m => m.value === mood);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 print:hidden nav-blur transition-all duration-300 ${
          scrolled
            ? "border-b border-border dark:border-border bg-background/90 dark:bg-background/80 shadow-sm"
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
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
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

            {/* Mood switcher (Desktop) */}
            <div ref={moodRef} className="relative hidden sm:block">
              <button
                onClick={() => setMoodOpen(!moodOpen)}
                title={`Mood: ${currentMood?.label}`}
                className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border transition-all duration-200 ${
                  moodOpen
                    ? "bg-muted text-foreground border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"
                }`}
              >
                <span className="opacity-70">{currentMood?.icon}</span>
                <span className="hidden md:block text-[11px]">
                  {lang === "ar" ? currentMood?.label_ar : currentMood?.label}
                </span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {moodOpen && (
                <div
                  className={`absolute top-10 z-50 py-1 rounded-xl border border-border bg-background dark:bg-[hsl(240_28%_6%)] shadow-xl overflow-hidden min-w-[140px] ${isRTL ? "left-0" : "right-0"}`}
                  style={{ animation: "scale-in 0.15s cubic-bezier(0.16,1,0.3,1)" }}
                >
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSetMood(opt.value); setMoodOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all ${isRTL ? "flex-row-reverse text-right" : ""} ${
                        mood === opt.value
                          ? "text-foreground bg-muted dark:bg-[hsl(263_80%_68%/0.1)] dark:text-[hsl(263_80%_80%)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span>{lang === "ar" ? opt.label_ar : opt.label}</span>
                      {mood === opt.value && (
                        <svg className={`${isRTL ? "mr-auto" : "ml-auto"} opacity-60`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex h-8 px-2.5 rounded-lg items-center justify-center text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 font-mono border border-border/60"
            >
              {lang === "en" ? "عربي" : "EN"}
            </button>

            {/* Desktop Theme Toggle */}
            <button
              onClick={onToggleDark}
              className="hidden sm:flex h-8 w-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="xl:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              aria-label="Toggle menu"
            >
              <div className="w-4 flex flex-col gap-1 items-end">
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "w-4 translate-y-1.5 -rotate-45" : "w-4"}`} />
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "opacity-0" : "w-2.5"}`} />
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "w-4 -translate-y-1.5 rotate-45" : "w-3.5"}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-xl flex flex-col p-6 animate-fade-in xl:hidden"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full border border-border overflow-hidden">
                <img src="/Fares.jpg" alt={personalName} className="w-full h-full object-cover object-top" />
              </div>
              <span className="font-bold">{personalName}</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-1 mb-8">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => { e.preventDefault(); scrollTo(item.href); setMenuOpen(false); }}
                  className="px-4 py-3 rounded-xl text-lg font-medium hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <span>{item.label}</span>
                  <svg className={`opacity-0 group-hover:opacity-40 transition-opacity ${isRTL ? "rotate-180" : ""}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </a>
              ))}
            </div>

            {/* Integrated Appearance System (Theme + Mood) */}
            <div className="mb-8">
              <div className={`px-4 mb-4 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "المظهر والنظام" : "Appearance & System"}
              </div>
              
              <div className="bg-muted/40 rounded-2xl p-2 border border-border/40">
                {/* Theme Toggle in Menu */}
                <button
                  onClick={onToggleDark}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${darkMode ? "bg-background shadow-sm" : "hover:bg-muted"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {darkMode ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    )}
                  </div>
                  <div className={`flex-1 text-sm font-semibold ${isRTL ? "text-right" : "text-left"}`}>
                    {lang === "ar" ? (darkMode ? "المظهر الليلي" : "المظهر النهاري") : (darkMode ? "Dark Mode" : "Light Mode")}
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${darkMode ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isRTL ? (darkMode ? "left-1" : "left-6") : (darkMode ? "left-6" : "left-1")}`} />
                  </div>
                </button>

                <div className="h-px bg-border/40 mx-4 my-1" />

                {/* Mood Options in Menu */}
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onSetMood(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                        mood === opt.value
                          ? "bg-background text-primary shadow-sm ring-1 ring-primary/20"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className={mood === opt.value ? "text-primary" : "opacity-60"}>{opt.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">
                        {lang === "ar" ? opt.label_ar : opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-border/40">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="w-full h-12 rounded-xl bg-foreground text-background font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {pdfLoading ? (
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {t.nav.downloadCV}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
