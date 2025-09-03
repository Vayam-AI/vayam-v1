import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { participants, votes, conversations, comments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { voteSchema } from "@/common/voteValidations";
import { auth } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    const body = await req.json();
    const validationResult = voteSchema.safeParse(body);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.flatten();
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errors: formattedErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { zid, tid, vote: numericVote } = validationResult.data;

    // First verify the conversation exists
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, zid))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Conversation does not exist",
        },
        { status: 404 }
      );
    }

    // Then verify the comment exists
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.tid, tid))
      .limit(1);

    if (!comment) {
      return NextResponse.json(
        {
          success: false,
          error: "Not Found",
          message: "Comment does not exist",
        },
        { status: 404 }
      );
    }

    // Verify the comment belongs to the conversation
    if (comment.zid !== zid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: "Comment does not belong to this conversation",
        },
        { status: 400 }
      );
    }

    // Find or create participant
    let [participant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.uid, uid), eq(participants.zid, zid)))
      .limit(1);

    if (!participant) {
      const newParticipants = await db
        .insert(participants)
        .values({
          uid,
          zid,
          voteCount: 0,
          lastInteraction: new Date().getTime(),
        })
        .returning();
      participant = newParticipants[0];
    }

    // Check for existing vote
    const [existingVote] = await db
      .select()
      .from(votes)
      .where(and(eq(votes.pid, participant.pid), eq(votes.tid, tid)));

    let responseMessage = "Vote recorded";
    let statusCode = 201;

    if (existingVote) {
      if (existingVote.vote === numericVote) {
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate vote",
            message: "Already voted this way",
          },
          { status: 400 }
        );
      }

      // Update existing vote
      await db
        .update(votes)
        .set({
          vote: numericVote,
          created: new Date(),
        })
        .where(and(eq(votes.pid, participant.pid), eq(votes.tid, tid)));
      responseMessage = "Vote updated";
      statusCode = 200;
    } else {
      // Create new vote
      await db.insert(votes).values({
        zid,
        pid: participant.pid,
        tid,
        uid,
        vote: numericVote,
        created: new Date(),
      });
    }

    // Update participant's last interaction
    await db
      .update(participants)
      .set({
        lastInteraction: new Date().getTime(),
      })
      .where(eq(participants.pid, participant.pid));

    // Update conversation vote counts
    const conversationVoteCounts = await db
      .select({
        likeCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = 1 THEN 1 END)`,
        dislikeCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = -1 THEN 1 END)`,
        neutralCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = 0 THEN 1 END)`,
      })
      .from(votes)
      .where(eq(votes.zid, zid));

    await db
      .update(conversations)
      .set({
        likeCount: conversationVoteCounts[0].likeCount,
        dislikeCount: conversationVoteCounts[0].dislikeCount,
        neutralCount: conversationVoteCounts[0].neutralCount,
        modified: new Date(),
      })
      .where(eq(conversations.zid, zid));

    // Update comment vote counts
    const commentVoteCounts = await db
      .select({
        likeCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = 1 THEN 1 END)`,
        dislikeCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = -1 THEN 1 END)`,
        neutralCount: sql<number>`COUNT(CASE WHEN ${votes.vote} = 0 THEN 1 END)`,
      })
      .from(votes)
      .where(eq(votes.tid, tid));

    await db
      .update(comments)
      .set({
        likeCount: commentVoteCounts[0].likeCount,
        dislikeCount: commentVoteCounts[0].dislikeCount,
        neutralCount: commentVoteCounts[0].neutralCount,
        modified: new Date(),
      })
      .where(eq(comments.tid, tid));

    return NextResponse.json(
      {
        success: true,
        message: responseMessage,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("API Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: "Failed to process vote",
      },
      { status: 500 }
    );
  }
}