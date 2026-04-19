import { useState, useEffect } from "react";
import { useResumeData } from "@/context/ResumeDataContext";
import { AchievementIcon, ICON_OPTIONS } from "@/lib/achievementIcons";

type ResumeData = ReturnType<typeof useResumeData>["data"];

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  dir = "auto",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  dir?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {multiline ? (
        <textarea
          className="cosmic-input min-h-[80px] resize-y leading-relaxed"
          value={String(value)}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="cosmic-input"
          value={String(value)}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-4 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function BilingualFields({
  labelEn,
  labelAr,
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  multiline = false,
}: {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (v: string) => void;
  onChangeAr: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label={`🇬🇧 ${labelEn}`} value={valueEn} onChange={onChangeEn} multiline={multiline} dir="ltr" />
      <Field label={`🇸🇦 ${labelAr}`} value={valueAr} onChange={onChangeAr} multiline={multiline} dir="rtl" />
    </div>
  );
}

function TagsEditor({
  label,
  tags,
  onChange,
  dir = "ltr",
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  dir?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput(""); }
  };
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border bg-muted text-foreground">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          dir={dir}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type & press Enter"
          className="cosmic-input text-sm py-1.5"
        />
        <button type="button" onClick={add} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-all whitespace-nowrap">Add</button>
      </div>
    </div>
  );
}

function HighlightsEditor({
  labelEn,
  labelAr,
  itemsEn,
  itemsAr,
  onChangeEn,
  onChangeAr,
}: {
  labelEn: string;
  labelAr: string;
  itemsEn: string[];
  itemsAr: string[];
  onChangeEn: (items: string[]) => void;
  onChangeAr: (items: string[]) => void;
}) {
  const maxLen = Math.max(itemsEn.length, itemsAr.length);
  const rows = Array.from({ length: maxLen + 1 }, (_, i) => i);
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{labelEn} / {labelAr}</label>
      <div className="space-y-2">
        {rows.map((i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
            <input
              dir="ltr"
              placeholder={`🇬🇧 Highlight ${i + 1}`}
              className="cosmic-input text-sm py-1.5"
              value={itemsEn[i] ?? ""}
              onChange={(e) => {
                const next = [...itemsEn];
                if (e.target.value) { next[i] = e.target.value; } else { next.splice(i, 1); }
                onChangeEn(next.filter(Boolean));
              }}
            />
            <input
              dir="rtl"
              placeholder={`🇸🇦 نقطة ${i + 1}`}
              className="cosmic-input text-sm py-1.5 text-right"
              value={itemsAr[i] ?? ""}
              onChange={(e) => {
                const next = [...itemsAr];
                if (e.target.value) { next[i] = e.target.value; } else { next.splice(i, 1); }
                onChangeAr(next.filter(Boolean));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "personal",      labelEn: "Personal",      labelAr: "الشخصية" },
  { id: "skills",        labelEn: "Skills",         labelAr: "المهارات" },
  { id: "experience",    labelEn: "Experience",     labelAr: "الخبرة" },
  { id: "projects",      labelEn: "Projects",       labelAr: "المشاريع" },
  { id: "education",     labelEn: "Education",      labelAr: "التعليم" },
  { id: "languages",     labelEn: "Languages",      labelAr: "اللغات" },
  { id: "achievements",  labelEn: "Achievements",   labelAr: "الإنجازات" },
  { id: "comments",      labelEn: "Comments",       labelAr: "التعليقات" },
] as const;

type TabId = typeof TABS[number]["id"];

type AdminComment = {
  id: number;
  name: string;
  message: string;
  likes: number;
  approved: boolean;
  createdAt: string;
};

function CommentsTab() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const storedToken = sessionStorage.getItem("cv-admin-token");
  const adminToken = (storedToken && storedToken !== "dev-token") ? storedToken : "Zoom100*";

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/comments/all", {
        headers: { "X-Admin-Key": adminToken },
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, []);

  const approve = async (id: number) => {
    setActionId(id);
    try {
      await fetch(`/api/comments/${id}/approve`, {
        method: "POST",
        headers: { "X-Admin-Key": adminToken },
      });
      setComments((prev) => prev.map((c) => c.id === id ? { ...c, approved: true } : c));
    } catch {}
    setActionId(null);
  };

  const deleteComment = async (id: number) => {
    if (!confirm("حذف هذا التعليق؟")) return;
    setActionId(id);
    try {
      await fetch(`/api/comments/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": adminToken },
      });
      setComments((prev) => prev.filter((c) => c.id !== id));
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
                        <button
                          onClick={() => approve(c.id)}
                          disabled={actionId === c.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all"
                        >
                          ✓ قبول
                        </button>
                        <button
                          onClick={() => deleteComment(c.id)}
                          disabled={actionId === c.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                        >
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
                      <button
                        onClick={() => deleteComment(c.id)}
                        disabled={actionId === c.id}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
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

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { data, setData, saveData, resetData, saving } = useResumeData();
  const [saved, setSaved] = useState(false);
  const [error, setSaveError] = useState("");
  const [tab, setTab] = useState<TabId>("personal");

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

  const upExp = (i: number, patch: Partial<ResumeData["experience"][0]>) =>
    setData((p) => ({ ...p, experience: p.experience.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  const upProj = (i: number, patch: Partial<ResumeData["projects"][0]>) =>
    setData((p) => ({ ...p, projects: p.projects.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  const upEdu = (i: number, patch: Partial<ResumeData["education"][0]>) =>
    setData((p) => ({ ...p, education: p.education.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  type AchItem = ResumeData["achievements"][0];
  const upAch = (i: number, patch: Partial<AchItem>) =>
    setData((p) => ({
      ...p,
      achievements: (p.achievements ?? []).map((a, idx) => idx === i ? { ...a, ...patch } : a),
    }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
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
            <span className="text-xs text-muted-foreground hidden sm:block">— edits all languages simultaneously</span>
          </div>
          <div className="flex items-center gap-1.5">
            {error && <span className="text-xs text-red-500 hidden sm:block">{error}</span>}
            <button onClick={handleReset} disabled={saving} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all disabled:opacity-50">
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60 ${
                saved ? "bg-emerald-600 text-white" : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {saving ? "Saving…" : saved ? "✓ Saved to DB" : "Save"}
            </button>
            <button onClick={() => { sessionStorage.removeItem("cv-admin"); onLogout(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all">
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
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
                tab === t.id
                  ? "bg-foreground text-background shadow-md dark:bg-[hsl(220_18%_93%)] dark:text-[hsl(240_24%_5%)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <span>{t.labelEn}</span>
              <span className="opacity-40 hidden sm:inline">·</span>
              <span className="opacity-60 text-[10px]">{t.labelAr}</span>
            </button>
          ))}
        </div>

        {/* ── PERSONAL ── */}
        {tab === "personal" && (
          <div className="space-y-5">
            <SectionHeader title="Contact Info" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" value={data.personal.name} onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, name: v } }))} />
              <Field label="Email" value={data.personal.email} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, email: v } }))} />
              <Field label="Phone" value={data.personal.phone} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, phone: v } }))} />
              <Field label="WhatsApp (number only)" value={data.personal.whatsapp} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, whatsapp: v } }))} />
              <Field label="GitHub URL" value={data.personal.github} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, github: v } }))} />
              <Field label="LinkedIn URL" value={data.personal.linkedin} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, linkedin: v } }))} />
              <Field label="Website URL" value={data.personal.website} dir="ltr" onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, website: v } }))} />
            </div>

            <SectionHeader title="Title & Location (both languages)" />
            <BilingualFields
              labelEn="Title (EN)" labelAr="المسمى الوظيفي"
              valueEn={data.personal.en.title} valueAr={data.personal.ar.title}
              onChangeEn={(v) => setData((p) => ({ ...p, personal: { ...p.personal, en: { ...p.personal.en, title: v } } }))}
              onChangeAr={(v) => setData((p) => ({ ...p, personal: { ...p.personal, ar: { ...p.personal.ar, title: v } } }))}
            />
            <BilingualFields
              labelEn="Location (EN)" labelAr="الموقع"
              valueEn={data.personal.en.location} valueAr={data.personal.ar.location}
              onChangeEn={(v) => setData((p) => ({ ...p, personal: { ...p.personal, en: { ...p.personal.en, location: v } } }))}
              onChangeAr={(v) => setData((p) => ({ ...p, personal: { ...p.personal, ar: { ...p.personal.ar, location: v } } }))}
            />
            <BilingualFields
              labelEn="Bio (EN)" labelAr="النبذة الشخصية"
              valueEn={data.personal.en.bio} valueAr={data.personal.ar.bio}
              onChangeEn={(v) => setData((p) => ({ ...p, personal: { ...p.personal, en: { ...p.personal.en, bio: v } } }))}
              onChangeAr={(v) => setData((p) => ({ ...p, personal: { ...p.personal, ar: { ...p.personal.ar, bio: v } } }))}
              multiline
            />

            <SectionHeader title="Typewriter Taglines" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TagsEditor
                label="🇬🇧 Taglines EN (one per tag)"
                tags={data.personal.en.taglines}
                dir="ltr"
                onChange={(tags) => setData((p) => ({ ...p, personal: { ...p.personal, en: { ...p.personal.en, taglines: tags } } }))}
              />
              <TagsEditor
                label="🇸🇦 شعارات AR"
                tags={data.personal.ar.taglines}
                dir="rtl"
                onChange={(tags) => setData((p) => ({ ...p, personal: { ...p.personal, ar: { ...p.personal.ar, taglines: tags } } }))}
              />
            </div>

            <SectionHeader title="GitHub Stats (manual fallback)" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {(["commits", "repos", "followers", "stars", "since"] as const).map((field) => (
                <Field
                  key={field}
                  label={field.charAt(0).toUpperCase() + field.slice(1)}
                  type="number"
                  value={data.personal.stats[field]}
                  onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, stats: { ...p.personal.stats, [field]: parseInt(v) || 0 } } }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {tab === "skills" && (
          <div className="space-y-4">
            <SectionHeader title="Skills" />
            <div className="space-y-3">
              {data.skills.map((skill, i) => (
                <div key={skill.id} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold">{skill.name}</span>
                    <button
                      onClick={() => setData((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label="Name" value={skill.name} onChange={(v) => setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, name: v } : s) }))} />
                    <Field label="Level %" type="number" value={skill.level} onChange={(v) => setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, level: Math.min(100, Math.max(0, parseInt(v) || 0)) } : s) }))} />
                    <Field label="🇬🇧 Category EN" value={skill.category_en} dir="ltr" onChange={(v) => setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, category_en: v } : s) }))} />
                    <Field label="🇸🇦 الفئة AR" value={skill.category_ar} dir="rtl" onChange={(v) => setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, category_ar: v } : s) }))} />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setData((p) => ({ ...p, skills: [...p.skills, { id: `skill-${Date.now()}`, name: "New Skill", level: 50, category_en: "Other", category_ar: "أخرى" }] }))}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Skill
            </button>
          </div>
        )}

        {/* ── EXPERIENCE ── */}
        {tab === "experience" && (
          <div className="space-y-4">
            <SectionHeader title="Work Experience" />
            {data.experience.map((exp, i) => (
              <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{exp.company}</span>
                  <button onClick={() => setData((p) => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }))} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Company" value={exp.company} onChange={(v) => upExp(i, { company: v })} />
                  <Field label="Period" value={exp.period} dir="ltr" onChange={(v) => upExp(i, { period: v })} />
                </div>
                <BilingualFields
                  labelEn="Role (EN)" labelAr="المنصب"
                  valueEn={exp.en.role} valueAr={exp.ar.role}
                  onChangeEn={(v) => upExp(i, { en: { ...exp.en, role: v } })}
                  onChangeAr={(v) => upExp(i, { ar: { ...exp.ar, role: v } })}
                />
                <BilingualFields
                  labelEn="Location (EN)" labelAr="الموقع"
                  valueEn={exp.en.location} valueAr={exp.ar.location}
                  onChangeEn={(v) => upExp(i, { en: { ...exp.en, location: v } })}
                  onChangeAr={(v) => upExp(i, { ar: { ...exp.ar, location: v } })}
                />
                <BilingualFields
                  labelEn="Description (EN)" labelAr="الوصف"
                  valueEn={exp.en.description} valueAr={exp.ar.description}
                  onChangeEn={(v) => upExp(i, { en: { ...exp.en, description: v } })}
                  onChangeAr={(v) => upExp(i, { ar: { ...exp.ar, description: v } })}
                  multiline
                />
                <HighlightsEditor
                  labelEn="Highlights (EN)" labelAr="الإنجازات"
                  itemsEn={exp.en.highlights} itemsAr={exp.ar.highlights}
                  onChangeEn={(items) => upExp(i, { en: { ...exp.en, highlights: items } })}
                  onChangeAr={(items) => upExp(i, { ar: { ...exp.ar, highlights: items } })}
                />
              </div>
            ))}
            <button
              onClick={() => setData((p) => ({
                ...p,
                experience: [...p.experience, {
                  company: "New Company", period: "2024 – Present",
                  en: { role: "Engineer", location: "Remote", description: "", highlights: [] },
                  ar: { role: "مهندس", location: "عن بُعد", description: "", highlights: [] },
                }],
              }))}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Experience
            </button>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {tab === "projects" && (
          <div className="space-y-4">
            <SectionHeader title="Projects" />
            {data.projects.map((proj, i) => (
              <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{proj.name}</span>
                  <button onClick={() => setData((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }))} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Name" value={proj.name} onChange={(v) => upProj(i, { name: v })} />
                  <Field label="Language" value={proj.language} onChange={(v) => upProj(i, { language: v })} />
                  <Field label="URL (no https://)" value={proj.url} dir="ltr" onChange={(v) => upProj(i, { url: v })} />
                  <Field label="Stars" type="number" value={proj.stars} onChange={(v) => upProj(i, { stars: parseInt(v) || 0 })} />
                  <Field label="Forks" type="number" value={proj.forks} onChange={(v) => upProj(i, { forks: parseInt(v) || 0 })} />
                </div>
                <BilingualFields
                  labelEn="Description (EN)" labelAr="الوصف"
                  valueEn={proj.en.description} valueAr={proj.ar.description}
                  onChangeEn={(v) => upProj(i, { en: { description: v } })}
                  onChangeAr={(v) => upProj(i, { ar: { description: v } })}
                  multiline
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TagsEditor
                    label="🇬🇧 Tags EN"
                    tags={proj.tags_en}
                    dir="ltr"
                    onChange={(tags) => upProj(i, { tags_en: tags })}
                  />
                  <TagsEditor
                    label="🇸🇦 الوسوم AR"
                    tags={proj.tags_ar}
                    dir="rtl"
                    onChange={(tags) => upProj(i, { tags_ar: tags })}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setData((p) => ({
                ...p,
                projects: [...p.projects, {
                  name: "New Project", stars: 0, forks: 0, language: "JavaScript",
                  tags_en: [], tags_ar: [],
                  url: "github.com/Farisatif/",
                  en: { description: "" },
                  ar: { description: "" },
                }],
              }))}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Project
            </button>
          </div>
        )}

        {/* ── EDUCATION ── */}
        {tab === "education" && (
          <div className="space-y-4">
            <SectionHeader title="Education" />
            {data.education.map((edu, i) => (
              <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{edu.school}</span>
                  <button onClick={() => setData((p) => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }))} className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="School / University" value={edu.school} onChange={(v) => upEdu(i, { school: v })} />
                  <Field label="Period" value={edu.period} dir="ltr" onChange={(v) => upEdu(i, { period: v })} />
                  <Field label="GPA" value={edu.gpa} dir="ltr" onChange={(v) => upEdu(i, { gpa: v })} />
                </div>
                <BilingualFields
                  labelEn="Degree (EN)" labelAr="الدرجة العلمية"
                  valueEn={edu.en.degree} valueAr={edu.ar.degree}
                  onChangeEn={(v) => upEdu(i, { en: { ...edu.en, degree: v } })}
                  onChangeAr={(v) => upEdu(i, { ar: { ...edu.ar, degree: v } })}
                />
                <HighlightsEditor
                  labelEn="Highlights (EN)" labelAr="الإنجازات"
                  itemsEn={edu.en.highlights} itemsAr={edu.ar.highlights}
                  onChangeEn={(items) => upEdu(i, { en: { ...edu.en, highlights: items } })}
                  onChangeAr={(items) => upEdu(i, { ar: { ...edu.ar, highlights: items } })}
                />
              </div>
            ))}
            <button
              onClick={() => setData((p) => ({
                ...p,
                education: [...p.education, {
                  school: "University", period: "2020 – 2024", gpa: "3.5",
                  en: { degree: "B.S. Computer Science", highlights: [] },
                  ar: { degree: "بكالوريوس علوم الحاسوب", highlights: [] },
                }],
              }))}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Education
            </button>
          </div>
        )}

        {/* ── LANGUAGES ── */}
        {tab === "languages" && (
          <div className="space-y-4">
            <SectionHeader title="Programming Languages Bar" />
            <p className="text-xs text-muted-foreground -mt-2">
              These are the default percentages shown in the interactive bar. Visitors can drag them, but their view resets on reload.
            </p>
            <div className="space-y-3">
              {data.languages.map((langItem, i) => (
                <div key={i} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${[
                        "bg-emerald-500","bg-blue-500","bg-violet-500","bg-amber-500",
                        "bg-rose-500","bg-cyan-500","bg-orange-500","bg-pink-500",
                        "bg-teal-500","bg-indigo-500",
                      ][i % 10]}`} />
                      <span className="font-mono text-sm font-semibold">{langItem.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{langItem.percent}%</span>
                    </div>
                    <button
                      onClick={() => setData((p) => ({ ...p, languages: p.languages.filter((_, idx) => idx !== i) }))}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Language Name"
                      value={langItem.name}
                      onChange={(v) => setData((p) => ({ ...p, languages: p.languages.map((l, idx) => idx === i ? { ...l, name: v } : l) }))}
                    />
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground">
                        Default % — <span className="font-mono">{langItem.percent}%</span>
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={80}
                        value={langItem.percent}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setData((p) => ({
                            ...p,
                            languages: p.languages.map((l, idx) => idx === i ? { ...l, percent: val } : l),
                          }));
                        }}
                        className="w-full accent-foreground"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setData((p) => ({ ...p, languages: [...p.languages, { name: "New Language", percent: 5 }] }))}
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Language
            </button>
          </div>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {tab === "achievements" && (
          <div className="space-y-4">
            <SectionHeader title="Achievements / الإنجازات" />
            <p className="text-xs text-muted-foreground -mt-2">
              Each card shows on the CV with a colored icon, title, description, and badge. Changes are saved to the database and reflected immediately.
            </p>
            {(data.achievements ?? []).map((ach, i) => (
              <div key={ach.id ?? i} className="border border-border rounded-xl p-5 bg-card space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0"
                      style={{
                        background: `hsl(${ach.accent} / 0.12)`,
                        color: `hsl(${ach.accent})`,
                        borderColor: `hsl(${ach.accent} / 0.25)`,
                      }}
                    >
                      <AchievementIcon name={ach.icon} size={18} />
                    </div>
                    <span className="font-semibold text-sm truncate max-w-[200px]">{ach.title_en}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Move up */}
                    <button
                      onClick={() => {
                        if (i === 0) return;
                        setData((p) => {
                          const arr = [...(p.achievements ?? [])];
                          [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                          return { ...p, achievements: arr };
                        });
                      }}
                      disabled={i === 0}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-1"
                      title="Move up"
                    >↑</button>
                    {/* Move down */}
                    <button
                      onClick={() => {
                        const arr = data.achievements ?? [];
                        if (i >= arr.length - 1) return;
                        setData((p) => {
                          const a = [...(p.achievements ?? [])];
                          [a[i], a[i + 1]] = [a[i + 1], a[i]];
                          return { ...p, achievements: a };
                        });
                      }}
                      disabled={i >= (data.achievements ?? []).length - 1}
                      className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-1"
                      title="Move down"
                    >↓</button>
                    <button
                      onClick={() => {
                        if (!confirm("Delete this achievement?")) return;
                        setData((p) => ({
                          ...p,
                          achievements: (p.achievements ?? []).filter((_, idx) => idx !== i),
                        }));
                      }}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Icon + Accent row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Icon</label>
                    <select
                      className="cosmic-input text-sm"
                      value={ach.icon}
                      onChange={(e) => upAch(i, { icon: e.target.value })}
                    >
                      {ICON_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Accent Color <span className="normal-case opacity-60">(HSL without hsl())</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        className="cosmic-input text-sm flex-1 font-mono"
                        value={ach.accent}
                        placeholder="263 80% 68%"
                        onChange={(e) => upAch(i, { accent: e.target.value })}
                      />
                      <div
                        className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
                        style={{ background: `hsl(${ach.accent})` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Titles */}
                <BilingualFields
                  labelEn="Title (EN)" labelAr="العنوان"
                  valueEn={ach.title_en} valueAr={ach.title_ar}
                  onChangeEn={(v) => upAch(i, { title_en: v })}
                  onChangeAr={(v) => upAch(i, { title_ar: v })}
                />

                {/* Descriptions */}
                <BilingualFields
                  labelEn="Description (EN)" labelAr="الوصف"
                  valueEn={ach.desc_en} valueAr={ach.desc_ar}
                  onChangeEn={(v) => upAch(i, { desc_en: v })}
                  onChangeAr={(v) => upAch(i, { desc_ar: v })}
                  multiline
                />

                {/* Badges */}
                <BilingualFields
                  labelEn="Badge Label (EN)" labelAr="اسم الشارة"
                  valueEn={ach.badge_en} valueAr={ach.badge_ar}
                  onChangeEn={(v) => upAch(i, { badge_en: v })}
                  onChangeAr={(v) => upAch(i, { badge_ar: v })}
                />
              </div>
            ))}

            {/* Add new */}
            <button
              onClick={() =>
                setData((p) => ({
                  ...p,
                  achievements: [
                    ...(p.achievements ?? []),
                    {
                      id: `ach-${Date.now()}`,
                      icon: "star",
                      title_en: "New Achievement",
                      title_ar: "إنجاز جديد",
                      desc_en: "Describe this achievement.",
                      desc_ar: "وصف هذا الإنجاز.",
                      badge_en: "Badge",
                      badge_ar: "شارة",
                      accent: "263 80% 68%",
                    },
                  ],
                }))
              }
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + Add Achievement
            </button>
          </div>
        )}

        {/* ── COMMENTS ── */}
        {tab === "comments" && <CommentsTab />}

        {tab !== "comments" && (
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              All edits in both languages. Press <strong>Save</strong> to write permanently to the database — visible to everyone instantly.
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${
                saved ? "bg-emerald-600 text-white" : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {saving ? "Saving…" : saved ? "✓ Saved" : "Save"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
