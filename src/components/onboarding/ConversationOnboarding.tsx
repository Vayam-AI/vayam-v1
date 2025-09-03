"use client";

import React, { useState } from "react";
import axios from "axios";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { toast } from "sonner";

const conversationSteps: Step[] = [
  {
    target: ".onboarding-conversation-title",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">
          Conversation Topic
        </h3>
        <p className="text-sm leading-relaxed">
          This is the main question or topic being discussed. Read it carefully
          to understand the context.
        </p>
      </div>
    ),
    placement: "bottom",
    disableBeacon: true,
    offset: 5,
  },
  {
    target: ".onboarding-back-button",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">Home Page</h3>

        <p className="text-sm leading-relaxed">
          Click here to view all the conversations.
        </p>
      </div>
    ),
    placement: "bottom-start",
    offset: 10,
    styles: {
      tooltip: {
        maxWidth: 450,
        minWidth: 380,
      },
    },
  },
  {
    target: ".onboarding-comment-card",
    content: (
      <div className="">
        <h3 className="text-lg font-semibold text-center">Comments</h3>

        <p className="text-sm">
          Read different opinions and perspectives from community members.
        </p>
      </div>
    ),
    placement: "top",
    offset: -10,
    styles: {
      tooltip: {
        maxWidth: 650,
        minWidth: 580,
      },
    },
  },
  {
    target: ".onboarding-voting-buttons",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">Vote on Comments</h3>

        <p className="text-sm leading-relaxed mb-3">
          Use these buttons to express your opinion:
        </p>
        <div className="space-y-2 text-sm">
          <div>
            👍 <strong>Agree</strong> - You support this view
          </div>
          <div>
            － <strong>Neutral</strong> - You're unsure
          </div>
          <div>
            👎<strong>Disagree</strong> - You don't support this view
          </div>
        </div>
      </div>
    ),
    placement: "top",
    offset: 15,
    styles: {
      tooltip: {
        maxWidth: 500,
        minWidth: 420,
      },
    },
  },
  {
    target: ".onboarding-skip-button",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">Skip Button</h3>

        <p className="text-sm leading-relaxed">
          Not ready to vote? Click here to move to the next comment.
        </p>
      </div>
    ),
    placement: "bottom-end",
    offset: 10,
    styles: {
      tooltip: {
        maxWidth: 500,
        minWidth: 350,
      },
    },
  },
  {
    target: ".onboarding-progress-indicator",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">Progress Tracker</h3>

        <p className="text-sm leading-relaxed">
          This shows your progress. Vote on 5 comments to unlock the ability to
          add your own!
        </p>
      </div>
    ),
    placement: "top",
    offset: 10,
    styles: {
      tooltip: {
        maxWidth: 500,
        minWidth: 420,
      },
    },
  },
  {
    target: ".onboarding-add-comment-hint",
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-center">Add Your Voice</h3>

        <p className="text-sm leading-relaxed">
          After voting on enough comments, you'll be able to add your own
          thoughts to the conversation!
        </p>
      </div>
    ),
    placement: "top",
    offset: 10,
    styles: {
      tooltip: {
        maxWidth: 400,
        minWidth: 320,
      },
    },
  },
];

interface ConversationOnboardingProps {
  isActive: boolean;
}

export function ConversationOnboarding({
  isActive,
}: ConversationOnboardingProps) {
  const { stopOnboarding } = useOnboarding();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const updateOnboardingStatus = async () => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await axios.post("/api/v1/user/tour-guide-status?type=conversation", {
        is_conversation_onboarding_done: true,
      });
      toast.success("Onboarding completed!");
    } catch (error) {
      console.error("Failed to update onboarding status:", error);
      toast.error("Failed to save your progress");
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action } = data;

    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      action === "close"
    ) {
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
      steps={conversationSteps}
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
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 10,
          fontSize: 16,
          fontFamily: "inherit",
          padding: "18px 24px 22px 24px",
          maxWidth: 480,
          minWidth: 340,
          backgroundColor: "white",
          color: "#1f2937",
          border: "2px solid #e5e7eb",
          boxShadow:
            "0 10px 25px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.10)",
          lineHeight: "1.5",
        },
        tooltipFooter: {
          marginTop: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          color: "white",
          fontSize: "15px",
          fontWeight: "600",
          padding: "10px 22px",
          borderRadius: "7px",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
          minWidth: "110px",
          textAlign: "center",
        },
        buttonBack: {
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "500",
          padding: "10px 16px",
          background: "#f9fafb",
          border: "1px solid #d1d5db",
          borderRadius: "7px",
          cursor: "pointer",
          minWidth: "80px",
          textAlign: "center",
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: "14px",
          fontWeight: "500",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
          padding: "10px 8px",
        },
        buttonClose: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "18px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        },
        beacon: {
          background: "hsl(var(--primary))",
          borderRadius: "50%",
        },
        spotlight: {
          borderRadius: 4,
          border: "2px solid hsl(var(--primary))",
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
