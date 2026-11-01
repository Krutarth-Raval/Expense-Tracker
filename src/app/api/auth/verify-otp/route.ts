import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json();

    const cleanEmail = email?.trim().toLowerCase();
    const cleanCode = code?.trim();

    if (!cleanEmail || !cleanCode) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Verify OTP in Neon PostgreSQL
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        expiresAt: { gt: new Date() },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Hash user password
    const hashedPassword = await bcrypt.hash(password || "ExpenseTracker@123", 10);

    // Save user in Neon PostgreSQL database
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: { password: hashedPassword },
      create: {
        email: cleanEmail,
        password: hashedPassword,
      },
    });

    console.log("User verified and saved to database successfully:", user.email);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        salaryDate: user.salaryDate,
        salaryDay: user.salaryDay,
        salaryAmount: user.salaryAmount,
        salaryConfigured: user.salaryConfigured,
        salaryPromptedAt: user.salaryPromptedAt,
        initialSavings: user.initialSavings,
        initialMonthBalance: user.initialMonthBalance,
        onboardingCompleted: user.onboardingCompleted,
        defaultPaymentApp: user.defaultPaymentApp,
      },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify code. Please try again." },
      { status: 500 }
    );
  }
}

