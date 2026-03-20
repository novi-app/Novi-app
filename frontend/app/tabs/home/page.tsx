"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTrendingVenues, saveVenue, unsaveVenue, getSavedVenues, getRecommendations } from "@/lib/api";
import type { TrendingVenue, Venue } from "@/lib/types";
import { trackRecommendationsViewed } from "@/lib/analytics";
import { LS_USER_ID, LS_USER_NAME, ACTIVITY } from "@/lib/onboarding";
import { pickInterventionMessage } from "@/lib/interventionTemplates";
import TrendingVenueCard, { TrendingVenueCardSkeleton } from "@/components/trendingVenueCard";
import { SpinningGlobe } from "@/components/spinningGlobe";
import VenueDetailsModal from "@/components/venueDetailsModal";
import NoviPickModal from "@/components/noviPickModal";
import { trackSelectionClick, clearSelectionClicks, setSelectionCooldown } from "@/lib/freezeDetection";
import { InterventionModal, type InterventionVenue } from "@/components/interventionModal";

const location = { latitude: 35.6595, longitude: 139.7004 };

const VIBES = ["Authentic", "Lively", "Quiet"];
const MOODS = ["Quick", "Relaxed", "Spontaneous"];

function getTimeOfDay(): "morning" | "afternoon" | "night" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
}

function isVenueOpenNow(openingHours: any): boolean {
  const periods = openingHours?.periods;
  if (!periods?.length) return true;

  const now = new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
  const currentDay = now.getUTCDay(); // 0=Sun
  const currentMin = now.getUTCHours() * 60 + now.getUTCMinutes();

  for (const period of periods) {
    const openDay = period.open?.day;
    const openMin = (period.open?.hour ?? 0) * 60 + (period.open?.minute ?? 0);
    if (!period.close) {
      if (openDay === currentDay) return true;
      continue;
    }
    const closeDay = period.close.day;
    const closeMin = period.close.hour * 60 + period.close.minute;
    if (openDay === closeDay) {
      if (currentDay === openDay && currentMin >= openMin && currentMin < closeMin) return true;
    } else {
      if (currentDay === openDay && currentMin >= openMin) return true;
      if (currentDay === closeDay && currentMin < closeMin) return true;
    }
  }
  return false;
}

function getHeroImage(tod: string): string {
  if (tod === "morning") return "/home-morning.png";
  if (tod === "afternoon") return "/home-afternoon.png";
  return "/home-night.png";
}

export default function HomePage() {
  const router = useRouter();
  const [userName, setUserName] = useState("there");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [trendingVenues, setTrendingVenues] = useState<TrendingVenue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [noviPickVenue, setNoviPickVenue] = useState<Venue | null>(null);
  const [savedVenueIds, setSavedVenueIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isNoviLoading, setIsNoviLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState("");
  const [interventionVenue, setInterventionVenue] = useState<InterventionVenue | null>(null);
  const [pendingNoviVenue, setPendingNoviVenue] = useState<Venue | null>(null);
  const [tod, setTod] = useState<"morning" | "afternoon" | "night">("afternoon");
  const heroImage = getHeroImage(tod);

  useEffect(() => {
    setTod(getTimeOfDay());
    const todInterval = setInterval(() => setTod(getTimeOfDay()), 60_000);
    const name = localStorage.getItem(LS_USER_NAME);
    if (name) setUserName(name);
    loadTrendingVenues();
    prefetchNoviPicks();
    return () => clearInterval(todInterval);
  }, []);

  const loadTrendingVenues = async () => {
    const cachedVenues = sessionStorage.getItem("cached_trending_venues");
    const cachedSavedIds = sessionStorage.getItem("cached_saved_ids");
    if (cachedVenues && cachedSavedIds) {
      setTrendingVenues(JSON.parse(cachedVenues));
      setSavedVenueIds(new Set(JSON.parse(cachedSavedIds)));
      setVenuesLoading(false);
      return;
    }

    setVenuesLoading(true);
    try {
      const result = await getTrendingVenues();
      const venues = result.venues.slice(0, 5);
      setTrendingVenues(venues);
      sessionStorage.setItem("cached_trending_venues", JSON.stringify(venues));
      const userId = localStorage.getItem(LS_USER_ID);
      if (userId) {
        const saved = await getSavedVenues(userId);
        const savedIds = saved.venues.map((v: { venue_id: string }) => v.venue_id);
        setSavedVenueIds(new Set(savedIds));
        sessionStorage.setItem("cached_saved_ids", JSON.stringify(savedIds));
      }
    } catch (error) {
      console.error("Failed to load trending venues:", error);
    } finally {
      setVenuesLoading(false);
    }
  };

  const prefetchNoviPicks = async () => {
    if (sessionStorage.getItem("cached_novi_pool")) return;
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;
    try {
      const result = await getRecommendations(userId, location, "any");
      if (result.recommendations.length > 0) {
        const open = result.recommendations.filter(v => isVenueOpenNow(v.opening_hours));
        const picks = (open.length > 0 ? open : result.recommendations).slice(0, 5);
        sessionStorage.setItem("cached_novi_pool", JSON.stringify(picks));
      }
    } catch {
      // silent — user will see real loading state on first tap if this failed
    }
  };

  const handleLetNoviDecide = async () => {
    setIsNoviLoading(true);
    try {
      const pool: Venue[] = JSON.parse(sessionStorage.getItem("cached_novi_pool") ?? "[]");
      const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
      const available = pool.filter(v => !shown.includes(v.venue_id));

      if (available.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pick = available[0];
        sessionStorage.setItem("cached_novi_shown", JSON.stringify([...shown, pick.venue_id]));
        trackRecommendationsViewed(0, "surprise_me", location);
        setNoviPickVenue(pick);
        if (available.length <= 2) {
          sessionStorage.removeItem("cached_novi_pool");
          prefetchNoviPicks();
        }
      } else {
        sessionStorage.removeItem("cached_novi_pool");
        sessionStorage.removeItem("cached_novi_shown");
        const userId = localStorage.getItem(LS_USER_ID) ?? "anonymous";
        trackRecommendationsViewed(0, "surprise_me", location);
        const result = await getRecommendations(userId, location, "any");
        if (result.recommendations.length > 0) {
          const open = result.recommendations.filter(v => isVenueOpenNow(v.opening_hours));
          const picks = (open.length > 0 ? open : result.recommendations).slice(0, 5);
          sessionStorage.setItem("cached_novi_pool", JSON.stringify(picks));
          sessionStorage.setItem("cached_novi_shown", JSON.stringify([picks[0].venue_id]));
          setNoviPickVenue(picks[0]);
        }
      }
    } finally {
      setIsNoviLoading(false);
    }
  };

  const triggerSelectionIntervention = () => {
    // Silently grab next pick from pool for the venue card
    const pool: Venue[] = JSON.parse(sessionStorage.getItem("cached_novi_pool") ?? "[]");
    const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
    const pick = pool.filter(v => !shown.includes(v.venue_id))[0] ?? null;
    if (pick) {
      setPendingNoviVenue(pick);
      setInterventionVenue({
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
      });
    } else {
      setPendingNoviVenue(null);
      setInterventionVenue(null);
    }

    setInterventionMessage(pickInterventionMessage("selection_indecision"));
    setShowIntervention(true);
  };

  const handleActivityClick = (activity: string) => {
    setSelectedActivity(activity);
    setSelectedVibe(null);
    setSelectedMood(null);
    if (trackSelectionClick("activity", activity)) triggerSelectionIntervention();
  };

  const handleVibeClick = (vibe: string) => {
    setSelectedVibe(vibe);
    setSelectedMood(null);
    if (trackSelectionClick("vibe", vibe)) triggerSelectionIntervention();
  };

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleContinue = async () => {
    if (!selectedActivity || !selectedVibe || !selectedMood) return;
    setIsLoading(true);
    try {
      const userId = localStorage.getItem(LS_USER_ID) ?? "anonymous";
      trackRecommendationsViewed(0, selectedActivity, location);
      const result = await getRecommendations(userId, location, selectedActivity, { vibe: [selectedVibe], mood: selectedMood });
      sessionStorage.setItem("prefetched_recommendations", JSON.stringify(result.recommendations));
      router.push(
        `/recommendations?activity=${selectedActivity}&vibe=${selectedVibe}&mood=${selectedMood}&latitude=${location.latitude}&longitude=${location.longitude}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async (venue: TrendingVenue) => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;
    const alreadySaved = savedVenueIds.has(venue.venue_id);

    const nextIds = new Set(savedVenueIds);
    alreadySaved ? nextIds.delete(venue.venue_id) : nextIds.add(venue.venue_id);
    setSavedVenueIds(nextIds);

    const cachedVenues: Venue[] = JSON.parse(sessionStorage.getItem("cached_saved_venues") ?? "[]");
    const updatedVenues = alreadySaved
      ? cachedVenues.filter(v => v.venue_id !== venue.venue_id)
      : [...cachedVenues, { ...venue, distance_km: 0, solo_score: 0, similarity_score: 0, combined_score: 0, saved_at: new Date().toISOString() }];
    sessionStorage.setItem("cached_saved_ids", JSON.stringify([...nextIds]));
    sessionStorage.setItem("cached_saved_venues", JSON.stringify(updatedVenues));
    try {
      alreadySaved
        ? await unsaveVenue(userId, venue.venue_id)
        : await saveVenue(userId, venue.venue_id);
    } catch {
      // revert on failure
      setSavedVenueIds(prev => {
        const next = new Set(prev);
        alreadySaved ? next.add(venue.venue_id) : next.delete(venue.venue_id);
        sessionStorage.setItem("cached_saved_ids", JSON.stringify([...next]));
        return next;
      });
    }
  };

  const handleTrendingClick = (venue: TrendingVenue) => {
    setSelectedVenue(venue as any);
  };

  const handleDirections = (venue: Venue | TrendingVenue) => {
    const lat = venue.location.latitude;
    const lng = venue.location.longitude;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  const handleInterventionAccept = () => {
    clearSelectionClicks();
    setShowIntervention(false);
    if (pendingNoviVenue) {
      const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
      sessionStorage.setItem("cached_novi_shown", JSON.stringify([...shown, pendingNoviVenue.venue_id]));
      setNoviPickVenue(pendingNoviVenue);
      setPendingNoviVenue(null);
      setInterventionVenue(null);
    }
  };

  const handleInterventionDismiss = () => {
    clearSelectionClicks();
    setSelectionCooldown(120000); // 2-minute cooldown after dismissal
    setShowIntervention(false);
  };

  const allSelected = selectedActivity && selectedVibe && selectedMood;

  return (
    <div className="min-h-screen bg-cream">

      <div
        className="bg-secondary px-6 text-white"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)", paddingBottom: "2rem" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-display font-bold">Hi {userName},</h1>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 transition-all active:scale-95">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="#0B4F4A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-black">Tokyo</span>
            </button>
          </div>
          <p className="text-white/80">Ready when you are</p>
        </div>
      </div>

      <div className="max-w-md mx-auto pt-2">

        <div className="relative w-full" style={{ height: "clamp(160px, 48vw, 220px)" }}>
          <Image
            src={heroImage}
            alt="Tokyo"
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="pt-6 pb-2 px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What sounds good right now?
          </h2>

          <div className="grid grid-cols-3 gap-3 mb-2">
            {ACTIVITY.map(act => {
              const isSelected = selectedActivity === act.value;
              const Icon = act.icon;
              return (
                <button
                  key={act.value}
                  onClick={() => handleActivityClick(act.value)}
                  className="flex flex-col items-center justify-center py-4 rounded-xl gap-2 transition-all active:scale-[0.97]"
                  style={{
                    background: "#ffffff",
                    border: isSelected ? "2.5px solid #E8700A" : "2px solid #e8700a33",
                  }}
                >
                  <Icon
                    width={25}
                    height={25}
                    className="shrink-0"
                    style={{ color: "#0B4F4A" }}
                  />
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "#374151" }}
                  >
                    {act.label}
                  </span>
                </button>
              );
            })}
          </div>

          {isNoviLoading ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <SpinningGlobe size={42} />
              <p className="text-gray-600 font-medium text-sm">Finding the perfect spot...</p>
            </div>
          ) : (
            <button
              onClick={handleLetNoviDecide}
              className="w-full mt-4 mb-4 font-semibold transition-all active:scale-[0.98]"
              style={{
                fontSize: "14px",
                color: "#E8700A",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                background: "none",
                border: "none",
              }}
            >
              Or let Novi decide
            </button>
          )}

          {/* Progressive: vibe */}
          {selectedActivity && (
            <div className="mt-5 animate-fadeIn">
              <h3 className="text-base text-gray-900 mb-3">What's the vibe?</h3>
              <div className="grid grid-cols-3 gap-2">
                {VIBES.map(vibe => {
                  const isSelected = selectedVibe === vibe;
                  return (
                    <button
                      key={vibe}
                      onClick={() => handleVibeClick(vibe)}
                      className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                      style={{
                        background: "#ffffff",
                        border: isSelected ? "2.5px solid #E8700A" : "2px solid #e8700a33",
                        color: "#374151",
                      }}
                    >
                      {vibe}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedVibe && (
            <div className="mt-5 animate-fadeIn">
              <h3 className="text-base text-gray-900 mb-3">What does tonight call for?</h3>
              <div className="grid grid-cols-3 gap-2">
                {MOODS.map(mood => {
                  const isSelected = selectedMood === mood;
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodClick(mood)}
                      className="py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
                      style={{
                        background: "#ffffff",
                        border: isSelected ? "2.5px solid #E8700A" : "2px solid #e8700a33",
                        color: "#374151",
                      }}
                    >
                      {mood}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedActivity && (
            isLoading ? (
              <div className="flex flex-col items-center justify-center mt-6 gap-1">
                <SpinningGlobe size={45} />
                <p className="text-gray-600 font-medium text-sm">Finding the perfect spots...</p>
              </div>
            ) : (
              <button
                onClick={handleContinue}
                disabled={!allSelected}
                className="px-12 font-semibold text-white mt-8 mx-auto block transition-all active:scale-[0.98] disabled:opacity-40"
                style={{
                  height: "52px",
                  borderRadius: "14px",
                  fontSize: "15px",
                  background: "#E8700A",
                  boxShadow: "0 4px 6px -2px rgba(0,0,0,0.3)"
                }}
              >
                Find My spot
              </button>
            )
          )}

          <hr className="mt-6 mb-2 border-t border-black" />

        </div>

        <div className="mb-3 px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Trending in Tokyo</h2>
          <p className="text-sm text-gray-500">Popular with solo travelers this {tod}</p>
        </div>

        <div
          className="flex flex-row gap-4 overflow-x-auto pb-6 px-6"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {venuesLoading
            ? Array.from({ length: 5 }).map((_, i) => <TrendingVenueCardSkeleton key={i} />)
            : trendingVenues.map(venue => (
                <TrendingVenueCard
                  key={venue.venue_id}
                  venue={venue}
                  onClick={() => handleTrendingClick(venue)}
                  onDirections={() => {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`,
                      "_blank"
                    );
                  }}
                  onBookmark={() => handleBookmark(venue)}
                  isSaved={savedVenueIds.has(venue.venue_id)}
                />
              ))
          }
        </div>

      </div>

      {noviPickVenue && (
        <NoviPickModal
          venue={noviPickVenue}
          onClose={() => setNoviPickVenue(null)}
          onDetails={() => {
            setSelectedVenue(noviPickVenue);
            setNoviPickVenue(null);
          }}
          onDirections={() => handleDirections(noviPickVenue)}
        />
      )}

      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onDirections={() => handleDirections(selectedVenue)}
        />
      )}

      <InterventionModal
        isOpen={showIntervention}
        onDismiss={handleInterventionDismiss}
        onAccept={handleInterventionAccept}
        level="GENTLE"
        message={interventionMessage}
        suggestedAction="Let's Go"
        venue={interventionVenue}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}
