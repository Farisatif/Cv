import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import rawData from "@/data/resume.json";

const API_BASE = "/api";
const POLL_INTERVAL = 20_000; // re-check server every 20s

type ResumeData = typeof rawData;

interface ResumeDataContextType {
  data: ResumeData;
  savedData: ResumeData;
  setData: Dispatch<SetStateAction<ResumeData>>;
  saveData: (data: ResumeData) => Promise<void>;
  resetData: () => Promise<void>;
  saving: boolean;
  loading: boolean;
}

const ResumeDataContext = createContext<ResumeDataContextType>({
  data: rawData,
  savedData: rawData,
  setData: () => {},
  saveData: async () => {},
  resetData: async () => {},
  saving: false,
  loading: true,
});

function getAdminKey(): string {
  try {
    const token = sessionStorage.getItem("cv-admin-token");
    if (token && token !== "dev-token") return token;
  } catch {}
  return process.env.ADMIN_KEY ?? "Zoom100*";
}

export function ResumeDataProvider({ children }: { children: ReactNode }) {
  const [data, setData]         = useState<ResumeData>(rawData);
  const [savedData, setSavedData] = useState<ResumeData>(rawData);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const updatedAtRef            = useRef<string | null>(null);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/resume`);
        if (!cancelled && res.ok) {
          const json = await res.json();
          if (json.data) {
            // Merge DB data with rawData defaults so new keys are never missing
            const merged = { ...rawData, ...json.data } as ResumeData;
            setData(merged);
            setSavedData(merged);
          }
          if (json.updatedAt) updatedAtRef.current = json.updatedAt;
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

  // ── Live polling — re-fetch if server data changed ─────────────────────────
  useEffect(() => {
    if (loading) return;

    const id = setInterval(async () => {
      // skip poll if document is hidden
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch(`${API_BASE}/resume`);
        if (!res.ok) return;
        const json = await res.json();
        if (!json.data) return;
        const serverTs = json.updatedAt ?? null;
        // Only update if server has a newer version
        if (serverTs && serverTs !== updatedAtRef.current) {
          updatedAtRef.current = serverTs;
          const merged = { ...rawData, ...json.data } as ResumeData;
          setData(merged);
          setSavedData(merged);
        }
      } catch {
        // ignore poll errors
      }
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [loading]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const saveData = async (d: ResumeData) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/resume`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": getAdminKey(),
        },
        body: JSON.stringify(d),
      });
      if (!res.ok) {
        let message = "Save failed";
        try {
          const errJson = await res.json();
          if (errJson.dbNotReady) {
            message = "Database not ready — please try again in a moment.";
          } else if (errJson.error) {
            message = errJson.error;
          }
        } catch {}
        throw new Error(message);
      }
      const json = await res.json();
      if (json.updatedAt) updatedAtRef.current = json.updatedAt;
      setData(d);
      setSavedData(d);
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetData = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/resume`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": getAdminKey(),
        },
        body: JSON.stringify(rawData),
      });
      if (!res.ok) throw new Error("Reset failed");
      const json = await res.json();
      if (json.updatedAt) updatedAtRef.current = json.updatedAt;
      setData(rawData);
      setSavedData(rawData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResumeDataContext.Provider value={{ data, savedData, setData, saveData, resetData, saving, loading }}>
      {children}
    </ResumeDataContext.Provider>
  );
}

export function useResumeData() {
  return useContext(ResumeDataContext);
}
