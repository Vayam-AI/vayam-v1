import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { conversations, zinvites, users, votes, comments, participants } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { generateConversationId } from "@/utils/generateConversationId";
import { sendEmail } from "@/utils/email";
import { privateConversationEmail } from "@/templates/privateConversationEmail";
import { conversationSchema } from "@/common/conversationValidations";
import { auth } from "@/lib/authOptions";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    const activeConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.isActive, true))
      .orderBy(desc(conversations.createdAt));

    // Fetch all votes by this user for all active conversations
    const userVotes = await db
      .select({ zid: votes.zid, tid: votes.tid, vote: votes.vote })
      .from(votes)
      .where(eq(votes.uid, uid));

    // Group votes by zid
    const votesMap: Record<number, { tid: number, vote: number }[]> = {};
    for (const v of userVotes) {
      if (v.zid === null || v.tid === null || v.vote === null) continue;
      if (!votesMap[v.zid]) votesMap[v.zid] = [];
      votesMap[v.zid].push({ tid: v.tid, vote: v.vote });
    }

    // Fetch participant counts for all conversations
    const participantCounts = await db
      .select({ 
        zid: participants.zid, 
        count: count() 
      })
      .from(participants)
      .groupBy(participants.zid);

    // Create a map of zid to participant count
    const participantCountMap: Record<number, number> = {};
    participantCounts.forEach(pc => {
      participantCountMap[pc.zid] = pc.count;
    });

    // Attach userVotes, participantCount, and logos to each conversation
    const conversationsWithExtras = activeConversations.map((conv) => ({
      zid: conv.zid,
      topic: conv.topic,
      description: conv.description,
      tags: conv.tags,
      participantCount: participantCountMap[conv.zid] || 0,
      logos: conv.logos || [],
      userVotes: votesMap[conv.zid] || [],
    }));

    return NextResponse.json(
      {
        success: true,
        data: conversationsWithExtras,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);

    const body = await req.json();
    const validationResult = conversationSchema.safeParse(body);

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

    const owner = uid;

    const {
      topic,
      description,
      isActive = true,
      isPublic = true,
      tags = [],
      allowedEmails = [],
      adminEmail,
    } = validationResult.data;

    // Set default admin email if not provided
    const finalAdminEmail = adminEmail || process.env.SENDER_EMAIL || "noreply@example.com";

    // Verify owner exists
    const [ownerExists] = await db
      .select({ uid: users.uid })
      .from(users)
      .where(eq(users.uid, Number(owner)));

    if (!ownerExists) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation Error",
          message: "Specified owner does not exist",
        },
        { status: 404 }
      );
    }

    // Additional validation for private conversations
    if (!isPublic) {
      if (allowedEmails.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation Error",
            message: "Private conversations require at least one allowed email",
          },
          { status: 400 }
        );
      }
    }

    // Create the conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        topic,
        description,
        isActive,
        isPublic,
        owner: Number(uid),
        tags,
        allowedEmails: isPublic ? [] : allowedEmails,
        createdAt: new Date().getTime(),
      })
      .returning();

    // Generate and store conversation invite ID
    const conversationId = await generateConversationId();
    await db.insert(zinvites).values({
      zid: newConversation.zid,
      zinvite: conversationId,
      created: new Date(),
    });

    if (!isPublic && allowedEmails.length > 0) {
      const conversationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/${newConversation.zid}`;
      const emailSubject = `You've been invited to join a private conversation: ${topic}`;
      const emailBody = privateConversationEmail({
        conversationLink,
        adminEmail: finalAdminEmail,
      });

      // Send emails in parallel but don't wait for completion
      allowedEmails.forEach(async (email) => {
        try {
          await sendEmail(email, emailSubject, emailBody);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newConversation,
          conversationId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/conversations:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        ...(process.env.NODE_ENV === "development" && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
