import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import resumeRaw from "@/data/resume.json";

type Lang = "en" | "ar";

const STORAGE_KEY = "cv-admin-data";

function loadData() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return null;
}

function saveData(data: typeof resumeRaw) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border mb-4">
      <h2 className="text-base font-bold">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const cls =
    "w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all";
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {multiline ? (
        <textarea
          className={cls + " min-h-[80px] resize-y"}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className={cls}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { isRTL } = useLanguage();
  const [data, setData] = useState<typeof resumeRaw>(() => loadData() ?? resumeRaw);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"personal" | "skills" | "experience" | "projects" | "education">("personal");
  const lang: Lang = isRTL ? "ar" : "en";

  const handleSave = () => {
    saveData(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm(isRTL ? "هل أنت متأكد من إعادة الضبط؟" : "Reset all data to defaults?")) {
      localStorage.removeItem(STORAGE_KEY);
      setData(resumeRaw);
    }
  };

  const updatePersonal = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  const updatePersonalLang = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [lang]: { ...(prev.personal[lang] as Record<string, unknown>), [field]: value },
      },
    }));
  };

  const updateStats = (field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        stats: { ...prev.personal.stats, [field]: field === "since" ? parseInt(value) || 0 : parseInt(value) || 0 },
      },
    }));
  };

  const TABS = [
    { id: "personal" as const, label: isRTL ? "الشخصية" : "Personal" },
    { id: "skills" as const, label: isRTL ? "المهارات" : "Skills" },
    { id: "experience" as const, label: isRTL ? "الخبرة" : "Experience" },
    { id: "projects" as const, label: isRTL ? "المشاريع" : "Projects" },
    { id: "education" as const, label: isRTL ? "التعليم" : "Education" },
  ];

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <span className="font-bold text-sm">{isRTL ? "لوحة التحكم" : "Admin Panel"}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {isRTL ? "إعادة تعيين" : "Reset"}
            </button>
            <button
              onClick={handleSave}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                saved
                  ? "bg-green-600 text-white"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {saved ? (isRTL ? "✓ تم الحفظ" : "✓ Saved") : isRTL ? "حفظ" : "Save"}
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem("cv-admin");
                onLogout();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              {isRTL ? "خروج" : "Logout"}
            </button>
            <a
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {isRTL ? "← CV" : "← CV"}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 border border-border rounded-xl p-1 bg-muted/30 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* PERSONAL TAB */}
        {tab === "personal" && (
          <div className="space-y-4">
            <SectionHeader title={isRTL ? "المعلومات الشخصية" : "Personal Information"} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={isRTL ? "الاسم" : "Name"} value={data.personal.name} onChange={(v) => updatePersonal("name", v)} />
              <Field label={isRTL ? "البريد الإلكتروني" : "Email"} value={data.personal.email} onChange={(v) => updatePersonal("email", v)} />
              <Field label={isRTL ? "الهاتف" : "Phone"} value={data.personal.phone} onChange={(v) => updatePersonal("phone", v)} />
              <Field label="GitHub" value={data.personal.github} onChange={(v) => updatePersonal("github", v)} />
              <Field label="LinkedIn" value={data.personal.linkedin} onChange={(v) => updatePersonal("linkedin", v)} />
            </div>

            <SectionHeader title={isRTL ? "المحتوى النصي" : "Text Content"} />
            <div className="grid grid-cols-1 gap-4">
              <Field label={isRTL ? "المسمى الوظيفي" : "Title"} value={(data.personal[lang] as { title: string }).title} onChange={(v) => updatePersonalLang("title", v)} />
              <Field label={isRTL ? "الموقع" : "Location"} value={(data.personal[lang] as { location: string }).location} onChange={(v) => updatePersonalLang("location", v)} />
              <Field label={isRTL ? "نبذة شخصية" : "Bio"} value={(data.personal[lang] as { bio: string }).bio} onChange={(v) => updatePersonalLang("bio", v)} multiline />
            </div>

            <SectionHeader title={isRTL ? "الإحصائيات" : "Stats"} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label={isRTL ? "إيداعات" : "Commits"} value={data.personal.stats.commits} onChange={(v) => updateStats("commits", v)} type="number" />
              <Field label={isRTL ? "مستودعات" : "Repos"} value={data.personal.stats.repos} onChange={(v) => updateStats("repos", v)} type="number" />
              <Field label={isRTL ? "متابعون" : "Followers"} value={data.personal.stats.followers} onChange={(v) => updateStats("followers", v)} type="number" />
              <Field label={isRTL ? "نجوم" : "Stars"} value={data.personal.stats.stars} onChange={(v) => updateStats("stars", v)} type="number" />
              <Field label={isRTL ? "بداية البرمجة" : "Coding Since"} value={data.personal.stats.since} onChange={(v) => updateStats("since", v)} type="number" />
            </div>
          </div>
        )}

        {/* SKILLS TAB */}
        {tab === "skills" && (
          <div className="space-y-4">
            <SectionHeader title={isRTL ? "المهارات" : "Skills"} />
            <div className="space-y-3">
              {data.skills.map((skill, i) => (
                <div key={skill.id} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-sm font-semibold">{skill.name}</span>
                    <button
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          skills: prev.skills.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      {isRTL ? "حذف" : "Delete"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field label={isRTL ? "الاسم" : "Name"} value={skill.name} onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        skills: prev.skills.map((s, idx) => idx === i ? { ...s, name: v } : s),
                      }))
                    } />
                    <Field label={isRTL ? "المستوى %" : "Level %"} type="number" value={skill.level} onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        skills: prev.skills.map((s, idx) => idx === i ? { ...s, level: parseInt(v) || 0 } : s),
                      }))
                    } />
                    <Field label={isRTL ? "الفئة EN" : "Category EN"} value={skill.category_en} onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        skills: prev.skills.map((s, idx) => idx === i ? { ...s, category_en: v } : s),
                      }))
                    } />
                    <Field label={isRTL ? "الفئة AR" : "Category AR"} value={skill.category_ar} onChange={(v) =>
                      setData((prev) => ({
                        ...prev,
                        skills: prev.skills.map((s, idx) => idx === i ? { ...s, category_ar: v } : s),
                      }))
                    } />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  skills: [
                    ...prev.skills,
                    { id: `skill-${Date.now()}`, name: "New Skill", level: 50, category_en: "Other", category_ar: "أخرى" },
                  ],
                }))
              }
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + {isRTL ? "إضافة مهارة" : "Add Skill"}
            </button>
          </div>
        )}

        {/* EXPERIENCE TAB */}
        {tab === "experience" && (
          <div className="space-y-4">
            <SectionHeader title={isRTL ? "الخبرة العملية" : "Experience"} />
            {data.experience.map((exp, i) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{exp.company}</span>
                  <button
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        experience: prev.experience.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    {isRTL ? "حذف" : "Delete"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={isRTL ? "الشركة" : "Company"} value={exp.company} onChange={(v) =>
                    setData((prev) => ({ ...prev, experience: prev.experience.map((e, idx) => idx === i ? { ...e, company: v } : e) }))
                  } />
                  <Field label={isRTL ? "الفترة" : "Period"} value={exp.period} onChange={(v) =>
                    setData((prev) => ({ ...prev, experience: prev.experience.map((e, idx) => idx === i ? { ...e, period: v } : e) }))
                  } />
                  <Field label={isRTL ? "المنصب" : "Role"} value={exp[lang].role} onChange={(v) =>
                    setData((prev) => ({ ...prev, experience: prev.experience.map((e, idx) => idx === i ? { ...e, [lang]: { ...e[lang], role: v } } : e) }))
                  } />
                  <Field label={isRTL ? "الموقع" : "Location"} value={exp[lang].location} onChange={(v) =>
                    setData((prev) => ({ ...prev, experience: prev.experience.map((e, idx) => idx === i ? { ...e, [lang]: { ...e[lang], location: v } } : e) }))
                  } />
                </div>
                <Field label={isRTL ? "الوصف" : "Description"} value={exp[lang].description} onChange={(v) =>
                  setData((prev) => ({ ...prev, experience: prev.experience.map((e, idx) => idx === i ? { ...e, [lang]: { ...e[lang], description: v } } : e) }))
                } multiline />
              </div>
            ))}
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  experience: [
                    ...prev.experience,
                    {
                      company: "New Company",
                      period: "2024 – Present",
                      en: { role: "Engineer", location: "Remote", description: "", highlights: [] },
                      ar: { role: "مهندس", location: "عن بُعد", description: "", highlights: [] },
                    },
                  ],
                }))
              }
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + {isRTL ? "إضافة خبرة" : "Add Experience"}
            </button>
          </div>
        )}

        {/* PROJECTS TAB */}
        {tab === "projects" && (
          <div className="space-y-4">
            <SectionHeader title={isRTL ? "المشاريع" : "Projects"} />
            {data.projects.map((proj, i) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{proj.name}</span>
                  <button
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        projects: prev.projects.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    {isRTL ? "حذف" : "Delete"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label={isRTL ? "الاسم" : "Name"} value={proj.name} onChange={(v) =>
                    setData((prev) => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? { ...p, name: v } : p) }))
                  } />
                  <Field label={isRTL ? "اللغة" : "Language"} value={proj.language} onChange={(v) =>
                    setData((prev) => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? { ...p, language: v } : p) }))
                  } />
                  <Field label="URL" value={proj.url} onChange={(v) =>
                    setData((prev) => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? { ...p, url: v } : p) }))
                  } />
                  <Field label={isRTL ? "النجوم" : "Stars"} value={proj.stars} type="number" onChange={(v) =>
                    setData((prev) => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? { ...p, stars: parseInt(v) || 0 } : p) }))
                  } />
                </div>
                <Field label={isRTL ? "الوصف" : "Description"} value={proj[lang].description} onChange={(v) =>
                  setData((prev) => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? { ...p, [lang]: { description: v } } : p) }))
                } multiline />
              </div>
            ))}
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  projects: [
                    ...prev.projects,
                    {
                      name: "New Project",
                      stars: 0,
                      forks: 0,
                      language: "JavaScript",
                      tags_en: [],
                      tags_ar: [],
                      url: "github.com/Farisatif/",
                      en: { description: "" },
                      ar: { description: "" },
                    },
                  ],
                }))
              }
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + {isRTL ? "إضافة مشروع" : "Add Project"}
            </button>
          </div>
        )}

        {/* EDUCATION TAB */}
        {tab === "education" && (
          <div className="space-y-4">
            <SectionHeader title={isRTL ? "التعليم" : "Education"} />
            {data.education.map((edu, i) => (
              <div key={i} className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{edu.school}</span>
                  <button
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        education: prev.education.filter((_, idx) => idx !== i),
                      }))
                    }
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    {isRTL ? "حذف" : "Delete"}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label={isRTL ? "المدرسة/الجامعة" : "School"} value={edu.school} onChange={(v) =>
                    setData((prev) => ({ ...prev, education: prev.education.map((e, idx) => idx === i ? { ...e, school: v } : e) }))
                  } />
                  <Field label={isRTL ? "الفترة" : "Period"} value={edu.period} onChange={(v) =>
                    setData((prev) => ({ ...prev, education: prev.education.map((e, idx) => idx === i ? { ...e, period: v } : e) }))
                  } />
                  <Field label={isRTL ? "المعدل" : "GPA"} value={edu.gpa} onChange={(v) =>
                    setData((prev) => ({ ...prev, education: prev.education.map((e, idx) => idx === i ? { ...e, gpa: v } : e) }))
                  } />
                </div>
                <Field label={isRTL ? "الدرجة العلمية" : "Degree"} value={edu[lang].degree} onChange={(v) =>
                  setData((prev) => ({ ...prev, education: prev.education.map((e, idx) => idx === i ? { ...e, [lang]: { ...e[lang], degree: v, highlights: e[lang].highlights } } : e) }))
                } />
              </div>
            ))}
            <button
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  education: [
                    ...prev.education,
                    {
                      school: "University",
                      period: "2020 – 2024",
                      gpa: "3.5",
                      en: { degree: "B.S. Computer Science", highlights: [] },
                      ar: { degree: "بكالوريوس علوم الحاسوب", highlights: [] },
                    },
                  ],
                }))
              }
              className="w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all"
            >
              + {isRTL ? "إضافة تعليم" : "Add Education"}
            </button>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            {isRTL
              ? "التعديلات تُحفظ محلياً — اضغط حفظ للتطبيق"
              : "Edits are stored locally — press Save to apply"}
          </p>
        </div>
      </div>
    </div>
  );
}
