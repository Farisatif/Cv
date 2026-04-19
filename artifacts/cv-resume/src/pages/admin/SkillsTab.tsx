import { useState } from "react";
import { SectionHeader, ADD_BTN, ReorderButtons, type ResumeData, type SetData } from "./adminShared";

const LEVEL_COLOR = (level: number) =>
  level >= 80 ? "bg-emerald-500" :
  level >= 60 ? "bg-blue-500" :
  level >= 40 ? "bg-amber-500" : "bg-rose-500";

export function SkillsTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const [search, setSearch] = useState("");

  const upSkill = (i: number, patch: Partial<ResumeData["skills"][0]>) =>
    setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));

  const move = (i: number, dir: -1 | 1) =>
    setData((p) => {
      const arr = [...p.skills];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, skills: arr };
    });

  const filtered = data.skills
    .map((s, i) => ({ ...s, _idx: i }))
    .filter((s) =>
      !search.trim() ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category_en.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <SectionHeader title="Skills" />

      {/* Search */}
      <div className="relative">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${data.skills.length} skills…`}
          className="cosmic-input pl-8 text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-base leading-none">
            ×
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((skill) => {
          const i = skill._idx;
          return (
            <div key={skill.id} className="border border-border rounded-xl p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ReorderButtons index={i} total={data.skills.length} onMove={(dir) => move(i, dir)} />
                  <span className="font-mono text-sm font-semibold">{skill.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-mono ${LEVEL_COLOR(skill.level)}`}>
                    {skill.level}%
                  </span>
                </div>
                <button onClick={() => setData((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Name</label>
                  <input type="text" className="cosmic-input" value={skill.name} onChange={(e) => upSkill(i, { name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">🇬🇧 Category</label>
                    <input type="text" className="cosmic-input" dir="ltr" value={skill.category_en} onChange={(e) => upSkill(i, { category_en: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">🇸🇦 الفئة</label>
                    <input type="text" className="cosmic-input" dir="rtl" value={skill.category_ar} onChange={(e) => upSkill(i, { category_ar: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* Range slider for level */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Level — <span className="font-mono">{skill.level}%</span>
                  </label>
                  <div className="flex items-center gap-1">
                    {[25, 50, 75, 100].map((v) => (
                      <button key={v} onClick={() => upSkill(i, { level: v })}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-all ${
                          skill.level === v ? "border-foreground/40 bg-muted text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={skill.level}
                    onChange={(e) => upSkill(i, { level: parseInt(e.target.value) })}
                    className="flex-1 accent-foreground"
                  />
                </div>
                {/* Visual level bar */}
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${LEVEL_COLOR(skill.level)}`}
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && search && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No skills match "<span className="font-mono">{search}</span>"
        </div>
      )}

      <button onClick={() => setData((p) => ({ ...p, skills: [...p.skills, { id: `skill-${Date.now()}`, name: "New Skill", level: 50, category_en: "Other", category_ar: "أخرى" }] }))}
        className={ADD_BTN}>
        + Add Skill
      </button>
    </div>
  );
}
