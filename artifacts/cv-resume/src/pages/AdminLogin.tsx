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
      className="min-h-screen admin-login-bg text-foreground flex items-center justify-center px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Subtle grid pattern */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(hsl(var(--border)/0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)/0.35) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
          opacity: 0.35,
        }}
      />

      <div className="w-full max-w-sm relative z-10 slide-in-up">
        {/* Top badge */}
        <div className={`flex ${isRTL ? "justify-end" : "justify-start"} mb-4`}>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
          >
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform group-hover:${isRTL ? "translate-x-0.5" : "-translate-x-0.5"}`}
              style={{ transform: isRTL ? "scaleX(-1)" : undefined }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {isRTL ? "العودة إلى الملف" : "Back to CV"}
          </a>
        </div>

        <div className="cosmic-card glow-border rounded-2xl overflow-hidden">
          {/* Card header */}
          <div className={`px-8 pt-8 pb-6 border-b border-border ${isRTL ? "text-right" : "text-center"}`}>
            {/* Icon */}
            <div className={`flex ${isRTL ? "justify-end" : "justify-center"} mb-5`}>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl blur-xl opacity-30"
                  style={{ background: "hsl(174 68% 40%)", transform: "scale(1.4)" }}
                />
                <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(174 68% 34%), hsl(174 72% 44%))",
                    boxShadow: "0 4px 18px hsl(174 68% 38% / 0.30), inset 0 1px 0 rgba(255,255,255,0.15)"
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
              </div>
            </div>

            <h1 className="text-xl font-bold mb-1">
              {isRTL ? "لوحة التحكم" : "Admin Panel"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? "تسجيل الدخول لإدارة سيرتك الذاتية" : "Sign in to manage your CV"}
            </p>
          </div>

          {/* Tabs — only show if Google is available */}
          {GOOGLE_CLIENT_ID && (
            <div className="flex border-b border-border bg-muted/20">
              <button
                onClick={() => { setTab("password"); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  tab === "password"
                    ? "text-foreground border-b-2 border-foreground bg-card/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {isRTL ? "كلمة المرور" : "Password"}
              </button>
              <button
                onClick={() => { setTab("google"); setError(""); }}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  tab === "google"
                    ? "text-foreground border-b-2 border-foreground bg-card/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Google
              </button>
            </div>
          )}

          <div className="px-8 py-7 space-y-5">
            {tab === "password" && (
              <PasswordLoginForm onLogin={onLogin} isRTL={isRTL} setError={setError} />
            )}

            {tab === "google" && GOOGLE_CLIENT_ID && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center p-4 rounded-xl bg-muted/40 border border-border w-full">
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? `فقط ${ADMIN_EMAIL} مسموح له بالوصول`
                      : `Only ${ADMIN_EMAIL} has access`}
                  </p>
                </div>
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
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 shake">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-xs text-red-500 font-medium leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className={`text-center text-xs text-muted-foreground/60 mt-5 ${isRTL ? "text-right" : ""}`}>
          {isRTL ? "محمي بتشفير من طرف إلى طرف" : "Protected with end-to-end encryption"}
        </p>
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
  const [showPass, setShowPass] = useState(false);
  const [localError, setLocalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(0);

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
        setErrorKey(k => k + 1);
        return;
      }

      sessionStorage.setItem("cv-admin", "1");
      sessionStorage.setItem("cv-admin-token", data.token || "");
      sessionStorage.setItem("cv-admin-email", data.username || "admin");
      onLogin();
    } catch {
      setLocalError(isRTL ? "حدث خطأ في الاتصال بالخادم" : "Connection error — server unreachable");
      setErrorKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className={`text-xs font-semibold text-muted-foreground block ${isRTL ? "text-right" : ""}`}>
          {isRTL ? "اسم المستخدم" : "Username"}
        </label>
        <div className="relative">
          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-muted-foreground/50`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isRTL ? "المستخدم" : "admin"}
            className={`cosmic-input text-sm ${isRTL ? "pr-9 text-right" : "pl-9"}`}
            dir={isRTL ? "rtl" : "ltr"}
            autoFocus
            autoComplete="username"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={`text-xs font-semibold text-muted-foreground block ${isRTL ? "text-right" : ""}`}>
          {isRTL ? "كلمة المرور" : "Password"}
        </label>
        <div className="relative">
          <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-3" : "left-3"} text-muted-foreground/50`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <input
            type={showPass ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`cosmic-input text-sm ${isRTL ? "pr-9 pl-10 text-right" : "pl-9 pr-10"}`}
            dir={isRTL ? "rtl" : "ltr"}
            autoComplete="current-password"
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass(v => !v)}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-3" : "right-3"} text-muted-foreground/50 hover:text-muted-foreground transition-colors`}
          >
            {showPass ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {localError && (
        <div key={errorKey} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 shake">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className={`text-xs text-red-500 font-medium ${isRTL ? "text-right" : ""}`}>{localError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!username.trim() || !password || loading}
        className="btn-primary w-full"
      >
        {loading && (
          <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
