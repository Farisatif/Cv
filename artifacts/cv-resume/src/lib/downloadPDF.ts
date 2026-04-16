export async function downloadPDF(lang: "en" | "ar" = "en") {
  const filename = lang === "ar" ? "السيرة-الذاتية.pdf" : "cv-resume.pdf";

  const { default: html2canvas } = await import("html2canvas");
  const { default: jsPDF } = await import("jspdf");

  const main = document.querySelector("main") as HTMLElement;
  if (!main) {
    window.print();
    return;
  }

  document.body.classList.add("generating-pdf");

  try {
    const canvas = await html2canvas(main, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      ignoreElements: (el) => {
        const cls = el.getAttribute("class") || "";
        return (
          cls.includes("print:hidden") ||
          el.tagName === "CANVAS" ||
          cls.includes("animate-bounce")
        );
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidthPx = canvas.width;
    const imgHeightPx = canvas.height;

    const ratio = pdfWidth / (imgWidthPx / 3.7795);
    const totalHeightMM = (imgHeightPx / 3.7795) * ratio;

    let yOffset = 0;
    let pageCount = 0;

    while (yOffset < totalHeightMM) {
      if (pageCount > 0) pdf.addPage();
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        -yOffset,
        pdfWidth,
        totalHeightMM
      );
      yOffset += pdfHeight;
      pageCount++;
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    window.print();
  } finally {
    document.body.classList.remove("generating-pdf");
  }
}
