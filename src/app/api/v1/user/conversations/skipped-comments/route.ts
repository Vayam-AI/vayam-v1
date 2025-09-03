import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { comments, conversations, votes, users } from "@/db/schema";
import { eq, and, not, exists } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { auth } from "@/lib/authOptions";

export async function GET(req: Request) {
  try {
    const session = await auth();
        if (!session || !session.user?.id) {
          return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        const uid = Number(session.user.id);

    const url = new URL(req.url);
    const zid = url.searchParams.get("zid");

    // Validate parameters
    if (!uid || isNaN(Number(uid))) {
      return NextResponse.json(
        { error: "Valid User ID is required" },
        { status: 400 }
      );
    }

    if (!zid || isNaN(Number(zid))) {
      return NextResponse.json(
        { error: "Valid Conversation ID (zid) is required" },
        { status: 400 }
      );
    }

    const numericUid = Number(uid);
    const numericZid = Number(zid);

    // Check if conversation exists
    const conversationResults = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, numericZid))
      .limit(1);

    if (conversationResults.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check if user exists
    const userResults = await db
      .select()
      .from(users)
      .where(eq(users.uid, numericUid))
      .limit(1);

    if (userResults.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all comments the user hasn't voted on (skipped comments)
    const skippedComments = await db
      .select({
        tid: comments.tid,
        zid: comments.zid,
        uid: comments.uid,
        txt: comments.txt,
        created: comments.created,
        modified: comments.modified,
        isSeed: comments.isSeed,
      })
      .from(comments)
      .where(
        and(
          eq(comments.zid, numericZid),
          eq(comments.active, true),
          not(
            exists(
              db
                .select()
                .from(votes)
                .where(
                  and(
                    eq(votes.tid, comments.tid),
                    eq(votes.uid, numericUid),
                    eq(votes.zid, numericZid)
                  )
                )
            )
          )
        )
      );

    // Get count of all active comments in the conversation
    const allCommentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(comments)
      .where(and(eq(comments.zid, numericZid), eq(comments.active, true)));

    return NextResponse.json({
      success: true,
      data: {
        conversation: conversationResults[0],
        user: {
          uid: userResults[0].uid,
          username: userResults[0].username,
        },
        stats: {
          skippedCommentsCount: skippedComments.length,
          totalCommentsCount: allCommentsCount[0].count,
          participationPercentage:
            allCommentsCount[0].count > 0
              ? (
                  ((allCommentsCount[0].count - skippedComments.length) /
                    allCommentsCount[0].count) *
                  100
                ).toFixed(2)
              : 0,
        },
        skippedComments: skippedComments,
      },
    });
  } catch (error) {
    console.error(
      "Error in GET /api/v1/user/conversations/skipped-comments:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
