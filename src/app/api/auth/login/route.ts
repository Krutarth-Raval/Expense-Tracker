import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const cleanEmail = email?.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Look up user in Neon PostgreSQL database
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this email. Please sign up." },
        { status: 401 }
      );
    }

    // Verify hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Incorrect password" },
        { status: 401 }
      );
    }

    const salaryDay =
      user.salaryDay !== null && user.salaryDay !== undefined
        ? user.salaryDay
        : user.salaryDate
        ? new Date(user.salaryDate).getUTCDate()
        : 1;

    const salaryConfigured = Boolean(
      user.salaryConfigured ||
      (user.salaryAmount !== null && user.salaryAmount !== undefined && user.salaryAmount > 0)
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        salaryDate: user.salaryDate,
        salaryDay,
        salaryAmount: user.salaryAmount,
        salaryConfigured,
        salaryPromptedAt: user.salaryPromptedAt,
        initialSavings: user.initialSavings,
        initialMonthBalance: user.initialMonthBalance,
        onboardingCompleted: user.onboardingCompleted,
        defaultPaymentApp: user.defaultPaymentApp,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to log in. Please try again." },
      { status: 500 }
    );
  }
}

