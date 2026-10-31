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
        salaryAmount: true,
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

    const salaryDay = user.salaryDate
      ? new Date(user.salaryDate).getUTCDate()
      : null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        salaryDate: user.salaryDate,
        salaryDay,
        salaryAmount: user.salaryAmount,
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

