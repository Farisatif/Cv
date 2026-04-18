import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useResumeData } from "@/context/ResumeDataContext";

export default function ContactSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const { data } = useResumeData();
  const personal = data.personal;
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    navigator.clipboard.writeText(personal.email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const contactLinks = [
    {
      label: t.contact.email,
      value: personal.email,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      ),
      href: `mailto:${personal.email}`,
      actionLabel: t.contact.sendEmail,
      onAction: copyEmail,
    },
    {
      label: t.contact.whatsapp,
      value: personal.phone,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      ),
      href: `https://wa.me/${personal.whatsapp}`,
      actionLabel: t.contact.openWhatsApp,
    },
    {
      label: t.contact.github,
      value: personal.github,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
        </svg>
      ),
      href: `https://${personal.github}`,
      actionLabel: t.contact.visitGitHub,
    },
    {
      label: t.contact.linkedin,
      value: personal.linkedin,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
      href: `https://${personal.linkedin}`,
      actionLabel: t.contact.visitLinkedIn,
    },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-16 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-5 border-b border-border bg-muted/20 ${isRTL ? "text-right" : ""}`}>
          <div className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <h2 className="text-lg font-bold tracking-tight">{t.contact.title}</h2>
          </div>
          <p className={`text-sm text-muted-foreground break-words ${isRTL ? "text-right" : ""}`}>{t.contact.subtitle}</p>
        </div>

        {/* Contact rows */}
        <div className="divide-y divide-border">
          {contactLinks.map((link) => (
            <div
              key={link.label}
              className={`px-6 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors group ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {/* Icon + text — grows to fill available space */}
              <div className={`flex items-center gap-3 flex-1 min-w-0 overflow-hidden ${isRTL ? "flex-row-reverse" : ""}`}>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                  {link.icon}
                </div>
                <div className={`min-w-0 flex-1 overflow-hidden ${isRTL ? "text-right" : ""}`}>
                  <div className="text-xs text-muted-foreground">{link.label}</div>
                  {/* Values like emails/URLs are always LTR and always left-aligned so truncation clips the end correctly */}
                  <div className="text-sm font-mono font-medium truncate overflow-hidden" dir="ltr" style={{ textAlign: "left" }}>
                    {link.value}
                  </div>
                </div>
              </div>

              {/* Action buttons — never shrink */}
              <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                {link.onAction && (
                  <button
                    onClick={link.onAction}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 ${
                      copied
                        ? "border-foreground/40 bg-foreground text-background"
                        : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {copied ? t.contact.copied : t.contact.copy}
                  </button>
                )}
                <a
                  href={link.href}
                  target={link.href.startsWith("mailto") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-all duration-200 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                >
                  {link.actionLabel}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
