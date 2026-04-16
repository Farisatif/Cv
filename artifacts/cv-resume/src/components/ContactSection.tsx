import { useState } from "react";
import { resumeData } from "@/data/resume";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const { personal } = resumeData;

export default function ContactSection() {
  const sectionRef = useScrollReveal();
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(personal.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const contactLinks = [
    {
      label: "Email",
      value: personal.email,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      action: copyEmail,
      actionLabel: copied ? "Copied!" : "Copy",
    },
    {
      label: "GitHub",
      value: personal.github,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      ),
      href: `https://${personal.github}`,
    },
    {
      label: "LinkedIn",
      value: personal.linkedin,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
      href: `https://${personal.linkedin}`,
    },
    {
      label: "Website",
      value: personal.website,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
      href: `https://${personal.website}`,
    },
  ];

  return (
    <section id="contact" ref={sectionRef as React.RefObject<HTMLElement>} className="section-reveal py-24 max-w-5xl mx-auto px-6">
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2 className="text-lg font-bold tracking-tight">Let's work together</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            I'm currently open to full-time roles and interesting consulting projects. If you have something exciting in mind, I'd love to hear about it.
          </p>
        </div>

        <div className="divide-y divide-border">
          {contactLinks.map((link) => (
            <div key={link.label} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/40 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {link.icon}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{link.label}</div>
                  <div className="text-sm font-mono font-medium">{link.value}</div>
                </div>
              </div>
              <div>
                {link.action ? (
                  <button
                    onClick={link.action}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 ${
                      copied
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {link.actionLabel}
                  </button>
                ) : (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all duration-200 flex items-center gap-1"
                  >
                    Open
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
