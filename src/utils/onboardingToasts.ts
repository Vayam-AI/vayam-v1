'use client';

import { toast } from 'sonner';

export const onboardingToasts = {
  welcome: () => {
    toast.success('🎉 Welcome to Vayam!', {
      description: 'Let\'s take a quick tour to get you started',
      duration: 3000,
    });
  },
  
  homeComplete: () => {
    toast.info('🏠 Home tour complete!', {
      description: 'Click on a conversation to continue the tour',
      duration: 4000,
    });
  },
  
  // Removed onboardingToasts (no longer used)
  onboardingComplete: () => {
    toast.success('🎓 Onboarding complete!', {
      description: 'You\'re all set to start meaningful conversations',
      duration: 5000,
    });
  },
  
  tourRestarted: () => {
    toast.info('🔄 Tour restarted', {
      description: 'Taking you back to the beginning',
      duration: 2000,
    });
  },
  
  tourSkipped: () => {
    toast.info('⏭️ Tour skipped', {
      description: 'You can restart it anytime using the help button',
      duration: 3000,
    });
  },
};
