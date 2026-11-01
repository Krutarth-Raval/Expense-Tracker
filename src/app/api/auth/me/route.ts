import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: {
        id: true,
        email: true,
        salaryDate: true,
        salaryDay: true,
        salaryAmount: true,
        salaryConfigured: true,
        salaryPromptedAt: true,
        initialSavings: true,
        initialMonthBalance: true,
        onboardingCompleted: true,
        defaultPaymentApp: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
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

    // Auto-heal legacy database rows where salaryAmount was saved before salaryConfigured was introduced
    if (!user.salaryConfigured && user.salaryAmount && user.salaryAmount > 0) {
      prisma.user
        .update({
          where: { id: user.id },
          data: { salaryConfigured: true },
        })
        .catch(() => {});
    }

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
    console.error("Session verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}

