"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { ThankyouView } from "@/components/conversations/thankyou-view";
import InitialStatsPrompt from "@/components/conversations/initial-stats-prompt";
import { Button } from "@/components/ui/button";
import Loading from "@/components/ui/loading";
import { AddCommentDialog } from "@/components/conversations/add-comment-dialog";
import { ConversationOnboarding } from "@/components/onboarding/ConversationOnboarding";
import { MoveLeft, ChevronRight, Minus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SkippedCommentsView } from "@/components/conversations/skipped-comments-view";
import { Badge } from "@/components/ui/badge";
import { VotingButtons } from "@/components/conversations/voting-buttons";

type VoteType = -1 | 0 | 1;

interface Vote {
  tid: number;
  zid: number;
  pid?: number;
  uid: number;
  vote: number;
  created?: string;
  modified?: string;
}

interface Comment {
  tid: number;
  zid: number;
  pid?: number;
  uid?: string;
  txt: string;
  agid?: number;
  created?: string;
  modified?: string;
  flagStatus?: string;
  isSeed?: boolean;
  votes: Vote[];
  userVote?: Vote | null;
}

interface Conversation {
  zid: number;
  topic?: string;
  description?: string;
  infoImages?: string[];
  tags?: string[];
  is_active?: boolean;
  created?: string;
  modified?: string;
  comments: Comment[];
}

export default function ConversationPage() {
  // Prevent scrolling on body and html when this page is mounted
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, []);
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const zid = params?.zid as string;
  const uid = session?.user?.id;
  const {
    isOnboardingActive,
    startOnboarding,
    stopOnboarding,
    setCurrentTour,
    currentTour,
  } = useOnboarding();
  const [showConversationTour, setShowConversationTour] = useState(false);

  // State management
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [voting, setVoting] = useState<{ [tid: number]: boolean }>({});
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [cardAnimation, setCardAnimation] = useState<any>(null);
  const [viewedCommentsCount, setViewedCommentsCount] = useState<number>(0);
  const [showSimpleThankYou, setShowSimpleThankYou] = useState<boolean>(false);
  const [showSkippedCommentsPrompt, setShowSkippedCommentsPrompt] =
    useState<boolean>(false);
  const [showSkippedComments, setShowSkippedComments] =
    useState<boolean>(false);
  const [skippedCommentsData, setSkippedCommentsData] = useState<any>(null);
  const [participationStats, setParticipationStats] = useState<{
    participationPercentage: string;
    skippedCommentsCount: number;
    totalCommentsCount: number;
  } | null>(null);
  const [showInitialStatsPrompt, setShowInitialStatsPrompt] =
    useState<boolean>(false);

  // Refs
  const commentCardRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  // Fetch conversation onboarding status after conversation is loaded
  useEffect(() => {
    if (status !== "authenticated" || !conversation) return;
    let cancelled = false;
    async function fetchConversationOnboardingStatus() {
      try {
        const res = await axios.get(
          "/api/v1/user/tour-guide-status?type=conversation"
        );
        if (!res.data.is_conversation_onboarding_done && !cancelled) {
          setShowConversationTour(true);
          startOnboarding("conversation");
        }
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchConversationOnboardingStatus();
    return () => {
      cancelled = true;
    };
  }, [status, conversation, startOnboarding]);

  // Detect mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Fisher-Yates shuffle algorithm
  const shuffleComments = useCallback((commentsArr: Comment[]): number[] => {
    const indices = Array.from({ length: commentsArr.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, []);

  // Fetch conversation and comments
  const fetchConversation = useCallback(async (): Promise<void> => {
    if (!zid || !uid || status !== "authenticated") return;
    setPageLoading(true);
    try {
      const convRes = await axios.get(`/api/v1/conversations/${zid}`);
      setConversation(convRes.data.data);
      const loadedComments = convRes.data.data.comments || [];
      setComments(loadedComments);
      setShuffledIndices(shuffleComments(loadedComments));
      setCurrentIndex(0);
      setViewedCommentsCount(0);
    } catch (e) {
      setError("Failed to load conversation");
      console.error("[fetchConversation] Error:", e);
    } finally {
      setPageLoading(false);
    }
  }, [zid, uid, status, shuffleComments]);

  useEffect(() => {
    if (uid && status === "authenticated") {
      fetchConversation();
    }
  }, [uid, status, fetchConversation]);

  // Fetch participation stats
  const fetchParticipationStats = useCallback(async (): Promise<void> => {
    if (!zid || !uid || status !== "authenticated") return;
    try {
      const skippedRes = await axios.get(
        `/api/v1/user/conversations/skipped-comments?zid=${zid}`
      );
      const statsData = skippedRes.data.data?.stats;
      setParticipationStats(statsData);
      setSkippedCommentsData(skippedRes.data.data);

      if (statsData) {
        const participationPercentage = parseFloat(
          statsData.participationPercentage
        );

        if (participationPercentage === 100) {
          setShowSimpleThankYou(true);
        } else if (participationPercentage === 0) {
          setShowInitialStatsPrompt(false);
        } else if (
          participationPercentage > 0 &&
          participationPercentage < 100
        ) {
          setShowInitialStatsPrompt(true);
        }
      }
    } catch (e) {
      console.error("[fetchParticipationStats] Error:", e);
    }
  }, [zid, uid, status]);

  useEffect(() => {
    if (uid && status === "authenticated") {
      fetchParticipationStats();
    }
  }, [uid, status, fetchParticipationStats]);

  // Always show stats UI if participation % > 0 (including 100)
  useEffect(() => {
    if (
      participationStats &&
      parseFloat(participationStats.participationPercentage) > 0
    ) {
  setShowInitialStatsPrompt((prev) => prev || true);
  setShowSimpleThankYou(false); // Always show stats first
    }
  }, [participationStats]);

  // Handle comment added
  const handleCommentAdded = useCallback(async () => {
    await fetchConversation();
    await fetchParticipationStats();

    const skippedRes = await axios.get(
      `/api/v1/user/conversations/skipped-comments?zid=${zid}`
    );
    const skippedComments = skippedRes.data.data?.skippedComments || [];

    if (skippedComments.length > 0) {
      setShowSkippedCommentsPrompt(true);
    } else {
      setShowSimpleThankYou(true);
    }
  }, [fetchConversation, fetchParticipationStats, zid]);

  // Handle initial stats prompt decision
  const handleInitialStatsDecision = (reviewSkipped: boolean) => {
    setShowInitialStatsPrompt(false);
    if (reviewSkipped) {
      setShowSkippedComments(true);
    }
  };

  // Handle skipped comments decision
  const handleSkippedCommentsDecision = (continueVoting: boolean) => {
    setShowSkippedCommentsPrompt(false);
    if (continueVoting) {
      setShowSkippedComments(true);
    } else {
      setShowSimpleThankYou(true);
    }
  };

  // Handle return from skipped comments
  const handleReturnFromSkipped = () => {
    setShowSkippedComments(false);
    setShowSimpleThankYou(true);
  };

  // Helper to get the user's vote for a comment
  const getUserVote = (tid: number): number | null => {
    const comment = comments.find((c) => c.tid === tid);
    if (!comment) return null;

    if (comment.userVote) {
      return comment.userVote.vote;
    }

    if (!comment.votes) return null;
    const userVote = comment.votes.find((v: Vote) => v.uid === Number(uid));
    return userVote ? userVote.vote : null;
  };

  // Handle voting
  const handleVote = async (tid: number, vote: VoteType): Promise<void> => {
    if (!uid || isAnimating) return;

    const userVote = getUserVote(tid);
    if (userVote === vote) {
      animateAndNext(userVote);
      return;
    }

    setVoting((prev) => ({ ...prev, [tid]: true }));
    setIsAnimating(true);

    // Update vote locally first
    setComments((prevComments) =>
      prevComments.map((comment) => {
        if (comment.tid === tid) {
          const filteredVotes = comment.votes.filter(
            (v) => v.uid !== Number(uid)
          );
          const newVote: Vote = {
            tid: Number(tid),
            zid: Number(zid),
            uid: Number(uid),
            vote: vote,
            created: new Date().toISOString(),
          };
          return {
            ...comment,
            votes: [...filteredVotes, newVote],
            userVote: newVote,
          };
        }
        return comment;
      })
    );

    animateAndNext(vote);

    try {
      await axios.post("/api/v1/votes", {
        zid: Number(zid),
        tid: Number(tid),
        vote: Number(vote),
      });
    } catch (error: any) {
      // Revert on error
      setComments((prevComments) =>
        prevComments.map((comment) => {
          if (comment.tid === tid) {
            const filteredVotes = comment.votes.filter(
              (v) => v.uid !== Number(uid)
            );
            if (userVote !== null) {
              const originalVote: Vote = {
                tid: Number(tid),
                zid: Number(zid),
                uid: Number(uid),
                vote: userVote,
                created: new Date().toISOString(),
              };
              return {
                ...comment,
                votes: [...filteredVotes, originalVote],
                userVote: originalVote,
              };
            }
            return {
              ...comment,
              votes: filteredVotes,
              userVote: null,
            };
          }
          return comment;
        })
      );
    } finally {
      setVoting((prev) => ({ ...prev, [tid]: false }));
    }
  };

  // Animation and next logic
  const animateAndNext = (vote: VoteType): void => {
    let anim;
    if (vote === 1) anim = { x: 500, opacity: 0, rotate: 15 };
    else if (vote === -1) anim = { x: -500, opacity: 0, rotate: -15 };
    else anim = { scale: 0.85, opacity: 0.5 };

    setCardAnimation(anim);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
      setViewedCommentsCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  // Next arrow handler
  const handleNext = (): void => {
    if (isAnimating) return;
    setCardAnimation({ x: 500, opacity: 0, rotate: 10 });
    setIsAnimating(true);
    setTimeout(() => {
      setCardAnimation(null);
      setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
      setViewedCommentsCount((prev) => prev + 1);
      setIsAnimating(false);
    }, 300);
  };

  // Touch/Swipe handlers
  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent): void => {
    if (!touchStartX.current || !touchStartY.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX.current - currentX;
    const diffY = touchStartY.current - currentY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      const swipePercentage = (diffX / window.innerWidth) * 100;
      const limitedSwipe = Math.max(Math.min(swipePercentage, 30), -30);
      setSwipeDirection(-limitedSwipe);

      if (commentCardRef.current) {
        commentCardRef.current.style.transform = `translateX(${-limitedSwipe}px)`;
        if (limitedSwipe > 15) {
          commentCardRef.current.style.backgroundColor =
            "rgba(239, 68, 68, 0.1)";
        } else if (limitedSwipe < -15) {
          commentCardRef.current.style.backgroundColor =
            "rgba(34, 197, 94, 0.1)";
        } else {
          commentCardRef.current.style.backgroundColor = "";
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, tid: number): void => {
    if (!touchStartX.current || !touchStartY.current) {
      setIsSwiping(false);
      return;
    }

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
    } else if (diffY > 100) {
      setCurrentIndex((i) => Math.min(i + 1, shuffledIndices.length));
      setViewedCommentsCount((prev) => prev + 1);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    setSwipeDirection(0);
    setIsSwiping(false);
  };

  const handleTap = (tid: number): void => {
    if (!isMobile) return;
    const userVote = getUserVote(tid);
    if (userVote !== 0) handleVote(tid, 0);
  };

  // Filter visible comments
  const visibleComments = useMemo(() => {
    return comments.filter(
      (c) => c.flagStatus !== "accepted" && c.flagStatus !== "flagged"
    );
  }, [comments]);

  const currentComment =
    visibleComments.length > 0 && shuffledIndices.length > 0
      ? visibleComments[shuffledIndices[currentIndex]]
      : null;

  const voteCounts = useMemo(() => {
    if (!currentComment)
      return { likes: 0, dislikes: 0, neutral: 0, userVote: null };

    const userVote = getUserVote(currentComment.tid);
    const counts = currentComment.votes.reduce(
      (acc: any, vote: Vote) => {
        if (vote.vote === 1) acc.likes++;
        else if (vote.vote === -1) acc.dislikes++;
        else if (vote.vote === 0) acc.neutral++;
        return acc;
      },
      { likes: 0, dislikes: 0, neutral: 0 }
    );

    return { ...counts, userVote };
  }, [currentComment, uid, comments]);

  const canAddComment = useMemo(() => {
    return (
      viewedCommentsCount >= 5 || viewedCommentsCount >= visibleComments.length
    );
  }, [viewedCommentsCount, visibleComments.length]);

  if (status === "loading" || pageLoading) {
    return <Loading />;
  }

  if (error) {
    return <div className="text-center text-destructive py-12">{error}</div>;
  }

  if (comments.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
        style={{ overflow: "hidden" }}
      >
        <div className="w-full max-w-2xl flex flex-col items-center">
          <div className="mb-6 text-2xl font-bold text-center">
            No comments yet
          </div>
          <div className="mb-4 text-lg text-center text-muted-foreground">
            Be the first to add your view!
          </div>
          <AddCommentDialog
            zid={String(zid)}
            disabled={false}
            disabledMessage={""}
            onCommentAdded={fetchConversation}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {showConversationTour &&
        isOnboardingActive &&
        currentTour === "conversation" && (
          <ConversationOnboarding isActive={true} />
        )}
      {showSimpleThankYou ? (
        <ThankyouView zid={String(zid)} />
      ) : (
        <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
            {/* Header with onboarding classes */}
            <div className="flex items-center justify-between p-3 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/home")}
                className="onboarding-back-button flex items-center gap-2"
              >
                <MoveLeft className="w-4 h-4" />
                Back
              </Button>

              {!showSimpleThankYou &&
                !showInitialStatsPrompt &&
                !showSkippedComments &&
                currentIndex < visibleComments.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNext}
                    disabled={isAnimating}
                    className="onboarding-skip-button flex items-center gap-2"
                  >
                    Skip
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-0 relative overflow-hidden">
              {/* Conversation title with onboarding class */}
              {!showSimpleThankYou && !showInitialStatsPrompt && (
                <div
                  className="mb-8 relative flex justify-center items-center"
                  style={{ minHeight: 48 }}
                >
                  <h2
                    className="onboarding-conversation-title text-2xl md:text-3xl lg:text-4xl font-bold"
                    style={{
                      display: "inline-block",
                      margin: 0,
                      padding: 0,
                      position: "relative", // Add this for better positioning
                    }}
                  >
                    {conversation?.topic}
                  </h2>
                </div>
              )}

              <AnimatePresence mode="wait">
                {showInitialStatsPrompt && participationStats ? (
                  <InitialStatsPrompt
                    participationStats={{
                      participationPercentage: parseFloat(
                        participationStats.participationPercentage
                      ),
                      skippedCount: participationStats.skippedCommentsCount,
                      totalCount: participationStats.totalCommentsCount,
                    }}
                    onViewSkipped={() => handleInitialStatsDecision(true)}
                    onContinueNew={() => handleInitialStatsDecision(false)}
                    onShowThankYou={() => {
                      setShowInitialStatsPrompt(false);
                      setShowSimpleThankYou(true);
                    }}
                  />
                ) : showSkippedComments ? (
                  <SkippedCommentsView
                    zid={Number(zid)}
                    onContinue={handleReturnFromSkipped}
                    onCommentAdded={handleCommentAdded}
                    conversationTitle={conversation?.topic}
                    totalCommentsReviewed={viewedCommentsCount}
                    onVote={() => {}}
                    onShowQuestion={() => {}}
                    isVoting={false}
                    isMobile={isMobile}
                    onTouchStart={() => {}}
                    onTouchMove={() => {}}
                    onTouchEnd={() => {}}
                    onTap={() => {}}
                    commentCardRef={
                      commentCardRef as React.RefObject<HTMLDivElement>
                    }
                  />
                ) : showSkippedCommentsPrompt ? (
                  <motion.div
                    key="skipped-comments-prompt"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 120,
                      damping: 15,
                    }}
                    className="text-center space-y-8 max-w-2xl mx-auto"
                  >
                    {/* Lottie animation removed: missing animationData asset */}

                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold mb-4">
                          You have skipped some comments
                        </h2>
                        <p className="text-muted-foreground mb-6">
                          Do you want to continue voting on the comments you
                          skipped?
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Button
                          onClick={() => handleSkippedCommentsDecision(true)}
                          className="w-full"
                          size="lg"
                        >
                          Yes, continue voting
                        </Button>

                        <Button
                          onClick={() => handleSkippedCommentsDecision(false)}
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          No, I'm done
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ) : currentIndex < visibleComments.length ? (
                  <div className="relative w-full max-w-4xl h-[65vh] md:h-[55vh]">
                    {/* Background card with next comment */}
                    {currentIndex + 1 < visibleComments.length && (
                      <div className="absolute -top-4 left-20 right-0 bottom-12 bg-card border-2 border-border rounded-2xl shadow-lg opacity-60 overflow-hidden z-0">
                        <div className="p-4 md:p-6 lg:p-8 h-full flex flex-col">
                          <div className="flex-1 flex items-center justify-center min-h-0">
                            <div className="max-h-full overflow-hidden w-full px-2">
                              <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words blur-sm text-muted-foreground">
                                "
                                {
                                  visibleComments[
                                    shuffledIndices[currentIndex + 1]
                                  ]?.txt
                                }
                                "
                              </blockquote>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Main comment card with onboarding class */}
                    <motion.div
                      key={currentComment?.tid || "comment"}
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
                      className="absolute top-12 left-0 right-12 bottom-0 bg-card border-2 border-border rounded-2xl shadow-xl p-4 md:p-6 lg:p-8 flex flex-col overflow-hidden z-[10100] onboarding-comment-card"
                      style={{ minHeight: 220 }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e: any) =>
                        currentComment && handleTouchEnd(e, currentComment.tid)
                      }
                      onClick={() =>
                        currentComment && handleTap(currentComment.tid)
                      }
                    >
                      <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                        {currentComment?.isSeed && (
                          <Badge variant="secondary" className="text-xs">
                            Seed
                          </Badge>
                        )}
                      </div>

                      {currentComment?.flagStatus === "pending" && (
                        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4 flex-shrink-0">
                          <Minus className="w-4 h-4" />
                          <span className="text-sm">Under review</span>
                        </div>
                      )}

                      <div className="flex-1 flex items-center justify-center min-h-0">
                        <div className="max-h-full overflow-y-auto w-full px-2">
                          <blockquote className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-center max-w-full break-words">
                            "{currentComment?.txt}"
                          </blockquote>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <ThankyouView zid={String(zid)} />
                )}
              </AnimatePresence>

              {/* Voting buttons with onboarding class */}
              {!showSimpleThankYou &&
                !showInitialStatsPrompt &&
                !showSkippedComments &&
                currentIndex < visibleComments.length && (
                  <div
                    className="w-full max-w-4xl mt-8 flex justify-center onboarding-voting-buttons relative z-[10100]"
                    style={{ minHeight: 80 }}
                  >
                    <VotingButtons
                      voteCounts={voteCounts}
                      isVoting={voting[currentComment?.tid || 0] || false}
                      onVote={(tid: number, vote: number) =>
                        handleVote(tid, vote as VoteType)
                      }
                      commentId={currentComment?.tid || 0}
                    />
                  </div>
                )}
            </div>

            {/* Footer with onboarding classes */}
            <div className="p-3 border-t">
              {!showSimpleThankYou &&
                !showInitialStatsPrompt &&
                !showSkippedComments &&
                currentIndex < visibleComments.length && (
                  <div className="flex items-center justify-center gap-3 mb-3 onboarding-progress-indicator">
                    <span className="text-xs text-muted-foreground">
                      {currentIndex + 1} of {visibleComments.length}
                    </span>
                    <div className="w-24 bg-muted/50 rounded-full h-1">
                      <div
                        className="bg-muted-foreground/60 h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((currentIndex + 1) / visibleComments.length) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              <div className="text-center onboarding-add-comment-hint">

                {/* Show voting hint until 5 comments are viewed, then show AddCommentDialog */}
                {!showSimpleThankYou &&
                  !showInitialStatsPrompt &&
                  !showSkippedComments &&
                  !canAddComment &&
                  currentIndex < visibleComments.length && (
                    viewedCommentsCount < 5 ? (
                      <div className="text-xs text-muted-foreground">
                        💡 Vote on how you feel about ideas so far
                      </div>
                    ) : null
                  )}

                {!showSimpleThankYou &&
                  !showInitialStatsPrompt &&
                  !showSkippedComments &&
                  canAddComment &&
                  currentIndex < visibleComments.length && (
                    <div className="flex justify-center items-center gap-1 text-muted-foreground">
                      <span className="font-bold">Didn't see your view?</span>
                      <div className="ml-1">
                        <AddCommentDialog
                          zid={String(zid)}
                          disabled={!canAddComment}
                          disabledMessage={
                            visibleComments.length < 5
                              ? "You can add your comment after viewing all comments"
                              : "You need to review " +
                                (5 - viewedCommentsCount) +
                                " more comments before adding your own"
                          }
                          onCommentAdded={handleCommentAdded}
                        />
                      </div>
                    </div>
                  )}

                {!showSimpleThankYou &&
                  !showInitialStatsPrompt &&
                  !showSkippedComments &&
                  canAddComment &&
                  currentIndex < visibleComments.length && (
                    <div className="flex justify-center items-center gap-1 text-muted-foreground">
                      <span className="font-bold">Didn't see your view?</span>
                      <div className="ml-1">
                        <AddCommentDialog
                          zid={String(zid)}
                          disabled={!canAddComment}
                          disabledMessage={
                            visibleComments.length < 5
                              ? "You can add your comment after viewing all comments"
                              : "You need to review " +
                                (5 - viewedCommentsCount) +
                                " more comments before adding your own"
                          }
                          onCommentAdded={handleCommentAdded}
                        />
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
      )}
    </>
  );
}
