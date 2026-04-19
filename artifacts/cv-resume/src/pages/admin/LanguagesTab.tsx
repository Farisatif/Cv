import { Field, SectionHeader, ADD_BTN, type ResumeData, type SetData } from "./adminShared";

const COLOR_CLASSES = [
  "bg-emerald-500","bg-blue-500","bg-violet-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-orange-500","bg-pink-500",
  "bg-teal-500","bg-indigo-500",
];

export function LanguagesTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const upLang = (i: number, patch: Partial<ResumeData["languages"][0]>) =>
    setData((p) => ({ ...p, languages: p.languages.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));

  return (
    <div className="space-y-4">
      <SectionHeader title="Programming Languages Bar" />
      <p className="text-xs text-muted-foreground -mt-2">
        These are the default percentages shown in the interactive bar. Visitors can drag them, but their view resets on reload.
      </p>
      <div className="space-y-3">
        {data.languages.map((lang, i) => (
          <div key={i} className="border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${COLOR_CLASSES[i % COLOR_CLASSES.length]}`} />
                <span className="font-mono text-sm font-semibold">{lang.name}</span>
                <span className="text-xs text-muted-foreground font-mono">{lang.percent}%</span>
              </div>
              <button onClick={() => setData((p) => ({ ...p, languages: p.languages.filter((_, idx) => idx !== i) }))}
                className="text-xs text-red-500 hover:text-red-700 transition-colors">Delete</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Language Name" value={lang.name} onChange={(v) => upLang(i, { name: v })} />
              <div className="space-y-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Default % — <span className="font-mono">{lang.percent}%</span>
                </label>
                <input type="range" min={1} max={80} value={lang.percent}
                  onChange={(e) => upLang(i, { percent: parseInt(e.target.value) })}
                  className="w-full accent-foreground" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setData((p) => ({ ...p, languages: [...p.languages, { name: "New Language", percent: 5 }] }))}
        className={ADD_BTN}>
        + Add Language
      </button>
    </div>
  );
}
