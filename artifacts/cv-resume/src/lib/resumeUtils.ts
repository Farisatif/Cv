import type rawData from "@/data/resume.json";
import type { Lang } from "@/context/LanguageContext";

export type ResumeData = typeof rawData;

export function getPersonal(lang: Lang, data: ResumeData) {
  return {
    ...data.personal,
    title: data.personal[lang].title,
    location: data.personal[lang].location,
    bio: data.personal[lang].bio,
    taglines: data.personal[lang].taglines,
  };
}

export function getSkills(lang: Lang, data: ResumeData) {
  return data.skills.map((s) => ({
    ...s,
    category: lang === "ar" ? s.category_ar : s.category_en,
  }));
}

export function getExperience(lang: Lang, data: ResumeData) {
  return data.experience.map((e) => ({
    ...e,
    ...e[lang],
  }));
}

export function getProjects(lang: Lang, data: ResumeData) {
  return data.projects.map((p) => ({
    ...p,
    description: p[lang].description,
    tags: lang === "ar" ? p.tags_ar : p.tags_en,
  }));
}

export function getEducation(lang: Lang, data: ResumeData) {
  return data.education.map((e) => ({
    ...e,
    degree: e[lang].degree,
    highlights: e[lang].highlights,
  }));
}

export function generateContributionData(): number[][] {
  const weeks = 53;
  const days = 7;
  const result: number[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: number[] = [];
    for (let d = 0; d < days; d++) {
      const rand = Math.random();
      let count = 0;
      if (rand > 0.4) {
        if (rand > 0.9) count = Math.floor(Math.random() * 10) + 8;
        else if (rand > 0.75) count = Math.floor(Math.random() * 6) + 4;
        else count = Math.floor(Math.random() * 3) + 1;
      }
      week.push(count);
    }
    result.push(week);
  }
  return result;
}
