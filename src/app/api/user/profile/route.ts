import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
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
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const salaryDay =
      user.salaryDay !== null && user.salaryDay !== undefined
        ? user.salaryDay
        : user.salaryDate
        ? new Date(user.salaryDate).getUTCDate()
        : 7;

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        salaryDay,
      },
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      salaryDay,
      salaryDate,
      salaryAmount,
      salaryConfigured,
      salaryPromptedAt,
      initialSavings,
      initialMonthBalance,
      onboardingCompleted,
      defaultPaymentApp,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prepare update data
    const updateData: {
      salaryDate?: Date | null;
      salaryDay?: number | null;
      salaryAmount?: number | null;
      salaryConfigured?: boolean;
      salaryPromptedAt?: Date | null;
      initialSavings?: number | null;
      initialMonthBalance?: number | null;
      onboardingCompleted?: boolean;
      defaultPaymentApp?: string | null;
    } = {};

    // Compulsory check when completing initial onboarding
    if (onboardingCompleted) {
      if (
        initialSavings === undefined ||
        initialSavings === null ||
        initialSavings === "" ||
        isNaN(Number(initialSavings)) ||
        Number(initialSavings) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Current savings is compulsory and must be 0 or greater",
          },
          { status: 400 }
        );
      }

      if (
        initialMonthBalance === undefined ||
        initialMonthBalance === null ||
        initialMonthBalance === "" ||
        isNaN(Number(initialMonthBalance)) ||
        Number(initialMonthBalance) < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Current Salary Balance is compulsory and must be 0 or greater",
          },
          { status: 400 }
        );
      }

      updateData.initialSavings = parseFloat(String(initialSavings));
      updateData.initialMonthBalance = parseFloat(String(initialMonthBalance));
      updateData.onboardingCompleted = true;
    }

    if (salaryDay !== undefined) {
      const dayNum = parseInt(String(salaryDay), 10);
      if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
        updateData.salaryDay = dayNum;
        updateData.salaryDate = new Date(Date.UTC(2026, 0, dayNum, 12, 0, 0));
      }
    } else if (salaryDate !== undefined) {
      updateData.salaryDate = salaryDate ? new Date(salaryDate) : null;
      if (updateData.salaryDate) {
        updateData.salaryDay = updateData.salaryDate.getUTCDate();
      }
    }

    if (salaryAmount !== undefined) {
      const numAmount =
        salaryAmount !== null && salaryAmount !== ""
          ? parseFloat(String(salaryAmount))
          : null;
      updateData.salaryAmount = numAmount;
      if (numAmount !== null && !isNaN(numAmount) && numAmount > 0) {
        updateData.salaryConfigured = true;
      }
    }

    if (salaryConfigured !== undefined) {
      updateData.salaryConfigured = Boolean(salaryConfigured);
    }

    if (salaryPromptedAt !== undefined) {
      updateData.salaryPromptedAt = salaryPromptedAt
        ? new Date(salaryPromptedAt)
        : new Date();
    }

    if (initialSavings !== undefined && !onboardingCompleted) {
      updateData.initialSavings =
        initialSavings !== null && initialSavings !== ""
          ? parseFloat(String(initialSavings))
          : 0;
    }

    if (initialMonthBalance !== undefined && !onboardingCompleted) {
      updateData.initialMonthBalance =
        initialMonthBalance !== null && initialMonthBalance !== ""
          ? parseFloat(String(initialMonthBalance))
          : 0;
    }

    if (onboardingCompleted !== undefined && !updateData.onboardingCompleted) {
      updateData.onboardingCompleted = Boolean(onboardingCompleted);
    }

    if (defaultPaymentApp !== undefined) {
      updateData.defaultPaymentApp = defaultPaymentApp || null;
    }

    const updatedUser = await prisma.user.update({
      where: { email: cleanEmail },
      data: updateData,
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
        updatedAt: true,
      },
    });

    const parsedSalaryDay =
      updatedUser.salaryDay !== null && updatedUser.salaryDay !== undefined
        ? updatedUser.salaryDay
        : updatedUser.salaryDate
        ? new Date(updatedUser.salaryDate).getUTCDate()
        : 7;

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        salaryDay: parsedSalaryDay,
      },
    });
  } catch (error) {
    console.error("POST /api/user/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user profile" },
      { status: 500 }
    );
  }
}
