import LoginForm from "../components/LoginForm";

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
          {/* Logo placeholder */}
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
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Sign in to your account to continue
          </p>

          <LoginForm onSuccess={onLoginSuccess} />
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          i3 Space &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
