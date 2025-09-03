import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { conversations, comments, votes, participants } from "@/db/schema";
import { eq, and, count, sum, sql } from "drizzle-orm";
import { sendEmail } from "@/utils/email";
import { privateConversationEmail } from "@/templates/privateConversationEmail";
import { auth } from "@/lib/authOptions";
import { authOptions } from "@/lib/authOptions";

export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    if (!params?.zid) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const zid = Number(params.zid);
    if (isNaN(zid)) {
      return NextResponse.json(
        { success: false, error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    // Fetch the conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, zid));

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get participant count for this conversation
    const [participantCountResult] = await db
      .select({ count: count() })
      .from(participants)
      .where(eq(participants.zid, zid));

    const participantCount = participantCountResult?.count || 0;

    // Fetch comments with ALL votes (for vote counts)
    const commentsWithAllVotes = await db
      .select({
        comments: comments,
        votes: votes,
      })
      .from(comments)
      .leftJoin(
        votes,
        and(eq(comments.tid, votes.tid), eq(comments.zid, votes.zid))
      )
      .where(eq(comments.zid, zid));

    // Fetch user's specific votes for this conversation
    // First get the participant record for this user
    const [userParticipant] = await db
      .select()
      .from(participants)
      .where(and(eq(participants.uid, uid), eq(participants.zid, zid)));

    let userVotes: any[] = [];
    if (userParticipant) {
      userVotes = await db
        .select()
        .from(votes)
        .where(and(eq(votes.zid, zid), eq(votes.pid, userParticipant.pid)));
    }

    // Create a map of user votes by tid
    const userVoteMap = new Map();
    userVotes.forEach(vote => {
      userVoteMap.set(vote.tid, vote);
    });

    // Structure the data
    const structuredComments = commentsWithAllVotes.reduce((acc, row) => {
      const comment = row.comments;
      const vote = row.votes;

      const existingComment = acc.find((c) => c.tid === comment.tid);
      if (existingComment) {
        if (vote) {
          existingComment.votes.push(vote);
        }
      } else {
        const userVote = userVoteMap.get(comment.tid);
        acc.push({
          ...comment,
          votes: vote ? [vote] : [],
          userVote: userVote || null, // Add user's specific vote
        });
      }
      return acc;
    }, [] as any[]);

    // Calculate vote counts for the conversation
    const allVotes = await db
      .select({
        likeCount: sum(sql`CASE WHEN ${votes.vote} = 1 THEN 1 ELSE 0 END`).mapWith(Number),
        dislikeCount: sum(sql`CASE WHEN ${votes.vote} = -1 THEN 1 ELSE 0 END`).mapWith(Number),
        neutralCount: sum(sql`CASE WHEN ${votes.vote} = 0 THEN 1 ELSE 0 END`).mapWith(Number),
      })
      .from(votes)
      .where(eq(votes.zid, zid));

    const voteCounts = allVotes[0] || { likeCount: 0, dislikeCount: 0, neutralCount: 0 };

    // Calculate vote counts for each comment
    const commentsWithCounts = structuredComments.map(comment => {
      const commentVotes = comment.votes;
      const likeCount = commentVotes.filter((v: any) => v.vote === 1).length;
      const dislikeCount = commentVotes.filter((v: any) => v.vote === -1).length;
      const neutralCount = commentVotes.filter((v: any) => v.vote === 0).length;
      
      return {
        ...comment,
        likeCount,
        dislikeCount,
        neutralCount,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...conversation,
          participantCount,
          likeCount: voteCounts.likeCount || 0,
          dislikeCount: voteCounts.dislikeCount || 0,
          neutralCount: voteCounts.neutralCount || 0,
          commentsCount: structuredComments.length,
          comments: commentsWithCounts,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: any
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    if (!params?.zid) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const zid = Number(params.zid);
    if (isNaN(zid)) {
      return NextResponse.json(
        { success: false, error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    const { emails } = await req.json();

    if (!Array.isArray(emails)) {
      return NextResponse.json(
        { success: false, error: "Emails must be an array" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid email format: ${invalidEmails.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Get current conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, zid));

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Check if conversation is private
    if (conversation.isPublic) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot update emails for public conversation",
        },
        { status: 400 }
      );
    }

    // Initialize allowedEmails if it doesn't exist
    const currentAllowedEmails = conversation.allowedEmails || [];

    // Remove duplicates and filter out existing emails
    const uniqueEmails = [...new Set(emails)];
    const newEmails = uniqueEmails.filter(
      (email) => !currentAllowedEmails.includes(email)
    );

    // Update allowed emails in database
    const [updatedConversation] = await db
      .update(conversations)
      .set({
        allowedEmails: [...currentAllowedEmails, ...newEmails],
      })
      .where(eq(conversations.zid, zid))
      .returning();

    // Send emails to new recipients
    if (newEmails.length > 0) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!baseUrl) {
        console.error("NEXT_PUBLIC_BASE_URL environment variable is not set");
        return NextResponse.json(
          { success: false, error: "Server configuration error" },
          { status: 500 }
        );
      }

      const conversationLink = `${baseUrl}/conversations/${zid}`;
      const emailSubject = `You've been invited to join a private conversation: ${conversation.topic}`;

      const emailBody = privateConversationEmail({
        conversationLink,
        adminEmail: process.env.SENDER_EMAIL || "admin@vayam.com",
      });

      const emailPromises = newEmails.map(async (email) => {
        try {
          await sendEmail(email, emailSubject, emailBody);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      });

      await Promise.allSettled(emailPromises);
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedConversation,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating conversation emails:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}