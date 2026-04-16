import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function CVApp() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cv-dark");
      if (stored !== null) return stored === "true";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true;
  });
  const [manualOverride, setManualOverride] = useState(
    () => localStorage.getItem("cv-dark") !== null
  );

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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar darkMode={darkMode} onToggleDark={handleToggleDark} />
      <main id="cv-main">
        <HeroSection />
        <div className="border-t border-border/50" />
        <SkillsSection />
        <LanguagesSection />
        <ContributionGraph />
        <div className="border-t border-border/50" />
        <ExperienceSection />
        <ProjectsSection />
        <EducationSection />
        <ContactSection />
        <CommentsSection />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CVApp />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
