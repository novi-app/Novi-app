"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSavedVenues, unsaveVenue } from "@/lib/api";
import { trackDirectionsClicked } from "@/lib/analytics";
import { LS_USER_ID } from "@/lib/onboarding";
import VenueDetailsModal from "@/components/venueDetailsModal";
import type { Venue } from "@/lib/types";

export default function SavedPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedVenues();
  }, []);

  const loadSavedVenues = async () => {
    setIsLoading(true);
    try {
      const userId = localStorage.getItem(LS_USER_ID);
      if (!userId) {
        router.replace("/onboarding/intro/1");
        return;
      }

      const result = await getSavedVenues(userId);
      setVenues(result.venues);
    } catch (err) {
      console.error("Failed to load saved venues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (venueId: string) => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;

    setVenues((prev) => prev.filter((v) => v.venue_id !== venueId));

    try {
      await unsaveVenue(userId, venueId);
    } catch (err) {
      console.error("Failed to unsave venue:", err);
      loadSavedVenues();
      alert("Failed to unsave venue. Please try again.");
    }
  };

  const handleDirections = (venue: Venue) => {
    trackDirectionsClicked(venue.venue_id, venue.name, venue.category, venue.distance_km);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;
    window.open(url, "_blank");
  };

  const groupedVenues = {
    food: venues.filter((v) => v.activity === "food"),
    social: venues.filter((v) => v.activity === "social"),
    explore: venues.filter((v) => v.activity === "explore"),
  };

  const activityLabels = {
    food: "Places to eat",
    social: "Places to socialize",
    explore: "Places to explore",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading saved places...</p>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <div
          className="bg-secondary px-6 text-white pb-6"
          style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" }}
        >
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold">Saved places</h1>
          </div>
        </div>

        <div className="px-6 max-w-md mx-auto mt-12 text-center">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No saved places yet</h2>
          <p className="text-gray-600 mb-6">
            Start saving venues you want to visit later
          </p>
          <button
            onClick={() => router.push("/home")}
            className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl"
          >
            Explore venues
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
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold">Saved places</h1>
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto space-y-6 mt-6">
        {Object.entries(groupedVenues).map(([activity, activityVenues]) => {
          if (activityVenues.length === 0) return null;

          return (
            <div key={activity}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {activityLabels[activity as keyof typeof activityLabels]}
              </h2>

              <div className="space-y-3">
                {activityVenues.map((venue) => (
                  <SavedVenueCard
                    key={venue.venue_id}
                    venue={venue}
                    onDetails={() => setSelectedVenue(venue)}
                    onDirections={() => handleDirections(venue)}
                    onUnsave={() => handleUnsave(venue.venue_id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedVenue && (
        <VenueDetailsModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onDirections={() => handleDirections(selectedVenue)}
        />
      )}
    </div>
  );
}

function SavedVenueCard({
  venue,
  onDetails,
  onDirections,
  onUnsave,
}: {
  venue: Venue;
  onDetails: () => void;
  onDirections: () => void;
  onUnsave: () => void;
}) {
  const priceSymbol = venue.price_level > 0 ? "$".repeat(venue.price_level) : "FREE";

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex gap-3">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {venue.photo ? (
            <Image src={venue.photo} alt={venue.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-gray-900 text-base truncate">
              {venue.name}
            </h3>
            <button
              onClick={onUnsave}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Unsave"
            >
              <svg className="w-5 h-5" fill="#E8700A" stroke="#E8700A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            {venue.category.charAt(0).toUpperCase() + venue.category.slice(1)} · {priceSymbol}
          </p>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-3 h-3"
                  fill={i < Math.floor(venue.rating) ? "#F59E0B" : "none"}
                  stroke={i < Math.floor(venue.rating) ? "#F59E0B" : "#D1D5DB"}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">{venue.rating.toFixed(1)}</span>
          </div>

          {venue.tags && venue.tags.length > 0 && (
            <div className="flex gap-1 mb-2">
              <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                {venue.tags[0]}
              </span>
              {venue.tags[1] && (
                <span className="inline-block px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                  {venue.tags[1]}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {venue.distance_km} min walk
          </div>

          <div className="flex gap-2">
            <button
              onClick={onDetails}
              className="flex-1 py-2 bg-white border-2 border-orange-500 text-orange-500 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
            >
              Details
            </button>
            <button
              onClick={onDirections}
              className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold active:scale-95 transition-transform"
            >
              Let's go
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
