import { NextResponse } from "next/server";

export async function GET() {
  const downloadUrl =
    process.env.APP_DOWNLOAD_URL ||
    process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ||
    process.env.GITHUB_RELEASE_URL ||
    process.env.NEXT_PUBLIC_GITHUB_RELEASE_URL ||
    "https://github.com/Krutarth-Raval/Expense-Tracker/releases/download/latest/app-debug.apk";

  return NextResponse.redirect(downloadUrl, 307);
}

