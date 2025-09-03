"use client";

import React, { useState } from "react";
import axios from "axios";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner"; // or your preferred toast library

const homeSteps: Step[] = [
  {
    target: '.onboarding-welcome',
    content: (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl mb-2">👋</span>
          <h2 className="text-2xl font-bold mb-1">Welcome to Vayam!</h2>
          <p className="text-lg text-muted-foreground mb-2">Let's show you around</p>
        </div>
        <p className="text-base leading-relaxed text-center mt-2">
          Discover conversations and engage with them.
        </p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: ".onboarding-participant-count",
    content: (
      <div className="space-y-3">
        <div className="flex justify-center items-center gap-2">
          <h3 className="text-lg font-semibold">Participant Count</h3>
        </div>
        <p className="text-sm leading-relaxed">
          This shows how many people are participating in each conversation.
        </p>
      </div>
    ),
    placement: "left",
    offset: 15,
  },
  {
    target: ".onboarding-conversation-topic",
    content: (
      <div className="space-y-3">
        <div className="flex justify-center items-center gap-2">
          <h3 className="text-lg font-semibold">Ready to Join?</h3>
        </div>
        <p className="text-sm leading-relaxed">
          Click on this conversation to continue the tour and learn how to
          participate.
        </p>
      </div>
    ),
    placement: "top",
    offset: 20,
  },
];

interface HomeOnboardingProps {
  isActive: boolean;
}

export function HomeOnboarding({ isActive }: HomeOnboardingProps) {
  const { stopOnboarding } = useOnboarding();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const updateOnboardingStatus = async () => {
    if (isUpdatingStatus) return;
    
    setIsUpdatingStatus(true);
    try {
      await axios.post("/api/v1/user/tour-guide-status?type=home", {
        is_home_onboarding_done: true
      });
      toast.success("Onboarding completed!");
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      toast.error("Failed to save your progress");
      throw error; // Re-throw to allow retry
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action } = data;
    
    // Handle all completion cases
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || action === 'close') {
      try {
        await updateOnboardingStatus();
        stopOnboarding();
      } catch {
        // Error already handled in updateOnboardingStatus
      }
    }
  };

  if (!isActive) return null;

  return (
    <Joyride
      steps={homeSteps}
      run={isActive}
      continuous
      showProgress
      showSkipButton
      disableCloseOnEsc={false}
      disableOverlayClose={false}
      hideCloseButton={false}
      scrollToFirstStep
      spotlightClicks={false}
      disableScrollParentFix
      callback={async (data) => {
        if (data.type === 'step:after' && data.action === 'skip') {
          await updateOnboardingStatus();
          stopOnboarding();
        } else {
          await handleJoyrideCallback(data);
        }
      }}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--background))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 10,
          fontSize: 16,
          fontFamily: 'inherit',
          padding: '18px 24px 22px 24px',
          maxWidth: 480,
          minWidth: 340,
          backgroundColor: 'white',
          color: '#1f2937',
          border: '2px solid #e5e7eb',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.10)',
          lineHeight: '1.5',
        },
        tooltipFooter: {
          marginTop: '18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          color: 'white',
          fontSize: '15px',
          fontWeight: '600',
          padding: '10px 22px',
          borderRadius: '7px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          minWidth: '110px',
          textAlign: 'center',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          padding: '10px 16px',
          background: '#f9fafb',
          border: '1px solid #d1d5db',
          borderRadius: '7px',
          cursor: 'pointer',
          minWidth: '80px',
          textAlign: 'center',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: '500',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: '10px 8px',
        },
        buttonClose: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '18px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        },
        beacon: {
          background: 'hsl(var(--primary))',
          borderRadius: '50%',
        },
        spotlight: {
          borderRadius: 4,
          border: '2px solid hsl(var(--primary))',
        },
      }}
      locale={{
        back: "Previous",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip tour",
      }}
    />
  );
}