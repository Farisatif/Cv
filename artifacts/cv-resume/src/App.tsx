import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SkillsSection from "@/components/SkillsSection";
import LanguagesSection from "@/components/LanguagesSection";
import ContributionGraph from "@/components/ContributionGraph";
import ExperienceSection from "@/components/ExperienceSection";
import ProjectsSection from "@/components/ProjectsSection";
import EducationSection from "@/components/EducationSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen bg-background text-foreground`}>
      <Navbar darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />

      <main>
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
      </main>

      <Footer />
    </div>
  );
}

export default App;
