import { Field, SectionHeader, BilingualFields, TagsEditor, ADD_BTN, type ResumeData, type SetData } from "./adminShared";

export function ProjectsTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const up = (i: number, patch: Partial<ResumeData["projects"][0]>) =>
    setData((p) => ({ ...p, projects: p.projects.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  return (
    <div className="space-y-4">
      <SectionHeader title="Projects" />
      {data.projects.map((proj, i) => (
        <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{proj.name}</span>
            <button onClick={() => setData((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }))}
              className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Name" value={proj.name} onChange={(v) => up(i, { name: v })} />
            <Field label="Language" value={proj.language} onChange={(v) => up(i, { language: v })} />
            <Field label="URL (no https://)" value={proj.url} dir="ltr" onChange={(v) => up(i, { url: v })} />
            <Field label="Stars" type="number" value={proj.stars} onChange={(v) => up(i, { stars: parseInt(v) || 0 })} />
            <Field label="Forks" type="number" value={proj.forks} onChange={(v) => up(i, { forks: parseInt(v) || 0 })} />
          </div>
          <BilingualFields labelEn="Description (EN)" labelAr="الوصف"
            valueEn={proj.en.description} valueAr={proj.ar.description}
            onChangeEn={(v) => up(i, { en: { description: v } })}
            onChangeAr={(v) => up(i, { ar: { description: v } })} multiline />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TagsEditor label="🇬🇧 Tags EN" tags={proj.tags_en} dir="ltr" onChange={(tags) => up(i, { tags_en: tags })} />
            <TagsEditor label="🇸🇦 الوسوم AR" tags={proj.tags_ar} dir="rtl" onChange={(tags) => up(i, { tags_ar: tags })} />
          </div>
        </div>
      ))}
      <button onClick={() => setData((p) => ({
        ...p,
        projects: [...p.projects, {
          name: "New Project", stars: 0, forks: 0, language: "JavaScript",
          tags_en: [], tags_ar: [], url: "github.com/Farisatif/",
          en: { description: "" }, ar: { description: "" },
        }],
      }))} className={ADD_BTN}>
        + Add Project
      </button>
    </div>
  );
}
