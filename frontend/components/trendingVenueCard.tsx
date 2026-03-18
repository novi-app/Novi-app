"use client";

import Image from "next/image";
import type { TrendingVenue } from "@/lib/types";

interface TrendingVenueCardProps {
  venue: TrendingVenue;
  onClick: () => void;
  onDirections: () => void;
  onBookmark: () => void;
  isSaved: boolean;
}

const USER_LOCATION = { lat: 35.6595, lng: 139.7004 };

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function walkMinutes(venue: TrendingVenue): number {
  const km = haversineKm(
    USER_LOCATION.lat, USER_LOCATION.lng,
    venue.location.latitude, venue.location.longitude
  );
  return Math.max(1, Math.round((km / 5) * 60));
}

export function TrendingVenueCardSkeleton() {
  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden bg-white"
      style={{ width: "clamp(200px, 60vw, 260px)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
    >
      <div className="w-full bg-gray-200 animate-pulse" style={{ height: "clamp(140px, 42vw, 180px)" }} />
      <div className="px-4 py-4 flex flex-col gap-2">
        <div className="h-5 w-3/4 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-3.5 w-1/2 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-3.5 w-2/3 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-4 w-1/3 bg-gray-100 rounded-full animate-pulse mt-1" />
        <div className="h-10 w-full bg-gray-200 rounded-2xl animate-pulse mt-2" />
      </div>
    </div>
  );
}

export default function TrendingVenueCard({
  venue,
  onClick,
  onDirections,
  onBookmark,
  isSaved,
}: TrendingVenueCardProps) {
  const mins = walkMinutes(venue);

  return (
    <div
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden bg-white"
      style={{ width: "clamp(200px, 60vw, 260px)", boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
    >
      <button
        onClick={onClick}
        className="relative w-full flex-shrink-0 active:opacity-90 transition-opacity"
        style={{ height: "clamp(140px, 42vw, 180px)" }}
      >
        {venue.photo ? (
          <Image src={venue.photo} alt={venue.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
      </button>

      <div className="px-4 pt-3 pb-4 flex flex-col gap-1">
        <button onClick={onClick} className="text-left">
          <h3
            className="font-bold text-secondary leading-tight line-clamp-1"
            style={{ fontSize: "clamp(14px, 4vw, 16px)" }}
          >
            {venue.name}
          </h3>
          <p
            className="text-gray-500 mt-0.5 line-clamp-1"
            style={{ fontSize: "clamp(11px, 3vw, 13px)" }}
          >
            {venue.category}
          </p>
        </button>

        <div className="flex items-center gap-1 mt-0.5">
          <span style={{ color: "#F59E0B", fontSize: "20px" }}>★</span>
          <span className="font-semibold text-secondary" style={{ fontSize: "clamp(11px, 3vw, 13px)" }}>
            {venue.rating.toFixed(1)}
          </span>
          {venue.reviews_count > 0 && (
            <span className="text-gray-400" style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}>
              ({venue.reviews_count})
            </span>
          )}
          <span className="text-gray-300">·</span>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-gray-400 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-gray-500" style={{ fontSize: "clamp(10px, 2.5vw, 12px)" }}>
            {mins} min walk
          </span>
        </div>

        {/* Vibe tag */}
        {venue.tags?.[0] && (
          <div className="mt-1">
            <span
              className="inline-block px-3 py-1 rounded-full font-medium"
              style={{
                fontSize: "clamp(10px, 2.8vw, 12px)",
                background: "rgba(11,79,74,0.08)",
                color: "#0B4F4A",
              }}
            >
              {venue.tags[0]}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-2 mt-3">
          <button
            onClick={onDirections}
            className="px-6 font-semibold text-white transition-all active:scale-[0.97]"
            style={{
              height: "40px",
              borderRadius: "9999px",
              fontSize: "clamp(12px, 3.2vw, 14px)",
              background: "#0B4F4A",
            }}
          >
            Let's go
          </button>
          <button
            onClick={e => { e.stopPropagation(); onBookmark(); }}
            className="flex items-center justify-center rounded-full transition-all active:scale-90 flex-shrink-0"
            style={{
              width: "40px",
              height: "40px",
            }}
            aria-label={isSaved ? "Unsave" : "Save"}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? "#E8700A" : "none"} stroke="#E8700A" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
