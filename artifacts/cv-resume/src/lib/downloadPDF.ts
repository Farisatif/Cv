import { getPersonal, getSkills, getExperience, getProjects, getEducation } from "@/lib/resumeUtils";

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
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const personal    = getPersonal(lang, resumeData);
    const skills      = getSkills(lang, resumeData);
    const experience  = getExperience(lang, resumeData);
    const projects    = getProjects(lang, resumeData);
    const education   = getEducation(lang, resumeData);
    const achievements = (resumeData.achievements ?? []) as any[];
    const languages   = (resumeData.languages ?? []) as { name: string; percent: number }[];

    const PW   = pdf.internal.pageSize.getWidth();
    const PH   = pdf.internal.pageSize.getHeight();
    const ML   = 18;
    const MR   = 18;
    const CW   = PW - ML - MR;
    let y      = ML;

    const clamp = (t: string, maxW: number): string[] =>
      pdf.splitTextToSize(t || "", maxW);

    const nextPage = () => { pdf.addPage(); y = ML; };
    const guard = (need: number) => { if (y + need > PH - ML) nextPage(); };

    const setColor = (r: number, g: number, b: number) =>
      pdf.setTextColor(r, g, b);

    const line = (yy: number) => {
      pdf.setDrawColor(210, 210, 220);
      pdf.setLineWidth(0.3);
      pdf.line(ML, yy, PW - MR, yy);
    };

    const section = (title: string) => {
      guard(16);
      y += 5;
      line(y);
      y += 6;
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      setColor(80, 40, 180);
      pdf.text(title.toUpperCase(), ML, y, { charSpace: 1.5 });
      y += 6;
      setColor(0, 0, 0);
    };

    // ── HEADER ────────────────────────────────────────────────────────────
    const photoSize = 32;
    try {
      // Fetch the image as blob for jsPDF compatibility
      const res = await fetch("/Fares.jpg");
      const blob = await res.blob();
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      pdf.addImage(dataUrl, "JPEG", PW - MR - photoSize, y, photoSize, photoSize, undefined, "FAST");
    } catch { /* no photo */ }

    // Name
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    setColor(20, 10, 60);
    pdf.text(personal.name || "", ML, y + 10);

    // Title
    y += 15;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    setColor(100, 60, 200);
    pdf.text(personal.title || "", ML, y);

    // Contact row
    y += 7;
    pdf.setFontSize(8.5);
    setColor(90, 90, 100);
    const contactParts = [
      personal.email,
      personal.phone,
      personal.location,
      ...(personal.github ? [personal.github.replace("https://", "")] : []),
    ].filter(Boolean);
    const contactRow = clamp(contactParts.join("   ·   "), CW - photoSize - 8);
    pdf.text(contactRow, ML, y);
    y += contactRow.length * 4.5;

    y = Math.max(y + 8, ML + photoSize + 6);

    // Summary / tagline
    if (personal.summary || personal.bio) {
      const bio = clamp((personal.summary || personal.bio || ""), CW);
      pdf.setFontSize(9.5);
      setColor(50, 50, 60);
      pdf.setFont("helvetica", "normal");
      pdf.text(bio, ML, y);
      y += bio.length * 4.5 + 4;
    }

    // ── EXPERIENCE ────────────────────────────────────────────────────────
    if (experience.length) {
      section(lang === "ar" ? "الخبرة العملية" : "Work Experience");
      experience.forEach((exp: any) => {
        guard(20);
        pdf.setFontSize(10.5);
        pdf.setFont("helvetica", "bold");
        setColor(20, 10, 60);
        pdf.text(`${exp.role}`, ML, y);

        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "italic");
        setColor(120, 100, 180);
        pdf.text(exp.period || "", PW - MR, y, { align: "right" });

        y += 5;
        pdf.setFont("helvetica", "normal");
        setColor(80, 60, 150);
        pdf.text(exp.company || "", ML, y);

        y += 5;
        pdf.setFontSize(9);
        setColor(55, 55, 65);
        const desc = clamp(exp.description || "", CW);
        pdf.text(desc, ML, y);
        y += desc.length * 4.2 + 2;

        // Highlights
        if (Array.isArray(exp.highlights)) {
          exp.highlights.slice(0, 3).forEach((h: string) => {
            guard(6);
            pdf.setFontSize(8.5);
            setColor(70, 70, 80);
            const hLines = clamp(`• ${h}`, CW - 5);
            pdf.text(hLines, ML + 3, y);
            y += hLines.length * 4 + 1;
          });
        }
        y += 4;
      });
    }

    // ── SKILLS ────────────────────────────────────────────────────────────
    if (skills.length) {
      section(lang === "ar" ? "المهارات التقنية" : "Technical Skills");
      // Group by category
      const catMap = new Map<string, string[]>();
      skills.forEach((s: any) => {
        if (!catMap.has(s.category)) catMap.set(s.category, []);
        catMap.get(s.category)!.push(s.name);
      });
      catMap.forEach((names, cat) => {
        guard(8);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        setColor(80, 40, 180);
        pdf.text(`${cat}:`, ML, y);
        pdf.setFont("helvetica", "normal");
        setColor(50, 50, 65);
        const skillStr = clamp(names.join(", "), CW - 28);
        pdf.text(skillStr, ML + 28, y);
        y += Math.max(skillStr.length * 4.2, 5) + 1;
      });
      y += 3;
    }

    // ── PROJECTS ──────────────────────────────────────────────────────────
    if (projects.length) {
      section(lang === "ar" ? "المشاريع" : "Projects");
      projects.slice(0, 5).forEach((proj: any) => {
        guard(18);
        pdf.setFontSize(10.5);
        pdf.setFont("helvetica", "bold");
        setColor(20, 10, 60);
        pdf.text(proj.title || "", ML, y);

        if (proj.url || proj.link) {
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "normal");
          setColor(100, 60, 200);
          const url = (proj.url || proj.link || "").replace("https://", "");
          pdf.text(url, PW - MR, y, { align: "right" });
        }
        y += 5;

        pdf.setFontSize(9);
        setColor(55, 55, 65);
        const desc = clamp(proj.description || "", CW);
        pdf.text(desc, ML, y);
        y += desc.length * 4.2;

        if (Array.isArray(proj.tags) && proj.tags.length) {
          pdf.setFontSize(8);
          setColor(120, 90, 180);
          pdf.text(`[${proj.tags.join(", ")}]`, ML, y);
          y += 5;
        }
        y += 3;
      });
    }

    // ── EDUCATION ─────────────────────────────────────────────────────────
    if (education.length) {
      section(lang === "ar" ? "التعليم" : "Education");
      education.forEach((edu: any) => {
        guard(16);
        pdf.setFontSize(10.5);
        pdf.setFont("helvetica", "bold");
        setColor(20, 10, 60);
        pdf.text(edu.degree || "", ML, y);

        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "italic");
        setColor(120, 100, 180);
        pdf.text(edu.period || "", PW - MR, y, { align: "right" });

        y += 5;
        pdf.setFont("helvetica", "normal");
        setColor(80, 60, 150);
        pdf.text(edu.school || "", ML, y);

        if (edu.gpa) {
          pdf.setFontSize(8.5);
          setColor(60, 60, 80);
          pdf.text(`GPA: ${edu.gpa}`, PW - MR, y, { align: "right" });
        }
        y += 7;
      });
    }

    // ── ACHIEVEMENTS ──────────────────────────────────────────────────────
    if (achievements.length) {
      section(lang === "ar" ? "الإنجازات والجوائز" : "Achievements & Awards");
      achievements.slice(0, 4).forEach((ach: any) => {
        guard(12);
        const title = lang === "ar" ? (ach.title_ar || ach.title_en) : ach.title_en;
        const desc  = lang === "ar" ? (ach.desc_ar  || ach.desc_en)  : ach.desc_en;
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        setColor(20, 10, 60);
        pdf.text(`• ${title || ""}`, ML, y);

        if (ach.badge) {
          pdf.setFontSize(8);
          pdf.setFont("helvetica", "italic");
          setColor(120, 100, 180);
          pdf.text(ach.badge, PW - MR, y, { align: "right" });
        }
        y += 5;

        if (desc) {
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "normal");
          setColor(60, 60, 75);
          const dLines = clamp(desc, CW - 4);
          pdf.text(dLines, ML + 4, y);
          y += dLines.length * 4.2;
        }
        y += 3;
      });
    }

    // ── LANGUAGES (programming) ───────────────────────────────────────────
    if (languages.length) {
      section(lang === "ar" ? "لغات البرمجة" : "Language Proficiency");
      const barW = CW;
      const barH = 2.5;
      guard(languages.length * 9 + 5);

      languages.forEach((l) => {
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        setColor(55, 55, 70);
        pdf.text(l.name, ML, y);
        pdf.text(`${Math.round(l.percent)}%`, PW - MR, y, { align: "right" });
        y += 3;

        // Track background
        pdf.setFillColor(230, 225, 245);
        pdf.roundedRect(ML, y, barW, barH, 1, 1, "F");
        // Fill
        pdf.setFillColor(100, 60, 210);
        pdf.roundedRect(ML, y, barW * (l.percent / 100), barH, 1, 1, "F");
        y += barH + 4;
      });
      y += 3;
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    const pages = (pdf.internal as any).pages.length - 1;
    for (let p = 1; p <= pages; p++) {
      pdf.setPage(p);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "normal");
      setColor(160, 150, 190);
      pdf.text(`${personal.name}  ·  ${lang === "ar" ? "السيرة الذاتية" : "CV / Resume"}`, ML, PH - 8);
      pdf.text(`${p} / ${pages}`, PW - MR, PH - 8, { align: "right" });
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  }
}
