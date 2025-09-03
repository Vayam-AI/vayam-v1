interface OTPEmailData {
  name: string;
  otp: string;
}

export const otpEmailTemplate = (data: OTPEmailData): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification - Vayam</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; line-height: 1.6;">
      <div style="max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #e2e8f0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1e293b;">Vayam</h1>
          <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">Email Verification</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
            Hello ${data.name}
          </h2>
          
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">
            Please verify your email address by entering this code:
          </p>
          
          <!-- OTP -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <div style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 4px; font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;">
              ${data.otp}
            </div>
            <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;">
              Expires in 3 minutes
            </p>
          </div>
          
          <p style="margin: 24px 0 0; color: #64748b; font-size: 14px;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 12px;">
            © 2025 Vayam. All rights reserved.
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};
