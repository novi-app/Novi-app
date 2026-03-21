"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getSavedVenues, unsaveVenue } from "@/lib/api";
import { trackDirectionsClicked } from "@/lib/analytics";
import { LS_USER_ID } from "@/lib/onboarding";
import VenueDetailsModal from "@/components/venueDetailsModal";
import type { Venue } from "@/lib/types";
import { SpinningGlobe } from "@/components/spinningGlobe";

const USER_LOCATION = { latitude: 35.6595, longitude: 139.7004 };
const NOW = Date.now();

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SavedPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedVenues();
  }, []);

  const loadSavedVenues = async () => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) {
      router.replace("/onboarding/intro/1");
      return;
    }

    const cached = sessionStorage.getItem("cached_saved_venues");
    if (cached) {
      setVenues(JSON.parse(cached));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getSavedVenues(userId);
      setVenues(result.venues);
      sessionStorage.setItem("cached_saved_venues", JSON.stringify(result.venues));
    } catch (err) {
      console.error("Failed to load saved venues:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsave = async (venueId: string) => {
    const userId = localStorage.getItem(LS_USER_ID);
    if (!userId) return;

    setVenues((prev) => {
      const updated = prev.filter((v) => v.venue_id !== venueId);
      sessionStorage.setItem("cached_saved_venues", JSON.stringify(updated));
      const updatedIds = updated.map((v) => v.venue_id);
      sessionStorage.setItem("cached_saved_ids", JSON.stringify(updatedIds));
      return updated;
    });

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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.latitude},${venue.location.longitude}`;
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
      <div className="min-h-screen bg-cream flex items-center justify-center font-[Sora]">
        <div className="text-center">
          <SpinningGlobe className="mx-auto mb-1" />
          <p className="text-gray-600 font-medium">Loading saved places...</p>
        </div>
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="min-h-screen bg-cream font-Sora">
        <div
          className="bg-secondary text-white px-6 flex items-center"
          style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)",
            height:"140px"
           }}
        >

          <div className="max-w-md mx-auto w-full flex items-end pb-4">
            <h1 className="text-2xl leading-none font-semibold">Saved places</h1>
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
    <div className="min-h-screen bg-cream pb-6 font-[Sora]">
      <div
        className="bg-secondary px-6 text-white flex items-center"
        style={{ paddingTop: "max(env(safe-area-inset-top), 2rem)" , height: "140px",}}
      >
        <div className="max-w-md mx-auto w-full flex items-end pb-4">
          <h1 className="text-2xl leading-none font-semibold">Saved places</h1>
        </div>
      </div>

      <div className="px-6 max-w-md mx-auto space-y-9 mt-6">
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
  // onDetails,
  // onDirections,
  onUnsave,
}: {
  venue: Venue;
  onDetails: () => void;
  onDirections: () => void;
  onUnsave: () => void;
}) {
  const priceSymbol = venue.price_level > 0 ? "¥".repeat(venue.price_level) : "FREE";
  const walkMins = Math.max(1, Math.round(
    (venue.distance_km || haversineKm(USER_LOCATION.latitude, USER_LOCATION.longitude, venue.location.latitude, venue.location.longitude)) / 5 * 60
  ));
  const savedLabel = (() => {
    if (!venue.saved_at) return null;
    const days = Math.floor((NOW - new Date(venue.saved_at).getTime()) / 86400000);
    if (days === 0) return "Saved today";
    if (days === 1) return "Saved yesterday";
    return `Saved ${days} days ago`;
  })();

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex gap-4">
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
          {venue.photo ? (
            <Image
              src={venue.photo}
              alt={venue.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight truncate">
                {venue.name}
              </h3>
              <p className="text-sm text-gray-500 leading-tight -mt-[1px] truncate font-medium">
                {venue.category.charAt(0).toUpperCase() +
                  venue.category.slice(1)}{" "}
                · {priceSymbol}
              </p>
            </div>

            <button
              onClick={onUnsave}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Unsave"
            >
              <svg
                className="w-5 h-5"
                fill="#E8700A"
                stroke="#E8700A"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-[2px]">
              {[...Array(5)].map((_, i) => {
                const filled = i < Math.floor(venue.rating);

                return (
                  <svg
                    key={i}
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill={filled ? "#E8700A" : "none"}
                    stroke={filled ? "#E8700A" : "#E8700A"}
                    strokeWidth={1.6}
                  >
                    <path d="M12 2.5L14.9 8.63L21.5 9.39L16.75 13.84L18 20.3L12 17L6 20.3L7.25 13.84L2.5 9.39L9.1 8.63L12 2.5Z" />
                  </svg>
                );
              })}
            </div>

            <span className="text-xs text-black">
              {venue.rating.toFixed(1)}
            </span>
          </div>

          {venue.tags && venue.tags.length > 0 && (
            <div className="flex gap-1 mb-2">
              {venue.tags.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "#F5F1E8",
                    color: "#0D4A4A",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <svg
              className="w-3.5 h-3.5 flex-shrink-0 opacity-60"
              viewBox="0 0 13 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.19723 2.09848C7.93864 2.09848 7.69065 2.20911 7.5078 2.40602C7.32496 2.60294 7.22223 2.87 7.22223 3.14848C7.22223 3.42696 7.32496 3.69403 7.5078 3.89094C7.69065 4.08785 7.93864 4.19848 8.19723 4.19848C8.45585 4.19848 8.70383 4.08785 8.88664 3.89094C9.06953 3.69403 9.17223 3.42696 9.17223 3.14848C9.17223 2.87 9.06953 2.60294 8.88664 2.40602C8.70383 2.20911 8.45585 2.09848 8.19723 2.09848ZM6.57223 3.14848C6.5723 2.8517 6.64246 2.55981 6.77611 2.30026C6.90976 2.0407 7.1025 1.82202 7.33623 1.66476C7.56995 1.50751 7.83698 1.41686 8.11219 1.40132C8.38736 1.38579 8.66174 1.44589 8.90947 1.57597C9.1572 1.70605 9.37008 1.90183 9.52819 2.14492C9.6863 2.388 9.78437 2.6704 9.81329 2.96555C9.84214 3.2607 9.80086 3.55892 9.69329 3.83215C9.58571 4.10538 9.41533 4.34466 9.19823 4.52748C9.51958 4.67443 9.79388 4.91948 9.98733 5.23238L10.3286 5.78398L11.2964 6.52808C11.4199 6.62071 11.5252 6.73882 11.606 6.87557C11.6868 7.01231 11.7417 7.16498 11.7673 7.3247C11.793 7.48443 11.7889 7.64805 11.7553 7.80608C11.7219 7.96411 11.6595 8.11341 11.5721 8.24532C11.4846 8.37723 11.3737 8.48913 11.2457 8.57454C11.1178 8.65995 10.9754 8.71716 10.8268 8.74286C10.6782 8.76856 10.5263 8.76226 10.38 8.72429C10.2337 8.68632 10.0958 8.61746 9.97433 8.52168L8.83683 7.64668L8.77833 7.59838L8.76858 7.62918L9.38153 8.62738C9.54403 8.89342 9.64348 9.19792 9.67013 9.51432L9.81768 11.2643C9.83913 11.5844 9.74309 11.9007 9.55021 12.1454C9.35724 12.39 9.08294 12.5433 8.78621 12.5724C8.48941 12.6014 8.1939 12.5039 7.96317 12.3008C7.73246 12.0977 7.58497 11.8052 7.55243 11.4862L7.41593 9.86782L7.09483 9.34492L6.16533 11.832C6.05061 12.13 5.83132 12.3673 5.5551 12.4923C5.27888 12.6172 4.96802 12.6199 4.69005 12.4995C4.41208 12.3791 4.18945 12.1454 4.0705 11.8493C3.95155 11.5531 3.94591 11.2184 4.05478 10.9178L4.93033 8.57418C4.74054 8.58276 4.55176 8.54002 4.38125 8.44985C4.21073 8.35967 4.0639 8.22495 3.95415 8.05797C3.84441 7.89099 3.77524 7.69707 3.75296 7.49391C3.73069 7.29074 3.75602 7.0848 3.82663 6.89488L4.54163 4.96988C4.60855 4.78998 4.71414 4.62975 4.84973 4.50234C4.98533 4.37493 5.14706 4.28399 5.32163 4.23698L6.32263 3.96748C6.45913 3.93014 6.59607 3.91102 6.73343 3.91008C6.6271 3.67254 6.572 3.41219 6.57223 3.14848ZM6.77893 4.56598L5.47893 4.91598C5.40401 4.93608 5.33459 4.97505 5.27639 5.0297C5.21819 5.08434 5.17288 5.15309 5.14418 5.23028L4.42918 7.15528C4.4031 7.21972 4.3893 7.28913 4.3886 7.35942C4.38789 7.42971 4.40031 7.49943 4.42509 7.56445C4.44988 7.62948 4.48654 7.68848 4.53289 7.73796C4.57925 7.78744 4.63436 7.82639 4.69496 7.8525C4.75555 7.87862 4.82041 7.89136 4.88566 7.88997C4.95092 7.88859 5.01525 7.87311 5.07485 7.84445C5.13445 7.81578 5.18809 7.77453 5.23261 7.72312C5.27712 7.67171 5.31159 7.61121 5.33398 7.54518L5.89688 6.03108C5.91143 5.98803 5.93388 5.94857 5.96289 5.91505C5.99189 5.88153 6.02686 5.85464 6.06571 5.83597C6.10456 5.8173 6.14651 5.80725 6.18905 5.80639C6.23158 5.80554 6.27384 5.81391 6.31331 5.83101C6.35278 5.84811 6.38866 5.87358 6.4188 5.90591C6.44894 5.93824 6.47273 5.97678 6.48876 6.01922C6.5048 6.06165 6.51274 6.10714 6.51211 6.15295C6.51149 6.19876 6.50232 6.24397 6.48513 6.28588L4.65733 11.1789C4.63147 11.2432 4.61782 11.3124 4.6172 11.3825C4.61658 11.4526 4.629 11.5221 4.65372 11.5869C4.67845 11.6518 4.71498 11.7107 4.76116 11.76C4.80734 11.8094 4.86224 11.8484 4.92261 11.8745C4.98299 11.9007 5.04762 11.9136 5.11271 11.9124C5.17778 11.9113 5.24198 11.8962 5.30152 11.8678C5.36107 11.8395 5.41474 11.7987 5.45939 11.7477C5.50404 11.6967 5.53876 11.6365 5.56148 11.5709L6.49098 9.08382C6.53524 8.96535 6.60873 8.86219 6.7035 8.78554C6.79827 8.70881 6.91071 8.66148 7.02866 8.64865C7.1466 8.63582 7.26557 8.65796 7.37267 8.7127C7.47977 8.76742 7.57092 8.85265 7.63628 8.95922L8.02498 9.59272C8.03968 9.61679 8.04861 9.64444 8.05098 9.67322L8.19853 11.4232C8.21031 11.5618 8.27279 11.6898 8.37224 11.7789C8.47161 11.868 8.59983 11.9109 8.72861 11.8982C8.85739 11.8854 8.97618 11.8181 9.05889 11.7111C9.1416 11.604 9.18141 11.4659 9.16963 11.3273L9.02208 9.57802C9.00502 9.37642 8.94181 9.18261 8.83813 9.01382L8.23753 8.03378C8.18098 7.94163 8.14556 7.83639 8.13402 7.72665C8.1225 7.61691 8.13524 7.5058 8.17123 7.40238L8.41693 6.69538C8.43473 6.64455 8.46519 6.60001 8.50501 6.56662C8.54482 6.53324 8.59243 6.51233 8.64248 6.50618C8.69261 6.50003 8.74339 6.50888 8.78914 6.53176C8.83488 6.55465 8.87388 6.59068 8.90183 6.63588L9.09098 6.94108C9.12389 6.99474 9.16468 7.04002 9.21318 7.07688L10.3507 7.95188C10.4027 7.99388 10.4619 8.02427 10.5249 8.04126C10.5879 8.05825 10.6535 8.06151 10.7177 8.05083C10.7819 8.04015 10.8435 8.01576 10.8988 7.97908C10.9541 7.9424 11.0021 7.89418 11.0399 7.83726C11.0777 7.78034 11.1045 7.71585 11.1188 7.6476C11.1331 7.57934 11.1347 7.5087 11.1232 7.43981C11.1118 7.37093 11.0878 7.30519 11.0524 7.24647C11.0171 7.18776 10.9712 7.13724 10.9175 7.09788L9.94963 6.35308C9.88577 6.30373 9.83068 6.24231 9.78713 6.17178L9.25218 5.30868C9.18491 5.20019 9.08245 5.12258 8.96488 5.09098L7.01488 4.56598C6.93742 4.54517 6.8564 4.54517 6.77893 4.56598Z"
                fill="currentColor"
              />
            </svg>
            {venue.distance_km} min walk
          </div>
          {/* <div className="flex gap-2">
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
          </div> */}
        </div>
      </div>
    </div>
  );
}
