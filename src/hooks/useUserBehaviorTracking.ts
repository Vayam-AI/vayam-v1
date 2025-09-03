'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

/**
 * Hook to track user behavior and improve new user detection
 */
export function useUserBehaviorTracking() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      const userId = session.user.id;
      
      // Track page visits
      const visitKey = `page_visits_${userId}`;
      const visits = JSON.parse(localStorage.getItem(visitKey) || '[]');
      
      const newVisit = {
        path: pathname,
        timestamp: new Date().toISOString(),
      };
      
      // Keep only last 10 visits
      const updatedVisits = [newVisit, ...visits].slice(0, 10);
      localStorage.setItem(visitKey, JSON.stringify(updatedVisits));
      
      // Track total session time
      const sessionKey = `session_time_${userId}`;
      const sessionStart = sessionStorage.getItem('session_start') || new Date().toISOString();
      sessionStorage.setItem('session_start', sessionStart);
      
      const totalTime = Date.now() - new Date(sessionStart).getTime();
      localStorage.setItem(sessionKey, totalTime.toString());
    }
  }, [pathname, session, status]);

  /**
   * Determine if user is likely new based on behavior patterns
   */
  const isLikelyNewUser = (): boolean => {
    if (!session?.user?.id) return false;

    const userId = session.user.id;
    
    // Check 1: Has completed onboarding
    const onboardingCompleted = localStorage.getItem(`onboarding_completed_${userId}`);
    if (onboardingCompleted) return false;
    
    // Check 2: Number of page visits
    const visits = JSON.parse(localStorage.getItem(`page_visits_${userId}`) || '[]');
    if (visits.length < 5) return true; // Less than 5 page visits
    
  // Check 3: Total session time (less than 3 minutes suggests new user)
  const totalTime = parseInt(localStorage.getItem(`session_time_${userId}`) || '0');
  if (totalTime < 3 * 60 * 1000) return true; // Less than 3 minutes
    
    // Check 4: First visit to key pages
    const homeVisits = visits.filter((v: any) => v.path === '/home').length;
    const conversationVisits = visits.filter((v: any) => v.path.includes('/conversations/')).length;
    
    if (homeVisits <= 1 && conversationVisits === 0) return true;
    
    return false;
  };

  return { isLikelyNewUser };
}
