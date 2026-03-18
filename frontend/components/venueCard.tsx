"use client";

import { useState } from "react";
import Image from "next/image";
import type { Venue } from "@/lib/types";

interface VenueCardProps {
  venue: Venue;
  size?: "large" | "small";
  saved?: boolean;
  onSaveToggle?: () => void;
  onDetails: () => void;
  onDirections: () => void;
}

export default function VenueCard({
  venue,
  size = "small",
  saved = false,
  onSaveToggle,
  onDetails,
  onDirections,
}: VenueCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  const priceSymbol = venue.price_level > 0 ? "$".repeat(venue.price_level) : "FREE";
  const isLarge = size === "large";

  const handleSaveClick = async () => {
    if (!onSaveToggle || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveToggle();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl overflow-hidden ${isLarge ? "shadow-lg" : "shadow-md"}`}>
      <div className={`relative ${isLarge ? "h-64" : "h-24"} bg-gray-100`}>
        {venue.photo ? (
          <Image
            src={venue.photo}
            alt={venue.name}
            fill
            className="object-cover"
            priority={isLarge}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
        )}
        
        {onSaveToggle && (
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            aria-label={saved ? "Unsave" : "Save"}
          >
            <svg
              className="w-5 h-5"
              fill={saved ? "#E8700A" : "none"}
              stroke={saved ? "#E8700A" : "#6B7280"}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        )}

        {isLarge && (
          <>
            <button
              onClick={onDirections}
              className="absolute top-3 left-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="#0D4A4A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={onDirections}
              className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Next"
            >
              <svg className="w-5 h-5" fill="none" stroke="#0D4A4A" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="p-4">
        <h3 className={`font-bold text-gray-900 ${isLarge ? "text-xl mb-2" : "text-base mb-1"}`}>
          {venue.name}
        </h3>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-yellow-500">★</span>
          <span className="font-semibold text-gray-700">{venue.rating.toFixed(1)}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 text-sm">{priceSymbol}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 text-sm flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {venue.distance_km} min walk
          </span>
        </div>

        {venue.tags && venue.tags.length > 0 && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
              {venue.tags[0]}
            </span>
          </div>
        )}

        {isLarge && venue.pro_tip && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {venue.pro_tip}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onDetails}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all active:scale-[0.98] ${
              isLarge
                ? "bg-white border-2 border-orange-500 text-orange-500"
                : "bg-white border-2 border-orange-500 text-orange-500"
            }`}
          >
            Details
          </button>
          <button
            onClick={onDirections}
            className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all active:scale-[0.98] ${
              isLarge ? "bg-orange-500" : "bg-orange-500"
            }`}
          >
            Let's go
          </button>
        </div>
      </div>
    </div>
  );
}
