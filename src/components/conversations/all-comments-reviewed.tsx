"use client";

import React from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import addCommentAnimation from "../../../public/assets/addComment.json";
import { AddCommentDialog } from "./add-comment-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, MessageSquare, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface AllCommentsReviewedProps {
  zid: string;
  onCommentAdded: () => void;
  totalCommentsReviewed?: number;
  conversationTopic?: string;
}

export function AllCommentsReviewed({ 
  zid, 
  onCommentAdded, 
  totalCommentsReviewed = 0,
  conversationTopic 
}: AllCommentsReviewedProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-background z-[9999] overflow-y-auto">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 15,
            duration: 0.6,
          }}
          className="relative z-10 text-center space-y-8 max-w-2xl mx-auto"
        >
          {/* Animated Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100, 
              damping: 10,
              delay: 0.2 
            }}
            className="w-40 h-40 mx-auto relative"
          >
            <div className="relative z-10 w-full h-full p-4">
              <Lottie
                animationData={addCommentAnimation}
                loop={true}
                className="w-full h-full"
                aria-label="Celebration animation"
              />
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Celebration Header */}
            <div className="space-y-4">
              
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                You've reviewed all comments!
              </h1>
              
              {totalCommentsReviewed > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center justify-center gap-3 text-muted-foreground bg-muted/50 rounded-full px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {totalCommentsReviewed} perspectives reviewed
                    </span>
                  </div>
                  <div className="w-1 h-4 bg-muted-foreground/30 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">
                      Amazing engagement!
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="space-y-4"
            >
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Share your thoughts and contribute to this meaningful conversation.
              </p>
              <div className="flex items-center justify-center gap-2 text-base text-muted-foreground/80 font-medium">
                <MessageSquare className="w-4 h-4" />
                <span>Your voice matters!</span>
                <span className="text-xl" role="img" aria-label="Thinking face emoji">💭</span>
              </div>
            </motion.div>

            {/* Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="pt-6"
            >
              <AddCommentDialog
                zid={zid}
                onCommentAdded={onCommentAdded}
              />
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="pt-8"
          >
            <Button
              variant="ghost"
              onClick={() => router.push("/home")}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to conversations
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
