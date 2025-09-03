import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";

interface VotingButtonsProps {
  voteCounts: {
    likes: number;
    dislikes: number;
    neutral: number;
    userVote: number | null;
  };
  isVoting: boolean;
  onVote: (tid: number, vote: number) => void;
  commentId: number;
}

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const VotingButtons = ({
  voteCounts,
  isVoting,
  onVote,
  commentId,
}: VotingButtonsProps) => {
  return (
    <div className="flex items-center justify-center gap-8 pt-4 voting-buttons">
      {/* Dislike button - left */}
      <motion.button
        onClick={() => onVote(commentId, -1)}
        className={`flex flex-col items-center justify-center px-3 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 shadow-sm
          ${voteCounts.userVote === -1
            ? "bg-red-500 text-white scale-110 shadow-lg"
            : "bg-secondary text-secondary-foreground hover:bg-red-500/10 hover:text-red-600"}
          ${isVoting || voteCounts.userVote === -1 ? "cursor-default" : "cursor-pointer"}
        `}
        whileHover={isVoting || voteCounts.userVote === -1 ? {} : buttonHover}
        whileTap={isVoting || voteCounts.userVote === -1 ? {} : buttonTap}
        aria-label="Dislike"
      >
        <ThumbsDown className={`h-7 w-7 ${voteCounts.userVote === -1 ? "stroke-2" : "stroke-1.5"}`} />
      </motion.button>

      {/* Neutral button - center */}
      <motion.button
        onClick={() => onVote(commentId, 0)}
        className={`flex flex-col items-center justify-center px-3 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-sm
          ${voteCounts.userVote === 0
            ? "bg-blue-500 text-white scale-110 shadow-lg"
            : "bg-secondary text-secondary-foreground hover:bg-blue-500/10 hover:text-blue-600"}
          ${isVoting || voteCounts.userVote === 0 ? "cursor-default" : "cursor-pointer"}
        `}
        whileHover={isVoting || voteCounts.userVote === 0 ? {} : buttonHover}
        whileTap={isVoting || voteCounts.userVote === 0 ? {} : buttonTap}
        aria-label="Neutral"
      >
        <Minus className={`h-7 w-7 ${voteCounts.userVote === 0 ? "stroke-2" : "stroke-1.5"}`} />
      </motion.button>

      {/* Like button - right */}
      <motion.button
        onClick={() => onVote(commentId, 1)}
        className={`flex flex-col items-center justify-center px-3 py-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500/40 shadow-sm
          ${voteCounts.userVote === 1
            ? "bg-green-500 text-white scale-110 shadow-lg"
            : "bg-secondary text-secondary-foreground hover:bg-green-500/10 hover:text-green-600"}
          ${isVoting || voteCounts.userVote === 1 ? "cursor-default" : "cursor-pointer"}
        `}
        whileHover={isVoting || voteCounts.userVote === 1 ? {} : buttonHover}
        whileTap={isVoting || voteCounts.userVote === 1 ? {} : buttonTap}
        aria-label="Like"
      >
        <ThumbsUp className={`h-7 w-7 ${voteCounts.userVote === 1 ? "stroke-2" : "stroke-1.5"}`} />
      </motion.button>
    </div>
  );
}; 