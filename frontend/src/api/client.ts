/**
 * Shared axios instance for every API call in the app.
 *
 * - Base URL from `VITE_API_URL` (compile-time-injected by Vite)
 * - Request interceptor attaches `Authorization: Bearer <token>` if we have one
 * - Response interceptor: on 401 → clear the session and emit `i3:unauthorized`
 *   so the App can redirect to login without each call site handling it
 */

import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";

import { clearSession, emitUnauthorized, getToken } from "./session";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  // Per-request timeout so a hung backend doesn't lock the UI forever
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      clearSession();
      emitUnauthorized();
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
