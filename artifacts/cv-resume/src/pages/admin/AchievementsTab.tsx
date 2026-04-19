import { SectionHeader, BilingualFields, ADD_BTN, type ResumeData, type SetData } from "./adminShared";
import { AchievementIcon, ICON_OPTIONS } from "@/lib/achievementIcons";

export function AchievementsTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const achievements = data.achievements ?? [];
  const up = (i: number, patch: Partial<ResumeData["achievements"][0]>) =>
    setData((p) => ({ ...p, achievements: (p.achievements ?? []).map((a, idx) => idx === i ? { ...a, ...patch } : a) }));

  const move = (i: number, dir: -1 | 1) => {
    setData((p) => {
      const arr = [...(p.achievements ?? [])];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, achievements: arr };
    });
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="Achievements / الإنجازات" />
      <p className="text-xs text-muted-foreground -mt-2">
        Each card shows on the CV with a colored icon, title, description, and badge.
      </p>

      {achievements.map((ach, i) => (
        <div key={ach.id ?? i} className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center border flex-shrink-0"
                style={{ background: `hsl(${ach.accent} / 0.12)`, color: `hsl(${ach.accent})`, borderColor: `hsl(${ach.accent} / 0.25)` }}>
                <AchievementIcon name={ach.icon} size={18} />
              </div>
              <span className="font-semibold text-sm truncate max-w-[200px]">{ach.title_en}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-1" title="Move up">↑</button>
              <button onClick={() => move(i, 1)} disabled={i >= achievements.length - 1}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors px-1" title="Move down">↓</button>
              <button onClick={() => { if (!confirm("Delete this achievement?")) return; setData((p) => ({ ...p, achievements: (p.achievements ?? []).filter((_, idx) => idx !== i) })); }}
                className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Icon</label>
              <select className="cosmic-input text-sm" value={ach.icon} onChange={(e) => up(i, { icon: e.target.value })}>
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
                <input type="text" className="cosmic-input text-sm flex-1 font-mono"
                  value={ach.accent} placeholder="263 80% 68%" onChange={(e) => up(i, { accent: e.target.value })} />
                <div className="w-8 h-8 rounded-lg border border-border flex-shrink-0" style={{ background: `hsl(${ach.accent})` }} />
              </div>
            </div>
          </div>

          <BilingualFields labelEn="Title (EN)" labelAr="العنوان"
            valueEn={ach.title_en} valueAr={ach.title_ar}
            onChangeEn={(v) => up(i, { title_en: v })} onChangeAr={(v) => up(i, { title_ar: v })} />
          <BilingualFields labelEn="Description (EN)" labelAr="الوصف"
            valueEn={ach.desc_en} valueAr={ach.desc_ar}
            onChangeEn={(v) => up(i, { desc_en: v })} onChangeAr={(v) => up(i, { desc_ar: v })} multiline />
          <BilingualFields labelEn="Badge Label (EN)" labelAr="اسم الشارة"
            valueEn={ach.badge_en} valueAr={ach.badge_ar}
            onChangeEn={(v) => up(i, { badge_en: v })} onChangeAr={(v) => up(i, { badge_ar: v })} />
        </div>
      ))}

      <button onClick={() => setData((p) => ({
        ...p,
        achievements: [...(p.achievements ?? []), {
          id: `ach-${Date.now()}`, icon: "star",
          title_en: "New Achievement", title_ar: "إنجاز جديد",
          desc_en: "Describe this achievement.", desc_ar: "وصف هذا الإنجاز.",
          badge_en: "Badge", badge_ar: "شارة", accent: "263 80% 68%",
        }],
      }))} className={ADD_BTN}>
        + Add Achievement
      </button>
    </div>
  );
}
