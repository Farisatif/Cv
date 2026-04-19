import { getPersonal, getSkills, getExperience, getProjects, getEducation } from "@/data/resume";

export async function downloadPDF(lang: "en" | "ar" = "en", data?: any) {
  const filename = lang === "ar" ? "السيرة-الذاتية.pdf" : "cv-resume.pdf";
  const { default: jsPDF } = await import("jspdf");

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
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = margin;

    // Helper for text
    const addText = (text: string, size: number, style: string = "normal", color: [number, number, number] = [0, 0, 0], align: "left" | "center" | "right" = "left") => {
      pdf.setFontSize(size);
      pdf.setFont("helvetica", style);
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      let xPos = margin;
      if (align === "center") xPos = pageWidth / 2;
      else if (align === "right") xPos = pageWidth - margin;
      
      pdf.text(lines, xPos, y, { align });
      y += (lines.length * size * 0.4) + 2;
    };

    const addSection = (title: string) => {
      if (y > pageHeight - 40) { pdf.addPage(); y = margin; }
      y += 5;
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      pdf.text(title.toUpperCase(), margin, y);
      y += 6;
    };

    // Header with Profile Picture
    const photoSize = 35;
    try {
      // We use the public path, in browser it will be available
      pdf.addImage("/Fares.jpg", "JPEG", pageWidth - margin - photoSize, y, photoSize, photoSize);
    } catch (e) {
      console.warn("Could not add profile picture to PDF", e);
    }

    // Name and Title
    pdf.setFontSize(26);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(personal.name, margin, y + 10);
    
    y += 18;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(80, 80, 80);
    pdf.text(personal.title, margin, y);
    
    y += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const contactInfo = `${personal.email}  |  ${personal.phone}  |  ${personal.location}`;
    pdf.text(contactInfo, margin, y);
    
    y = Math.max(y + 15, margin + photoSize + 5);

    // Experience
    if (experience.length > 0) {
      addSection(lang === "ar" ? "الخبرة العملية" : "Experience");
      experience.forEach(exp => {
        if (y > pageHeight - 30) { pdf.addPage(); y = margin; }
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${exp.role} @ ${exp.company}`, margin, y);
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(130, 130, 130);
        pdf.text(exp.period, pageWidth - margin, y, { align: "right" });
        
        y += 5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const descLines = pdf.splitTextToSize(exp.description, pageWidth - margin * 2);
        pdf.text(descLines, margin, y);
        y += (descLines.length * 4.5) + 4;
      });
    }

    // Skills
    if (skills.length > 0) {
      addSection(lang === "ar" ? "المهارات" : "Skills");
      const skillsText = skills.map(s => `${s.name}`).join("  •  ");
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(60, 60, 60);
      const skillLines = pdf.splitTextToSize(skillsText, pageWidth - margin * 2);
      pdf.text(skillLines, margin, y);
      y += (skillLines.length * 5) + 5;
    }

    // Projects
    if (projects.length > 0) {
      addSection(lang === "ar" ? "المشاريع" : "Projects");
      projects.forEach(proj => {
        if (y > pageHeight - 30) { pdf.addPage(); y = margin; }
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(proj.title, margin, y);
        y += 5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const projLines = pdf.splitTextToSize(proj.description, pageWidth - margin * 2);
        pdf.text(projLines, margin, y);
        y += (projLines.length * 4.5) + 4;
      });
    }

    // Education
    if (education.length > 0) {
      addSection(lang === "ar" ? "التعليم" : "Education");
      education.forEach(edu => {
        if (y > pageHeight - 25) { pdf.addPage(); y = margin; }
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 0, 0);
        pdf.text(edu.degree, margin, y);
        
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(130, 130, 130);
        pdf.text(edu.period, pageWidth - margin, y, { align: "right" });
        
        y += 5;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        pdf.text(edu.school, margin, y);
        y += 8;
      });
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  }
}
