import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import rawData from "@/data/resume.json";

const ADMIN_KEY = "Zoom100*";
const API_BASE = "/api";

type ResumeData = typeof rawData;

interface ResumeDataContextType {
  data: ResumeData;
  setData: Dispatch<SetStateAction<ResumeData>>;
  saveData: (data: ResumeData) => Promise<void>;
  resetData: () => Promise<void>;
  saving: boolean;
  loading: boolean;
}

const ResumeDataContext = createContext<ResumeDataContextType>({
  data: rawData,
  setData: () => {},
  saveData: async () => {},
  resetData: async () => {},
  saving: false,
  loading: true,
});

export function ResumeDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ResumeData>(rawData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/resume`);
        if (!cancelled && res.ok) {
          const json = await res.json();
          if (json.data) {
            setData(json.data as ResumeData);
          }
        }
      } catch {
        // API unreachable — use default static data
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const saveData = async (d: ResumeData) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/resume`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": ADMIN_KEY,
        },
        body: JSON.stringify(d),
      });
      if (!res.ok) throw new Error("Save failed");
      setData(d);
    } finally {
      setSaving(false);
    }
  };

  const resetData = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/resume`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": ADMIN_KEY,
        },
        body: JSON.stringify(rawData),
      });
      if (!res.ok) throw new Error("Reset failed");
      setData(rawData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResumeDataContext.Provider value={{ data, setData, saveData, resetData, saving, loading }}>
      {children}
    </ResumeDataContext.Provider>
  );
}

export function useResumeData() {
  return useContext(ResumeDataContext);
}
