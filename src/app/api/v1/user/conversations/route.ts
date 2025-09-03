import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { conversations, comments, votes, participants } from "@/db/schema";
import { eq, and, count, sum, sql } from "drizzle-orm";
import { auth } from "@/lib/authOptions";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    // Fetch all conversations created by this user
    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.owner, uid));

    // Get conversation IDs for stats queries
    const conversationIds = userConversations.map(conv => conv.zid);
    
    let voteCounts: any[] = [];
    let commentCounts: any[] = [];
    let participantCounts: any[] = [];

    if (conversationIds.length > 0) {
      // Get vote counts for each conversation
      voteCounts = await db
        .select({
          zid: votes.zid,
          likeCount: sum(sql`CASE WHEN ${votes.vote} = 1 THEN 1 ELSE 0 END`).mapWith(Number),
          dislikeCount: sum(sql`CASE WHEN ${votes.vote} = -1 THEN 1 ELSE 0 END`).mapWith(Number),
          neutralCount: sum(sql`CASE WHEN ${votes.vote} = 0 THEN 1 ELSE 0 END`).mapWith(Number),
        })
        .from(votes)
        .where(sql`${votes.zid} IN (${sql.join(conversationIds, sql`, `)})`)
        .groupBy(votes.zid);

      // Get comment counts for each conversation
      commentCounts = await db
        .select({
          zid: comments.zid,
          commentsCount: count().mapWith(Number),
        })
        .from(comments)
        .where(sql`${comments.zid} IN (${sql.join(conversationIds, sql`, `)})`)
        .groupBy(comments.zid);

      // Get participant counts for each conversation
      participantCounts = await db
        .select({
          zid: participants.zid,
          participantCount: count().mapWith(Number),
        })
        .from(participants)
        .where(sql`${participants.zid} IN (${sql.join(conversationIds, sql`, `)})`)
        .groupBy(participants.zid);
    }

    // Create maps for quick lookup
    const voteCountMap: Record<number, any> = {};
    voteCounts.forEach(vc => {
      voteCountMap[vc.zid] = {
        likeCount: vc.likeCount || 0,
        dislikeCount: vc.dislikeCount || 0,
        neutralCount: vc.neutralCount || 0,
      };
    });

    const commentCountMap: Record<number, number> = {};
    commentCounts.forEach(cc => {
      commentCountMap[cc.zid] = cc.commentsCount || 0;
    });

    const participantCountMap: Record<number, number> = {};
    participantCounts.forEach(pc => {
      participantCountMap[pc.zid] = pc.participantCount || 0;
    });

    // Combine conversations with their stats
    const conversationsWithStats = userConversations.map(conv => ({
      ...conv,
      likeCount: voteCountMap[conv.zid]?.likeCount || 0,
      dislikeCount: voteCountMap[conv.zid]?.dislikeCount || 0,
      neutralCount: voteCountMap[conv.zid]?.neutralCount || 0,
      commentsCount: commentCountMap[conv.zid] || 0,
      participantCount: participantCountMap[conv.zid] || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        data: conversationsWithStats || [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user's conversations:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}