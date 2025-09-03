interface PrivateConversationEmailData {
  conversationLink: string;
  adminEmail: string;
}

export const privateConversationEmail = (data: PrivateConversationEmailData): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Private Conversation Invitation - Vayam</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b;">Vayam</h1>
          <p style="margin: 8px 0 0; font-size: 14px; color: #64748b;">Private Conversation Invitation</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1e293b;">
            Hello!
          </h2>
          
          <p style="margin: 0 0 20px; color: #475569; font-size: 16px;">
            You have been invited to join a private conversation on Vayam.
          </p>
          
          <!-- Conversation Card -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: #1e293b;">
              Private Conversation
            </h3>
            <p style="margin: 0; font-size: 14px; color: #64748b;">
              Invitation only • Admin: ${data.adminEmail}
            </p>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.conversationLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 500; font-size: 16px;">
              Join Conversation
            </a>
          </div>
          
          <p style="margin: 20px 0 0; color: #64748b; font-size: 14px;">
            This is a private conversation. Only invited members can participate.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © 2025 Vayam. All rights reserved.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};
