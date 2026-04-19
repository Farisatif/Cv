import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
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
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

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

export type Mood = "cosmic" | "minimal" | "professional";

function SectionDivider() {
  return <div className="glow-divider" />;
}

function CVApp() {
  const [loading, setLoading] = useState(true);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cv-dark");
      if (stored !== null) return stored === "true";
      return true;
    }
    return true;
  });

  const [mood, setMood] = useState<Mood>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cv-mood") as Mood) || "cosmic";
    }
    return "cosmic";
  });

  const [manualOverride, setManualOverride] = useState(
    () => localStorage.getItem("cv-dark") !== null
  );

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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!manualOverride) setDarkMode(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [manualOverride]);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode && mood !== "professional") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    html.setAttribute("data-mood", mood);
  }, [darkMode, mood]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setManualOverride(true);
    setDarkMode(next);
    localStorage.setItem("cv-dark", String(next));
  };

  const handleSetMood = useCallback((m: Mood) => {
    setMood(m);
    localStorage.setItem("cv-mood", m);
    if (m === "professional") {
      document.documentElement.classList.remove("dark");
    } else if (darkMode) {
      document.documentElement.classList.add("dark");
    }
  }, [darkMode]);

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

        <Navbar
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
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
          {SECTIONS.projects     && <ProjectsSection />}
          {SECTIONS.achievements && <AchievementsSection />}
          {SECTIONS.education    && <EducationSection />}

          <SectionDivider />

          {SECTIONS.contact    && <ContactSection />}
          {SECTIONS.guestbook  && <CommentsSection />}
        </main>

        <Footer />
      </div>
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
