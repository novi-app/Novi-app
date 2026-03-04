"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Container, Stack, Row } from "@/components/layout";
import { Button } from "@/components/button"
import { Select } from "@/components/select"
import { VenueCard, VenueCardSkeleton } from "@/components/venueCard";
import { InterventionModal } from "@/components/interventionModal";
import { VenueDetailModal } from "@/components/venueDetailModal";
import { useFreezeDetection } from "@/hooks/useFreezeDetection";
import { useScrollDistance } from "@/hooks/useScrollDistance";
import { trackRecommendationsViewed, trackRecommendationCardClicked, trackFilterChanged } from "@/lib/analytics";
import { Logo } from "@/components/logo";

interface Venue {
  venue_id: string;
  name: string;
  category: string;
  location: { lat: number; lng: number };
  address?: string;
  distance_km: number;
  rating?: number;
  price_level?: number;
  solo_score?: number;
  solo_reason?: string;
  pro_tip?: string;
  combined_score?: number;
}

interface RecommendationsResponse {
  recommendations: Venue[];
  count: number;
}

/* ── Shared layout shell ── */
function PageShell({
  children,
  onStartOver,
}: {
  children: React.ReactNode;
  onStartOver: () => void;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <div className="sticky top-0 z-10 bg-cream/90 backdrop-blur-sm border-b border-secondary/[0.06] px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Logo size="md" />
          <button
            // onClick={onStartOver}
            className="text-secondary/40 font-medium transition-colors hover:text-secondary/70"
            style={{ fontSize: "20px", letterSpacing: "0.04em" }}
          >
            ⚙
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Filter bar — shared across states ── */
const CATEGORIES = [
  { value: "any", label: "All categories" },
  { value: "restaurant", label: "Restaurants" },
  { value: "cafe", label: "Cafes" },
  { value: "bar", label: "Bars" },
  { value: "museum", label: "Museums" },
  { value: "park", label: "Parks" },
  { value: "shopping mall", label: "Shopping" },
];

function FilterBar({
  selectedIntent,
  onFilterChange,
  onRefresh,
  isLoading,
}: {
  selectedIntent: string;
  onFilterChange: (v: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-row gap-3 items-center">
      <div className="flex-1">
        <Select
          value={selectedIntent}
          onChange={(e: any) => onFilterChange(e.target.value)}
          size="md"
        >
          {CATEGORIES.map(c => (
            <Select.Option key={c.value} value={c.value}>
              {c.label}
            </Select.Option>
          ))}
        </Select>
      </div>
      <button
        onClick={onRefresh}
        disabled={isLoading}
        aria-label="Refresh recommendations"
        className="shrink-0 flex items-center justify-center rounded-pill border border-secondary/12 text-secondary/50 hover:text-secondary/80 hover:bg-secondary/5 transition-all disabled:opacity-40"
        style={{ width: "56px", height: "56px" }}
      >
        <svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          className={isLoading ? "animate-spin" : ""}
        >
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M21 3v5h-5" />
          <path d="M3 21v-5h5" />
        </svg>
      </button>
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();

  const [userId, setUserId] = React.useState<string | null>(null);
  const [recommendations, setRecommendations] = React.useState<Venue[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = React.useState("any");

  const userLocation = { lat: 35.6762, lng: 139.6503 };

  const [filterChangeCount, setFilterChangeCount] = React.useState(0);
  const [previousFilter, setPreviousFilter] = React.useState("any");

  const [showIntervention, setShowIntervention] = React.useState(false);
  const [interventionData, setInterventionData] = React.useState<any>(null);
  const [selectedVenue, setSelectedVenue] = React.useState<Venue | null>(null);


  const freezeDetection = useFreezeDetection({
    enabled: true,
    recommendations,
    onFreeze: async (event) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/intervention`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              trigger_type: event.rule,
              context: event.context,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInterventionData({
            level: event.level,
            message: data.message,
            suggestedAction: data.suggested_action,
            venue: event.context.selected_venue,
          });
          setShowIntervention(true);
        }
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

  React.useEffect(() => {
    const storedUserId = localStorage.getItem("novi_user_id");
    if (!storedUserId) {
      router.push("/onboarding");
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  React.useEffect(() => {
    if (!isLoading && recommendations.length > 0) {
      trackRecommendationsViewed(recommendations.length, selectedIntent, userLocation);
    }
  }, [isLoading, recommendations, selectedIntent]);

  React.useEffect(() => {
    if (!userId) return;
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/recommendations`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: userId,
              location: userLocation,
              intent: selectedIntent,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to fetch recommendations");
        const data: RecommendationsResponse = await response.json();
        setRecommendations(data.recommendations);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, [userId, selectedIntent]);

  const handleFilterChange = (newIntent: string) => {
    trackFilterChanged(previousFilter, newIntent, filterChangeCount + 1);
    freezeDetection.recordFilterChange(newIntent);
    setPreviousFilter(selectedIntent);
    setFilterChangeCount(c => c + 1);
    setSelectedIntent(newIntent);
  };

  const handleViewDetails = (venueId: string) => {
    const venue = recommendations.find(v => v.venue_id === venueId);
    if (!venue) return;
    const cardPosition = recommendations.findIndex(v => v.venue_id === venueId) + 1;
    trackRecommendationCardClicked(
      venue.venue_id, venue.name, venue.category,
      cardPosition, venue.combined_score || 0, venue.distance_km
    );
    freezeDetection.recordCardClick(venueId);
    setSelectedVenue(venue);
  };

  const handleRefresh = () => {
    setSelectedIntent("any");
    if (userId) setIsLoading(true);
  };

  const handleStartOver = () => {
    localStorage.removeItem("novi_user_id");
    router.push("/onboarding");
  };

  const handleInterventionAccept = () => {
    if (!interventionData?.venue) return;

    const venue = recommendations.find(v => v.venue_id === interventionData.venue.id);
    if (!venue) return;

    // Track acceptance
    // trackInterventionResponse("intervention_accepted", interventionData.level, /* ... */);

    // Open directions
    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;
    window.open(url, "_blank");

    setShowIntervention(false);
  };

  const handleInterventionDismiss = () => {
    // trackInterventionResponse("intervention_dismissed", interventionData.level, /* ... */);
    freezeDetection.dismissIntervention();
    setShowIntervention(false);
  };

  /* ── Loading ── */
  if (isLoading && !recommendations.length) {
    return (
      <PageShell onStartOver={handleStartOver}>
        <Container size="lg" className="py-10">
          <Stack gap="lg">
            <div className="space-y-3">
              <div className="h-9 bg-secondary/8 rounded-2xl w-48 animate-pulse" />
              <div className="h-5 bg-secondary/6 rounded-xl w-64 animate-pulse" />
            </div>
            <div className="h-14 bg-secondary/8 rounded-pill animate-pulse" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <VenueCardSkeleton />
              <VenueCardSkeleton />
              <VenueCardSkeleton />
            </div>
          </Stack>
        </Container>
      </PageShell>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <PageShell onStartOver={handleStartOver}>
        <div className="flex items-center justify-center min-h-[70vh] px-6">
          <div className="text-center max-w-sm space-y-6">
            <p
              className="font-display font-medium text-secondary/12 leading-none select-none"
              style={{ fontSize: "clamp(80px, 20vw, 120px)", letterSpacing: "-0.04em" }}
            >
              oh.
            </p>
            <div className="space-y-2">
              <h1
                className="font-display font-medium text-secondary tracking-tight"
                style={{ fontSize: "clamp(20px, 5vw, 26px)" }}
              >
                Something went wrong
              </h1>
              <p className="text-secondary/45 text-sm leading-relaxed">{error}</p>
            </div>
            <Row gap="sm" justify="center">
              <Button variant="primary" onClick={handleRefresh}>Try again</Button>
              <Button variant="ghost" onClick={handleStartOver}>Start over</Button>
            </Row>
          </div>
        </div>
      </PageShell>
    );
  }

  /* ── Empty ── */
  if (!isLoading && recommendations.length === 0) {
    return (
      <PageShell onStartOver={handleStartOver}>
        <Container size="md" className="py-10">
          <Stack gap="lg">
            <FilterBar
              selectedIntent={selectedIntent}
              onFilterChange={handleFilterChange}
              onRefresh={handleRefresh}
              isLoading={isLoading}
            />
            <div className="text-center py-20 space-y-6">
              <p
                className="font-display font-medium text-secondary/10 leading-none select-none"
                style={{ fontSize: "clamp(80px, 20vw, 120px)", letterSpacing: "-0.04em" }}
              >
                hmm.
              </p>
              <div className="space-y-2">
                <h2
                  className="font-display font-medium text-secondary tracking-tight"
                  style={{ fontSize: "clamp(20px, 5vw, 26px)" }}
                >
                  Nothing here yet
                </h2>
                <p className="text-secondary/45 text-sm leading-relaxed max-w-xs mx-auto">
                  We couldn't find venues matching your preferences nearby.
                  Try a different category or broaden your search.
                </p>
              </div>
              <Row gap="sm" justify="center">
                <Button variant="primary" onClick={() => handleFilterChange("any")}>
                  View all categories
                </Button>
                <Button variant="ghost">
                  Update preferences
                </Button>
              </Row>
            </div>
          </Stack>
        </Container>
      </PageShell>
    );
  }

  /* ── Success ── */
  return (
    <PageShell onStartOver={handleStartOver}>
      <Container size="lg" className="py-4">
        <Stack gap="lg">

          <div>
            <h1
              className="font-display font-bold text-primary leading-tight tracking-tight text-center"
              style={{ fontSize: "clamp(30px, 8vw, 40px)", letterSpacing: "-0.02em" }}
            >
              Your Tokyo, ready.
            </h1>
            <p className="text-secondary/45 mt-1 text-sm text-center">
              {recommendations.length}{" "}
              {recommendations.length === 1 ? "place" : "places"} curated for you
            </p>
          </div>

          <FilterBar
            selectedIntent={selectedIntent}
            onFilterChange={handleFilterChange}
            onRefresh={handleRefresh}
            isLoading={isLoading}
          />

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <VenueCardSkeleton />
              <VenueCardSkeleton />
              <VenueCardSkeleton />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((venue, index) => (
                <VenueCard
                  key={venue.venue_id}
                  venue={venue}
                  cardPosition={index + 1}
                  onViewDetails={handleViewDetails}
                  onCardView={freezeDetection.recordCardView}
                />
              ))}
            </div>
          )}

          <div className="pt-6 border-t border-secondary/[0.06] text-center">
            <p className="text-secondary/35 text-xs mb-3">
              Not finding what you're looking for?
            </p>
            <button
              // onClick={handleStartOver}
              className="text-secondary/50 text-sm font-medium hover:text-secondary/80 transition-colors"
            >
              Update your preferences
            </button>
          </div>

        </Stack>
      </Container>

      {interventionData && (
        <InterventionModal
          isOpen={showIntervention}
          onDismiss={handleInterventionDismiss}
          onAccept={handleInterventionAccept}
          level={interventionData.level}
          message={interventionData.message}
          suggestedAction={interventionData.suggestedAction}
          venue={interventionData.venue}
        />
      )}

      <VenueDetailModal
        isOpen={!!selectedVenue}
        onClose={() => setSelectedVenue(null)}
        venue={selectedVenue}
      />

    </PageShell>
  );
}
