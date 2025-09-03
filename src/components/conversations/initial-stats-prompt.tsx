"use client";

import { motion } from "framer-motion";
import { TrendingUp, MessageSquare, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ParticipationStats {
  participationPercentage: number;
  skippedCount: number;
  totalCount: number;
}

interface InitialStatsPromptProps {
  participationStats: ParticipationStats;
  onViewSkipped: () => void;
  onContinueNew: () => void;
  onShowThankYou: () => void;
}

export default function InitialStatsPrompt({
  participationStats,
  onViewSkipped,
  onContinueNew,
  onShowThankYou,
}: InitialStatsPromptProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-4"
        >
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold">Welcome back!</h1>
          <p className="text-muted-foreground">
            You've been engaging with this conversation. Here's your participation summary:
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-center gap-6"
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-500 mr-1" />
              <span className="text-2xl font-bold text-green-500">
                {participationStats.participationPercentage.toFixed(0)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Participation</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <SkipForward className="w-5 h-5 text-orange-500 mr-1" />
              <span className="text-2xl font-bold text-orange-500">
                {participationStats.skippedCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Skipped</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5 text-blue-500 mr-1" />
              <span className="text-2xl font-bold text-blue-500">
                {participationStats.totalCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
        </motion.div>

        {/* Question */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-lg text-muted-foreground"
        >
          Would you like to review the comments you skipped or continue exploring new perspectives?
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={onViewSkipped}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Review skipped comments ({participationStats.skippedCount})
          </Button>
          
          <Button
            onClick={onContinueNew}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Continue with all comments
          </Button>

          <Button
            onClick={onShowThankYou}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            I'm done for now
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
