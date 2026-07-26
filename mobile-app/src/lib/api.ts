import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Backend API base URL.
 * Configured via EXPO_PUBLIC_API_URL (see eas.json build profiles),
 * falls back to local development server.
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "user_token";
export const ONBOARDING_STORAGE_KEY = "user_onboarding_complete";
export const MOCK_TOKEN = "mock_token_123";

/**
 * fetch wrapper that prefixes API_URL and attaches the JWT from AsyncStorage
 * as an Authorization: Bearer header (when present).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(`${API_URL}${path}`, { ...init, headers });
}
