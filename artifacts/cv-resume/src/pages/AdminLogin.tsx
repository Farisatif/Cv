import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const ADMIN_PASSWORD = "Zoom100*";

export default function AdminLogin({
  onLogin,
}: {
  onLogin: () => void;
}) {
  const { isRTL } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem("cv-admin", "1");
        onLogin();
      } else {
        setError(isRTL ? "كلمة المرور غير صحيحة" : "Incorrect password");
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center px-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm">
        <div className="border border-border rounded-2xl bg-card shadow-lg overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-border bg-muted/30">
            <div className="w-12 h-12 rounded-xl bg-foreground flex items-center justify-center mb-4 mx-auto">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-background"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-center">
              {isRTL ? "لوحة التحكم" : "Admin Panel"}
            </h1>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {isRTL ? "أدخل كلمة المرور للمتابعة" : "Enter your password to continue"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {isRTL ? "كلمة المرور" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRTL ? "••••••••" : "••••••••"}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isRTL
                  ? "جاري التحقق..."
                  : "Verifying..."
                : isRTL
                ? "دخول"
                : "Sign in"}
            </button>

            <a
              href="/"
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRTL ? "← العودة إلى الملف الشخصي" : "← Back to CV"}
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
