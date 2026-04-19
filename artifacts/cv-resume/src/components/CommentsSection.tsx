import { useState, useEffect, useRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useListComments, useCreateComment, useLikeComment, getListCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

// Scroll-driven radial glow circle — grows from center as user scrolls into the section
function ScrollCircle({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el  = sectionRef.current;
      const dot = circleRef.current;
      if (!el || !dot) return;

      const rect = el.getBoundingClientRect();
      const vh   = window.innerHeight;

      // 0 = section just enters from bottom, 1 = section top reached
      const raw      = 1 - rect.top / vh;
      const progress = Math.max(0, Math.min(1, raw));

      dot.style.transform = `translate(-50%, -50%) scale(${progress})`;
      dot.style.opacity   = String(Math.min(1, progress * 1.6));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionRef]);

  return (
    <div
      ref={circleRef}
      aria-hidden="true"
      style={{
        position:       "absolute",
        top:            "55%",
        left:           "50%",
        width:          "min(900px, 130vw)",
        height:         "min(900px, 130vw)",
        borderRadius:   "50%",
        transform:      "translate(-50%, -50%) scale(0)",
        opacity:        0,
        pointerEvents:  "none",
        background:     "radial-gradient(circle, hsl(263 80% 62% / 0.07) 0%, hsl(220 80% 55% / 0.04) 45%, transparent 72%)",
        filter:         "blur(2px)",
        willChange:     "transform, opacity",
        zIndex:         0,
      }}
    />
  );
}

function timeAgo(dateStr: string, lang: "en" | "ar") {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (lang === "ar") {
    if (diff < 60)  return `منذ ${diff} ث`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentCard({
  comment, index, onLike, liked, lang,
}: {
  comment: { id: number; name: string; message: string; likes: number; createdAt: string };
  index: number;
  onLike: (id: number) => void;
  liked: boolean;
  lang: "en" | "ar";
}) {
  const { isRTL } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const isArabicChar = (ch: string) => /[\u0600-\u06FF]/.test(ch);
  const firstChars = comment.name.trim().split(/\s+/).map((w) => w[0] ?? "").filter(Boolean);
  const rawInitials = firstChars.join("").toUpperCase().slice(0, 2);
  const initials = firstChars.length > 0 && isArabicChar(firstChars[0]) ? firstChars[0] : rawInitials;

  const hue = (comment.name.charCodeAt(0) * 47 + comment.name.charCodeAt(1 % comment.name.length) * 31) % 360;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1)",
      }}
      className="cosmic-card rounded-2xl p-5 group"
    >
      <div className={`flex items-start gap-3.5 ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border border-border"
          style={{
            background: `hsl(${hue} 60% ${document.documentElement.classList.contains("dark") ? "25%" : "92%"})`,
            color: `hsl(${hue} 60% ${document.documentElement.classList.contains("dark") ? "70%" : "30%"})`,
          }}
        >
          <span className={`font-bold leading-none select-none ${isArabicChar(initials[0] ?? "") ? "text-sm" : "text-xs font-mono"}`}>
            {initials}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className={`flex items-center justify-between gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-sm font-semibold truncate tracking-tight">{comment.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0 tabular-nums">
                {timeAgo(comment.createdAt, lang)}
              </span>
            </div>
          </div>
          <p className={`text-sm text-muted-foreground leading-relaxed break-words mb-3 ${isRTL ? "text-right" : ""}`}>
            {comment.message}
          </p>
          <button
            onClick={() => onLike(comment.id)}
            disabled={liked}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 ${isRTL ? "flex-row-reverse" : ""} ${
              liked
                ? "text-foreground bg-foreground/8 border border-foreground/12 dark:text-[hsl(263_80%_75%)] dark:bg-[hsl(263_80%_68%/0.1)] dark:border-[hsl(263_80%_68%/0.18)] font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border/60 dark:hover:border-[hsl(263_80%_68%/0.15)]"
            }`}
            aria-label={liked ? "Liked" : "Like"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="tabular-nums">{comment.likes}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection() {
  const sectionRef = useScrollReveal();
  const { lang, isRTL } = useLanguage();
  const t = translations[lang];
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useListComments();
  const createComment = useCreateComment();
  const likeComment = useLikeComment();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) { setError(t.guestbook.fillBoth); return; }
    setError("");
    setSubmitting(true);
    try {
      await createComment.mutateAsync({ data: { name: name.trim(), message: message.trim() } });
      queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey() });
      setName(""); setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 7000);
    } catch {
      setError(t.guestbook.failed);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: number) => {
    if (likedIds.has(id)) return;
    try {
      await likeComment.mutateAsync({ id });
      setLikedIds((prev) => new Set([...prev, id]));
      queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey() });
    } catch {}
  };

  const totalLikes = comments?.reduce((sum, c) => sum + c.likes, 0) ?? 0;

  const elRef = sectionRef as React.RefObject<HTMLElement | null>;

  return (
    <section
      id="comments"
      ref={elRef}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6 relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Scroll-driven glow circle */}
      <ScrollCircle sectionRef={elRef} />

      <div className={`relative z-10 mb-14 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.guestbook.title}</span>
        <h2 className="section-title">
          {lang === "ar" ? "سجّل حضورك" : "Sign the guestbook"}
        </h2>
        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md">
          {t.guestbook.subtitle}
        </p>

        {/* Trust signals */}
        {!isLoading && comments && comments.length > 0 && (
          <div className={`flex items-center gap-4 mt-5 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="font-semibold text-foreground font-mono">{comments.length}</span>
              {lang === "ar" ? " رسالة" : " messages"}
            </div>
            {totalLikes > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-red-400">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="font-semibold text-foreground font-mono">{totalLikes}</span>
                {lang === "ar" ? " إعجاب" : " likes"}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2" style={{ order: isRTL ? 2 : 1 }}>
          <div className="cosmic-card glow-border rounded-2xl p-6 sticky top-20">
            <div className={`flex items-center gap-2.5 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}>
              <div className="w-8 h-8 rounded-lg bg-muted dark:bg-[hsl(263_80%_68%/0.08)] border border-border dark:border-[hsl(263_80%_68%/0.18)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="dark:text-[hsl(263_80%_70%)]">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <h3 className="text-sm font-semibold">{t.guestbook.writeMessage}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-[11px] text-muted-foreground mb-1.5 block font-semibold uppercase tracking-widest ${isRTL ? "text-right" : ""}`}>
                  {t.guestbook.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.guestbook.namePlaceholder}
                  maxLength={50}
                  dir="auto"
                  className="cosmic-input"
                />
              </div>
              <div>
                <label className={`text-[11px] text-muted-foreground mb-1.5 block font-semibold uppercase tracking-widest ${isRTL ? "text-right" : ""}`}>
                  {t.guestbook.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.guestbook.messagePlaceholder}
                  maxLength={300}
                  rows={4}
                  dir="auto"
                  className="cosmic-input resize-none leading-relaxed"
                />
                <div className={`flex items-center justify-between mt-1.5 ${isRTL ? "flex-row-reverse" : ""}`}>
                  <span className={`text-[10px] font-mono text-muted-foreground/50 ${isRTL ? "text-right" : ""}`}>
                    {message.length}/300
                  </span>
                  {message.length > 250 && (
                    <span className="text-[10px] text-amber-500/70 font-mono">
                      {300 - message.length} {lang === "ar" ? "حرف متبقي" : "left"}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className={`flex items-center gap-2 text-xs text-red-500 bg-red-500/8 border border-red-500/12 rounded-lg px-3 py-2.5 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !name.trim() || !message.trim()}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  submitted
                    ? "bg-green-500/10 text-green-600 border border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                    : "btn-primary"
                } ${(submitting || (!name.trim() || !message.trim())) && !submitted ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    {t.guestbook.posting}
                  </span>
                ) : submitted ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {lang === "ar" ? "تم الإرسال! ✓" : "Sent! Awaiting approval"}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {t.guestbook.post}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                  </span>
                )}
              </button>

              <p className={`text-[10px] text-muted-foreground/50 leading-relaxed ${isRTL ? "text-right" : ""}`}>
                {lang === "ar"
                  ? "الرسائل تظهر بعد موافقة المشرف"
                  : "Messages appear after admin approval"}
              </p>
            </form>
          </div>
        </div>

        {/* Comments list */}
        <div className="lg:col-span-3 space-y-3" style={{ order: isRTL ? 1 : 2 }}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="cosmic-card rounded-2xl p-5">
                  <div className="flex gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0 shimmer" />
                    <div className="flex-1 space-y-2.5 pt-1">
                      <div className="h-3 bg-muted rounded-full w-1/3 shimmer" />
                      <div className="h-3 bg-muted rounded-full w-full shimmer" />
                      <div className="h-3 bg-muted rounded-full w-2/3 shimmer" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="cosmic-card rounded-2xl p-14 text-center glow-border">
              <div className="w-14 h-14 rounded-2xl dark:bg-[hsl(263_80%_68%/0.07)] bg-muted flex items-center justify-center mx-auto mb-5 border border-border dark:border-[hsl(263_80%_68%/0.18)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground dark:text-[hsl(263_80%_65%)]">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-foreground/70 mb-1">{t.guestbook.noMessages}</p>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "كن أول من يترك رسالة!" : "Be the first to leave a message!"}
              </p>
            </div>
          ) : (
            comments.map((comment, i) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                index={i}
                onLike={handleLike}
                liked={likedIds.has(comment.id)}
                lang={lang}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
