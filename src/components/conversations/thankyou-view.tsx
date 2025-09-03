"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { TextGenerateEffect } from "../ui/text-generate-effect";
import { AddCommentDialog } from "./add-comment-dialog";
import { useRouter as useAppRouter } from "next/navigation";

interface ThankyouViewProps {
  zid: string;
  enableNotifications?: boolean;
  onNotificationChange?: (val: boolean) => void;
}

export function ThankyouView({
  zid,
  enableNotifications,
  onNotificationChange,
}: ThankyouViewProps) {
  const router = useRouter();
  const appRouter = useAppRouter();

  // Subscription state
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch subscription status on mount
  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/user/subscribe?zid=${zid}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.isSubscribed === "boolean") {
          setIsSubscribed(data.isSubscribed);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch status");
        }
      })
      .catch(() => setError("Failed to fetch status"))
      .finally(() => setLoading(false));
  }, [zid]);

  // Toggle handler
  const handleToggle = async (checked: boolean) => {
    setUpdating(true);
    setIsSubscribed(checked); // Optimistic update
    try {
      const res = await fetch("/api/v1/user/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zid: Number(zid), subscribe: checked }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        setIsSubscribed(!checked); // Revert
      } else {
        setError(null);
      }
    } catch {
      setError("Failed to update");
      setIsSubscribed(!checked); // Revert
    } finally {
      setUpdating(false);
    }
  };

  // Callback to reload the page after comment is added
  const handleCommentAdded = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* Celebration Icon */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center space-x-2 text-6xl mb-6">
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              🎉
            </motion.div>
            <motion.div
              animate={{
                y: [0, -10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.3,
              }}
            >
              ✨
            </motion.div>
          </div>

          {/* Main Thank You Message with Typewriter Effect */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
            >
              <TextGenerateEffect words="Thanks for being an active member of our community" />
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="flex items-center justify-center gap-2 text-xl md:text-2xl font-medium text-muted-foreground"
            >
              <Heart className="w-6 h-6 text-red-500" />
              <span>You're now a part of Vayam</span>
              <Sparkles className="w-6 h-6 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>

        {/* Notification/Subscribe Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="space-y-6"
        >
          {loading ? (
            <div className="text-lg text-muted-foreground">
              Loading subscription status...
            </div>
          ) : error ? (
            <div className="text-lg text-destructive">{error}</div>
          ) : (
            <>
              <p className="text-lg md:text-xl text-muted-foreground">
                {isSubscribed
                  ? "You are subscribed to updates on new comments."
                  : "Would you like to receive updates on new comments?"}
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0, duration: 0.6 }}
                className="flex items-center justify-center gap-4 p-6 border rounded-xl bg-card/50 backdrop-blur-sm shadow-lg"
              >
                <span className="text-base font-medium">
                  {isSubscribed ? "Subscribed" : "Enable notifications"}
                </span>
                <Switch
                  checked={!!isSubscribed}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-primary"
                  disabled={updating}
                />
              </motion.div>
            </>
          )}
        </motion.div>

        {/* Additional Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.6 }}
        >
          <Button
            onClick={() => router.push("/home")}
            variant="outline"
            size="lg"
            className="w-full max-w-sm mx-auto"
          >
            Explore More Conversations
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.8, duration: 0.7 }}
          className="mt-8"
        >
          <div className="mb-3 text-lg font-medium text-muted-foreground">
            Didn't see your view?
          </div>
          <AddCommentDialog zid={zid} onCommentAdded={handleCommentAdded} />
        </motion.div>
      </motion.div>
    </div>
  );
}
