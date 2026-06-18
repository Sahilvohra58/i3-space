import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";

export default function LoginPage() {
  const { instance } = useMsal();

  const handleLogin = () => instance.loginRedirect(loginRequest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg
                className="h-7 w-7 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 text-center mb-1">
            Welcome to i3 Space
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Sign in with your i3 Institute Microsoft account to continue
          </p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 active:bg-gray-100 transition"
          >
            {/* Microsoft logo (4-square grid) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="h-5 w-5 flex-shrink-0">
              <rect x="0" y="0" width="10" height="10" fill="#F25022" />
              <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
              <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
              <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          i3 Space &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
