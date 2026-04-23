import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useResumeData } from "@/context/ResumeDataContext";
import { downloadPDF } from "@/lib/downloadPDF";
import type { Mood } from "@/App";

interface NavbarProps {
  mood: Mood;
  onSetMood: (m: Mood) => void;
}

function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const update = () => {
      const bar = barRef.current;
      if (!bar) return;
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${total > 0 ? Math.min(1, scrolled / total) : 0})`;
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div
      ref={barRef}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "linear-gradient(90deg, hsl(174 88% 52%), hsl(199 94% 58%), hsl(155 80% 50%))",
        transformOrigin: "left",
        transform: "scaleX(0)",
        willChange: "transform",
        opacity: 0.75,
        pointerEvents: "none",
      }}
    />
  );
}

const MOOD_OPTIONS: { value: Mood; icon: React.ReactNode; label: string; label_ar: string }[] = [
  {
    value: "cosmic",
    label: "Cosmic",
    label_ar: "كوني",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12"/>
        <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" opacity="0.9"/>
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Night",
    label_ar: "ليل",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
  },
  {
    value: "light",
    label: "Light",
    label_ar: "نهار",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    ),
  },
];

// Globe icon SVG (language toggle)
function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

export default function Navbar({ mood, onSetMood }: NavbarProps) {
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
    try { await downloadPDF(lang, data); }
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
        style={{ position: "fixed" }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <ScrollProgress />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          {/* Logo */}
          <a
            href="#about"
            className={`flex items-center gap-2.5 group flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          >
            <div className="w-7 h-7 rounded-full border border-border overflow-hidden group-hover:ring-2 group-hover:ring-foreground/20 dark:group-hover:ring-[hsl(174_88%_52%/0.35)] transition-all flex-shrink-0">
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
                        ? "bg-foreground text-background dark:bg-[hsl(174_88%_52%)] dark:text-[hsl(215_55%_3%)] dark:shadow-[0_0_16px_hsl(174_88%_52%/0.35)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Right actions — NO flex-row-reverse; dir="rtl" on parent handles layout */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* Mood switcher (Desktop) */}
            <div ref={moodRef} className="relative hidden sm:block">
              <button
                onClick={() => setMoodOpen(!moodOpen)}
                title={`Theme: ${currentMood?.label}`}
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
                  className={`absolute top-10 z-50 py-1 rounded-xl border border-border bg-background dark:bg-[hsl(215_50%_5%)] shadow-xl overflow-hidden min-w-[140px] ${isRTL ? "right-0" : "right-0"}`}
                  style={{ animation: "scale-in 0.15s cubic-bezier(0.16,1,0.3,1)" }}
                >
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSetMood(opt.value); setMoodOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all ${isRTL ? "flex-row-reverse text-right" : ""} ${
                        mood === opt.value
                          ? "text-foreground bg-muted dark:bg-[hsl(174_88%_52%/0.10)] dark:text-[hsl(174_80%_68%)]"
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

            {/* Language toggle — Globe icon + language abbr */}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              title={lang === "en" ? "التبديل للعربية" : "Switch to English"}
              className="flex h-8 w-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 border border-border/60 relative group"
            >
              <GlobeIcon />
              {/* Language badge */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-foreground text-background text-[7px] font-black flex items-center justify-center leading-none pointer-events-none select-none">
                {lang === "en" ? "ع" : "E"}
              </span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="xl:hidden h-10 w-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all bg-muted/20"
              aria-label="Toggle menu"
            >
              <div className="w-5 flex flex-col gap-1.5">
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "w-5 translate-y-2 -rotate-45" : "w-5"}`} />
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "w-0 opacity-0" : "w-4"}`} />
                <span className={`h-0.5 bg-current transition-all duration-300 ${menuOpen ? "w-5 -translate-y-2 rotate-45" : "w-3"}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Side Drawer Effect */}
      <div
        className={`fixed inset-0 z-[60] transition-all duration-500 xl:hidden ${menuOpen ? "visible" : "invisible"}`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-500 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Drawer Content */}
        <div
          className={`absolute top-0 bottom-0 w-[85%] max-w-[360px] bg-background border-border shadow-2xl transition-transform duration-500 ease-out flex flex-col ${
            isRTL 
              ? `left-0 border-r ${menuOpen ? "translate-x-0" : "-translate-x-full"}` 
              : `right-0 border-l ${menuOpen ? "translate-x-0" : "translate-x-full"}`
          }`}
        >
          <div className={`p-6 flex items-center justify-between border-b border-border/40 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-10 h-10 rounded-full border border-border overflow-hidden ring-2 ring-primary/10">
                <img src="/Fares.jpg" alt={personalName} className="w-full h-full object-cover object-top" />
              </div>
              <div className={isRTL ? "text-right" : ""}>
                <span className="block font-bold text-base">{personalName}</span>
                <span className="block text-[10px] text-muted-foreground uppercase tracking-widest">
                  {lang === "ar" ? "مطور متكامل" : "Full Stack Developer"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="h-10 w-10 rounded-full bg-muted/40 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-4">
            <div className="space-y-1 mb-8">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.href.slice(1);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); scrollTo(item.href); setMenuOpen(false); }}
                    className={`px-4 py-3.5 rounded-2xl text-base font-medium transition-all flex items-center justify-between group ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    } ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <span>{item.label}</span>
                    <svg 
                      className={`transition-all duration-300 ${isActive ? "opacity-100" : "opacity-0"} ${isRTL ? "rotate-180" : ""}`} 
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </a>
                );
              })}
            </div>

            {/* Appearance */}
            <div className="mb-8">
              <div className={`px-4 mb-4 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "اختر المظهر" : "Choose Theme"}
              </div>
              
              <div className="bg-muted/30 rounded-3xl p-3 border border-border/40 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onSetMood(opt.value)}
                      className={`flex flex-col items-center gap-2.5 p-3.5 rounded-2xl transition-all border ${
                        mood === opt.value
                          ? "bg-background border-primary/30 text-primary shadow-md ring-1 ring-primary/10"
                          : "bg-background/20 border-transparent text-muted-foreground hover:bg-background/40"
                      }`}
                    >
                      <span className={`transition-transform duration-300 ${mood === opt.value ? "scale-110 text-primary" : "opacity-60"}`}>{opt.icon}</span>
                      <span className="text-[10px] font-bold uppercase tracking-tight">
                        {lang === "ar" ? opt.label_ar : opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Language switcher in drawer */}
            <div className="mb-4">
              <div className={`px-4 mb-3 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "اللغة" : "Language"}
              </div>
              <button
                onClick={() => { setLang(lang === "en" ? "ar" : "en"); setMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-muted/30 border border-border/40 text-sm font-medium hover:bg-muted/50 transition-all ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <GlobeIcon />
                <span>{lang === "en" ? "التبديل إلى العربية" : "Switch to English"}</span>
              </button>
            </div>
          </div>

          <div className="p-6 border-t border-border/40 bg-muted/10">
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className={`w-full h-14 rounded-2xl bg-foreground text-background font-bold flex items-center justify-center gap-3 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {pdfLoading ? (
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {t.nav.downloadCV}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
