import { useState, useEffect } from "react";
import { SectionHeader, useAdminHeaders } from "./adminShared";

type Stats = {
  visitors: number;
  totalComments: number;
  pendingComments: number;
  approvedComments: number;
  resumeLastSaved: string | null;
  dbStatus: "ok" | "not_initialized" | "error";
  serverTime: string | null;
};

type DbStatus = {
  ready: boolean;
  tables: Record<string, boolean>;
};

const STAT_CARDS = [
  {
    key: "visitors" as const,
    label: "Visitors",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
  {
    key: "totalComments" as const,
    label: "Comments",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    key: "pendingComments" as const,
    label: "Pending",
    warn: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: "approvedComments" as const,
    label: "Approved",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
];

const MIGRATION_URL = "https://supabase.com/dashboard/project/zhqstdrgmtayullvuekn/sql";

function CopyButton({ text, label = "Copy SQL" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-all">
      {copied ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [sqlContent, setSqlContent] = useState<string>("");
  const [showSql, setShowSql] = useState(false);
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
      const [statsRes, dbRes] = await Promise.all([
        fetch("/api/admin/stats", { headers: authHeaders }),
        fetch("/api/admin/db-status", { headers: authHeaders }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      else setStatsError("Failed to load stats");
      if (dbRes.ok) setDbStatus(await dbRes.json());
    } catch {
      setStatsError("Network error");
    }
    setStatsLoading(false);
  };

  useEffect(() => {
    fetchStats();
    fetch("/api/migration-sql")
      .then((r) => r.text())
      .catch(() => "");
  }, []);

  // Fetch migration SQL from the public endpoint (or fallback to empty)
  useEffect(() => {
    fetch("/api/admin/migration-sql", { headers: authHeaders })
      .then((r) => (r.ok ? r.text() : ""))
      .then((sql) => setSqlContent(sql))
      .catch(() => setSqlContent(""));
  }, []);

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

  const dbNotInitialized = dbStatus && !dbStatus.ready;

  return (
    <div className="space-y-8">

      {/* ── Database Setup Banner ─────────────────────────────────────────── */}
      {dbNotInitialized && (
        <div className="border border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-amber-800 dark:text-amber-300">Supabase database not set up</div>
              <div className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 leading-relaxed">
                The app is running in offline mode using static data. To enable live data persistence, visitor tracking, comments, and admin edits — run the migration SQL in your Supabase project.
              </div>
            </div>
          </div>

          {/* Table status grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dbStatus && Object.entries(dbStatus.tables).map(([table, ok]) => (
              <div key={table} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono ${
                ok
                  ? "border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                  : "border-red-400/30 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
                {table}
              </div>
            ))}
          </div>

          {/* Setup steps */}
          <div className="space-y-2.5 text-xs text-amber-800 dark:text-amber-300">
            <div className="font-semibold text-sm">Setup instructions:</div>
            {[
              <>Open your <a href={MIGRATION_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 font-medium hover:opacity-80">Supabase SQL Editor ↗</a></>,
              <>Click <strong>+ New query</strong>, paste the SQL below, then click <strong>Run</strong></>,
              <>Reload this page — the banner will disappear once all tables are ready</>,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="leading-relaxed">{step}</span>
              </div>
            ))}
          </div>

          {/* SQL toggle */}
          <div>
            <button onClick={() => setShowSql(!showSql)}
              className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:opacity-80 transition-opacity">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: showSql ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              {showSql ? "Hide" : "Show"} migration SQL
            </button>

            {showSql && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">supabase-migrations.sql</span>
                  <div className="flex gap-2">
                    <CopyButton text={sqlContent || FALLBACK_SQL} />
                    <a href={MIGRATION_URL} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted transition-all">
                      Open Supabase ↗
                    </a>
                  </div>
                </div>
                <pre className="bg-background border border-border rounded-xl p-4 text-[10px] font-mono text-muted-foreground overflow-x-auto overflow-y-auto max-h-64 leading-relaxed whitespace-pre">
                  {sqlContent || FALLBACK_SQL}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Account ─────────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Account" />
        <div className="border border-border rounded-xl p-5 bg-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-foreground/10 border border-border flex items-center justify-center text-lg font-bold">
              {adminEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-sm">{adminEmail}</div>
              <div className="text-xs text-muted-foreground">
                {sessionToken ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Session active
                    {dbStatus && !dbStatus.ready && <span className="text-amber-500"> · offline mode</span>}
                  </span>
                ) : "No active session"}
              </div>
            </div>
            <button onClick={handleLogout}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ── Site Statistics ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between">
          <SectionHeader title="Site Statistics" />
          <button onClick={fetchStats} className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 border border-border rounded-lg mb-4 flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </button>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0,1,2,3].map((i) => (
              <div key={i} className="border border-border rounded-xl p-4 text-center animate-pulse bg-card">
                <div className="w-8 h-8 rounded-xl bg-foreground/5 mx-auto mb-2" />
                <div className="h-7 bg-foreground/5 rounded mx-auto w-10 mb-1" />
                <div className="h-2.5 bg-foreground/5 rounded mx-auto w-14" />
              </div>
            ))}
          </div>
        ) : statsError ? (
          <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {statsError}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CARDS.map(({ key, label, icon, warn }) => {
              const value = stats[key];
              const isWarn = warn && (value as number) > 0;
              return (
                <div key={label} className={`border rounded-xl p-4 text-center ${isWarn ? "border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20" : "border-border bg-card"}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                    isWarn ? "bg-amber-500/15 text-amber-500" : "bg-foreground/8 text-muted-foreground"
                  }`}>
                    {icon}
                  </div>
                  <div className={`text-2xl font-bold tabular-nums ${isWarn ? "text-amber-600 dark:text-amber-400" : ""}`}>{value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {stats && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stats.dbStatus === "ok" ? "bg-emerald-500" : "bg-amber-500"}`} />
              Database: {stats.dbStatus === "ok" ? "connected" : stats.dbStatus === "not_initialized" ? "not initialized" : "error"}
            </span>
            {stats.resumeLastSaved && (
              <span>CV last saved: {new Date(stats.resumeLastSaved).toLocaleString()}</span>
            )}
            {stats.serverTime && (
              <span>Server time: {new Date(stats.serverTime).toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Change Password ──────────────────────────────────────────────────── */}
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
                <div className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-2 ${
                  pwMsg.type === "success"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-800"
                    : "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/30 dark:border-red-800"
                }`}>
                  {pwMsg.type === "success" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                  {pwMsg.text}
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

const FALLBACK_SQL = `-- ============================================================
-- Interactive CV/Resume — Supabase Migration
-- Run this in: https://supabase.com/dashboard/project/zhqstdrgmtayullvuekn/sql
-- ============================================================

-- 1. Visitors -------------------------------------------------------
create table if not exists public.visitors (
  id         bigserial primary key,
  ip_hash    text        not null unique,
  user_agent text,
  country    text,
  first_seen timestamptz not null default now(),
  last_seen  timestamptz not null default now(),
  count      int         not null default 1
);
alter table public.visitors disable row level security;

-- 2. Comments -------------------------------------------------------
create table if not exists public.comments (
  id         bigserial primary key,
  author     text        not null,
  content    text        not null,
  approved   boolean     not null default false,
  created_at timestamptz not null default now(),
  ip_hash    text,
  token      text unique
);
alter table public.comments disable row level security;

-- 3. Comment tokens -------------------------------------------------
create table if not exists public.comment_tokens (
  id         bigserial primary key,
  token      text        not null unique,
  ip_hash    text,
  created_at timestamptz not null default now()
);
alter table public.comment_tokens disable row level security;

-- 4. Resume data ----------------------------------------------------
create table if not exists public.resume_data (
  id         bigserial primary key,
  lang       text        not null default 'en',
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);
alter table public.resume_data disable row level security;

-- 5. Admin credentials ----------------------------------------------
create table if not exists public.admin_credentials (
  id            bigserial primary key,
  username      text        not null unique,
  password_hash text        not null,
  created_at    timestamptz not null default now()
);
alter table public.admin_credentials disable row level security;
-- Insert default admin (password: Zoom100*)
insert into public.admin_credentials (username, password_hash)
values ('admin', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
on conflict (username) do nothing;

-- 6. Admin sessions -------------------------------------------------
create table if not exists public.admin_sessions (
  id            bigserial primary key,
  google_id     text        not null unique,
  email         text        not null,
  name          text,
  session_token text        not null unique,
  expires_at    timestamptz not null,
  created_at    timestamptz not null default now()
);
alter table public.admin_sessions disable row level security;`;
