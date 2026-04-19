import { Field, SectionHeader, ADD_BTN, type ResumeData, type SetData } from "./adminShared";

export function SkillsTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const upSkill = (i: number, patch: Partial<ResumeData["skills"][0]>) =>
    setData((p) => ({ ...p, skills: p.skills.map((s, idx) => idx === i ? { ...s, ...patch } : s) }));

  return (
    <div className="space-y-4">
      <SectionHeader title="Skills" />
      <div className="space-y-3">
        {data.skills.map((skill, i) => (
          <div key={skill.id} className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm font-semibold">{skill.name}</span>
              <button onClick={() => setData((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))}
                className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Name" value={skill.name} onChange={(v) => upSkill(i, { name: v })} />
              <Field label="Level %" type="number" value={skill.level}
                onChange={(v) => upSkill(i, { level: Math.min(100, Math.max(0, parseInt(v) || 0)) })} />
              <Field label="🇬🇧 Category EN" value={skill.category_en} dir="ltr" onChange={(v) => upSkill(i, { category_en: v })} />
              <Field label="🇸🇦 الفئة AR" value={skill.category_ar} dir="rtl" onChange={(v) => upSkill(i, { category_ar: v })} />
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setData((p) => ({ ...p, skills: [...p.skills, { id: `skill-${Date.now()}`, name: "New Skill", level: 50, category_en: "Other", category_ar: "أخرى" }] }))}
        className={ADD_BTN}>
        + Add Skill
      </button>
    </div>
  );
}
