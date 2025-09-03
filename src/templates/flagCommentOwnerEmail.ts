export interface FlagCommentOwnerEmailProps {
  commentTxt: string;
  commentId: number;
  conversationId: number;
  conversationTopic: string;
  conversationDescription: string;
  appName?: string;
  supportEmail?: string;
  ownerEmail: string;
  commentAuthorEmail: string;
  flagReason: string;
  ownerName: string;
  commentAuthorName: string;
}

export const flagCommentOwnerEmail = ({
  commentTxt,
  commentId,
  conversationId,
  conversationTopic,
  conversationDescription,
  appName = "Vayam",
  supportEmail = "support@vayam.ai",
  ownerEmail,
  commentAuthorEmail,
  flagReason,
  ownerName,
  commentAuthorName,
}: FlagCommentOwnerEmailProps): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comment Flagged - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b;">${appName}</h1>
          <p style="margin: 8px 0 0; color: #f59e0b; font-size: 14px; font-weight: 500;">⚠️ Comment Flagged in Your Conversation</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
            Hello ${ownerName}
          </h2>
          
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
            A comment in your conversation "<strong>${conversationTopic}</strong>" has been flagged by the community.
          </p>
          
          <!-- Alert Box -->
          <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #f59e0b; font-weight: 500;">Reason: ${flagReason}</p>
          </div>
          
          <!-- Comment -->
          <div style="margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">Flagged Comment</h3>
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0 0 8px; color: #1e293b; font-style: italic;">"${commentTxt}"</p>
              <p style="margin: 0; color: #64748b; font-size: 14px;">— by ${commentAuthorName}</p>
            </div>
          </div>
          
          <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">
            We're reviewing this content and will take appropriate action if necessary. You'll be notified of any updates.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            Questions? Contact us at ${supportEmail}
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};