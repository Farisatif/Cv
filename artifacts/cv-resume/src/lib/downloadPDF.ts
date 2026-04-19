import { getPersonal, getSkills, getExperience, getProjects, getEducation } from "@/data/resume";

export async function downloadPDF(lang: "en" | "ar" = "en", data?: any) {
  const filename = lang === "ar" ? "السيرة-الذاتية.pdf" : "cv-resume.pdf";

  const { default: jsPDF } = await import("jspdf");

  // If data is not provided, we try to get it from the window or fallback to a default
  // In a real app, this should be passed from the component
  const resumeData = data || (window as any).__RESUME_DATA__;

  if (!resumeData) {
    console.error("No resume data found for PDF generation");
    window.print();
    return;
  }

  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const personal = getPersonal(lang, resumeData);
    const skills = getSkills(resumeData);
    const experience = getExperience(lang, resumeData);
    const projects = getProjects(lang, resumeData);
    const education = getEducation(lang, resumeData);

    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = margin;

    // Helper for text
    const addText = (text: string, size: number, style: string = "normal", color: [number, number, number] = [0, 0, 0]) => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", style);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      pdf.text(lines, margin, y);
      y += (lines.length * size * 0.5) + 2;
    };

    const addSection = (title: string) => {
      y += 5;
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 7;
      addText(title.toUpperCase(), 12, "bold", [60, 60, 60]);
      y += 2;
    };

    // Header
    addText(personal.name, 24, "bold", [0, 0, 0]);
    addText(personal.title, 14, "normal", [100, 100, 100]);
    addText(`${personal.email} | ${personal.phone} | ${personal.location}`, 10, "normal", [100, 100, 100]);
    
    // Experience
    if (experience.length > 0) {
      addSection(lang === "ar" ? "الخبرة العملية" : "Experience");
      experience.forEach(exp => {
        if (y > 260) { pdf.addPage(); y = margin; }
        addText(`${exp.role} @ ${exp.company}`, 11, "bold");
        addText(exp.period, 9, "italic", [120, 120, 120]);
        addText(exp.description, 10);
        y += 3;
      });
    }

    // Skills
    if (skills.length > 0) {
      addSection(lang === "ar" ? "المهارات" : "Skills");
      const skillsText = skills.map(s => `${s.name} (${s.level}%)`).join(", ");
      addText(skillsText, 10);
    }

    // Projects
    if (projects.length > 0) {
      addSection(lang === "ar" ? "المشاريع" : "Projects");
      projects.forEach(proj => {
        if (y > 260) { pdf.addPage(); y = margin; }
        addText(proj.title, 11, "bold");
        addText(proj.description, 10);
        y += 2;
      });
    }

    // Education
    if (education.length > 0) {
      addSection(lang === "ar" ? "التعليم" : "Education");
      education.forEach(edu => {
        if (y > 260) { pdf.addPage(); y = margin; }
        addText(edu.degree, 11, "bold");
        addText(`${edu.school} | ${edu.period}`, 10);
        y += 2;
      });
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  }
}
