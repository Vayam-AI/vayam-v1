import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

interface AddCommentDialogProps {
  zid: string;
  onCommentAdded?: () => void;
  disabled?: boolean;
  disabledMessage?: string;
  triggerText?: string;
}

const buttonHover = {
  scale: 1.05,
  transition: { duration: 0.2 },
};

const buttonTap = {
  scale: 0.98,
  transition: { duration: 0.1 },
};

export const AddCommentDialog = ({
  zid,
  onCommentAdded,
  disabled = false,
  disabledMessage,
  triggerText = "Add your comment",
}: AddCommentDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate word count
  const wordCount = newComment.trim()
    ? newComment.trim().split(/\s+/).length
    : 0;
  const isWordCountValid = wordCount >= 1 && wordCount <= 80;

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (wordCount < 1) {
      toast.error("Please enter a comment");
      return;
    }

    if (wordCount > 80) {
      toast.error("Comment must not exceed 80 words");
      return;
    }

    const numericZid = Number(zid);
    setIsSubmitting(true);

    try {
      const response = await axios.post("/api/v1/comments", {
        zid: numericZid,
        txt: newComment.trim(),
        isSeed: false,
      });

      if (response.status === 201) {
        setNewComment("");
        setIsOpen(false);
        toast.success("Comment added successfully!");

        // Call the callback to refetch comments
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
    } catch (error: any) {
      console.error("Error submitting comment:", error);

      // Handle validation errors from the API
      if (error.response?.status === 400 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (errors.txt) {
          toast.error(errors.txt[0] || "Invalid comment format");
        } else if (errors.zid) {
          toast.error(errors.zid[0] || "Invalid conversation ID");
        } else {
          toast.error("Validation error. Please check your input.");
        }
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to add comment. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={disabled ? {} : buttonHover}
          whileTap={disabled ? {} : buttonTap}
          className="add-comment"
        >
          <Button
            className={`transition-all duration-200 ${
              disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-primary hover:text-primary-foreground"
            }`}
            disabled={disabled}
            title={disabled ? disabledMessage : triggerText}
          >
            <div className="flex items-center justify-center gap-2">
              <div>+</div>
              <div>{triggerText}</div>
            </div>
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="rounded-xl max-w-7xl w-[98vw] max-h-[98vh] flex flex-col overflow-hidden">
        <DialogHeader className="pb-4 flex-shrink-0">
          <DialogTitle className="text-3xl font-bold">
            Share your thoughts
          </DialogTitle>
          <DialogDescription className="text-lg text-muted-foreground">
            Be respectful and constructive in your response. Your comment should
            be up to 80 words maximum.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-6 p-1">
            <Textarea
              placeholder="Type your comment here... (up to 80 words)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[120px] max-h-[250px] w-full text-lg resize-none leading-relaxed p-6 border-2 focus:border-primary"
              style={{
                height: "auto",
                minHeight: "120px",
                maxHeight: "250px",
                overflowY: newComment.length > 300 ? "auto" : "hidden",
              }}
            />
            {/* Word count and validation removed as per request */}
          </div>
        </div>
        <DialogFooter className="pt-6 flex-shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || wordCount < 1 || wordCount > 80}
            className="px-12 py-3 text-lg font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Post Comment"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
