"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecommendations, saveVenue, unsaveVenue, getUserProfile } from "@/lib/api";
import { trackDirectionsClicked, trackRecommendationDetailsViewed, trackFreezeDetected, trackInterventionShown, trackInterventionResponse, trackRecommendationsViewed } from "@/lib/analytics";
import { useFreezeDetection } from "@/hooks/useFreezeDetection";
import { useScrollDistance } from "@/hooks/useScrollDistance";
import { InterventionModal } from "@/components/interventionModal";
import { LS_USER_ID } from "@/lib/onboarding";
import { Venue } from "@/lib/types";
import VenueCard from "@/components/venueCard";
import VenueDetailsModal from "@/components/venueDetailsModal";
import { clearSelectionClicks } from "@/lib/freezeDetection";
import { SpinningGlobe } from "@/components/spinningGlobe";

const ACTIVITY_LABELS: Record<string, string> = {
  food: "Where to eat",
  social: "Where to socialize",
  explore: "Where to explore",
  any: "Recommendations for you",
};

function Page () {
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
  const showInterventionRef = useRef(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const activity = searchParams.get("activity") || "any";
  const vibe = searchParams.get("vibe");
  const latitude = parseFloat(searchParams.get("latitude") || "35.6595");
  const longitude = parseFloat(searchParams.get("longitude") || "139.7004");

  const freezeDetection = useFreezeDetection({
    enabled: true,
    recommendations: venues,
    onFreeze: (event) => {
      if (showInterventionRef.current) return;

      trackFreezeDetected(event.rule, event.level, event.context);

      const recommendedVenue = event.context.venue_id
        ? venues.find(v => v.venue_id === event.context.venue_id)
        : venues[0];

      if (!recommendedVenue) return;

      setInterventionData({
        level: event.level,
        message: "Still deciding? We think you'll love this one",
        venue: {
          id: recommendedVenue.venue_id,
          name: recommendedVenue.name,
          photo: recommendedVenue.photo,
          category: recommendedVenue.category,
          rating: recommendedVenue.rating,
          reviews_count: recommendedVenue.reviews_count,
          price_level: recommendedVenue.price_level,
          tags: recommendedVenue.tags,
          solo_reason: recommendedVenue.solo_reason,
          distance_km: recommendedVenue.distance_km,
        },
        triggerRule: event.rule,
      });
      setInterventionStartTime(Date.now());
      setShowIntervention(true);

      trackInterventionShown(
        event.level,
        event.rule,
        recommendedVenue.venue_id,
        recommendedVenue.name,
        0
      );
    },
  });

  useScrollDistance({
    onScroll: (direction, distance) => {
      freezeDetection.recordScroll(direction, distance);
    },
  });

  useEffect(() => {
    showInterventionRef.current = showIntervention;
  }, [showIntervention]);

  useEffect(() => {
    loadRecommendations();
    loadSavedVenues();
  }, []);

  useEffect(() => {
    if (!isLoading && venues.length > 0 && !hasTrackedView) {
      console.log("📊 Tracking recommendations viewed:", venues.length);
      trackRecommendationsViewed(venues.length, activity, { latitude, longitude });
      setHasTrackedView(true);
      clearSelectionClicks();
      // Register all visible venues so exploration_stall can fire
      venues.forEach(v => freezeDetection.recordCardView(v.venue_id));
    }
  }, [isLoading, venues, activity, latitude, longitude, hasTrackedView]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) {
        router.replace("/onboarding/intro/1");
        return;
      }

      const prefetched = sessionStorage.getItem("prefetched_recommendations");
      if (prefetched) {
        sessionStorage.removeItem("prefetched_recommendations");
        const recommendations = JSON.parse(prefetched);
        if (recommendations.length === 0) {
          setError("No venues found. Try adjusting your preferences.");
        } else {
          setVenues(recommendations);
        }
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
    const cachedVenues: Venue[] = JSON.parse(sessionStorage.getItem("cached_saved_venues") ?? "[]");
    const updatedCache = isSaved
      ? cachedVenues.filter(v => v.venue_id !== venue.venue_id)
      : [...cachedVenues, { ...venue, saved_at: new Date().toISOString() }];
    sessionStorage.setItem("cached_saved_venues", JSON.stringify(updatedCache));

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
    
    freezeDetection.recordDetailsView(venue.venue_id);
    
    trackRecommendationDetailsViewed(
      venue.venue_id,
      venue.name,
      venue.category,
      position,
      venue.combined_score,
      venue.distance_km
    );
    
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

  const handleInterventionDetails = () => {
    if (!interventionData?.venue) return;
    const venue = venues.find(v => v.venue_id === interventionData.venue.id);
    setShowIntervention(false);
    if (venue) setSelectedVenue(venue);
  };

  const topVenue = venues[0];
  const alternatives = venues.slice(1, 3);
  const moreOptions = venues.slice(3);


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
        className="bg-secondary px-6 flex flex-col text-white pb-6"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
      >
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="w-7 h-7 flex items-center justify-center text-black rounded-full bg-white bg-opacity-20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="flex items-center gap-1 px-3 py-2 bg-white text-secondary bg-opacity-20 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm text-black font-medium">Tokyo</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold">{ACTIVITY_LABELS[activity]}</h1>
        </div>
      </div>

      <div className="pt-6 px-6 max-w-md mx-auto">
        {isLoading && (
          <div>
            <div className="mb-6">
              <div className="h-5 w-40 bg-gray-200 rounded-full mb-3 animate-pulse" />
              <div className="rounded-2xl overflow-hidden bg-white">
                <div className="h-52 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded-full mb-3 animate-pulse" />
              <div className="space-y-3">
                {[0, 1].map(i => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-white flex">
                    <div className="w-24 h-24 bg-gray-200 animate-pulse shrink-0" />
                    <div className="p-3 flex-1 space-y-2">
                      <div className="h-4 w-3/4 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-3 w-1/2 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {!isLoading && topVenue && (
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

        {!isLoading && alternatives.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              More alternatives
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

        {!isLoading && moreOptions.length > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-4 border-2 border-primary text-primary font-semibold rounded-full active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            Show me more options
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {!isLoading && showAll && moreOptions.length > 0 && (
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
          onDetails={handleInterventionDetails}
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

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <SpinningGlobe />
          <p className="text-gray-600 font-medium mt-3">Finding the perfect spots...</p>
        </div>
      </div>
    }>
      <Page />
    </Suspense>
  );
}
