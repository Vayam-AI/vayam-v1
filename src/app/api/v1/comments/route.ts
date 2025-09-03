import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { comments, conversations, participants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { commentSchema } from "@/common/commentValidations";
import { auth } from "@/lib/authOptions";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    const body = await req.json();
    const validationResult = commentSchema.safeParse(body);

    if (!validationResult.success) {
      const formattedErrors = validationResult.error.flatten();

      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          errors: formattedErrors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { zid, txt, isSeed } = validationResult.data;

    // Check or create participant
    let participant = await db
      .select()
      .from(participants)
      .where(and(eq(participants.zid, zid), eq(participants.uid, uid)))
      .then((res) => res[0]);

    if (!participant) {
      participant = await db
        .insert(participants)
        .values({
          zid,
          uid,
          voteCount: 0,
          lastInteraction: Date.now(),
        })
        .returning()
        .then((res) => res[0]);
    }

    // Insert comment
    const comment = await db
      .insert(comments)
      .values({
        zid,
        pid: participant.pid,
        uid,
        txt: txt.trim(),
        isSeed: isSeed || false,
      })
      .returning()
      .then((res) => res[0]);

    // Update last interaction
    await db
      .update(participants)
      .set({ lastInteraction: Date.now() })
      .where(eq(participants.pid, participant.pid));

    // Update total comment count for the conversation
    const commentCountQuery = await db
      .select({ totalComments: sql<number>`COUNT(*)` })
      .from(comments)
      .where(eq(comments.zid, zid));

    const commentCount = commentCountQuery[0].totalComments;

    await db
      .update(conversations)
      .set({
        commentsCount: commentCount,
        modified: new Date(),
      })
      .where(eq(conversations.zid, zid));

    return NextResponse.json(
      {
        success: true,
        data: {
          participant,
          comment,
          commentCount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
