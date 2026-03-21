"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTrendingVenues, saveVenue, unsaveVenue, getSavedVenues, getRecommendations } from "@/lib/api";
import type { TrendingVenue, Venue } from "@/lib/types";
import { trackRecommendationsViewed } from "@/lib/analytics";
import { LS_USER_ID, LS_USER_NAME, ACTIVITY } from "@/lib/onboarding";
import TrendingVenueCard, { TrendingVenueCardSkeleton } from "@/components/trendingVenueCard";
import { SpinningGlobe } from "@/components/spinningGlobe";
import VenueDetailsModal from "@/components/venueDetailsModal";
import NoviPickModal from "@/components/noviPickModal";
import { trackSelectionClick, clearSelectionClicks, setSelectionCooldown, FREEZE_COOLDOWN_KEY } from "@/lib/freezeDetection";
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
  const [tod, setTod] = useState<"morning" | "afternoon" | "night">(getTimeOfDay);
  const [displayedHero, setDisplayedHero] = useState(() => getHeroImage(getTimeOfDay()));
  const [fadingInHero, setFadingInHero] = useState<string | null>(null);
  const [heroFadeActive, setHeroFadeActive] = useState(false);
  const selectionDismissCount = useRef(0);
  const selectedActivityRef = useRef<string | null>(null);
  const trendingClickedRef = useRef(false);
  const heroImage = getHeroImage(tod);

  // Crossfade when hero image changes
  useEffect(() => {
    if (heroImage === displayedHero) return;
    setFadingInHero(heroImage);
    requestAnimationFrame(() => requestAnimationFrame(() => setHeroFadeActive(true)));
    const t = setTimeout(() => {
      setDisplayedHero(heroImage);
      setFadingInHero(null);
      setHeroFadeActive(false);
    }, 800);
    return () => clearTimeout(t);
  }, [heroImage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Runs before first paint — prevents "there" flash on both SPA navigation and hard refresh
  useLayoutEffect(() => {
    const name = localStorage.getItem(LS_USER_NAME);
    if (name) { setUserName(name); return; }
    try {
      const raw = localStorage.getItem("cached_profile");
      if (raw) {
        const { data } = JSON.parse(raw);
        if (data?.username) setUserName(data.username);
      }
    } catch {}
  }, []);

  useEffect(() => {
    setTod(getTimeOfDay());
    const todInterval = setInterval(() => setTod(getTimeOfDay()), 60_000);
    loadTrendingVenues();
    prefetchNoviPicks();

    // Pick up venue passed from tab-switch intervention
    const pendingPick = sessionStorage.getItem("pending_novi_pick");
    if (pendingPick) {
      sessionStorage.removeItem("pending_novi_pick");
      setNoviPickVenue(JSON.parse(pendingPick));
    }
    const pendingDetails = sessionStorage.getItem("pending_novi_details");
    if (pendingDetails) {
      sessionStorage.removeItem("pending_novi_details");
      setSelectedVenue(JSON.parse(pendingDetails));
    }

    // Idle nudge: fire if user hasn't selected activity or tapped trending after 40s
    const idleTimer = setTimeout(() => {
      if (selectedActivityRef.current || trendingClickedRef.current) return;
      const cooldownUntil = parseInt(localStorage.getItem(FREEZE_COOLDOWN_KEY) || "0");
      if (Date.now() < cooldownUntil) return;
      // Set cooldown immediately so navigating away without interacting doesn't re-trigger
      setSelectionCooldown(120_000);
      triggerSelectionIntervention(null, null);
    }, 40_000);

    return () => {
      clearInterval(todInterval);
      clearTimeout(idleTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrendingVenues = async () => {
    const TRENDING_TTL_MS = 60 * 60 * 1000; // 1 hour
    const raw = localStorage.getItem("cached_trending_venues");
    const cachedIds = sessionStorage.getItem("cached_saved_ids");

    if (raw) {
      try {
        const { venues, savedAt } = JSON.parse(raw);
        if (Date.now() - savedAt < TRENDING_TTL_MS) {
          setTrendingVenues(venues);
          if (cachedIds) setSavedVenueIds(new Set(JSON.parse(cachedIds)));
          setVenuesLoading(false);
          if (!cachedIds) {
            const userId = localStorage.getItem(LS_USER_ID);
            if (userId) {
              getSavedVenues(userId)
                .then(saved => {
                  const ids = saved.venues.map((v: { venue_id: string }) => v.venue_id);
                  setSavedVenueIds(new Set(ids));
                  sessionStorage.setItem("cached_saved_ids", JSON.stringify(ids));
                })
                .catch(() => {});
            }
          }
          return;
        }
      } catch {}
    }

    // Cache miss or expired — fetch trending and saved in parallel
    setVenuesLoading(true);
    try {
      const userId = localStorage.getItem(LS_USER_ID);
      const [venueResult, savedResult] = await Promise.all([
        getTrendingVenues(),
        userId ? getSavedVenues(userId) : Promise.resolve(null),
      ]);
      const venues = venueResult.venues.slice(0, 5);
      setTrendingVenues(venues);
      localStorage.setItem("cached_trending_venues", JSON.stringify({ venues, savedAt: Date.now() }));
      if (savedResult) {
        const ids = savedResult.venues.map((v: { venue_id: string }) => v.venue_id);
        setSavedVenueIds(new Set(ids));
        sessionStorage.setItem("cached_saved_ids", JSON.stringify(ids));
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

  const prefetchAllCombinations = (activity: string, vibe: string) => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;
    for (const mood of MOODS) {
      const cacheKey = `prefetch_rec_${activity}_${vibe}_${mood}`;
      if (sessionStorage.getItem(cacheKey)) continue;
      getRecommendations(userId, location, activity, { vibe: [vibe], mood })
        .then(result => {
          if (result.recommendations?.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify(result.recommendations));
          }
        })
        .catch(() => {});
    }
  };

  const triggerSelectionIntervention = (currentActivity: string | null, currentVibe: string | null) => {
    // Prefer a prefetched recommendation tailored to the user's current selection
    let pick: Venue | null = null;
    if (currentActivity && currentVibe) {
      for (const mood of MOODS) {
        const cached = sessionStorage.getItem(`prefetch_rec_${currentActivity}_${currentVibe}_${mood}`);
        if (cached) {
          try {
            const recs: Venue[] = JSON.parse(cached);
            if (recs.length > 0) { pick = recs[0]; break; }
          } catch {}
        }
      }
    }
    // Fall back to the generic Novi pool
    if (!pick) {
      const pool: Venue[] = JSON.parse(sessionStorage.getItem("cached_novi_pool") ?? "[]");
      const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
      pick = pool.filter(v => !shown.includes(v.venue_id))[0] ?? null;
    }

    if (!pick) return;

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
    setInterventionMessage("Still deciding? We think you'll love this one");
    setSelectionCooldown(120_000); // block all other rules immediately while this is visible
    setShowIntervention(true);
  };

  const handleActivityClick = (activity: string) => {
    selectedActivityRef.current = activity;
    setSelectedActivity(activity);
    setSelectedVibe(null);
    setSelectedMood(null);
    if (trackSelectionClick("activity", activity)) triggerSelectionIntervention(activity, null);
  };

  const handleVibeClick = (vibe: string) => {
    setSelectedVibe(vibe);
    setSelectedMood(null);
    prefetchAllCombinations(selectedActivity!, vibe);
    if (trackSelectionClick("vibe", vibe)) triggerSelectionIntervention(selectedActivity, vibe);
  };

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleContinue = async () => {
    if (!selectedActivity || !selectedVibe || !selectedMood) return;
    setIsLoading(true);
    try {
      trackRecommendationsViewed(0, selectedActivity, location);
      const cacheKey = `prefetch_rec_${selectedActivity}_${selectedVibe}_${selectedMood}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        sessionStorage.setItem("prefetched_recommendations", cached);
      } else {
        const userId = localStorage.getItem(LS_USER_ID) ?? "anonymous";
        const result = await getRecommendations(userId, location, selectedActivity, { vibe: [selectedVibe], mood: selectedMood });
        sessionStorage.setItem("prefetched_recommendations", JSON.stringify(result.recommendations));
      }
      router.push(
        `/recommendations?activity=${selectedActivity}&vibe=${selectedVibe}&mood=${selectedMood}&latitude=${location.latitude}&longitude=${location.longitude}`
      );
      // Re-fetch this combo in background so it's fresh next time the user picks it
      prefetchAllCombinations(selectedActivity, selectedVibe);
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

    const savedRaw = localStorage.getItem("cached_saved_venues");
    const cachedVenues: Venue[] = savedRaw ? (JSON.parse(savedRaw).data ?? []) : [];
    const updatedVenues = alreadySaved
      ? cachedVenues.filter(v => v.venue_id !== venue.venue_id)
      : [...cachedVenues, { ...venue, distance_km: 0, solo_score: 0, similarity_score: 0, combined_score: 0, saved_at: new Date().toISOString() }];
    sessionStorage.setItem("cached_saved_ids", JSON.stringify([...nextIds]));
    localStorage.setItem("cached_saved_venues", JSON.stringify({ data: updatedVenues, savedAt: Date.now() }));
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
    trendingClickedRef.current = true;
    setSelectedVenue(venue as any);
  };

  const handleDirections = (venue: Venue | TrendingVenue) => {
    const lat = venue.location.latitude;
    const lng = venue.location.longitude;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, "_blank");
  };

  const handleInterventionAccept = () => {
    clearSelectionClicks();
    setSelectionCooldown(120_000);
    setShowIntervention(false);
    if (pendingNoviVenue) {
      const shown: string[] = JSON.parse(sessionStorage.getItem("cached_novi_shown") ?? "[]");
      sessionStorage.setItem("cached_novi_shown", JSON.stringify([...shown, pendingNoviVenue.venue_id]));
      setNoviPickVenue(pendingNoviVenue);
      setPendingNoviVenue(null);
      setInterventionVenue(null);
    }
  };

  const handleInterventionDetails = () => {
    clearSelectionClicks();
    if (pendingNoviVenue) {
      setSelectedVenue(pendingNoviVenue);
      setPendingNoviVenue(null);
      setInterventionVenue(null);
      // Delay closing so VenueDetailsModal slides up over the intervention
      setTimeout(() => setShowIntervention(false), 520);
    } else {
      setShowIntervention(false);
    }
  };

  const handleInterventionDismiss = () => {
    clearSelectionClicks();
    selectionDismissCount.current += 1;
    const cooldown =
      selectionDismissCount.current === 1 ? 120_000 :
        selectionDismissCount.current === 2 ? 240_000 :
          1_800_000;
    setSelectionCooldown(cooldown);
    setShowIntervention(false);
  };

  const allSelected = selectedActivity && selectedVibe && selectedMood;

  return (
    <div className="min-h-screen bg-cream">

      <div
        className="bg-secondary px-6 text-white"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)", paddingBottom: "2rem", height: "140px" }}
      >
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-display font-bold truncate min-w-0 mr-3">Hi {userName},</h1>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/90 transition-all active:scale-95">
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

        <div className="relative w-full overflow-hidden" style={{ height: "clamp(160px, 48vw, 220px)" }}>
          <Image
            src={displayedHero}
            alt="Tokyo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
          {fadingInHero && (
            <Image
              src={fadingInHero}
              alt="Tokyo"
              fill
              className="object-cover transition-opacity duration-700 ease-in-out"
              style={{ opacity: heroFadeActive ? 1 : 0 }}
              unoptimized
            />
          )}
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
              <h3 className="text-base text-gray-900 mb-3">{tod === "night" ? "What does tonight call for?" : `What does this ${tod} call for?`}</h3>
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

        <div className="mb-4 px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Trending in Tokyo</h2>
          <p className="text-sm text-gray-500">Popular with solo travelers {tod === "night" ? "tonight" : `this ${tod}`}</p>
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
            // Delay unmounting so VenueDetailsModal slides up over NoviPickModal
            // rather than over the bare homepage
            setTimeout(() => setNoviPickVenue(null), 520);
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
        onDetails={handleInterventionDetails}
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
