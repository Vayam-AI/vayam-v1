// Email template interfaces and functions
export interface FlagCommentUserEmailProps {
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

export const flagCommentUserEmail = ({
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
}: FlagCommentUserEmailProps): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Comment Has Been Flagged - ${appName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b;">${appName}</h1>
          <p style="margin: 8px 0 0; color: #dc2626; font-size: 14px; font-weight: 500;">🚩 Comment Flagged</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
            Hello ${commentAuthorName}
          </h2>
          
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
            Your comment in the conversation "<strong>${conversationTopic}</strong>" has been flagged by the community for review.
          </p>
          
          <!-- Alert Box -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #dc2626; font-weight: 500;">Reason: ${flagReason}</p>
          </div>
          
          <!-- Comment -->
          <div style="margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">Your Comment</h3>
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; color: #1e293b; font-style: italic;">"${commentTxt}"</p>
            </div>
          </div>
          
          <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">
            Our team is reviewing this flagged content. If the flag is justified, appropriate action may be taken. If you believe this was flagged in error, please contact our support team.
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