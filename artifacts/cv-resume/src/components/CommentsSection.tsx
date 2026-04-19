import { useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/data/translations";
import { useListComments, useCreateComment, useLikeComment, getListCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function timeAgo(dateStr: string, lang: "en" | "ar") {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (lang === "ar") {
    if (diff < 60)  return `منذ ${diff} ثانية`;
    if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
    return `منذ ${Math.floor(diff / 86400)} يوم`;
  }
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentCard({
  comment,
  index,
  onLike,
  liked,
  lang,
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
    const timer = setTimeout(() => setVisible(true), index * 70);
    return () => clearTimeout(timer);
  }, [index]);

  const isArabicChar = (ch: string) => /[\u0600-\u06FF]/.test(ch);
  const firstChars = comment.name.trim().split(/\s+/).map((w) => w[0] ?? "").filter(Boolean);
  const rawInitials = firstChars.join("").toUpperCase().slice(0, 2);
  const initials = firstChars.length > 0 && isArabicChar(firstChars[0]) ? firstChars[0] : rawInitials;

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s cubic-bezier(0.16,1,0.3,1), transform 0.45s cubic-bezier(0.16,1,0.3,1)",
      }}
      className="group border border-border rounded-2xl bg-card p-5 hover:border-foreground/15 hover:shadow-sm transition-all"
    >
      <div className={`flex items-start gap-3.5 ${isRTL ? "flex-row-reverse" : ""}`}>
        <div className="w-9 h-9 rounded-full bg-foreground/8 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 mt-0.5">
          <span className={`font-bold leading-none select-none text-foreground/70 ${isArabicChar(initials[0] ?? "") ? "text-sm" : "text-xs font-mono"}`}>
            {initials}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`flex items-center justify-between gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className={`flex items-center gap-2 min-w-0 ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-sm font-semibold truncate tracking-tight">{comment.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">{timeAgo(comment.createdAt, lang)}</span>
            </div>
          </div>
          <p className={`text-sm text-muted-foreground leading-relaxed break-words mb-3 ${isRTL ? "text-right" : ""}`}>
            {comment.message}
          </p>
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <button
              onClick={() => onLike(comment.id)}
              disabled={liked}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all duration-200 ${isRTL ? "flex-row-reverse" : ""} ${
                liked
                  ? "text-foreground bg-foreground/10 border border-foreground/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border"
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill={liked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className={`tabular-nums ${liked ? "font-semibold" : ""}`}>{comment.likes}</span>
            </button>
          </div>
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
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 6000);
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

  return (
    <section
      id="comments"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-20 sm:py-28 max-w-5xl mx-auto px-4 sm:px-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className={`mb-12 ${isRTL ? "text-right" : ""}`}>
        <span className="section-label">{t.guestbook.title}</span>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {lang === "ar" ? "سجّل حضورك" : "Sign the guestbook"}
        </h2>
        <p className="text-muted-foreground mt-3 text-[15px] leading-relaxed max-w-md">
          {t.guestbook.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2" style={{ order: isRTL ? 2 : 1 }}>
          <div className="border border-border rounded-2xl bg-card p-6 sticky top-20">
            <h3 className={`text-sm font-semibold mb-5 flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {t.guestbook.writeMessage}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`text-[11px] text-muted-foreground mb-1.5 block uppercase tracking-wide ${isRTL ? "text-right" : ""}`}>
                  {t.guestbook.name}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.guestbook.namePlaceholder}
                  maxLength={50}
                  dir="auto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all"
                />
              </div>
              <div>
                <label className={`text-[11px] text-muted-foreground mb-1.5 block uppercase tracking-wide ${isRTL ? "text-right" : ""}`}>
                  {t.guestbook.message}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.guestbook.messagePlaceholder}
                  maxLength={300}
                  rows={4}
                  dir="auto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/30 transition-all resize-none"
                />
                <div className={`text-[10px] text-muted-foreground mt-1 font-mono ${isRTL ? "text-left" : "text-right"}`}>
                  {message.length}/300
                </div>
              </div>
              {error && (
                <p className={`text-xs text-red-500 flex items-center gap-1.5 ${isRTL ? "flex-row-reverse text-right" : ""}`}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  submitted
                    ? "bg-foreground/8 text-foreground border border-foreground/15"
                    : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]"
                } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    {t.guestbook.posting}
                  </span>
                ) : submitted ? (
                  <span className="flex items-center justify-center gap-2 text-xs">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {lang === "ar" ? "تم الإرسال — بانتظار موافقة المشرف" : "Sent — awaiting admin approval"}
                  </span>
                ) : (
                  t.guestbook.post
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-3" style={{ order: isRTL ? 1 : 2 }}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-2xl bg-card p-5 animate-pulse">
                  <div className="flex gap-3.5">
                    <div className="w-9 h-9 rounded-full bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-2.5 pt-1">
                      <div className="h-3 bg-muted rounded-full w-1/3" />
                      <div className="h-3 bg-muted rounded-full w-full" />
                      <div className="h-3 bg-muted rounded-full w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="border border-border rounded-2xl bg-card p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground font-medium">{t.guestbook.noMessages}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {lang === "ar" ? "كن أول من يكتب رسالة!" : "Be the first to leave a message!"}
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
