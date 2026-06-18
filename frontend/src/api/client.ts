import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";
import { msalInstance, loginRequest } from "../auth/msalConfig";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 20_000,
});

api.interceptors.request.use(async (config) => {
  const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];
  if (account) {
    try {
      const result = await msalInstance.acquireTokenSilent({ ...loginRequest, account });
      config.headers = config.headers ?? {};
      config.headers["Authorization"] = `Bearer ${result.idToken}`;
    } catch {
      // Silent acquisition failed — user will be redirected to login on 401
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await msalInstance.loginRedirect(loginRequest);
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
