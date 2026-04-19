import { useState, useEffect, useMemo } from "react";
import { SectionHeader, useAdminHeaders, type AdminComment } from "./adminShared";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommentsTab() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const authHeaders = useAdminHeaders();

  const fetchComments = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch("/api/comments/all", { headers: authHeaders });
      if (res.ok) {
        setComments(await res.json());
      } else {
        setFetchError(`Failed to load comments (${res.status})`);
      }
    } catch {
      setFetchError("Network error — check server connection");
    }
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const approve = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/comments/${id}/approve`, { method: "POST", headers: authHeaders });
      if (res.ok) setComments((prev) => prev.map((c) => c.id === id ? { ...c, approved: true } : c));
    } catch {}
    setActionId(null);
  };

  const unapprove = async (id: number) => {
    setActionId(id);
    try {
      const res = await fetch(`/api/comments/${id}/unapprove`, { method: "POST", headers: authHeaders });
      if (res.ok) setComments((prev) => prev.map((c) => c.id === id ? { ...c, approved: false } : c));
    } catch {}
    setActionId(null);
  };

  const deleteComment = async (id: number) => {
    if (!confirm("Delete this comment permanently?")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
    setActionId(null);
  };

  const approveAll = async () => {
    const pendingIds = comments.filter((c) => !c.approved).map((c) => c.id);
    if (!pendingIds.length) return;
    if (!confirm(`Approve all ${pendingIds.length} pending comments?`)) return;
    for (const id of pendingIds) {
      try {
        const res = await fetch(`/api/comments/${id}/approve`, { method: "POST", headers: authHeaders });
        if (res.ok) setComments((prev) => prev.map((c) => c.id === id ? { ...c, approved: true } : c));
      } catch {}
    }
  };

  const filtered = useMemo(() => {
    return comments.filter((c) => {
      if (filter === "pending" && c.approved) return false;
      if (filter === "approved" && !c.approved) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.message.toLowerCase().includes(q);
      }
      return true;
    });
  }, [comments, filter, search]);

  const pending  = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <SectionHeader title={`Comments`} />
          <div className="flex items-center gap-1.5 -mt-4">
            <span className="text-xs text-muted-foreground font-mono">{comments.length} total</span>
            {pending.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                {pending.length} pending
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 -mt-4">
          {pending.length > 1 && (
            <button onClick={approveAll}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 transition-all font-medium">
              Approve all ({pending.length})
            </button>
          )}
          <button onClick={fetchComments}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded-lg flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or message…"
            className="cosmic-input pl-8 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-base leading-none">×</button>
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-xs">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 font-medium transition-all capitalize ${
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {fetchError && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          Loading comments…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          {search ? `No comments match "${search}"` : filter === "pending" ? "No pending comments" : filter === "approved" ? "No approved comments yet" : "No comments yet"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div key={c.id}
              className={`border rounded-xl p-4 ${
                !c.approved
                  ? "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20"
                  : "border-border bg-card"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-semibold text-sm">{c.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{relativeTime(c.createdAt)}</span>
                    {c.approved && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-rose-400">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {c.likes}
                      </span>
                    )}
                    {!c.approved && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                        pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed break-words">{c.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{c.message.length} chars</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 flex-col sm:flex-row">
                  {!c.approved ? (
                    <button onClick={() => approve(c.id)} disabled={actionId === c.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center gap-1">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Approve
                    </button>
                  ) : (
                    <button onClick={() => unapprove(c.id)} disabled={actionId === c.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 transition-all">
                      Unapprove
                    </button>
                  )}
                  <button onClick={() => deleteComment(c.id)} disabled={actionId === c.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 disabled:opacity-50 transition-all flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && comments.length > 0 && (
        <div className="pt-2 border-t border-border flex items-center gap-4 text-xs text-muted-foreground">
          <span>{approved.length} approved</span>
          <span className="opacity-30">·</span>
          <span className={pending.length > 0 ? "text-amber-500 font-medium" : ""}>{pending.length} pending</span>
        </div>
      )}
    </div>
  );
}
