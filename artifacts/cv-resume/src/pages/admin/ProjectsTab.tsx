import { Field, SectionHeader, BilingualFields, TagsEditor, ADD_BTN, ReorderButtons, type ResumeData, type SetData } from "./adminShared";

export function ProjectsTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const up = (i: number, patch: Partial<ResumeData["projects"][0]>) =>
    setData((p) => ({ ...p, projects: p.projects.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  const move = (i: number, dir: -1 | 1) =>
    setData((p) => {
      const arr = [...p.projects];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, projects: arr };
    });

  return (
    <div className="space-y-4">
      <SectionHeader title="Projects" />
      {data.projects.map((proj, i) => (
        <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReorderButtons index={i} total={data.projects.length} onMove={(dir) => move(i, dir)} />
              <span className="font-semibold text-sm">{proj.name}</span>
              <span className="text-xs text-muted-foreground font-mono">{proj.language}</span>
            </div>
            <button onClick={() => setData((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }))}
              className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Name" value={proj.name} onChange={(v) => up(i, { name: v })} />
            <Field label="Language" value={proj.language} onChange={(v) => up(i, { language: v })} />
            <Field label="URL (no https://)" value={proj.url} dir="ltr" onChange={(v) => up(i, { url: v })} />
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">
            ⭐ Stars and forks are fetched live from GitHub — no need to edit them here.
          </p>
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
