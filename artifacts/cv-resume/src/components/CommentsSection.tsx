import { useState, useRef, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useListComments, useCreateComment, useLikeComment, getListCommentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentCard({
  comment,
  index,
  onLike,
  liked,
}: {
  comment: { id: number; name: string; message: string; likes: number; createdAt: string };
  index: number;
  onLike: (id: number) => void;
  liked: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const initials = comment.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
      className="group border border-border rounded-xl bg-card p-4 hover:border-foreground/25 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-foreground/10 border border-border flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 mt-0.5">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{comment.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {timeAgo(comment.createdAt)}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{comment.message}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => onLike(comment.id)}
              disabled={liked}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-all duration-200 ${
                liked
                  ? "text-foreground bg-foreground/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
    if (!name.trim() || !message.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await createComment.mutateAsync({ data: { name: name.trim(), message: message.trim() } });
      queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey() });
      setName("");
      setMessage("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setError("Failed to post comment. Please try again.");
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
    } catch {
      // silently ignore
    }
  };

  return (
    <section
      id="comments"
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="section-reveal py-16 max-w-5xl mx-auto px-6"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 rounded border border-border flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Guestbook</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Leave a message — say hi, share feedback, or just wave.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Comment form */}
        <div className="lg:col-span-2">
          <div className="border border-border rounded-xl bg-card p-5 sticky top-20">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Write a message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={50}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something nice..."
                  maxLength={300}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 transition-all resize-none"
                />
                <div className="text-right text-[10px] text-muted-foreground mt-0.5">{message.length}/300</div>
              </div>
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  submitted
                    ? "bg-foreground/10 text-foreground border border-foreground/20"
                    : "bg-foreground text-background hover:opacity-90 active:scale-95"
                } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Posting...
                  </span>
                ) : submitted ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Message sent!
                  </span>
                ) : (
                  "Post message"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Comments list */}
        <div className="lg:col-span-3 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-border rounded-xl bg-card p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !comments || comments.length === 0 ? (
            <div className="border border-border rounded-xl bg-card p-8 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">No messages yet — be the first!</p>
            </div>
          ) : (
            comments.map((comment, i) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                index={i}
                onLike={handleLike}
                liked={likedIds.has(comment.id)}
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
