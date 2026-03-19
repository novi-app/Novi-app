"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNav from "@/components/bottomNav";
import { InterventionModal } from "@/components/interventionModal";
import { trackTabSwitch, clearTabSwitches, setTabSwitchCooldown } from "@/lib/freezeDetection";
import { LS_USER_ID } from "@/lib/onboarding";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState("");
  const [currentTab, setCurrentTab] = useState<"home" | "saved" | "profile">("home");

  // Auth check
  useEffect(() => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) {
      router.replace("/onboarding/intro/1");
    }
  }, [router]);

  // Track tab switches
  useEffect(() => {
    // Determine which tab we're on based on pathname
    let tab: "home" | "saved" | "profile" = "home";
    if (pathname.includes("/saved")) {
      tab = "saved";
    } else if (pathname.includes("/profile")) {
      tab = "profile";
    } else if (pathname.includes("/home")) {
      tab = "home";
    }

    setCurrentTab(tab);

    // Track the switch - returns tab name if should trigger intervention
    const shouldTrigger = trackTabSwitch(tab);

    if (shouldTrigger) {
      setInterventionMessage("Enough browsing. Let's find you something!");
      setShowIntervention(true);
    }
  }, [pathname]);

  const handleInterventionAccept = () => {
    setShowIntervention(false);
    
    if (currentTab === "profile") {
      // Redirect to home to start exploring
      router.push("/tabs/home");
    }
  };

  const handleInterventionDismiss = () => {
    clearTabSwitches();
    setTabSwitchCooldown(120000); // 2-minute cooldown after dismissal
    setShowIntervention(false);
  };

  return (
    <div className="min-h-screen bg-cream pb-16">
      {children}
      <BottomNav />
      
      <InterventionModal
        isOpen={showIntervention}
        onDismiss={handleInterventionDismiss}
        onAccept={handleInterventionAccept}
        level="GENTLE"
        message={interventionMessage}
        suggestedAction="Let's Go"
        venue={null}
      />
    </div>
  );
}
