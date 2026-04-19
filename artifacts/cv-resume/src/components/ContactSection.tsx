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
      color: "hsl(263 80% 68%)",
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
      color: "hsl(142 70% 45%)",
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
      color: "hsl(220 14% 65%)",
    },
    {
      label: t.contact.linkedin,
      value: personal.linkedin.split("?")[0],
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
      ),
      href: `https://${personal.linkedin}`,
      actionLabel: t.contact.visitLinkedIn,
      color: "hsl(210 100% 52%)",
    },
  ];

  return (
    <section
      id="contact"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{lang === "ar" ? "التواصل" : "Contact"}</span>
        <h2 className="section-title">{t.contact.title}</h2>
        <p className="text-muted-foreground mt-3 max-w-md text-[15px] leading-relaxed">
          {t.contact.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Availability card */}
        <div className={`lg:col-span-2 ${isRTL ? "lg:order-2" : "lg:order-1"}`}>
          <div className="premium-card glow-border rounded-2xl p-6 h-full flex flex-col justify-between gap-6">
            <div>
              <div className="w-11 h-11 rounded-xl bg-muted dark:bg-[hsl(263_80%_68%/0.07)] border border-border dark:border-[hsl(263_80%_68%/0.18)] flex items-center justify-center mb-5 text-xl">
                👋
              </div>
              <h3 className={`font-bold text-base mb-2 tracking-tight ${isRTL ? "text-right" : ""}`}>
                {lang === "ar" ? "متاح للفرص" : "Open to work"}
              </h3>
              <p className={`text-sm text-muted-foreground leading-relaxed ${isRTL ? "text-right" : ""}`}>
                {lang === "ar"
                  ? "أفضّل مناقشة المشاريع عبر البريد أو واتساب. أستجيب خلال 24 ساعة."
                  : "I prefer discussing projects over email or WhatsApp. I typically respond within 24 hours."}
              </p>
            </div>
            <div>
              <div className={`flex items-center gap-2.5 mb-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
                <span className="text-xs text-muted-foreground font-medium dark:text-[hsl(192_100%_60%/0.8)]">
                  {lang === "ar" ? "متاح الآن" : "Available now"}
                </span>
              </div>
              <button
                onClick={() => document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full btn-secondary text-xs py-2"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {lang === "ar" ? "سجّل حضورك في دفتر الزوار" : "Sign the guestbook"}
              </button>
            </div>
          </div>
        </div>

        {/* Contact links */}
        <div className={`lg:col-span-3 ${isRTL ? "lg:order-1" : "lg:order-2"}`}>
          <div className="cosmic-card rounded-2xl overflow-hidden divide-y divide-border">
            {contactLinks.map((link, i) => (
              <div
                key={link.label}
                className={`px-5 py-4 flex items-center gap-4 hover:bg-muted/20 dark:hover:bg-[hsl(263_80%_68%/0.03)] transition-all group ${isRTL ? "flex-row-reverse" : ""}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border border-border transition-all group-hover:scale-105"
                  style={{
                    background: `${link.color}12`,
                    color: link.color,
                    borderColor: `${link.color}22`,
                  }}
                >
                  {link.icon}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className={`text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5 font-semibold ${isRTL ? "text-right" : ""}`}>{link.label}</div>
                  <div
                    className="text-sm font-mono font-medium truncate overflow-hidden"
                    dir="ltr"
                    style={{ textAlign: isRTL ? "right" : "left", maxWidth: "100%" }}
                  >
                    {link.value}
                  </div>
                </div>

                <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? "flex-row-reverse" : ""}`}>
                  {link.onAction && (
                    <button
                      onClick={link.onAction}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                        copied
                          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
                          : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground dark:hover:border-[hsl(263_80%_68%/0.35)]"
                      }`}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          {t.contact.copied}
                        </span>
                      ) : t.contact.copy}
                    </button>
                  )}
                  <a
                    href={link.href}
                    target={link.href.startsWith("mailto") ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground dark:hover:border-[hsl(263_80%_68%/0.3)] transition-all duration-200 flex items-center gap-1.5 active:scale-95 whitespace-nowrap"
                  >
                    {link.actionLabel}
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 17L17 7M17 7H7M17 7v10"/>
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
