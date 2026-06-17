import { api } from "./client";
import { saveSession } from "./session";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  email?: string;
}

export interface MeResponse {
  email: string;
  expires_at: number;
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", credentials);
  if (data.success && data.access_token && data.expires_in && data.email) {
    saveSession(data.access_token, data.email, data.expires_in);
  }
  return data;
}

/** Verifies the stored token is still valid. Returns null on 401 / network errors. */
export async function me(): Promise<MeResponse | null> {
  try {
    const { data } = await api.get<MeResponse>("/auth/me");
    return data;
  } catch {
    return null;
  }
}
