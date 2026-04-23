import { useState, useEffect, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { ResumeDataProvider } from "@/context/ResumeDataContext";
import Navbar from "@/components/Navbar";
import FloatingLanguageParticles from "@/components/FloatingLanguageParticles";
import HeroSection from "@/components/HeroSection";
import FeaturedImpact from "@/components/FeaturedImpact";
import SkillsSection from "@/components/SkillsSection";
import LanguagesSection from "@/components/LanguagesSection";
import ContributionGraph from "@/components/ContributionGraph";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import EducationSection from "@/components/EducationSection";
import AchievementsSection from "@/components/AchievementsSection";
import ContactSection from "@/components/ContactSection";
import CommentsSection from "@/components/CommentsSection";
import Footer from "@/components/Footer";
import LoadingScreen from "@/components/LoadingScreen";
import ScrollProgress from "@/components/ScrollProgress";
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function BackToTop({ isRTL }: { isRTL: boolean }) {
  const [visible, setVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      ref={btnRef}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      data-rtl={isRTL ? "true" : undefined}
      className="fab-top print:hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    </button>
  );
}

// ─── SECTION VISIBILITY ─────────────────────────────────────────────
const SECTIONS = {
  impact:        true,
  skills:        true,
  languages:     true,
  contributions: true,
  experience:    true,
  projects:      true,
  achievements:  true,
  education:     true,
  contact:       true,
  guestbook:     true,
} as const;
// ────────────────────────────────────────────────────────────────────

export type Mood = "dark" | "light";

function SectionDivider() {
  return (
    <div className="px-4 sm:px-6 my-1">
      <div className="section-bridge" />
    </div>
  );
}

function CVApp() {
  const { isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);

  // Initialize mood based on system preference or stored value
  const [mood, setMood] = useState<Mood>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cv-mood") as Mood | null;
      if (stored === "dark" || stored === "light") return stored;
      // Detect system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return prefersDark ? "dark" : "light";
    }
    return "dark";
  });

  const [adminView, setAdminView] = useState<"cv" | "login" | "panel">(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.includes("admin")) {
        return sessionStorage.getItem("cv-admin") === "1" ? "panel" : "login";
      }
    }
    return "cv";
  });

  useEffect(() => {
    const handleNav = () => {
      const path = window.location.pathname;
      if (path.includes("admin")) {
        setAdminView(sessionStorage.getItem("cv-admin") === "1" ? "panel" : "login");
      } else {
        setAdminView("cv");
      }
    };
    window.addEventListener("popstate", handleNav);
    return () => window.removeEventListener("popstate", handleNav);
  }, []);

  // Listen for system preference changes and update mood if not manually set
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("cv-mood");
      // Only update if user hasn't manually selected a mood
      if (!stored) {
        setMood(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Apply mood to document
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark");
    if (mood === "dark") {
      html.classList.add("dark");
    }
    html.setAttribute("data-mood", mood);
  }, [mood]);

  const handleSetMood = useCallback((m: Mood) => {
    setMood(m);
    localStorage.setItem("cv-mood", m);
  }, []);

  if (adminView === "login") {
    return <AdminLogin onLogin={() => setAdminView("panel")} />;
  }

  if (adminView === "panel") {
    return (
      <AdminPanel
        onLogout={() => {
          window.history.pushState({}, "", "/");
          setAdminView("cv");
        }}
      />
    );
  }

  return (
    <>
      {loading && <LoadingScreen onDone={() => setLoading(false)} />}

      <div
        className="min-h-screen bg-background text-foreground"
        style={{ opacity: loading ? 0 : 1, transition: "opacity 0.7s ease", position: "relative" }}
      >
        {/* Fixed background particle layer — behind all content */}
        <FloatingLanguageParticles />

        {/* Top scroll-progress bar */}
        <ScrollProgress />

        <Navbar
          mood={mood}
          onSetMood={handleSetMood}
        />

        <main id="cv-main" style={{ position: "relative", zIndex: 1 }}>
          <HeroSection />

          {SECTIONS.impact && <FeaturedImpact />}

          <SectionDivider />

          {SECTIONS.skills        && <SkillsSection />}
          {SECTIONS.languages     && <LanguagesSection />}
          {SECTIONS.contributions && <ContributionGraph />}

          <SectionDivider />

          {SECTIONS.experience   && <ExperienceSection />}

          <SectionDivider />

          {SECTIONS.projects     && <ProjectsSection />}

          <SectionDivider />

          {SECTIONS.achievements && <AchievementsSection />}
          {SECTIONS.education    && <EducationSection />}

          <SectionDivider />

          {SECTIONS.contact    && <ContactSection />}
          {SECTIONS.guestbook  && <CommentsSection />}
        </main>

        <Footer />
      </div>

      <BackToTop isRTL={isRTL} />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ResumeDataProvider>
          <CVApp />
        </ResumeDataProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
