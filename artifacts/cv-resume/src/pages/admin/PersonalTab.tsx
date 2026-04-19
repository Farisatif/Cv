import { Field, SectionHeader, BilingualFields, TagsEditor, type ResumeData, type SetData } from "./adminShared";

export function PersonalTab({ data, setData }: { data: ResumeData; setData: SetData }) {
  const up = (patch: Partial<typeof data.personal>) =>
    setData((p) => ({ ...p, personal: { ...p.personal, ...patch } }));
  const upEn = (patch: Partial<typeof data.personal.en>) =>
    setData((p) => ({ ...p, personal: { ...p.personal, en: { ...p.personal.en, ...patch } } }));
  const upAr = (patch: Partial<typeof data.personal.ar>) =>
    setData((p) => ({ ...p, personal: { ...p.personal, ar: { ...p.personal.ar, ...patch } } }));

  return (
    <div className="space-y-5">
      <SectionHeader title="Contact Info" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name" value={data.personal.name} onChange={(v) => up({ name: v })} />
        <Field label="Email" value={data.personal.email} dir="ltr" onChange={(v) => up({ email: v })} />
        <Field label="Phone" value={data.personal.phone} dir="ltr" onChange={(v) => up({ phone: v })} />
        <Field label="WhatsApp (number only)" value={data.personal.whatsapp} dir="ltr" onChange={(v) => up({ whatsapp: v })} />
        <Field label="GitHub URL" value={data.personal.github} dir="ltr" onChange={(v) => up({ github: v })} />
        <Field label="LinkedIn URL" value={data.personal.linkedin} dir="ltr" onChange={(v) => up({ linkedin: v })} />
        <Field label="Website URL" value={data.personal.website} dir="ltr" onChange={(v) => up({ website: v })} />
      </div>

      <SectionHeader title="Title & Location (both languages)" />
      <BilingualFields labelEn="Title (EN)" labelAr="المسمى الوظيفي"
        valueEn={data.personal.en.title} valueAr={data.personal.ar.title}
        onChangeEn={(v) => upEn({ title: v })} onChangeAr={(v) => upAr({ title: v })} />
      <BilingualFields labelEn="Location (EN)" labelAr="الموقع"
        valueEn={data.personal.en.location} valueAr={data.personal.ar.location}
        onChangeEn={(v) => upEn({ location: v })} onChangeAr={(v) => upAr({ location: v })} />
      <BilingualFields labelEn="Bio (EN)" labelAr="النبذة الشخصية"
        valueEn={data.personal.en.bio} valueAr={data.personal.ar.bio}
        onChangeEn={(v) => upEn({ bio: v })} onChangeAr={(v) => upAr({ bio: v })} multiline />

      <SectionHeader title="Typewriter Taglines" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TagsEditor label="🇬🇧 Taglines EN (one per tag)" tags={data.personal.en.taglines} dir="ltr"
          onChange={(tags) => upEn({ taglines: tags })} />
        <TagsEditor label="🇸🇦 شعارات AR" tags={data.personal.ar.taglines} dir="rtl"
          onChange={(tags) => upAr({ taglines: tags })} />
      </div>

      <SectionHeader title="GitHub Stats (manual fallback)" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(["commits", "repos", "followers", "stars", "since"] as const).map((field) => (
          <Field key={field}
            label={field.charAt(0).toUpperCase() + field.slice(1)}
            type="number"
            value={data.personal.stats[field]}
            onChange={(v) => setData((p) => ({ ...p, personal: { ...p.personal, stats: { ...p.personal.stats, [field]: parseInt(v) || 0 } } }))}
          />
        ))}
      </div>
    </div>
  );
}
