"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigation } from "@/context/NavigationContext";
import { AuthCard } from "@/components/auth/AuthCard";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { CalendarExpensesView } from "@/components/calendar/CalendarExpensesView";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { activeTab, setActiveTab } = useNavigation();

  // While restoring session from storage, don't flash login card
  if (isLoading) {
    return <div className="w-full flex-1 min-h-[calc(100vh-140px)]" />;
  }

  // Unauthenticated State: Clean Apple Liquid Glass Auth Card
  if (!isAuthenticated) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center px-2.5 sm:px-4 py-6 sm:py-10 min-h-[calc(100vh-120px)]">
        <AuthCard />
      </div>
    );
  }

  // First-time signup onboarding: Ask current savings & current month balance
  const showOnboarding = Boolean(user && user.onboardingCompleted === false);

  // Authenticated State: Tab Views
  return (
    <div className="w-full flex-1 flex flex-col items-center px-0 py-3 sm:py-5 max-w-5xl mx-auto min-h-[calc(100vh-140px)]">
      {showOnboarding && (
        <OnboardingModal
          isOpen={true}
          onComplete={() => setActiveTab("home")}
        />
      )}

      {activeTab === "profile" && <ProfileCard />}

      {activeTab === "calendar" && <CalendarExpensesView />}

      {activeTab === "home" && <HomeDashboard />}
    </div>
  );
}
