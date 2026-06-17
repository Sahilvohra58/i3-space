import { useState } from "react";
import { useForm } from "react-hook-form";
import { login, type LoginCredentials } from "../api/auth";

type FormState = "idle" | "loading" | "error";

interface LoginFormProps {
  onSuccess: (email: string) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [serverMessage, setServerMessage] = useState("");

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setFormState("loading");
    setServerMessage("");
    try {
      const res = await login(data);
      if (res.success) {
        onSuccess(getValues("email"));
      } else {
        setFormState("error");
        setServerMessage(res.message);
      }
    } catch (err: unknown) {
      setFormState("error");
      const response = (err as { response?: { status?: number; data?: { message?: string; detail?: string } } })?.response;
      if (response?.status === 429) {
        setServerMessage("Too many login attempts. Please wait a minute and try again.");
      } else if (typeof response?.data?.message === "string") {
        setServerMessage(response.data.message);
      } else if (typeof response?.data?.detail === "string") {
        setServerMessage(response.data.detail);
      } else {
        setServerMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-5"
      noValidate
    >
      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            errors.email
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300"
          }`}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
          })}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={`w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-indigo-500 ${
            errors.password
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300"
          }`}
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 4,
              message: "Password must be at least 4 characters",
            },
          })}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Server error */}
      {formState === "error" && serverMessage && (
        <div className="rounded-lg px-4 py-3 text-sm font-medium bg-red-50 text-red-700 border border-red-200">
          {serverMessage}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={formState === "loading"}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {formState === "loading" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
