import nodemailer from "nodemailer";

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER || "ravalkrutarth95@gmail.com",
    pass: process.env.SMTP_PASS || "svcevyiycyainpbo",
  },
});

export async function sendOtpEmail(to: string, otpCode: string): Promise<boolean> {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Expense Tracker" <ravalkrutarth95@gmail.com>',
    to,
    subject: `Your Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 32px 24px; background: #0c0c0c; color: #ffffff; border-radius: 28px; border: 1px solid #262626;">
        <div style="margin-bottom: 24px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: 600; margin: 0; color: #ffffff;">Expense Tracker</h2>
          <p style="color: #888888; font-size: 13px; margin-top: 6px;">Email Verification</p>
        </div>
        <div style="background: #171717; border-radius: 20px; padding: 24px; text-align: center; border: 1px solid #333333; margin-bottom: 24px;">
          <span style="font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${otpCode}</span>
        </div>
        <p style="color: #999999; font-size: 13px; line-height: 1.5; text-align: center; margin: 0 0 16px 0;">
          Enter this 6-digit verification code to complete your registration. This code will expire in 10 minutes.
        </p>
        <p style="color: #555555; font-size: 11px; text-align: center; margin: 0;">
          If you did not request this code, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Your Expense Tracker verification code is: ${otpCode}. It expires in 10 minutes.`,
  };

  try {
    const info = await mailTransporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to", to, "messageId:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

