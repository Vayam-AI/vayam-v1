"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Meh,
  BarChart2,
  Flag,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/ui/loading";
import VisUi from "@/components/visualization/vis-ui";
import { isAdminUser } from "@/utils/adminCheck";

const voteIcons = {
  1: <ThumbsUp className="w-4 h-4 text-primary" />, // Like
  0: <Meh className="w-4 h-4 text-primary" />, // Neutral
  "-1": <ThumbsDown className="w-4 h-4 text-primary" />, // Dislike
};
const voteLabels = {
  1: "Like",
  0: "Neutral",
  "-1": "Dislike",
};

// Flag reasons for the select dropdown
const flagReasons = [
  "Inappropriate content",
  "Spam or advertising",
  "Harassment or bullying",
  "False information",
  "Offensive language",
  "Other (please specify below)",
];

function ConversationCard({
  conversation,
  onClick,
  selected,
}: {
  conversation: any;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 120 }}
      className={`w-full cursor-pointer ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      onClick={onClick}
    >
      <Card className="relative overflow-hidden group transition-transform">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="truncate max-w-[180px]">{conversation.topic}</span>
            {conversation.isActive ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
            {conversation.isPublic ? (
              <Badge variant="secondary">Public</Badge>
            ) : (
              <Badge variant="outline">Private</Badge>
            )}
          </CardTitle>
          <span className="ml-auto text-xs text-muted-foreground">
          </span>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm mb-2 text-foreground/90">
            {conversation.description}
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {conversation.tags?.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {conversation.likeCount}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="w-3 h-3" />
              {conversation.dislikeCount}
            </span>
            <span className="flex items-center gap-1">
              <Meh className="w-3 h-3" />
              {conversation.neutralCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {conversation.commentsCount}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CommentCard({
  comment,
  index,
  onFlagUpdate,
  isOwner,
}: {
  comment: any;
  index: number;
  onFlagUpdate: (tid: number, flagStatus: string, flagReason: string) => void;
  isOwner: boolean;
}) {
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [flagLoading, setFlagLoading] = useState(false);

  // Only show flag button if status is rejected, null, or undefined
  const canFlag =
    isOwner && (!comment.flagStatus || comment.flagStatus === "rejected");

  // Badge logic
  let flagBadge = null;
  if (comment.flagStatus === "flagged") {
    flagBadge = (
      <Badge variant="destructive" className="flex items-center gap-1">
        <Flag className="w-3 h-3" />
        Flagged
      </Badge>
    );
  } else if (comment.flagStatus === "pending") {
    flagBadge = (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Flag className="w-3 h-3" />
        Flag Pending
      </Badge>
    );
  }

  const isOther = selectedReason === "Other (please specify below)";
  const isFlagButtonDisabled =
    flagLoading || !selectedReason || (isOther && !customReason.trim());

  const handleFlag = async () => {
    if (!selectedReason || (isOther && !customReason.trim())) {
      toast.error("Please select or specify a reason for flagging");
      return;
    }
    const reasonToSend = isOther ? customReason.trim() : selectedReason;
    setFlagLoading(true);
    try {
      const response = await axios.put(`/api/v1/comments/flag/${comment.tid}`, {
        flagStatus: "pending",
        flagReason: reasonToSend,
      });
      if (response.data.success) {
        onFlagUpdate(comment.tid, "pending", reasonToSend);
        toast.success("Comment flag request sent. Awaiting admin review.");
        setFlagDialogOpen(false);
        setSelectedReason("");
        setCustomReason("");
      }
    } catch (error: any) {
      console.error("Error flagging comment:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to flag comment. Please try again.";
      toast.error(errorMessage);
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 120 }}
      className="w-full"
    >
      <Card className="relative overflow-hidden group transition-transform">
        <CardHeader className="flex flex-row items-center gap-2 ">
          <CardTitle className="flex items-center gap-2 text-base">
            {flagBadge}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm mb-2 text-foreground/90">{comment.txt}</div>
          {comment.flagReason && comment.flagStatus !== "rejected" && (
            <div className="mb-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                <AlertTriangle className="w-3 h-3" />
                Flag Reason: {comment.flagReason}
              </div>
            </div>
          )}
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap items-center justify-between">
            <div className="flex gap-3">
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                {comment.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsDown className="w-3 h-3" />
                {comment.dislikeCount}
              </span>
              <span className="flex items-center gap-1">
                <Meh className="w-3 h-3" />
                {comment.neutralCount}
              </span>
            </div>
            {canFlag && (
              <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-destructive border-destructive hover:bg-destructive/10"
                  >
                    <Flag className="w-3 h-3" />
                    Report to Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Comment to Admin</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      As the conversation creator, you can report this comment
                      to the admin for review. The admin will be notified and
                      can take appropriate action.
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Reason for reporting:
                      </label>
                      <Select
                        value={selectedReason}
                        onValueChange={setSelectedReason}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {flagReasons.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isOther && (
                        <input
                          type="text"
                          className="mt-3 w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Please specify the reason"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                        />
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setFlagDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleFlag}
                        disabled={isFlagButtonDisabled}
                      >
                        {flagLoading ? "Reporting..." : "Report to Admin"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [tab, setTab] = useState<"stats" | "comments" | "visualization">(
    "stats"
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = isAdminUser(session?.user?.email);

  // Simple date formatter
  const formatDate = (timestamp: string | number) => {
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  useEffect(() => {
    if (status === "loading") return; // Still loading
    
    if (status === "unauthenticated") {
      router.replace("/");
      return;
    }

    if (status === "authenticated" && !isAdmin) {
      router.replace("/home");
      return;
    }

    if (status === "authenticated" && isAdmin) {
      setDashboardLoading(true);
      axios
        .get(`/api/v1/user/conversations`)
        .then((res) => setConversations(res.data.data || []))
        .catch((error) => {
          console.error("Error fetching conversations:", error);
          setConversations([]);
        })
        .finally(() => setDashboardLoading(false));
    }
  }, [status, isAdmin, router]);

  const handleSelect = (conv: any) => {
    setSelected(conv);
    setDetailsLoading(true);
    setTab("stats");
    axios
      .get(`/api/v1/conversations/${conv.zid}`)
      .then((res) => setDetails(res.data.data))
      .catch(() => setDetails(null))
      .finally(() => setDetailsLoading(false));
  };

  const handleFlagUpdate = (
    tid: number,
    flagStatus: string,
    flagReason: string
  ) => {
    setDetails((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        comments: prev.comments.map((comment: any) => {
          if (comment.tid === tid) {
            return {
              ...comment,
              flagStatus,
              flagReason,
            };
          }
          return comment;
        }),
      };
    });
  };

  if (status === "loading" || dashboardLoading || (status === "authenticated" && !isAdmin)) {
    return <Loading />;
  }

  if (status === "unauthenticated") {
    return null; // Will redirect to root
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-2 md:px-0">
      <h2 className="text-2xl font-bold tracking-tight mb-8">
        Your Conversations
      </h2>
      {/* Show conversation list only if not selected */}
      {!selected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <AnimatePresence>
            {conversations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-muted-foreground text-center py-8 col-span-2"
              >
                No conversations found.
              </motion.div>
            ) : (
              conversations.map((conv, idx) => (
                <ConversationCard
                  key={conv.zid}
                  conversation={conv}
                  onClick={() => handleSelect(conv)}
                  selected={selected && selected.zid === conv.zid}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      )}
      {/* Details panel */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => {
              setSelected(null);
              setDetails(null);
            }}
          >
            ← Back to all conversations
          </Button>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <CardTitle className="flex items-center gap-2 text-lg">
                <span>{selected.topic}</span>
                {selected.isActive ? (
                  <Badge variant="default">Active</Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
                {selected.isPublic ? (
                  <Badge variant="secondary">Public</Badge>
                ) : (
                  <Badge variant="outline">Private</Badge>
                )}
              </CardTitle>
              <span className="ml-auto text-xs text-muted-foreground">
                {formatDate(selected.createdAt)}
              </span>
            </CardHeader>
            <CardContent>
              {/* Tab Switcher */}
              <div className="flex gap-4 mb-6 mt-2">
                <Button
                  variant={tab === "stats" ? "default" : "outline"}
                  onClick={() => setTab("stats")}
                >
                  Conversation Stats
                </Button>
                <Button
                  variant={tab === "comments" ? "default" : "outline"}
                  onClick={() => setTab("comments")}
                >
                  Comments with Votes
                </Button>
                <Button
                  variant={tab === "visualization" ? "default" : "outline"}
                  onClick={() => setTab("visualization")}
                >
                  Visualization
                </Button>
              </div>
              {detailsLoading ? (
                <Loading />
              ) : details ? (
                <div>
                  {tab === "stats" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="mb-2 text-lg font-semibold">
                          Description
                        </div>
                        <div className="mb-4 text-muted-foreground">
                          {details.description}
                        </div>
                        <div className="mb-2 text-lg font-semibold">Tags</div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {details.tags?.map((tag: string) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mb-2 text-lg font-semibold">
                          Allowed Emails
                        </div>
                        <div className="flex gap-2 flex-wrap mb-4">
                          {details.allowedEmails?.length > 0 ? (
                            details.allowedEmails.map((email: string) => (
                              <Badge key={email} variant="secondary">
                                {email}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 text-lg font-semibold">Stats</div>
                        <div className="grid grid-cols-2 gap-3 bg-muted/40 rounded-xl p-4">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm">
                            <ThumbsUp className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Likes:</span>
                            <span>{details.likeCount}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm">
                            <ThumbsDown className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Dislikes:</span>
                            <span>{details.dislikeCount}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm">
                            <Meh className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Neutral:</span>
                            <span>{details.neutralCount}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Comments:</span>
                            <span>{details.commentsCount}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm">
                            <BarChart2 className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Participants:</span>
                            <span>{details.participantCount}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-card shadow-sm col-span-2">
                            <span className="font-semibold">
                              Strict Moderation:
                            </span>
                            <span>
                              {details.strictModeration ? "Yes" : "No"}
                            </span>
                            <span className="font-semibold ml-4">
                              Prioritize Seed:
                            </span>
                            <span>{details.prioritizeSeed ? "Yes" : "No"}</span>
                            
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {tab === "comments" && (
                    <div className="flex flex-col gap-6">
                      {details.comments?.length === 0 ? (
                        <div className="text-muted-foreground text-center py-8">
                          No comments yet.
                        </div>
                      ) : (
                        details.comments.map((comment: any, idx: number) => (
                          <CommentCard
                            key={comment.tid}
                            comment={comment}
                            index={idx}
                            onFlagUpdate={(tid, flagStatus, flagReason) => {
                              handleFlagUpdate(tid, flagStatus, flagReason);
                            }}
                            isOwner={true}
                          />
                        ))
                      )}
                    </div>
                  )}
                  {tab === "visualization" && (
                    <div className="text-center text-muted-foreground py-12">
                      {error ? (
                        <div className="text-destructive text-center">
                          {error}
                        </div>
                      ) : (
                        <VisUi zid={String(selected.zid)} />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No details found.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
