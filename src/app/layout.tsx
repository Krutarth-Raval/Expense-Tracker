import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { NavigationProvider } from "@/context/NavigationContext";
import { Navbar } from "@/components/layout/Navbar";
import { BottomBarWrapper } from "@/components/layout/BottomBarWrapper";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { AmbientBackground } from "@/components/ui/AmbientBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Monochrome Liquid Glass Mobile & Web Expense Tracker",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-dark.png", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/icons/icon-light.png", type: "image/png", media: "(prefers-color-scheme: light)" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Expense Tracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-background text-text-primary relative overflow-x-hidden">
        <ThemeProvider>
          <AuthProvider>
            <NavigationProvider>
              <AmbientBackground />
              <SplashScreen />
              <Navbar />
              <main className="flex-1 flex flex-col w-full pb-24 sm:pb-28">{children}</main>
              <BottomBarWrapper />
            </NavigationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
