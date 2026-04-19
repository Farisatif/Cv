import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { ResumeDataProvider } from "@/context/ResumeDataContext";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SkillsSection from "@/components/SkillsSection";
import LanguagesSection from "@/components/LanguagesSection";
import ContributionGraph from "@/components/ContributionGraph";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import EducationSection from "@/components/EducationSection";
import ContactSection from "@/components/ContactSection";
import CommentsSection from "@/components/CommentsSection";
import Footer from "@/components/Footer";
import AdminLogin from "@/pages/AdminLogin";
import AdminPanel from "@/pages/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// ─── SECTION VISIBILITY ────────────────────────────────────────────────────
// To remove a section cleanly, set its value to false.
// The layout adapts automatically — no broken spacing or gaps.
const SECTIONS = {
  skills:        true,
  languages:     true,
  contributions: true,
  experience:    true,
  projects:      true,
  education:     true,
  contact:       true,
  guestbook:     true,
} as const;
// ──────────────────────────────────────────────────────────────────────────

function CVApp() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cv-dark");
      if (stored !== null) return stored === "true";
      // default: dark (cosmic atmosphere)
      return true;
    }
    return true;
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
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const handleToggleDark = () => {
    const next = !darkMode;
    setManualOverride(true);
    setDarkMode(next);
    localStorage.setItem("cv-dark", String(next));
  };

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
    <div className="min-h-screen bg-background text-foreground transition-colors duration-400">
      <Navbar darkMode={darkMode} onToggleDark={handleToggleDark} />

      <main id="cv-main">
        <HeroSection />

        {(SECTIONS.skills || SECTIONS.languages || SECTIONS.contributions) && (
          <div className="glow-divider" />
        )}

        {SECTIONS.skills        && <SkillsSection />}
        {SECTIONS.languages     && <LanguagesSection />}
        {SECTIONS.contributions && <ContributionGraph />}

        {(SECTIONS.experience || SECTIONS.projects || SECTIONS.education) && (
          <div className="glow-divider" />
        )}

        {SECTIONS.experience && <ExperienceSection />}
        {SECTIONS.projects   && <ProjectsSection />}
        {SECTIONS.education  && <EducationSection />}
        {SECTIONS.contact    && <ContactSection />}
        {SECTIONS.guestbook  && <CommentsSection />}
      </main>

      <Footer />
    </div>
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
