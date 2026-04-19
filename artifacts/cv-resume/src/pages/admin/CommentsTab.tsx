import { useState, useEffect } from "react";
import { SectionHeader, useAdminHeaders, type AdminComment } from "./adminShared";

export function CommentsTab() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState("");
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

  const deleteComment = async (id: number) => {
    if (!confirm("حذف هذا التعليق؟")) return;
    setActionId(id);
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE", headers: authHeaders });
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {}
    setActionId(null);
  };

  const pending = comments.filter((c) => !c.approved);
  const approved = comments.filter((c) => c.approved);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader title={`التعليقات (${comments.length} إجمالي)`} />
        <button onClick={fetchComments} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded-lg">
          تحديث ↻
        </button>
      </div>

      {fetchError && (
        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <span>⚠</span> {fetchError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</div>
      ) : (
        <>
          {pending.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                قيد الانتظار ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map((c) => (
                  <div key={c.id} className="border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(c.createdAt).toLocaleDateString("ar")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.message}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => approve(c.id)} disabled={actionId === c.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all">
                          ✓ قبول
                        </button>
                        <button onClick={() => deleteComment(c.id)} disabled={actionId === c.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all">
                          ✗ حذف
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              المعتمدة ({approved.length})
            </h3>
            {approved.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">لا يوجد تعليقات معتمدة بعد</div>
            ) : (
              <div className="space-y-3">
                {approved.map((c) => (
                  <div key={c.id} className="border border-border rounded-xl p-4 bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(c.createdAt).toLocaleDateString("ar")}</span>
                          <span className="text-[10px] text-muted-foreground">❤️ {c.likes}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{c.message}</p>
                      </div>
                      <button onClick={() => deleteComment(c.id)} disabled={actionId === c.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors flex-shrink-0">
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
