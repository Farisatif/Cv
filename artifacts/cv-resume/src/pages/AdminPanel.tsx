import { useState, useEffect } from "react";
import { useResumeData } from "@/context/ResumeDataContext";
import { TABS, TAB_ICONS, type TabId } from "./admin/adminShared";
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

  const isUnsaved = DATA_TABS.includes(tab) && JSON.stringify(data) !== JSON.stringify(savedData);

  const handleSave = async () => {
    setSaveError("");
    try {
      await saveData(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Save failed — check your connection.");
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
            ) : (
              <span className="text-xs text-muted-foreground hidden sm:block">— edits both languages simultaneously</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {error && <span className="text-xs text-red-500 hidden sm:block">{error}</span>}
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
