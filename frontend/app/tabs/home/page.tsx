"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTrendingVenues, saveVenue, unsaveVenue, getSavedVenues } from "@/lib/api";
import type { TrendingVenue, Venue } from "@/lib/types";
import { trackRecommendationsViewed } from "@/lib/analytics";
import { LS_USER_ID, LS_USER_NAME, ACTIVITY } from "@/lib/onboarding";
import TrendingVenueCard, { TrendingVenueCardSkeleton } from "@/components/trendingVenueCard";
import VenueDetailsModal from "@/components/venueDetailsModal";
import { trackSelectionClick, clearSelectionClicks } from "@/lib/freezeDetection";
import { InterventionModal } from "@/components/interventionModal";

const location = { latitude: 35.6595, longitude: 139.7004 };

const VIBES = ["Authentic", "Lively", "Quiet"];
const MOODS = ["Quick", "Relaxed", "Spontaneous"];

function getTimeOfDay(): "morning" | "afternoon" | "night" {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 19) return "afternoon";
  return "night";
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
  const [savedVenueIds, setSavedVenueIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionMessage, setInterventionMessage] = useState("");
  const tod = getTimeOfDay()
  const heroImage = useRef(getHeroImage(tod)).current;

  useEffect(() => {
    const name = localStorage.getItem(LS_USER_NAME);
    if (name) setUserName(name);
    loadTrendingVenues();
  }, []);

  const loadTrendingVenues = async () => {
    setVenuesLoading(true);
    try {
      const result = await getTrendingVenues();
      setTrendingVenues(result.venues.slice(0, 5));
      const userId = localStorage.getItem(LS_USER_ID);
      if (userId) {
        const saved = await getSavedVenues(userId);
        setSavedVenueIds(new Set(saved.venues.map((v: any) => v.venue_id)));
      }
    } catch (error) {
      console.error("Failed to load trending venues:", error);
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleLetNoviDecide = async () => {
    setIsLoading(true);
    try {
      trackRecommendationsViewed(0, "surprise_me", location);
      router.push(`/recommendations?activity=any&latitude=${location.latitude}&longitude=${location.longitude}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityClick = (activity: string) => {
    setSelectedActivity(activity);
    setSelectedVibe(null);
    setSelectedMood(null);
    const shouldTrigger = trackSelectionClick("activity", activity);
    if (shouldTrigger) {
      setInterventionMessage("Trust your gut. Pick one and go!");
      setShowIntervention(true);
    }
  };

  const handleVibeClick = (vibe: string) => {
    setSelectedVibe(vibe);
    setSelectedMood(null);
    const shouldTrigger = trackSelectionClick("vibe", vibe);
    if (shouldTrigger) {
      setInterventionMessage("Any choice is a good choice. Just commit!");
      setShowIntervention(true);
    }
  };

  const handleMoodClick = (mood: string) => {
    setSelectedMood(mood);
  };

  const handleContinue = async () => {
    if (!selectedActivity || !selectedVibe || !selectedMood) return;
    setIsLoading(true);
    try {
      trackRecommendationsViewed(0, selectedActivity, location);
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
    setSavedVenueIds(prev => {
      const next = new Set(prev);
      alreadySaved ? next.delete(venue.venue_id) : next.add(venue.venue_id);
      return next;
    });
    try {
      alreadySaved
        ? await unsaveVenue(userId, venue.venue_id)
        : await saveVenue(userId, venue.venue_id);
    } catch {
      // revert on failure
      setSavedVenueIds(prev => {
        const next = new Set(prev);
        alreadySaved ? next.add(venue.venue_id) : next.delete(venue.venue_id);
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
    router.push(`/recommendations?activity=any&latitude=${location.latitude}&longitude=${location.longitude}`);
  };

  const handleInterventionDismiss = () => {
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

        {/* ── Hero image — flat, no rounded corners, no margin top overlap ── */}
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

          <button
            onClick={handleLetNoviDecide}
            disabled={isLoading}
            className="w-full mt-4 mb-2 font-semibold transition-all active:scale-[0.98]"
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
            <button
              onClick={handleContinue}
              disabled={!allSelected || isLoading}
              className="px-12 font-semibold text-white mt-8 mx-auto block transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                height: "52px",
                borderRadius: "14px",
                fontSize: "15px",
                background: "#E8700A",
                boxShadow: "0 4px 6px -2px rgba(0,0,0,0.3)"
              }}
            >
              {isLoading ? "Finding spots…" : "Find My spot"}
            </button>
          )}

          <hr className="my-4 border-t border-black" />

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
        venue={null}
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
