"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Meh, ChevronRight, MoveLeft, Minus, Users, MessageSquare, TrendingUp } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { AddCommentDialog } from "@/components/conversations/add-comment-dialog";
import { VotingButtons } from "@/components/conversations/voting-buttons";
import { ThankyouView } from "@/components/conversations/thankyou-view";
import { useSession } from "next-auth/react";
import Loading from "../ui/loading";

type VoteType = -1 | 0 | 1;

interface SkippedComment {
  tid: number;
  zid: number;
  uid: number;
  txt: string;
  created: string;
  modified: string;
  isSeed: boolean;
  votes?: any[];
  flagStatus?: string;
}

interface SkippedCommentsViewProps {
  zid: number;
  onVote: (tid: number, vote: number) => void;
  onShowQuestion: () => void;
  isVoting: boolean;
  isMobile: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTap: () => void;
  commentCardRef: React.RefObject<HTMLDivElement>;
  onContinue: () => void;
  onCommentAdded?: () => void;
  conversationTitle?: string;
  totalCommentsReviewed?: number;
}

export const SkippedCommentsView = ({
  zid,
  onContinue,
  onCommentAdded,
  conversationTitle,
  totalCommentsReviewed,
}: SkippedCommentsViewProps) => {
  const { data: session } = useSession();
  const uid = session?.user?.id ? parseInt(session.user.id) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skippedComments, setSkippedComments] = useState<SkippedComment[]>([]);
  const [stats, setStats] = useState<{
    skippedCommentsCount: number;
    totalCommentsCount: number;
    participationPercentage: string;
  } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [voting, setVoting] = useState<{ [tid: number]: boolean }>({});
  const [isMobile, setIsMobile] = useState(false);
  const [cardAnimation, setCardAnimation] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(false);
  const commentCardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Fetch skipped comments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const commentsRes = await axios.get(`/api/v1/user/conversations/skipped-comments?zid=${zid}`);
        setSkippedComments(commentsRes.data.data.skippedComments || []);
        setStats(commentsRes.data.data.stats || null);
      } catch (err: any) {
        setError(err?.response?.data?.error || "Failed to load skipped comments.");
      } finally {
        setLoading(false);
      }
    };
    
    if (zid) fetchData();
  }, [zid]);

  // Helper to get the user's vote for a comment
  const getUserVote = (tid: number) => {
    const comment = skippedComments.find(c => c.tid === tid);
    if (!comment || !comment.votes || !Array.isArray(comment.votes)) return null;
    const userVote = comment.votes.find((v: any) => v.uid === Number(uid));
    return userVote ? userVote.vote : null;
  };

  // Handle vote with animation and next logic
  const handleVote = async (tid: number, vote: VoteType) => {
    if (!uid) {
      toast.error("Login required");
      return;
    }
    
    if (isAnimating) {
      toast.error("Please wait for the animation to finish.");
      return;
    }
    
    const userVote = getUserVote(tid);
    if (userVote === vote) {
      toast.info("You have already voted on this reaction.");
      animateAndNext(userVote);
      return;
    }
    
    setVoting((prev) => ({ ...prev, [tid]: true }));
    setIsAnimating(true);
    
    animateAndNext(vote);
    
    try {
      const res = await axios.post("/api/v1/votes", {
        zid: Number(zid),
        tid: Number(tid),
        vote: Number(vote),
      });
      if (res.data?.message === "Vote updated") {
        toast.success("Vote updated!");
      } else {
        toast.success("Vote recorded successfully!");
      }
      // Refresh the comments to get updated vote counts
      const commentsRes = await axios.get(`/api/v1/user/conversations/skipped-comments?zid=${zid}`);
      setSkippedComments(commentsRes.data.data.skippedComments || []);
      setStats(commentsRes.data.data.stats || null);
    } catch (error: any) {
      if (error?.response?.data?.message === "Already voted this way") {
        toast.info("You have already voted on this reaction.");
        animateAndNext(userVote);
      } else {
        toast.error("Failed to record vote. Please try again.");
      }
    } finally {
      setVoting((prev) => ({ ...prev, [tid]: false }));
    }
  };

  // Animation and next logic
  const animateAndNext = (vote: VoteType) => {
    let anim;
    if (vote === 1) anim = { x: 500, opacity: 0, rotate: 15 };
    else if (vote === -1) anim = { x: -500, opacity: 0, rotate: -15 };
    else anim = { scale: 0.85, opacity: 0.5 };
    setCardAnimation(anim);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
      setIsAnimating(false);
    }, 400);
  };

  // Next arrow handler
  const handleNext = () => {
    if (isAnimating) return;
    setCardAnimation({ x: 500, opacity: 0, rotate: 10 });
    setIsAnimating(true);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
      setIsAnimating(false);
    }, 400);
  };

  // Touch/Swipe logic
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipePercentage = (diffX / window.innerWidth) * 100;
      const limitedSwipe = Math.max(Math.min(swipePercentage, 30), -30);
      if (commentCardRef.current) {
        commentCardRef.current.style.transform = `translateX(${-limitedSwipe}px)`;
        if (limitedSwipe > 15)
          commentCardRef.current.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
        else if (limitedSwipe < -15)
          commentCardRef.current.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
        else commentCardRef.current.style.backgroundColor = "";
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tid: number) => {
    if (!touchStartX.current || !touchStartY.current) return;
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    if (commentCardRef.current) {
      commentCardRef.current.style.transform = "";
      commentCardRef.current.style.backgroundColor = "";
    }
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 100) {
        if (diffX > 0) handleVote(tid, -1);
        else handleVote(tid, 1);
      }
    } else {
      if (diffY > 100) setCurrentIndex((i) => Math.min(i + 1, skippedComments.length));
    }
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTap = (tid: number) => {
    if (!isMobile) return;
    const userVote = getUserVote(tid);
    if (userVote !== 0) handleVote(tid, 0);
  };

  // Get current comment
  const currentComment = skippedComments[currentIndex];

  // Calculate vote counts
  const voteCounts = useMemo(() => {
    if (!currentComment)
      return { likes: 0, dislikes: 0, neutral: 0, userVote: null };
    
    const userVote = getUserVote(currentComment.tid);
    const counts = (currentComment.votes || []).reduce(
      (acc: any, vote: any) => {
        if (vote.vote === 1) acc.likes++;
        else if (vote.vote === -1) acc.dislikes++;
        else if (vote.vote === 0) acc.neutral++;
        return acc;
      },
      { likes: 0, dislikes: 0, neutral: 0 }
    );
    return { ...counts, userVote };
  }, [currentComment, uid, skippedComments]);

  if (loading) {
    return (
      <Loading />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-4 pt-2 sm:px-8 lg:px-24">
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <Button variant="ghost" size="sm" onClick={onContinue}>
              <MoveLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-destructive">
              <p className="text-lg font-medium mb-2">Error Loading Comments</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!skippedComments.length) {
    return (
      <div className="min-h-screen px-4 pt-2 sm:px-8 lg:px-24">
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <Button variant="ghost" size="sm" onClick={onContinue}>
              <MoveLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold">No Skipped Comments</h2>
              <p className="text-muted-foreground">
                You haven't skipped any comments! Great job staying engaged.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-2 sm:px-8 lg:px-24">
      {/* Voting Interface - Full Screen Layout */}
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-3 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onContinue}
          >
            <MoveLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {/* Next button */}
          {currentIndex < skippedComments.length && currentComment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={isAnimating}
            >
              Skip
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Fixed title at the top */}
          <div className="w-full max-w-4xl mb-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4">
              {conversationTitle || "Conversation"}
            </h2>
            
            {/* Participation Stats */}
            {stats && (
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="flex items-center gap-6 bg-muted/50 rounded-full px-6 py-3">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <div className="text-lg font-bold text-foreground">
                        {stats.participationPercentage}%
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Participation
                    </div>
                  </div>
                  <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Minus className="w-4 h-4 text-orange-500" />
                      <div className="text-lg font-bold text-foreground">
                        {stats.skippedCommentsCount}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Skipped
                    </div>
                  </div>
                  <div className="w-1 h-8 bg-muted-foreground/30 rounded-full" />
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 mb-1">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <div className="text-lg font-bold text-foreground">
                        {stats.totalCommentsCount}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {currentComment ? (
              <div className="relative w-full max-w-4xl h-[65vh] md:h-[55vh]">
                {/* Background card with next comment (blurred) - positioned behind and offset */}
                {currentIndex + 1 < skippedComments.length && (
                  <div className="absolute -top-4 left-20 right-0 bottom-12 bg-card border-2 border-border rounded-2xl shadow-lg opacity-60 overflow-hidden z-0">
                    <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
                      {/* Blurred background content */}
                      <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="max-h-full overflow-hidden w-full px-2">
                          <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words blur-sm text-muted-foreground">
                            "
                            {skippedComments[currentIndex + 1]?.txt}
                            "
                          </blockquote>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main comment card */}
                <motion.div
                  key={currentComment.tid}
                  ref={commentCardRef}
                  initial={{ scale: 0.95, opacity: 0, x: 100 }}
                  animate={
                    cardAnimation || {
                      scale: 1,
                      opacity: 1,
                      x: 0,
                      y: 0,
                      rotate: 0,
                    }
                  }
                  exit={{ scale: 0.95, opacity: 0, x: -100 }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 15,
                  }}
                  className="absolute top-12 left-0 right-12 bottom-0 bg-card border-2 border-border rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden z-10"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={(e: any) => handleTouchEnd(e, currentComment.tid)}
                  onClick={() => handleTap(currentComment.tid)}
                >
                  {/* Header with badges */}
                  <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {currentIndex + 1}/{skippedComments.length}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Skipped
                    </Badge>
                    {currentComment.isSeed && (
                      <Badge variant="secondary" className="text-xs">
                        Seed
                      </Badge>
                    )}
                  </div>

                  {/* Flag status */}
                  {currentComment.flagStatus === "pending" && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4 flex-shrink-0">
                      <Meh className="w-4 h-4" />
                      <span className="text-sm">Under review</span>
                    </div>
                  )}

                  {/* Main comment - scrollable for long content */}
                  <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="max-h-full overflow-y-auto w-full px-2">
                      <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words">
                        "{currentComment.txt}"
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <ThankyouView
                enableNotifications={enableNotifications}
                onNotificationChange={setEnableNotifications}
                zid={String(zid)}
              />
            )}
          </AnimatePresence>

          {/* Voting buttons - moved below the card */}
          {currentComment && (
            <div className="w-full max-w-4xl mt-4">
              <VotingButtons
                voteCounts={voteCounts}
                isVoting={voting[currentComment.tid] || false}
                onVote={(tid: number, vote: number) => handleVote(tid, vote as VoteType)}
                commentId={currentComment.tid}
              />
            </div>
          )}
        </div>

        {/* Footer with Progress indicator */}
        <div className="p-3 border-t">
          {/* Progress indicator */}
          {currentComment && (
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} of {skippedComments.length} skipped
              </span>
              <div className="w-32 bg-muted/50 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      ((currentIndex + 1) / skippedComments.length) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(((currentIndex + 1) / skippedComments.length) * 100)}%
              </span>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center">
            {currentComment && (
              <div className="text-xs text-muted-foreground">
                💡 Vote on how you feel about this previously skipped comment
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};