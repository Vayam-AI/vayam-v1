'use client';

import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { HomeOnboarding } from './HomeOnboarding';
import { ConversationOnboarding } from './ConversationOnboarding';

export function OnboardingTour() {
  const { isOnboardingActive, currentTour } = useOnboarding();

  if (!isOnboardingActive) return null;

  return (
    <>
      <HomeOnboarding isActive={currentTour === 'home'} />
      <ConversationOnboarding isActive={currentTour === 'conversation'} />
    </>
  );
}