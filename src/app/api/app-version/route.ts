import { NextResponse } from "next/server";
import {
  APP_VERSION,
  APP_VERSION_LABEL,
  GITHUB_APK_DIRECT_URL,
} from "@/lib/version";

interface ReleaseAsset {
  name: string;
  updated_at: string;
  browser_download_url: string;
  size?: number;
}

interface GitHubReleaseResponse {
  tag_name: string;
  name: string;
  published_at: string;
  body?: string;
  assets?: ReleaseAsset[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientVersion = searchParams.get("clientVersion") || APP_VERSION;
    const clientInstalledTime = searchParams.get("installedTime");

    const headers: Record<string, string> = {
      "User-Agent": "ExpenseTracker-Updater",
      Accept: "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const res = await fetch(
      "https://api.github.com/repos/Krutarth-Raval/Expense-Tracker/releases/latest",
      {
        headers,
        next: { revalidate: 180 }, // Cache for 3 minutes to preserve GitHub rate limits
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: true,
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        hasUpdate: false,
        downloadUrl: GITHUB_APK_DIRECT_URL,
        message: "Up to date",
      });
    }

    const release: GitHubReleaseResponse = await res.json();
    const apkAsset = release.assets?.find((a) => a.name.endsWith(".apk"));

    const releaseVersion = release.tag_name?.replace(/^v/i, "") || APP_VERSION;
    const releaseTime = apkAsset?.updated_at || release.published_at;

    let hasUpdate = false;

    // 1. Version tag comparison (e.g. 1.0.1 > 1.0.0)
    if (releaseVersion !== "latest" && releaseVersion !== clientVersion) {
      hasUpdate = true;
    }

    // 2. Build time comparison if running in installed app mode
    if (clientInstalledTime && releaseTime) {
      const clientTime = new Date(clientInstalledTime).getTime();
      const serverTime = new Date(releaseTime).getTime();
      if (serverTime > clientTime + 60000) {
        hasUpdate = true;
      }
    }

    return NextResponse.json({
      success: true,
      currentVersion: APP_VERSION,
      latestVersion: releaseVersion !== "latest" ? releaseVersion : APP_VERSION,
      latestVersionLabel: release.tag_name || APP_VERSION_LABEL,
      releaseName: release.name || "Latest Release",
      publishedAt: releaseTime,
      hasUpdate,
      downloadUrl: apkAsset?.browser_download_url || GITHUB_APK_DIRECT_URL,
      releaseNotes: release.body || "Performance improvements and bug fixes.",
    });
  } catch (error) {
    // If Next.js interrupts prerendering for dynamic bailout, rethrow so Next.js handles it cleanly
    if ((error as { digest?: string })?.digest) {
      throw error;
    }
    console.warn("Failed to check for app updates:", error);
    return NextResponse.json({
      success: true,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION,
      hasUpdate: false,
      downloadUrl: GITHUB_APK_DIRECT_URL,
    });
  }
}

