import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists. Please log in.",
        },
        { status: 409 }
      );
    }

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up older pending OTPs for this email
    await prisma.otpVerification.deleteMany({
      where: { email: cleanEmail },
    });

    // Store in Neon PostgreSQL database
    await prisma.otpVerification.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // Send real email via Gmail SMTP (Nodemailer)
    const emailSent = await sendOtpEmail(cleanEmail, code);

    if (!emailSent) {
      console.warn("Email sending failed via SMTP, but OTP is stored in DB:", code);
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}

