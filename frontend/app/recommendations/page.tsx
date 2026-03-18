"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecommendations, saveVenue, unsaveVenue, getUserProfile } from "@/lib/api";
import {
  trackDirectionsClicked,
  trackRecommendationDetailsViewed,
  trackFreezeDetected,
  trackInterventionShown,
  trackInterventionResponse,
  trackRecommendationsViewed,
} from "@/lib/analytics";
import { useFreezeDetection } from "@/hooks/useFreezeDetection";
import { useScrollDistance } from "@/hooks/useScrollDistance";
import { InterventionModal } from "@/components/interventionModal";
import { LS_USER_ID } from "@/lib/onboarding";
import { Venue } from "@/lib/types";
import VenueCard from "@/components/venueCard";
import VenueDetailsModal from "@/components/venueDetailsModal";
import { clearSelectionClicks } from "@/lib/freezeDetection";

const ACTIVITY_LABELS: Record<string, string> = {
  food: "Where to eat",
  social: "Where to socialize",
  explore: "Where to explore",
  any: "Recommendations for you",
};

export default function RecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [venues, setVenues] = useState<Venue[]>([]);
  const [savedVenueIds, setSavedVenueIds] = useState<Set<string>>(new Set());
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionData, setInterventionData] = useState<any>(null);
  const [interventionStartTime, setInterventionStartTime] = useState(0);
  const [dismissalCount, setDismissalCount] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const activity = searchParams.get("activity") || "any";
  const vibe = searchParams.get("vibe");
  const latitude = parseFloat(searchParams.get("latitude") || "35.6595");
  const longitude = parseFloat(searchParams.get("longitude") || "139.7004");

  const freezeDetection = useFreezeDetection({
    enabled: true,
    recommendations: venues,
    onFreeze: async (event) => {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) return;

      console.log("🔥 FREEZE EVENT:", event);

      trackFreezeDetected(event.rule, event.level, event.context);

      try {
        // Determine recommended venue BEFORE API call
        const recommendedVenue = event.context.venue_id
          ? venues.find(v => v.venue_id === event.context.venue_id)
          : venues[0];
        
        if (!recommendedVenue) {
          console.error("No venue found for intervention");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/intervention`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              trigger_type: event.rule,
              context: {
                ...event.context,
                venue_name: recommendedVenue.name,  // Add venue name for backend
              },
            }),
          }
        );

        if (!response.ok) {
          console.error("Intervention API error:", response.status);
          return;
        }

        const data = await response.json();
        console.log("💬 Intervention response:", data);

        const newInterventionData = {
          level: event.level,
          message: data.message,
          venue: {
            id: recommendedVenue.venue_id,
            name: recommendedVenue.name,
            photo: recommendedVenue.photo,
            category: recommendedVenue.category,
          },
          triggerRule: event.rule,
        };
        
        console.log("✅ Setting intervention data:", newInterventionData);
        
        setInterventionData(newInterventionData);
        setInterventionStartTime(Date.now());
        setShowIntervention(true);

        trackInterventionShown(
          event.level,
          event.rule,
          recommendedVenue.venue_id,
          recommendedVenue.name,
          0
        );
      } catch (error) {
        console.error("Failed to fetch intervention:", error);
      }
    },
  });

  useScrollDistance({
    onScroll: (direction, distance) => {
      freezeDetection.recordScroll(direction, distance);
    },
  });

  useEffect(() => {
    loadRecommendations();
    loadSavedVenues();
  }, []);

  useEffect(() => {
    if (!isLoading && venues.length > 0 && !hasTrackedView) {
      console.log("📊 Tracking recommendations viewed:", venues.length);
      trackRecommendationsViewed(venues.length, activity, { latitude, longitude });
      setHasTrackedView(true);
      
      // Clear selection clicks - user successfully made it to recommendations
      clearSelectionClicks();
    }
  }, [isLoading, venues, activity, latitude, longitude, hasTrackedView]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) {
        router.replace("/onboarding/intro/1");
        return;
      }

      const sessionPreferences = vibe ? { vibe: [vibe] } : undefined;

      const result = await getRecommendations(
        userId,
        { latitude, longitude },
        activity,
        sessionPreferences
      );

      if (result.recommendations.length === 0) {
        setError("No venues found. Try adjusting your preferences.");
      } else {
        setVenues(result.recommendations);
      }
    } catch (err: any) {
      console.error("Failed to load recommendations:", err);
      setError(err.message || "Failed to load recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedVenues = async () => {
    try {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) return;

      const profile = await getUserProfile(userId);
      setSavedVenueIds(new Set(profile.saved_venues));
    } catch (err) {
      console.error("Failed to load saved venues:", err);
    }
  };

  const handleSaveToggle = async (venue: Venue) => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;

    const isSaved = savedVenueIds.has(venue.venue_id);

    const newSaved = new Set(savedVenueIds);
    if (isSaved) {
      newSaved.delete(venue.venue_id);
    } else {
      newSaved.add(venue.venue_id);
    }
    setSavedVenueIds(newSaved);

    try {
      if (isSaved) {
        await unsaveVenue(userId, venue.venue_id);
      } else {
        await saveVenue(userId, venue.venue_id);
      }
    } catch (err) {
      setSavedVenueIds(savedVenueIds);
      console.error("Failed to toggle save:", err);
      alert("Failed to save venue. Please try again.");
    }
  };

  const handleDetails = (venue: Venue, position: number) => {
    console.log("🔍 Opening details for:", venue.name);
    
    // Track for freeze detection
    freezeDetection.recordDetailsView(venue.venue_id);
    
    // Track for analytics
    trackRecommendationDetailsViewed(
      venue.venue_id,
      venue.name,
      venue.category,
      position,
      venue.combined_score,
      venue.distance_km
    );
    
    // Open modal
    setSelectedVenue(venue);
  };

  const handleDirections = (venue: Venue) => {
    trackDirectionsClicked(
      venue.venue_id,
      venue.name,
      venue.category,
      venue.distance_km
    );
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`;
    window.open(url, "_blank");
  };

  const handleInterventionAccept = () => {
    if (!interventionData?.venue) return;

    const timeToRespond = Math.round((Date.now() - interventionStartTime) / 1000);

    trackInterventionResponse(
      interventionData.level,
      "accepted",
      timeToRespond,
      dismissalCount
    );

    const venue = venues.find(v => v.venue_id === interventionData.venue.id);
    if (venue) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`;
      window.open(url, "_blank");
    }

    setShowIntervention(false);
  };

  const handleInterventionDismiss = () => {
    const timeToRespond = Math.round((Date.now() - interventionStartTime) / 1000);

    trackInterventionResponse(
      interventionData.level,
      "dismissed",
      timeToRespond,
      dismissalCount
    );

    freezeDetection.dismissIntervention();
    setDismissalCount((count) => count + 1);
    setShowIntervention(false);
  };

  const topVenue = venues[0];
  const alternatives = venues.slice(1, 3);
  const moreOptions = venues.slice(3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Finding the perfect spots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-gray-900 font-semibold mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-secondary text-white rounded-xl font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-6">
      <div
        className="bg-secondary px-6 text-white pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white bg-opacity-20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{ACTIVITY_LABELS[activity]}</h1>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-white bg-opacity-20 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">Tokyo</span>
          </button>
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto">
        {topVenue && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Best matched for you
            </h2>
            <VenueCard
              venue={topVenue}
              size="large"
              saved={savedVenueIds.has(topVenue.venue_id)}
              onSaveToggle={() => handleSaveToggle(topVenue)}
              onDetails={() => handleDetails(topVenue, 0)}
              onDirections={() => handleDirections(topVenue)}
            />
          </div>
        )}

        {alternatives.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Two other alternatives
            </h2>
            <div className="space-y-3">
              {alternatives.map((venue, index) => (
                <VenueCard
                  key={venue.venue_id}
                  venue={venue}
                  size="small"
                  saved={savedVenueIds.has(venue.venue_id)}
                  onSaveToggle={() => handleSaveToggle(venue)}
                  onDetails={() => handleDetails(venue, index + 1)}
                  onDirections={() => handleDirections(venue)}
                />
              ))}
            </div>
          </div>
        )}

        {moreOptions.length > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-4 border-2 border-orange-500 text-orange-500 font-semibold rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Show me more options
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {showAll && moreOptions.length > 0 && (
          <div className="space-y-3 animate-fadeIn">
            {moreOptions.map((venue, index) => (
              <VenueCard
                key={venue.venue_id}
                venue={venue}
                size="small"
                saved={savedVenueIds.has(venue.venue_id)}
                onSaveToggle={() => handleSaveToggle(venue)}
                onDetails={() => handleDetails(venue, index + 3)}
                onDirections={() => handleDirections(venue)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onDirections={() => handleDirections(selectedVenue)}
        />
      )}

      {interventionData && (
        <InterventionModal
          isOpen={showIntervention}
          onDismiss={handleInterventionDismiss}
          onAccept={handleInterventionAccept}
          level={interventionData.level}
          message={interventionData.message}
          suggestedAction="Let's Go"
          venue={interventionData.venue}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
