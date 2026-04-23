import { useState, useEffect } from "react";
import { useResumeData } from "@/context/ResumeDataContext";
import { TABS, TAB_ICONS, useAdminHeaders, type TabId } from "./admin/adminShared";
import { PersonalTab }      from "./admin/PersonalTab";
import { SkillsTab }        from "./admin/SkillsTab";
import { ExperienceTab }    from "./admin/ExperienceTab";
import { ProjectsTab }      from "./admin/ProjectsTab";
import { EducationTab }     from "./admin/EducationTab";
import { LanguagesTab }     from "./admin/LanguagesTab";
import { AchievementsTab }  from "./admin/AchievementsTab";
import { CommentsTab }      from "./admin/CommentsTab";
import { SettingsTab }      from "./admin/SettingsTab";

const DATA_TABS: TabId[] = ["personal","skills","experience","projects","education","languages","achievements"];

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { data, setData, saveData, resetData, saving, savedData } = useResumeData();
  const [saved, setSaved] = useState(false);
  const [error, setSaveError] = useState("");
  const [tab, setTab] = useState<TabId>("personal");
  const [dbReady, setDbReady] = useState<boolean | null>(null);
  const authHeaders = useAdminHeaders();

  useEffect(() => {
    fetch("/api/admin/db-status", { headers: authHeaders })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setDbReady(d?.ready ?? false))
      .catch(() => setDbReady(false));
  }, []);

  const isUnsaved = DATA_TABS.includes(tab) && JSON.stringify(data) !== JSON.stringify(savedData);

  const handleSave = async () => {
    setSaveError("");
    try {
      await saveData(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed — check your connection.";
      setSaveError(msg);
      // If DB not ready, auto-navigate to settings to show setup guide
      if (msg.includes("Database not initialized")) {
        setTimeout(() => setTab("settings"), 800);
      }
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all data to defaults? This cannot be undone.")) return;
    await resetData();
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem("cv-admin-token") || "";
    try { await fetch("/api/auth/logout", { method: "POST", headers: { "X-Session-Token": token } }); } catch {}
    sessionStorage.removeItem("cv-admin");
    sessionStorage.removeItem("cv-admin-token");
    sessionStorage.removeItem("cv-admin-email");
    onLogout();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (DATA_TABS.includes(tab)) handleSave();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [tab, data]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </div>
            <span className="font-bold text-sm">Admin Panel</span>
            {isUnsaved ? (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Unsaved changes</span>
              </span>
            ) : dbReady === false ? (
              <button
                onClick={() => setTab("settings")}
                className="flex items-center gap-1.5 text-xs text-amber-500 font-medium hover:text-amber-400 transition-colors"
                title="Database not initialized — click to view setup guide"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span className="hidden sm:inline">DB not set up</span>
              </button>
            ) : dbReady === true ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium hidden sm:flex">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Database connected
              </span>
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:block">— edits both languages simultaneously</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={handleReset} disabled={saving}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50">
              Reset
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60 flex items-center gap-1.5 ${
                saved
                  ? "bg-emerald-600 text-white"
                  : isUnsaved
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-foreground text-background hover:opacity-90"
              }`}>
              {saving ? (
                <>
                  <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Saving…
                </>
              ) : saved ? "✓ Saved" : "Save"}
            </button>
            <button onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
              Logout
            </button>
            <a href="/" className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
              ← CV
            </a>
          </div>
        </div>
      </div>

      {/* Save error banner */}
      {error && (
        <div className="border-b border-red-500/20 bg-red-500/8">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setSaveError("")} className="text-xs text-red-500/60 hover:text-red-500 transition-colors flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border border-border rounded-xl p-1 bg-muted/20 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex flex-col items-center justify-center gap-0.5 min-w-[52px] ${
                tab === t.id
                  ? "bg-foreground text-background shadow-md dark:bg-[hsl(220_18%_93%)] dark:text-[hsl(240_24%_5%)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}>
              <span className="leading-none">{TAB_ICONS[t.id] ?? t.icon}</span>
              <span className="hidden sm:block mt-0.5">{t.labelEn}</span>
              <span className="sm:hidden mt-0.5 text-[9px]">{t.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "personal"     && <PersonalTab     data={data} setData={setData} />}
        {tab === "skills"       && <SkillsTab       data={data} setData={setData} />}
        {tab === "experience"   && <ExperienceTab   data={data} setData={setData} />}
        {tab === "projects"     && <ProjectsTab     data={data} setData={setData} />}
        {tab === "education"    && <EducationTab    data={data} setData={setData} />}
        {tab === "languages"    && <LanguagesTab    data={data} setData={setData} />}
        {tab === "achievements" && <AchievementsTab data={data} setData={setData} />}
        {tab === "comments"  && <CommentsTab />}
        {tab === "settings"  && <SettingsTab onLogout={onLogout} />}

        {/* Bottom save bar for data tabs */}
        {DATA_TABS.includes(tab) && (
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              All edits apply to both languages. Press <kbd className="px-1 py-0.5 rounded border border-border bg-muted font-mono text-[10px]">⌘S</kbd> or click <strong>Save</strong> to write to the database.
            </p>
            <button onClick={handleSave} disabled={saving}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-1.5 ${
                saved
                  ? "bg-emerald-600 text-white"
                  : isUnsaved
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-foreground text-background hover:opacity-90"
              }`}>
              {saving ? "Saving…" : saved ? "✓ Saved" : isUnsaved ? "Save changes" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
