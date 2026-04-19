import { Field, SectionHeader, BilingualFields, HighlightsEditor, ADD_BTN, type ResumeData, type SetData } from "./adminShared";

export function EducationTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const up = (i: number, patch: Partial<ResumeData["education"][0]>) =>
    setData((p) => ({ ...p, education: p.education.map((e, idx) => idx === i ? { ...e, ...patch } : e) }));

  return (
    <div className="space-y-4">
      <SectionHeader title="Education" />
      {data.education.map((edu, i) => (
        <div key={i} className="border border-border rounded-xl p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{edu.school}</span>
            <button onClick={() => setData((p) => ({ ...p, education: p.education.filter((_, idx) => idx !== i) }))}
              className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="School / University" value={edu.school} onChange={(v) => up(i, { school: v })} />
            <Field label="Period" value={edu.period} dir="ltr" onChange={(v) => up(i, { period: v })} />
            <Field label="GPA" value={edu.gpa} dir="ltr" onChange={(v) => up(i, { gpa: v })} />
          </div>
          <BilingualFields labelEn="Degree (EN)" labelAr="الدرجة العلمية"
            valueEn={edu.en.degree} valueAr={edu.ar.degree}
            onChangeEn={(v) => up(i, { en: { ...edu.en, degree: v } })}
            onChangeAr={(v) => up(i, { ar: { ...edu.ar, degree: v } })} />
          <HighlightsEditor labelEn="Highlights (EN)" labelAr="الإنجازات"
            itemsEn={edu.en.highlights} itemsAr={edu.ar.highlights}
            onChangeEn={(items) => up(i, { en: { ...edu.en, highlights: items } })}
            onChangeAr={(items) => up(i, { ar: { ...edu.ar, highlights: items } })} />
        </div>
      ))}
      <button onClick={() => setData((p) => ({
        ...p,
        education: [...p.education, {
          school: "University", period: "2020 – 2024", gpa: "3.5",
          en: { degree: "B.S. Computer Science", highlights: [] },
          ar: { degree: "بكالوريوس علوم الحاسوب", highlights: [] },
        }],
      }))} className={ADD_BTN}>
        + Add Education
      </button>
    </div>
  );
}
