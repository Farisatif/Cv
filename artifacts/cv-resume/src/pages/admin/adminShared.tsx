import { useState, type Dispatch, type SetStateAction } from "react";
import { useResumeData } from "@/context/ResumeDataContext";

export type ResumeData = ReturnType<typeof useResumeData>["data"];
export type SetData = Dispatch<SetStateAction<ResumeData>>;

export const TABS = [
  { id: "personal",     labelEn: "Personal",     labelAr: "الشخصية",   icon: "👤" },
  { id: "skills",       labelEn: "Skills",        labelAr: "المهارات",  icon: "⚡" },
  { id: "experience",   labelEn: "Experience",    labelAr: "الخبرة",    icon: "💼" },
  { id: "projects",     labelEn: "Projects",      labelAr: "المشاريع",  icon: "🚀" },
  { id: "education",    labelEn: "Education",     labelAr: "التعليم",   icon: "🎓" },
  { id: "languages",    labelEn: "Languages",     labelAr: "اللغات",    icon: "💻" },
  { id: "achievements", labelEn: "Achievements",  labelAr: "الإنجازات", icon: "🏆" },
  { id: "comments",     labelEn: "Comments",      labelAr: "التعليقات", icon: "💬" },
  { id: "settings",     labelEn: "Settings",      labelAr: "الإعدادات", icon: "⚙️" },
] as const;

export type TabId = typeof TABS[number]["id"];

export type AdminComment = {
  id: number;
  name: string;
  message: string;
  likes: number;
  approved: boolean;
  createdAt: string;
};

export function useAdminHeaders(): Record<string, string> {
  const sessionToken = sessionStorage.getItem("cv-admin-token") || "";
  return sessionToken
    ? { "X-Session-Token": sessionToken }
    : { "X-Admin-Key": "Zoom100*" };
}

export function Field({
  label, value, onChange, type = "text", multiline = false, dir = "auto",
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  dir?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {multiline ? (
        <textarea
          className="cosmic-input min-h-[80px] resize-y leading-relaxed"
          value={String(value)}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="cosmic-input"
          value={String(value)}
          dir={dir}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-4 mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{title}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function BilingualFields({
  labelEn, labelAr, valueEn, valueAr, onChangeEn, onChangeAr, multiline = false,
}: {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (v: string) => void;
  onChangeAr: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Field label={`🇬🇧 ${labelEn}`} value={valueEn} onChange={onChangeEn} multiline={multiline} dir="ltr" />
      <Field label={`🇸🇦 ${labelAr}`} value={valueAr} onChange={onChangeAr} multiline={multiline} dir="rtl" />
    </div>
  );
}

export function TagsEditor({
  label, tags, onChange, dir = "ltr",
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  dir?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) { onChange([...tags, t]); setInput(""); }
  };
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-border bg-muted text-foreground">
            {tag}
            <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          dir={dir}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Type & press Enter"
          className="cosmic-input text-sm py-1.5"
        />
        <button type="button" onClick={add} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-all whitespace-nowrap">Add</button>
      </div>
    </div>
  );
}

export function HighlightsEditor({
  labelEn, labelAr, itemsEn, itemsAr, onChangeEn, onChangeAr,
}: {
  labelEn: string;
  labelAr: string;
  itemsEn: string[];
  itemsAr: string[];
  onChangeEn: (items: string[]) => void;
  onChangeAr: (items: string[]) => void;
}) {
  const maxLen = Math.max(itemsEn.length, itemsAr.length);
  const rows = Array.from({ length: maxLen + 1 }, (_, i) => i);
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">{labelEn} / {labelAr}</label>
      <div className="space-y-2">
        {rows.map((i) => (
          <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
            <input dir="ltr" placeholder={`🇬🇧 Highlight ${i + 1}`} className="cosmic-input text-sm py-1.5"
              value={itemsEn[i] ?? ""}
              onChange={(e) => {
                const next = [...itemsEn];
                if (e.target.value) { next[i] = e.target.value; } else { next.splice(i, 1); }
                onChangeEn(next.filter(Boolean));
              }}
            />
            <input dir="rtl" placeholder={`🇸🇦 نقطة ${i + 1}`} className="cosmic-input text-sm py-1.5 text-right"
              value={itemsAr[i] ?? ""}
              onChange={(e) => {
                const next = [...itemsAr];
                if (e.target.value) { next[i] = e.target.value; } else { next.splice(i, 1); }
                onChangeAr(next.filter(Boolean));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const ADD_BTN = "w-full py-2.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm transition-all";
