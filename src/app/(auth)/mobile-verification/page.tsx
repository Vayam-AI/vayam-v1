"use client";

import { MobileOtpAuth } from "@/components/auth/MobileOtpAuth";
import Loading from "@/components/ui/loading";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MobileVerificationPage() {
  const router = useRouter();
  const [uiState, setUiState] = useState<"loading" | "info" | "input">("loading");

  useEffect(() => {
    // On mount, fetch profile
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/v1/user/profile");
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        const user = data.user;
        if (user && user.mobile && user.isMobileVerified) {
          router.replace("/home");
        } else {
          setUiState("info");
        }
      } catch {
        setUiState("info");
      }
    };
    fetchProfile();
  }, [router]);

  // Auto-advance from info to input after 5 seconds
  useEffect(() => {
    if (uiState === "info") {
      const timer = setTimeout(() => setUiState("input"), 5000);
      return () => clearTimeout(timer);
    }
  }, [uiState]);

  if (uiState === "loading") {
    return <Loading />;
  }

  if (uiState === "info") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center max-w-2xl mx-auto p-6">
        <TextGenerateEffect 
          words="A quick phone number check ensures every participant's vote is unique" 
        />
      </div>
    );
  }

  return <MobileOtpAuth />;
}