"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface OnboardingContextType {
  isOnboardingActive: boolean;
  currentTour: string | null;
  startOnboarding: (tourType?: string) => void;
  stopOnboarding: () => void;
  setCurrentTour: (tourType: string | null) => void;
  isNewUser: boolean;
}

const OnboardingContext = createContext<OnboardingContextType>({
  isOnboardingActive: false,
  currentTour: null,
  startOnboarding: () => {},
  stopOnboarding: () => {},
  setCurrentTour: () => {},
  isNewUser: false,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const startOnboarding = useCallback((tourType = "home") => {
    setCurrentTour(tourType);
    setIsOnboardingActive(true);
    setIsNewUser(true);
  }, []);

  const stopOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setCurrentTour(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingActive,
        currentTour,
        startOnboarding,
        stopOnboarding,
        setCurrentTour,
        isNewUser,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);