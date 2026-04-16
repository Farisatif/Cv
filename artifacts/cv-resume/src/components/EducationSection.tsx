import { resumeData } from "@/data/resume";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function EducationSection() {
  const sectionRef = useScrollReveal();

  return (
    <section id="education" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-24 max-w-5xl mx-auto px-6">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Education</h2>
        </div>
      </div>

      <div className="space-y-4">
        {resumeData.education.map((edu, i) => (
          <div key={i} className="border border-border rounded-xl bg-card p-5 hover:border-foreground/30 transition-colors">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{edu.school}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{edu.period}</span>
                </div>
                <div className="text-sm text-muted-foreground">{edu.degree}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-muted-foreground">GPA</div>
                <div className="font-mono font-bold text-lg">{edu.gpa}</div>
              </div>
            </div>

            <ul className="mt-4 space-y-1.5">
              {edu.highlights.map((h, hi) => (
                <li key={hi} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-foreground/40 flex-shrink-0" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
