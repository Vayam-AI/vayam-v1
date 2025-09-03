import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { comments, conversations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/utils/email";
import { flagCommentUserEmail } from "@/templates/flagCommentUserEmail";
import { flagCommentOwnerEmail } from "@/templates/flagCommentOwnerEmail";
import { flagCommentAdminEmail } from "@/templates/flagCommentAdminEmail";
import { auth } from "@/lib/authOptions";
import { authOptions } from "@/lib/authOptions";

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

    const tid = Number((await params).tid);
    if (isNaN(tid)) {
      return NextResponse.json(
        { success: false, error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const { flagStatus, flagReason } = await req.json();

    // Get the comment to verify user permissions
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.tid, tid));

    if (!comment) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    // Get the conversation to check if user is the owner
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, comment.zid));

    if (!conversation) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Only the conversation owner can flag comments
    if (conversation.owner !== uid) {
      return NextResponse.json(
        { success: false, error: "Only conversation owner can flag comments" },
        { status: 403 }
      );
    }

    // Update the comment's flag status and reason
    const result = await db
      .update(comments)
      .set({
        flagStatus,
        flagReason,
      })
      .where(eq(comments.tid, tid))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Comment not found" },
        { status: 404 }
      );
    }

    const updatedComment = result[0];
    const conversationId = updatedComment.zid;
    const commentAuthorId = updatedComment.uid;

    // Get conversation details
    const conversationDetails = await db
      .select()
      .from(conversations)
      .where(eq(conversations.zid, conversationId))
      .limit(1);

    if (conversationDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conversation not found" },
        { status: 404 }
      );
    }

    const flaggedConversation = conversationDetails[0];
    const conversationOwnerId = flaggedConversation.owner;

    // Get comment author details
    const commentAuthorDetails = await db
      .select()
      .from(users)
      .where(eq(users.uid, commentAuthorId))
      .limit(1);

    if (commentAuthorDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: "Comment author not found" },
        { status: 404 }
      );
    }

    // Get conversation owner details
    if (conversationOwnerId === null || conversationOwnerId === undefined) {
      return NextResponse.json(
        { success: false, error: "Conversation owner not found" },
        { status: 404 }
      );
    }

    const conversationOwnerDetails = await db
      .select()
      .from(users)
      .where(eq(users.uid, conversationOwnerId))
      .limit(1);

    if (conversationOwnerDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: "Conversation owner not found" },
        { status: 404 }
      );
    }

    // Prepare email data
    const commentAuthorEmail = commentAuthorDetails[0].email;
    const commentAuthorName =
      commentAuthorDetails[0].hname || commentAuthorDetails[0].username;
    const ownerEmail = conversationOwnerDetails[0].email;
    const ownerName =
      conversationOwnerDetails[0].hname || conversationOwnerDetails[0].username;
    const adminEmail = process.env.ADMIN_EMAIL || "abhiramjaini28@gmail.com";

    // Send email to comment author
    const userEmailContent = flagCommentUserEmail({
      commentTxt: updatedComment.txt,
      commentId: updatedComment.tid,
      conversationId: conversation.zid,
      conversationTopic: conversation.topic!,
      conversationDescription: conversation.description!,
      ownerEmail: ownerEmail!,
      commentAuthorEmail: commentAuthorEmail!,
      commentAuthorName: commentAuthorName!,
      ownerName: ownerName!,
      flagReason: flagReason,
    });

    await sendEmail(
      commentAuthorEmail!,
      "Your Comment Has Been Flagged - Vayam",
      userEmailContent
    );

    // Send email to conversation owner
    const ownerEmailContent = flagCommentOwnerEmail({
      commentTxt: updatedComment.txt,
      commentId: updatedComment.tid,
      conversationId: conversation.zid,
      conversationTopic: conversation.topic!,
      conversationDescription: conversation.description!,
      commentAuthorEmail: commentAuthorEmail!,
      ownerEmail: ownerEmail!,
      ownerName: ownerName!,
      commentAuthorName: commentAuthorName!,
      flagReason: flagReason,
    });

    await sendEmail(
      ownerEmail!,
      "Comment Flagged in Your Conversation - Vayam",
      ownerEmailContent
    );

    // Send email to admin
    const adminEmailContent = flagCommentAdminEmail({
      commentTxt: updatedComment.txt,
      commentId: updatedComment.tid,
      conversationId: conversation.zid,
      conversationTopic: conversation.topic!,
      conversationDescription: conversation.description!,
      ownerEmail: ownerEmail!,
      commentAuthorEmail: commentAuthorEmail!,
      flagReason: flagReason!,
      ownerName: ownerName!,
      commentAuthorName: commentAuthorName!,
    });

    await sendEmail(
      adminEmail,
      "Comment Flagged - Admin Notification - Vayam",
      adminEmailContent
    );

    // Prepare response data
    const responseData = {
      comment: {
        id: updatedComment.tid,
        text: updatedComment.txt,
        flagStatus: updatedComment.flagStatus,
        flagReason: updatedComment.flagReason,
        createdAt: updatedComment.created,
        modifiedAt: updatedComment.modified,
        isActive: updatedComment.active,
        isSeed: updatedComment.isSeed,
      },
      conversation: {
        id: conversation.zid,
        topic: conversation.topic,
        description: conversation.description,
        isPublic: conversation.isPublic,
        strictModeration: conversation.strictModeration,
        createdAt: conversation.createdAt,
      },
      commentAuthor: {
        id: commentAuthorDetails[0].uid,
        username: commentAuthorDetails[0].username,
        name: commentAuthorDetails[0].hname,
        email: commentAuthorDetails[0].email,
      },
      conversationOwner: {
        id: conversationOwnerDetails[0].uid,
        username: conversationOwnerDetails[0].username,
        name: conversationOwnerDetails[0].hname,
        email: conversationOwnerDetails[0].email,
      },
      emailsSent: {
        toCommentAuthor: commentAuthorEmail,
        toConversationOwner: ownerEmail,
        toAdmin: adminEmail,
      },
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error in PUT request:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
