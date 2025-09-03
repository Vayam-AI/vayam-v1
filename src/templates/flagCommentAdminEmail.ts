export interface FlagCommentAdminEmailProps {
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

export const flagCommentAdminEmail = ({
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
}: FlagCommentAdminEmailProps): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comment Flagged - Admin Alert</title>
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
            Admin Alert
          </h2>
          
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
            A comment has been flagged and requires your attention.
          </p>
          
          <!-- Alert Box -->
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; color: #dc2626; font-weight: 500;">Reason: ${flagReason}</p>
          </div>
          
          <!-- Details -->
          <div style="margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">Details</h3>
            <div style="background: #f8fafc; border-radius: 6px; padding: 16px;">
              <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>Conversation:</strong> ${conversationTopic}</p>
              <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>Comment Author:</strong> ${commentAuthorName} (${commentAuthorEmail})</p>
              <p style="margin: 0 0 8px; color: #475569; font-size: 14px;"><strong>Conversation Owner:</strong> ${ownerName} (${ownerEmail})</p>
              <p style="margin: 0; color: #475569; font-size: 14px;"><strong>Comment ID:</strong> #${commentId}</p>
            </div>
          </div>
          
          <!-- Comment -->
          <div style="margin: 24px 0;">
            <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1e293b;">Flagged Comment</h3>
            <div style="background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; color: #1e293b; font-style: italic;">"${commentTxt}"</p>
            </div>
          </div>
          
          <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">
            Please review this flagged content and take appropriate action.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            This is an automated message from ${appName} | Contact: ${supportEmail}
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};