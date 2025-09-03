"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Loading from "@/components/ui/loading";
import { useTheme } from "next-themes";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

interface Conversation {
  zid: number;
  topic: string;
  participantCount: number;
  logos?: string[];
}

// Custom Card Component
const CustomCard = ({ children, className, onClick, ...props }: any) => {
  return (
    <div
      className={`rounded-lg shadow-lg overflow-hidden cursor-pointer transition-shadow duration-200 hover:shadow-xl ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

const CustomCardContent = ({ children, className, ...props }: any) => {
  return (
    <div className={`${className}`} {...props}>
      {children}
    </div>
  );
};

const CustomCardTitle = ({ children, className, ...props }: any) => {
  return (
    <h3 className={`${className}`} {...props}>
      {children}
    </h3>
  );
};

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { isOnboardingActive, startOnboarding, setCurrentTour } = useOnboarding();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch conversations
        const convRes = await axios.get("/api/v1/conversations");
        const realData = convRes.data.data || [];

  setConversations(realData);
        
        // Fetch onboarding status
        const onboardingRes = await axios.get("/api/v1/user/tour-guide-status?type=home");
        const isHomeOnboardingDone = onboardingRes.data.is_home_onboarding_done;
        
        // Only show tour if onboarding isn't completed
        setShouldShowTour(!isHomeOnboardingDone);
        
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Start onboarding when data is loaded and tour should be shown
  useEffect(() => {
    if (shouldShowTour && !loading && conversations.length > 0) {
      setCurrentTour("home");
      startOnboarding();
    }
  }, [shouldShowTour, loading, conversations, setCurrentTour, startOnboarding]);

  return (
    <div className="py-8 px-4 sm:px-8 lg:px-24">
      {/* Only show tour if shouldShowTour is true */}
      {shouldShowTour && <OnboardingTour />}

      <div className="mb-10 onboarding-welcome">
        <h1 className="text-3xl font-bold mb-2">Welcome to Vayam</h1>
        <p className="text-lg text-muted-foreground mx-auto">
          Vayam is a collaborative platform for meaningful conversations and
          community engagement.
        </p>
      </div>

      {loading && <Loading />}
      {error && <div className="text-center text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 onboarding-conversation-cards">
        {conversations.map((conv, index) => (
          <CustomCard
            key={conv.zid}
            className={`
              h-full flex flex-col relative
              ${
                theme === "dark" ? "bg-white text-black" : "bg-black text-white"
              }
              ${index === 0 ? "onboarding-conversation-topic" : ""}
            `}
            onClick={() => router.push(`/conversations/${conv.zid}`)}
          >
            {/* Participants count badge */}
            <div
              className={`absolute right-3 top-3 z-10 ${
                index === 0 ? "onboarding-participant-count" : ""
              }`}
            >
              <div className="bg-white text-black rounded px-2 py-1 text-xs shadow font-medium">
                {(typeof conv.participantCount === 'number' ? conv.participantCount.toLocaleString() : '0')} participants
              </div>
            </div>

            {/* Main content area */}
            <CustomCardContent className="flex-1 flex flex-col justify-center p-6 min-h-[180px]">
              <CustomCardTitle className="text-2xl font-light line-clamp-3">
                {conv.topic}
              </CustomCardTitle>
            </CustomCardContent>

            {/* Footer - only show when there are logos */}
            {conv.logos && conv.logos.length > 0 && (
              <div className="flex justify-center items-center gap-6 bg-white p-4">
                {conv.logos.map((logo, idx) => (
                  <img
                    key={idx}
                    src={logo}
                    alt={`logo-${idx}`}
                    className="h-10 w-auto object-contain max-w-[80px]"
                  />
                ))}
              </div>
            )}
          </CustomCard>
        ))}
      </div>
    </div>
  );
}