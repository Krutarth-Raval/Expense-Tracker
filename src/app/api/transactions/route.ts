import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    const transactions = await prisma.transaction.findMany({
      orderBy: { date: "desc" },
    });

    const parsed = transactions
      .map((tx) => {
        let merchantName = "Merchant";
        let merchantUpi = "";
        let txEmail = "";

        if (tx.description) {
          try {
            if (tx.description.startsWith("{")) {
              const p = JSON.parse(tx.description);
              merchantName = p.merchantName || merchantName;
              merchantUpi = p.merchantUpi || merchantUpi;
              txEmail = p.email || txEmail;
            } else {
              merchantName = tx.description;
            }
          } catch {
            merchantName = tx.description;
          }
        }

        return {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          merchantName,
          merchantUpi,
          email: txEmail || email || "",
          date: tx.date,
          createdAt: tx.createdAt,
        };
      })
      .filter((tx) => !email || !tx.email || tx.email.toLowerCase() === email);

    return NextResponse.json({ success: true, transactions: parsed });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, merchantName, merchantUpi, email, date } = body;

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : "";
    const cleanMerchant = merchantName ? String(merchantName).trim() : "Merchant";
    const cleanUpi = merchantUpi ? String(merchantUpi).trim() : "";

    const transaction = await prisma.transaction.create({
      data: {
        amount: numAmount,
        type: "EXPENSE",
        category: "UPI",
        description: JSON.stringify({
          merchantName: cleanMerchant,
          merchantUpi: cleanUpi,
          email: cleanEmail,
        }),
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        merchantName: cleanMerchant,
        merchantUpi: cleanUpi,
        email: cleanEmail,
        date: transaction.date,
        createdAt: transaction.createdAt,
      },
    });
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}

