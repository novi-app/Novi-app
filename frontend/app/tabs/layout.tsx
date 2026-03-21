"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import BottomNav from "@/components/bottomNav";
import { InterventionModal, type InterventionVenue } from "@/components/interventionModal";
import { trackTabSwitch, clearTabSwitches, setTabSwitchCooldown } from "@/lib/freezeDetection";
import { LS_USER_ID } from "@/lib/onboarding";
import { getRecommendations } from "@/lib/api";
import type { Venue } from "@/lib/types";

const TOKYO = { latitude: 35.6595, longitude: 139.7004 };

interface InterventionState {
  show: boolean;
  message: string;
  venue: InterventionVenue | null;
  pendingVenue: Venue | null;
}

const CLOSED: InterventionState = { show: false, message: "", venue: null, pendingVenue: null };

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTab: "home" | "saved" | "profile" = pathname.includes("/saved")
    ? "saved"
    : pathname.includes("/profile")
    ? "profile"
    : "home";

  const [intervention, setIntervention] = useState<InterventionState>(CLOSED);

  // Auth check
  useEffect(() => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) router.replace("/onboarding/intro/1");
  }, [router]);

  // Ensure Novi pool is populated regardless of which tab the user lands on
  useEffect(() => {
    if (sessionStorage.getItem("cached_novi_pool")) return;
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;
    getRecommendations(userId, TOKYO, "any")
      .then(result => {
        if (result.recommendations.length > 0) {
          sessionStorage.setItem("cached_novi_pool", JSON.stringify(result.recommendations.slice(0, 5)));
        }
      })
      .catch(() => {});
  }, []);

  // Track tab switches
  useEffect(() => {
    if (!trackTabSwitch(currentTab)) return;

    const pool: Venue[] = JSON.parse(sessionStorage.getItem("cached_novi_pool") ?? "[]");
    const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
    const pick = pool.filter(v => !shown.includes(v.venue_id))[0] ?? null;

    setTimeout(() => setIntervention({
      show: true,
      message: "Still deciding? We think you'll love this one",
      venue: pick ? {
        id: pick.venue_id,
        name: pick.name,
        photo: pick.photo,
        category: pick.category,
        rating: pick.rating,
        reviews_count: pick.reviews_count,
        price_level: pick.price_level,
        tags: pick.tags,
        solo_reason: pick.solo_reason,
        distance_km: pick.distance_km,
      } : null,
      pendingVenue: pick,
    }), 0);
  }, [pathname, currentTab]);

  const handleInterventionAccept = () => {
    clearTabSwitches();
    if (intervention.pendingVenue) {
      const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
      sessionStorage.setItem("cached_novi_shown", JSON.stringify([...shown, intervention.pendingVenue.venue_id]));
      sessionStorage.setItem("pending_novi_pick", JSON.stringify(intervention.pendingVenue));
    }
    setIntervention(CLOSED);
    if (currentTab !== "home") router.push("/tabs/home");
  };

  const handleInterventionDetails = () => {
    clearTabSwitches();
    if (intervention.pendingVenue) {
      sessionStorage.setItem("pending_novi_details", JSON.stringify(intervention.pendingVenue));
    }
    setIntervention(CLOSED);
    if (currentTab !== "home") router.push("/tabs/home");
  };

  const handleInterventionDismiss = () => {
    clearTabSwitches();
    setTabSwitchCooldown(120000);
    setIntervention(CLOSED);
  };

  return (
    <div className="min-h-screen bg-cream pb-16">
      {children}
      <BottomNav />

      <InterventionModal
        isOpen={intervention.show}
        onDismiss={handleInterventionDismiss}
        onAccept={handleInterventionAccept}
        onDetails={handleInterventionDetails}
        level="GENTLE"
        message={intervention.message}
        suggestedAction="Let's Go"
        venue={intervention.venue}
      />
    </div>
  );
}
