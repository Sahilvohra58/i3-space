import { useEffect, useState } from "react";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { me } from "./api/auth";
import {
  UNAUTHORIZED_EVENT,
  clearSession,
  getSession,
} from "./api/session";

type BootState = "loading" | "anonymous" | "authenticated";

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [bootState, setBootState] = useState<BootState>("loading");

  // On mount, if we have a persisted token, verify it against the backend.
  // If valid, restore the session; otherwise fall through to the login screen.
  useEffect(() => {
    const session = getSession();
    if (!session) {
      setBootState("anonymous");
      return;
    }
    let cancelled = false;
    (async () => {
      const profile = await me();
      if (cancelled) return;
      if (profile?.email) {
        setUserEmail(profile.email);
        setBootState("authenticated");
      } else {
        clearSession();
        setBootState("anonymous");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for 401s anywhere in the app (axios interceptor emits this) and log
  // the user out cleanly.
  useEffect(() => {
    const handler = () => {
      setUserEmail(null);
      setBootState("anonymous");
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, []);

  if (bootState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
          </svg>
          Restoring session…
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <LoginPage
        onLoginSuccess={(email) => {
          setUserEmail(email);
          setBootState("authenticated");
        }}
      />
    );
  }

  return (
    <DashboardPage
      userEmail={userEmail}
      onLogout={() => {
        clearSession();
        setUserEmail(null);
        setBootState("anonymous");
      }}
    />
  );
}
