"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "designer" | "engineer" | "pm" | "other";

export type OnboardingProfile = {
  name: string;
  role: UserRole | "";
};

type OnboardingContextValue = {
  profile: OnboardingProfile;
  setProfile: (profile: OnboardingProfile) => void;
  isComplete: boolean;
  setIsComplete: (complete: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const ROLE_OPTIONS = [
  { value: "designer", label: "Designer" },
  { value: "engineer", label: "Engineer" },
  { value: "pm", label: "PM" },
  { value: "other", label: "Other" },
] as const;

export function getRoleLabel(role: UserRole | "") {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? "";
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile>({
    name: "",
    role: "",
  });
  const [isComplete, setIsComplete] = useState(false);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      isComplete,
      setIsComplete,
    }),
    [profile, isComplete]
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }

  return context;
}
