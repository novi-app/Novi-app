"use client";

import * as React from "react";
import { Card } from "./";
import { trackDirectionsClicked } from "@/lib/analytics";
import { useViewportTracking } from "@/hooks/useViewportTracking";

interface VenueCardProps {
  venue: {
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
  };
  cardPosition: number;
  onViewDetails?: (venueId: string) => void;
  onCardView?: (venueId: string) => void;
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const color =
          i < full ? "#D97D3E"
            : i === full && half ? "rgba(217,125,62,0.45)"
              : "rgba(11,79,74,0.12)";
        return (
          <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill={color}>
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        );
      })}
      <span className="ml-1.5 text-xs font-medium text-secondary/55">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// price_level 0 or undefined → all $$$ at 30% opacity (unspecified)
// price_level 1-3 → amber filled, remainder muted
function PriceLevel({ level }: { level?: number }) {
  if (!level || level === 0) {
    return <span className="text-xs font-medium tracking-wide text-secondary/30">$$$</span>;
  }
  return (
    <span className="text-xs font-medium tracking-wide">
      <span className="text-primary/80">{"$".repeat(level)}</span>
      <span className="text-secondary/20">{"$".repeat(Math.max(0, 3 - level))}</span>
    </span>
  );
}

function CardHeader({ category, distance_km }: { category: string; distance_km: number }) {
  return (
    <div className="relative h-44 bg-secondary overflow-hidden flex items-center justify-center">
      {/* Large ambient category initial */}
      <span
        aria-hidden="true"
        className="font-display font-medium text-white/[0.07] leading-none select-none absolute"
        style={{ fontSize: "160px", letterSpacing: "-0.04em" }}
      >
        {category.charAt(0).toUpperCase()}
      </span>

      {/* Amber bottom accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: "linear-gradient(90deg, transparent, rgba(217,125,62,0.6), transparent)" }}
      />

      {/* Distance — top right */}
      <span
        className="absolute top-3 right-3 bg-white/10 backdrop-blur-sm text-white/75 font-medium px-2.5 py-1 rounded-full"
        style={{ fontSize: "11px", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {distance_km} km
      </span>

      {/* Category label — bottom left */}
      <span
        className="absolute bottom-4 left-4 uppercase tracking-[0.15em] text-white/30 font-medium"
        style={{ fontSize: "10px" }}
      >
        {category}
      </span>
    </div>
  );
}

export const VenueCard: React.FC<VenueCardProps> = ({
  venue, cardPosition, onViewDetails, onCardView,
}) => {
  const [hasReportedView, setHasReportedView] = React.useState(false);
  const cardRef = useViewportTracking(
    venue.venue_id, venue.name, venue.category, cardPosition
  );

  React.useEffect(() => {
    if (onCardView && !hasReportedView) {
      const timer = setTimeout(() => {
        onCardView(venue.venue_id);
        setHasReportedView(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [venue.venue_id, onCardView, hasReportedView]);

  const handleGetDirections = () => {
    trackDirectionsClicked(venue.venue_id, venue.name, venue.category, venue.distance_km);
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`,
      "_blank"
    );
  };

  return (
    <Card ref={cardRef} variant="elevated" padding="none" className="overflow-hidden">
      <CardHeader category={venue.category} distance_km={venue.distance_km} />
      <div className="px-5 pt-4 pb-5 space-y-3.5">
        <div>
          <h3
            className="font-display font-medium text-secondary leading-tight line-clamp-2"
            style={{ fontSize: "clamp(15px, 3.5vw, 17px)", letterSpacing: "-0.01em" }}
          >
            {venue.name}
          </h3>
          <p className="text-secondary/40 text-xs capitalize mt-0.5 tracking-wide">
            {venue.category}
          </p>
        </div>

        {(venue.rating != null || venue.price_level != null) && (
          <div className="flex items-center justify-between">
            {venue.rating != null && <StarRating rating={venue.rating} />}
            <PriceLevel level={venue.price_level} />
          </div>
        )}

        {venue.pro_tip && (
          <div
            className="rounded-xl px-3.5 py-3 border-l-2"
            style={{ background: "rgba(217,125,62,0.06)", borderLeftColor: "rgba(217,125,62,0.4)" }}
          >
            <p className="text-xs font-semibold text-primary/75 uppercase tracking-[0.12em] mb-1">
              Pro tip
            </p>
            <p className="text-xs text-secondary/60 leading-relaxed">{venue.pro_tip}</p>
          </div>
        )}

        {venue.solo_reason && (
          <p className="text-xs text-secondary/45 leading-relaxed">{venue.solo_reason}</p>
        )}

        {venue.address && (
          <div
            className="flex items-center"
            style={{ minHeight: "32px" }}
          >
            <p className="text-xs text-secondary/35 leading-relaxed line-clamp-2">
              {venue.address}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => onViewDetails?.(venue.venue_id)}
            className="flex-1 h-11 rounded-xl font-medium text-white text-sm transition-all active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #e8923a 0%, #D97D3E 60%, #c96d2a 100%)",
              boxShadow: "0 4px 16px rgba(217,125,62,0.28)",
            }}
          >
            View details
          </button>
          <button
            onClick={handleGetDirections}
            className="h-11 px-4 rounded-xl border text-secondary/55 text-xs font-medium hover:bg-secondary/5 transition-colors shrink-0"
            style={{ borderColor: "rgba(11,79,74,0.12)", fontSize: "12px" }}
          >
            Directions
          </button>
        </div>

      </div>
    </Card>
  );
};

export const VenueCardSkeleton: React.FC = () => (
  <Card variant="elevated" padding="none" className="overflow-hidden animate-pulse">
    <div className="h-44 bg-secondary/20" />
    <div className="px-5 pt-4 pb-5 space-y-3.5">
      <div className="space-y-2">
        <div className="h-5 bg-secondary/8 rounded-lg w-3/4" />
        <div className="h-3 bg-secondary/6 rounded w-1/3" />
      </div>
      <div className="h-3 bg-secondary/6 rounded w-1/2" />
      <div className="h-16 bg-secondary/6 rounded-xl" />
      <div className="flex gap-2">
        <div className="h-11 bg-secondary/10 rounded-xl flex-1" />
        <div className="h-11 w-24 bg-secondary/6 rounded-xl" />
      </div>
    </div>
  </Card>
);
