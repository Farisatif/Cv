import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import rawData from "@/data/resume.json";

const STORAGE_KEY = "cv-admin-data";

type ResumeData = typeof rawData;

interface ResumeDataContextType {
  data: ResumeData;
  setData: Dispatch<SetStateAction<ResumeData>>;
  saveData: (data: ResumeData) => void;
  resetData: () => void;
}

const ResumeDataContext = createContext<ResumeDataContextType>({
  data: rawData,
  setData: () => {},
  saveData: () => {},
  resetData: () => {},
});

export function ResumeDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ResumeData>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) return JSON.parse(s) as ResumeData;
    } catch {}
    return rawData;
  });

  const saveData = (d: ResumeData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    setData(d);
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(rawData);
  };

  return (
    <ResumeDataContext.Provider value={{ data, setData, saveData, resetData }}>
      {children}
    </ResumeDataContext.Provider>
  );
}

export function useResumeData() {
  return useContext(ResumeDataContext);
}
