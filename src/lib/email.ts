/**
 * Transactional email service for Tickety.
 * Supports Resend API (via RESEND_API_KEY) or logs in development/fallback.
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  recipientName,
}: {
  to: string;
  resetUrl: string;
  recipientName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "Tickety Support <support@tickety.app>";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #f5f5f5; padding: 24px; }
          .container { max-width: 520px; margin: 0 auto; background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 32px; }
          .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
          .footer { margin-top: 24px; font-size: 12px; color: #737373; border-top: 1px solid #262626; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2 style="margin-top: 0; color: #ffffff;">Password Reset Request</h2>
          <p>Hello ${recipientName || "there"},</p>
          <p>We received a request to reset your password for your Tickety account. Click the button below to choose a new password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="btn">Reset My Password</a>
          </p>
          <p style="font-size: 13px; color: #a3a3a3;">This link will expire in 60 minutes. If you did not request a password reset, you can safely ignore this email.</p>
          <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #818cf8;">${resetUrl}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  if (!apiKey) {
    console.log(`[Email Service (Dev/No-Key)]: Password reset email for ${to}: ${resetUrl}`);
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: "Reset your Tickety password",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[Email Service Error]:", body);
      return { success: false, error: "Failed to deliver email through provider." };
    }

    return { success: true };
  } catch (err) {
    console.error("[Email Service Exception]:", err);
    return { success: false, error: "Network error sending email." };
  }
}
