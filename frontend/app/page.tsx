"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackOnboardingStarted } from "@/lib/analytics";
import { LS_USER_ID } from "@/lib/onboarding";
import { getTrendingVenues, getSavedVenues, getRecommendations } from "@/lib/api";
import { Logo } from "../components/logo";

const TOKYO = { latitude: 35.6595, longitude: 139.7004 };

async function prefetchForReturningUser(userId: string) {
  await Promise.allSettled([
    // Trending venues + saved IDs
    (async () => {
      if (sessionStorage.getItem("cached_trending_venues")) return;
      const result = await getTrendingVenues();
      sessionStorage.setItem("cached_trending_venues", JSON.stringify(result.venues.slice(0, 5)));
    })(),
    (async () => {
      if (sessionStorage.getItem("cached_saved_ids") && sessionStorage.getItem("cached_saved_venues")) return;
      const saved = await getSavedVenues(userId);
      const ids = saved.venues.map((v: { venue_id: string }) => v.venue_id);
      sessionStorage.setItem("cached_saved_ids", JSON.stringify(ids));
      sessionStorage.setItem("cached_saved_venues", JSON.stringify(saved.venues));
    })(),
    // Novi picks pool
    (async () => {
      if (sessionStorage.getItem("cached_novi_pool")) return;
      const result = await getRecommendations(userId, TOKYO, "any");
      if (result.recommendations.length > 0) {
        sessionStorage.setItem("cached_novi_pool", JSON.stringify(result.recommendations.slice(0, 5)));
      }
    })(),
  ]);
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (userId) {
      prefetchForReturningUser(userId);
    }
  }, []);

  const handleClick = () => {
    if (localStorage.getItem(LS_USER_ID)) {
      router.push("/tabs/home");
      return;
    }
    trackOnboardingStarted();
    router.push("/onboarding/intro/1");
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-black">

      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.png"
      />

      <div className="absolute left-0 z-20" style={{ top: "9dvh", paddingLeft: "9vw" }}>
        <Logo size="lg" dark />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center"
        style={{ paddingLeft: "8vw", paddingRight: "8vw", paddingBottom: "6dvh" }}
      >
        <div
          className="w-full flex flex-col text-white tracking-wide mb-[3dvh]"
          style={{ fontSize: "clamp(28px, 11vw, 34px)", lineHeight: 1.3 }}
        >
          <p className="font-normal leading-relaxed">Less overthinking,</p>
          <p className="font-semibold">more exploring</p>
        </div>

        <button
          className="w-full font-semibold tracking-widest text-white transition-all active:scale-[0.97]"
          onClick={handleClick}
          style={{
            height: "7dvh",
            minHeight: "48px",
            maxHeight: "64px",
            borderRadius: "15px",
            fontSize: "clamp(14px, 4vw, 16px)",
            letterSpacing: "0.08em",
            background: "#0D4A4A",
          }}
        >
          Get Started
        </button>
      </div>

    </div>
  );
}
