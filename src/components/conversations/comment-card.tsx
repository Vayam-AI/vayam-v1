"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, HelpCircle, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VotingButtons } from "./voting-buttons";
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";

interface CommentVote {
  zid: number;
  pid: number;
  tid: number;
  uid: number;
  vote: number;
  weightX32767: number;
  created: string;
}

interface Comment {
  tid: number;
  txt: string;
  isSeed: boolean;
  votes: CommentVote[];
  zid: number;
}

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

const starVariants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.2, 1], transition: { duration: 0.4 } },
};

interface CommentCardProps {
  comment: Comment;
  uid: number;
  onNextComment: () => void;
  onShowQuestion?: () => void;
}

export const CommentCard = ({ comment: initialComment, uid, onNextComment, onShowQuestion }: CommentCardProps) => {
  const [comment, setComment] = useState<Comment>(initialComment);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteCounts, setVoteCounts] = useState({
    likes: 0,
    dislikes: 0,
    neutral: 0,
    userVote: null as number | null,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const commentCardRef = useRef<HTMLDivElement>(null);

  // Touch position refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const updateVoteCounts = useCallback((votes: CommentVote[] = [], userId: number) => {
    const userVote = votes.find((v) => v.uid === userId)?.vote ?? null;
    const counts = votes.reduce(
      (acc, vote) => {
        if (vote.vote === 1) acc.likes++;
        else if (vote.vote === -1) acc.dislikes++;
        else if (vote.vote === 0) acc.neutral++;
        return acc;
      },
      { likes: 0, dislikes: 0, neutral: 0 }
    );
    setVoteCounts({
      ...counts,
      userVote,
    });
  }, []);

  useEffect(() => {
    // Only fetch star status if needed
    const fetchStarStatus = async () => {
      try {
        setIsLoading(true);
        const starResponse = await axios.get(`/api/v1/user/stars`);
        setIsStarred(starResponse.data.data?.some((c: any) => c.tid === comment.tid));
      } catch (error) {
        setIsStarred(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStarStatus();
    updateVoteCounts(comment.votes, uid);
  }, [comment, uid, updateVoteCounts]);

  const handleVote = useCallback(async (voteValue: number) => {
    if (!comment || !uid) return;

    if (voteCounts.userVote === voteValue) {
      toast("You've already voted this way");
      onNextComment();
      return;
    }

    setIsVoting(true);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      // Optimistic update
      const newVotes = [...comment.votes];
      const existingVoteIndex = newVotes.findIndex(v => v.uid === uid);
      
      if (existingVoteIndex >= 0) {
        newVotes[existingVoteIndex].vote = voteValue;
      } else {
        newVotes.push({
          zid: comment.zid,
          pid: 0, // Adjust if needed
          tid: comment.tid,
          uid: uid,
          vote: voteValue,
          weightX32767: 1,
          created: new Date().toISOString(),
        });
      }

      const updatedComment = {
        ...comment,
        votes: newVotes,
      };

      setComment(updatedComment);
      updateVoteCounts(newVotes, uid);

      await axios.post("/api/votes", {
        uid,
        zid: comment.zid,
        tid: comment.tid,
        vote: voteValue,
      });

      toast.success("Vote recorded");
      setTimeout(onNextComment, 100);
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
      
      // Revert optimistic update
      if (comment) {
        setComment(comment);
        updateVoteCounts(comment.votes, uid);
      }
    } finally {
      setIsVoting(false);
    }
  }, [comment, uid, voteCounts.userVote, updateVoteCounts, onNextComment]);

  const handleStar = useCallback(async () => {
    if (!comment || !uid) return;

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      setIsStarred(!isStarred);

      if (isStarred) {
        await axios.delete("/api/user/stars", {
          data: { uid, tid: comment.tid }
        });
        toast.success("Comment unstarred");
      } else {
        await axios.post("/api/user/stars", {
          uid,
          tid: comment.tid,
        });
        toast.success("Comment starred");
      }
    } catch (error) {
      console.error("Error toggling star:", error);
      setIsStarred(!isStarred);
      toast.error("Failed to update star status");
    }
  }, [comment, uid, isStarred]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(true);
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
      setSwipeDirection(-limitedSwipe);

      if (commentCardRef.current) {
        commentCardRef.current.style.transform = `translateX(${-limitedSwipe}px)`;
        if (limitedSwipe > 15) {
          commentCardRef.current.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
        } else if (limitedSwipe < -15) {
          commentCardRef.current.style.backgroundColor = "rgba(34, 197, 94, 0.1)";
        } else {
          commentCardRef.current.style.backgroundColor = "";
        }
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current || !comment) {
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
        if (diffX > 0) {
          handleVote(-1);
        } else {
          handleVote(1);
        }
      }
    } else {
      if (diffY > 100) {
        onNextComment();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
    setSwipeDirection(0);
    setIsSwiping(false);
  };

  const handleTap = () => {
    if (isMobile && voteCounts.userVote !== 0) {
      handleVote(0);
    }
  };

  if (isLoading || !comment) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{
            rotate: 360,
            transition: {
              duration: 1,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            },
          }}
          className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div
      ref={commentCardRef}
      className="transition-all duration-200 rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      <Card className="border-none shadow-xl bg-gradient-to-br from-card to-muted/20 min-h-[60vh] flex flex-col">
        <CardContent className="p-6 flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {comment.isSeed && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="secondary">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Seed
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This is a seed comment to start the conversation</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {onShowQuestion && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onShowQuestion}
                        className="h-8 w-8"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>View the question</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <motion.button
                onClick={handleStar}
                className="p-2 rounded-full star-button"
                aria-label={isStarred ? "Unstar comment" : "Star comment"}
                whileHover={buttonHover}
                whileTap={buttonTap}
                variants={starVariants}
                initial="initial"
                animate={isStarred ? "animate" : "initial"}
              >
                <Star
                  className={`h-5 w-5 ${
                    isStarred
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            </div>
          </div>

          <div className="flex-grow flex items-center justify-center py-8">
            <p className="text-2xl text-foreground leading-relaxed text-center max-w-2xl mx-auto">
              {comment.txt}
            </p>
          </div>

          <VotingButtons
            voteCounts={voteCounts}
            isVoting={isVoting}
            onVote={handleVote}
            commentId={comment.tid}
          />

          {isMobile && (
            <div className="text-center text-sm text-muted-foreground pt-6">
              <p>
                Swipe right to like, left to dislike, up to skip | Tap for
                neutral
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};