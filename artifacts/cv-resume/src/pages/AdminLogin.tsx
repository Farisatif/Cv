import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ADMIN_EMAIL = "farisatif7780@gmail.com";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const { isRTL } = useLanguage();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [tab, setTab] = useState<"password" | "google">(
    GOOGLE_CLIENT_ID ? "google" : "password"
  );
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const scriptId = "google-gsi";
    if (document.getElementById(scriptId)) {
      initGoogle();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => initGoogle();
    document.head.appendChild(script);
  }, []);

  function initGoogle() {
    if (!window.google || !GOOGLE_CLIENT_ID) {
      setGoogleReady(false);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    setGoogleReady(true);
  }

  useEffect(() => {
    if (googleReady && btnRef.current && window.google) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "filled_black",
        size: "large",
        width: "300",
        text: "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
      });
    }
  }, [googleReady, tab]);

  async function handleGoogleCredential(response: { credential: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          setError(isRTL ? "هذا البريد غير مصرح له بالوصول" : "This email is not authorized");
        } else {
          setError(data.error || (isRTL ? "فشل تسجيل الدخول" : "Login failed"));
        }
        return;
      }

      const data = await res.json();
      sessionStorage.setItem("cv-admin", "1");
      sessionStorage.setItem("cv-admin-token", data.token || "");
      sessionStorage.setItem("cv-admin-email", data.email || "");
      onLogin();
    } catch {
      setError(isRTL ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm">
        <div className="border border-border rounded-2xl bg-card shadow-lg overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-border bg-muted/30">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center mb-4 mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-center">
              {isRTL ? "لوحة التحكم" : "Admin Panel"}
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {isRTL ? "تسجيل الدخول للإدارة" : "Sign in to manage your CV"}
            </p>
          </div>

          {/* Tabs — only show if Google is available */}
          {GOOGLE_CLIENT_ID && (
            <div className="flex border-b border-border">
              <button
                onClick={() => { setTab("password"); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === "password"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isRTL ? "كلمة المرور" : "Password"}
              </button>
              <button
                onClick={() => { setTab("google"); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === "google"
                    ? "text-foreground border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Google
              </button>
            </div>
          )}

          <div className="px-8 py-8 space-y-5">
            {/* Password login tab */}
            {tab === "password" && (
              <PasswordLoginForm onLogin={onLogin} isRTL={isRTL} setError={setError} />
            )}

            {/* Google login tab */}
            {tab === "google" && GOOGLE_CLIENT_ID && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground text-center">
                  {isRTL
                    ? `فقط ${ADMIN_EMAIL} مسموح له بالوصول`
                    : `Only ${ADMIN_EMAIL} has access`}
                </p>
                <div ref={btnRef} className="flex justify-center" />
                {loading && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    {isRTL ? "جاري التحقق..." : "Verifying..."}
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 font-medium text-center">{error}</p>
            )}

            <a
              href="/"
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRTL ? "← العودة إلى الملف الشخصي" : "← Back to CV"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordLoginForm({
  onLogin,
  isRTL,
  setError,
}: {
  onLogin: () => void;
  isRTL: boolean;
  setError: (e: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setLocalError("");
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(
          isRTL ? "اسم المستخدم أو كلمة المرور غير صحيحة" : "Invalid username or password"
        );
        return;
      }

      sessionStorage.setItem("cv-admin", "1");
      sessionStorage.setItem("cv-admin-token", data.token || "");
      sessionStorage.setItem("cv-admin-email", data.username || "admin");
      onLogin();
    } catch {
      setLocalError(isRTL ? "حدث خطأ في الاتصال بالخادم" : "Connection error — server unreachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground block">
          {isRTL ? "اسم المستخدم" : "Username"}
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={isRTL ? "admin" : "admin"}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          autoFocus
          autoComplete="username"
          disabled={loading}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground block">
          {isRTL ? "كلمة المرور" : "Password"}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
          autoComplete="current-password"
          disabled={loading}
        />
      </div>

      {localError && (
        <p className="text-xs text-red-500 font-medium">{localError}</p>
      )}

      <button
        type="submit"
        disabled={!username.trim() || !password || loading}
        className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
        )}
        {loading
          ? (isRTL ? "جاري التحقق..." : "Signing in...")
          : (isRTL ? "دخول" : "Sign in")}
      </button>
    </form>
  );
}
