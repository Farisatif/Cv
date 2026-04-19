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
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const contactLinks = [
    {
      label: t.contact.email,
      value: personal.email,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{lang === "ar" ? "التواصل" : "Contact"}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {t.contact.title}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md text-[15px] leading-relaxed">
          {t.contact.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Availability card */}
        <div className={`lg:col-span-2 ${isRTL ? "lg:order-2" : "lg:order-1"}`}>
          <div className="cosmic-card glow-border rounded-2xl p-6 h-full flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl border border-border dark:border-[hsl(263_80%_68%/0.2)] dark:bg-[hsl(263_80%_68%/0.08)] bg-muted flex items-center justify-center mb-4 text-xl">
                👋
              </div>
              <h3 className={`font-semibold text-base mb-2 ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "متاح للفرص" : "Available for work"}
              </h3>
              <p className={`text-sm text-muted-foreground leading-relaxed ${isRTL ? "text-right" : ""}`}>
                {lang === "ar"
                  ? "أفضّل مناقشة المشاريع عبر البريد أو واتساب. أستجيب خلال 24 ساعة."
                  : "I prefer discussing projects over email or WhatsApp. I typically respond within 24 hours."}
              </p>
            </div>
            <div className={`mt-6 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium dark:text-[hsl(192_100%_62%/0.8)]">
                {lang === "ar" ? "متاح الآن" : "Online now"}
              </span>
            </div>
          </div>
        </div>

        {/* Contact links */}
        <div className={`lg:col-span-3 ${isRTL ? "lg:order-1" : "lg:order-2"}`}>
          <div className="cosmic-card rounded-2xl overflow-hidden divide-y divide-border">
            {contactLinks.map((link) => (
              <div
                key={link.label}
                className={`px-5 py-4 flex items-center gap-4 hover:bg-muted/30 dark:hover:bg-[hsl(263_80%_68%/0.04)] transition-all group ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <div className="icon-btn w-9 h-9 rounded-xl flex-shrink-0">
                  {link.icon}
                </div>

                <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{link.label}</div>
                  <div className="text-sm font-mono font-medium truncate" dir="ltr" style={{ textAlign: "left" }}>
                    {link.value}
                  </div>
                </div>

                <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {link.onAction && (
                    <button
                      onClick={link.onAction}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                        copied
                          ? "border-foreground bg-foreground text-background dark:border-[hsl(263_80%_68%)] dark:bg-[hsl(263_80%_68%)] dark:text-[hsl(240_25%_3.5%)]"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground dark:hover:border-[hsl(263_80%_68%/0.4)]"
                      }`}
                    >
                      {copied ? t.contact.copied : t.contact.copy}
                    </button>
                  )}
                  <a
                    href={link.href}
                    target={link.href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground dark:hover:border-[hsl(263_80%_68%/0.35)] dark:hover:shadow-[0_0_10px_hsl(263_80%_68%/0.1)] transition-all duration-200 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
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
      </div>
    </section>
  );
}
