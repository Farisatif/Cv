import { Field, SectionHeader, BilingualFields, HighlightsEditor, ADD_BTN, type ResumeData, type SetData } from "./adminShared";

export function ExperienceTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const up = (i: number, patch: Partial<ResumeData["experience"][0]>) =>
    setData((p) => ({ ...p, experience: p.experience.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  return (
    <div className="space-y-4">
      <SectionHeader title="Work Experience" />
      {data.experience.map((exp, i) => (
        <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{exp.company}</span>
            <button onClick={() => setData((p) => ({ ...p, experience: p.experience.filter((_, idx) => idx !== i) }))}
              className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Company" value={exp.company} onChange={(v) => up(i, { company: v })} />
            <Field label="Period" value={exp.period} dir="ltr" onChange={(v) => up(i, { period: v })} />
          </div>
          <BilingualFields labelEn="Role (EN)" labelAr="المنصب"
            valueEn={exp.en.role} valueAr={exp.ar.role}
            onChangeEn={(v) => up(i, { en: { ...exp.en, role: v } })}
            onChangeAr={(v) => up(i, { ar: { ...exp.ar, role: v } })} />
          <BilingualFields labelEn="Location (EN)" labelAr="الموقع"
            valueEn={exp.en.location} valueAr={exp.ar.location}
            onChangeEn={(v) => up(i, { en: { ...exp.en, location: v } })}
            onChangeAr={(v) => up(i, { ar: { ...exp.ar, location: v } })} />
          <BilingualFields labelEn="Description (EN)" labelAr="الوصف"
            valueEn={exp.en.description} valueAr={exp.ar.description}
            onChangeEn={(v) => up(i, { en: { ...exp.en, description: v } })}
            onChangeAr={(v) => up(i, { ar: { ...exp.ar, description: v } })} multiline />
          <HighlightsEditor labelEn="Highlights (EN)" labelAr="الإنجازات"
            itemsEn={exp.en.highlights} itemsAr={exp.ar.highlights}
            onChangeEn={(items) => up(i, { en: { ...exp.en, highlights: items } })}
            onChangeAr={(items) => up(i, { ar: { ...exp.ar, highlights: items } })} />
        </div>
      ))}
      <button onClick={() => setData((p) => ({
        ...p,
        experience: [...p.experience, {
          company: "New Company", period: "2024 – Present",
          en: { role: "Engineer", location: "Remote", description: "", highlights: [] },
          ar: { role: "مهندس", location: "عن بُعد", description: "", highlights: [] },
        }],
      }))} className={ADD_BTN}>
        + Add Experience
      </button>
    </div>
  );
}
