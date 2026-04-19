import { useState, useEffect } from "react";
import { SectionHeader, useAdminHeaders } from "./adminShared";

type Stats = {
  visitors: number;
  totalComments: number;
  pendingComments: number;
  approvedComments: number;
  resumeLastSaved: string | null;
  dbStatus: "ok" | "error";
  serverTime: string | null;
};

export function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const authHeaders = useAdminHeaders();

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const adminEmail = sessionStorage.getItem("cv-admin-email") || "admin";
  const sessionToken = sessionStorage.getItem("cv-admin-token") || "";

  const fetchStats = async () => {
    setStatsLoading(true);
    setStatsError("");
    try {
      const res = await fetch("/api/admin/stats", { headers: authHeaders });
      if (res.ok) setStats(await res.json());
      else setStatsError("Failed to load stats");
    } catch {
      setStatsError("Network error");
    }
    setStatsLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "New passwords do not match" }); return; }
    if (newPw.length < 8) { setPwMsg({ type: "error", text: "Password must be at least 8 characters" }); return; }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Token": sessionToken },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: "success", text: "Password changed successfully" });
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
      } else {
        setPwMsg({ type: "error", text: data.error || "Failed to change password" });
      }
    } catch {
      setPwMsg({ type: "error", text: "Network error" });
    }
    setPwLoading(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", headers: { "X-Session-Token": sessionToken } });
    } catch {}
    sessionStorage.removeItem("cv-admin");
    sessionStorage.removeItem("cv-admin-token");
    sessionStorage.removeItem("cv-admin-email");
    onLogout();
  };

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Account" />
        <div className="border border-border rounded-xl p-5 bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/10 border border-border flex items-center justify-center text-lg font-bold">
              {adminEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm">{adminEmail}</div>
              <div className="text-xs text-muted-foreground">{sessionToken ? "Session active" : "No active session"}</div>
            </div>
            <button onClick={handleLogout}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <SectionHeader title="Site Statistics" />
          <button onClick={fetchStats} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded-lg mb-4">
            Refresh ↻
          </button>
        </div>

        {statsLoading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">Loading stats…</div>
        ) : statsError ? (
          <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">⚠ {statsError}</div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Visitors", value: stats.visitors, icon: "👁" },
              { label: "Comments", value: stats.totalComments, icon: "💬" },
              { label: "Pending", value: stats.pendingComments, icon: "⏳", warn: stats.pendingComments > 0 },
              { label: "Approved", value: stats.approvedComments, icon: "✅" },
            ].map(({ label, value, icon, warn }) => (
              <div key={label} className={`border rounded-xl p-4 text-center ${warn ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className={`text-2xl font-bold tabular-nums ${warn ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {stats && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stats.dbStatus === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
              Database: {stats.dbStatus}
            </span>
            {stats.resumeLastSaved && <span>CV last saved: {new Date(stats.resumeLastSaved).toLocaleString()}</span>}
            {stats.serverTime && <span>Server time: {new Date(stats.serverTime).toLocaleString()}</span>}
          </div>
        )}
      </div>

      {sessionToken && !adminEmail.includes("@") && (
        <div>
          <SectionHeader title="Change Password" />
          <div className="border border-border rounded-xl p-5 bg-card">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
              {[
                { label: "Current Password", value: currentPw, setter: setCurrentPw, ac: "current-password" },
                { label: "New Password", value: newPw, setter: setNewPw, ac: "new-password", hint: "Min. 8 characters" },
                { label: "Confirm New Password", value: confirmPw, setter: setConfirmPw, ac: "new-password", hint: "Repeat new password" },
              ].map(({ label, value, setter, ac, hint }) => (
                <div key={label} className="space-y-1">
                  <label className="block text-xs font-medium text-muted-foreground">{label}</label>
                  <input type="password" value={value} onChange={(e) => setter(e.target.value)}
                    className="cosmic-input" autoComplete={ac} disabled={pwLoading} placeholder={hint ?? "••••••••"} />
                </div>
              ))}

              {pwMsg && (
                <div className={`text-xs px-3 py-2 rounded-lg border ${
                  pwMsg.type === "success"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
                }`}>
                  {pwMsg.type === "success" ? "✓ " : "⚠ "}{pwMsg.text}
                </div>
              )}

              <button type="submit" disabled={!currentPw || !newPw || !confirmPw || pwLoading}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-foreground text-background hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2">
                {pwLoading && (
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                )}
                {pwLoading ? "Changing…" : "Change Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
