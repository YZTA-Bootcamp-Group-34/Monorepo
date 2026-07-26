import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { apiFetch, MOCK_TOKEN, ONBOARDING_STORAGE_KEY, TOKEN_STORAGE_KEY } from "@/lib/api";

export interface PatientProfile {
  id: number;
  name: string;
  tc_no?: string;
  age?: number;
  gender?: string;
  blood_type?: string;
  weight?: number;
  height?: number;
  chronic_conditions?: string;
  referral_status?: string;
  referral_date?: string;
  referral_doctor?: string;
}

interface AuthContextValue {
  token: string | null;
  onboardingComplete: boolean;
  profile: PatientProfile | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep the latest token available to callbacks without re-creating them.
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  const fetchProfile = useCallback(async (activeToken: string | null) => {
    // Mock/offline mode: no real backend identity, keep a null profile so
    // screens fall back to their demo data.
    if (!activeToken || activeToken === MOCK_TOKEN) {
      setProfile(null);
      return;
    }
    try {
      const res = await apiFetch(`/api/auth/me?token=${encodeURIComponent(activeToken)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data?.profile ?? null);
      }
    } catch {
      // Offline: keep whatever profile we already have (possibly null).
    }
  }, []);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
        setToken(storedToken);
        setOnboardingComplete(storedOnboarding === "true");
        await fetchProfile(storedToken);
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, [fetchProfile]);

  const signIn = useCallback(
    async (newToken: string) => {
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      await fetchProfile(newToken);
    },
    [fetchProfile]
  );

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    setOnboardingComplete(true);
    await fetchProfile(tokenRef.current);
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setToken(null);
    setOnboardingComplete(false);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(tokenRef.current);
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        token,
        onboardingComplete,
        profile,
        loading,
        signIn,
        completeOnboarding,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
