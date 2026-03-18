"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Venue } from "@/lib/types";

interface VenueDetailsModalProps {
  venue: Venue;
  onClose: () => void;
  onDirections: () => void;
}

export default function VenueDetailsModal({ venue, onClose, onDirections }: VenueDetailsModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const priceSymbol = venue.price_level > 0 ? "$".repeat(venue.price_level) : "FREE";

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/90"
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col max-h-[70vh]"
        style={{ borderRadius: "20px 20px 0 0" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 rounded-full bg-gray-300" style={{ height: "4px" }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ scrollbarWidth: "none" }}>
          {venue.photo && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-gray-100">
              <Image src={venue.photo} alt={venue.name} fill className="object-cover" />
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{venue.name}</h2>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-yellow-500 text-lg">★</span>
            <span className="font-semibold text-gray-700">{venue.rating.toFixed(1)}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{venue.reviews_count.toLocaleString()} reviews</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{priceSymbol}</span>
          </div>

          {venue.tags && venue.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {venue.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-teal-50 text-teal-700 text-sm font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {venue.pro_tip && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-4">
              <p className="text-sm font-semibold text-orange-800 mb-1">Pro tip</p>
              <p className="text-sm text-orange-700 leading-relaxed">{venue.pro_tip}</p>
            </div>
          )}

          {venue.solo_reason && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-teal-800">Solo-friendly score</p>
                <span className="text-sm font-bold text-teal-700">{venue.solo_score}/100</span>
              </div>
              <p className="text-sm text-teal-700 leading-relaxed">{venue.solo_reason}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Address</p>
                <p className="text-sm text-gray-600">{venue.address}</p>
                <p className="text-sm text-gray-500 mt-1">{venue.distance_km} min walk from you</p>
              </div>
            </div>

            {venue.phone && venue.phone !== "Not available" && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Phone</p>
                  <a href={`tel:${venue.phone}`} className="text-sm text-teal-600">
                    {venue.phone}
                  </a>
                </div>
              </div>
            )}

            {venue.website && venue.website !== "Not available" && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">Website</p>
                  <a
                    href={venue.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-teal-600 break-all"
                  >
                    Visit website
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-200">
          <button
            onClick={onDirections}
            className="w-full py-4 bg-orange-500 text-white font-semibold rounded-xl active:scale-[0.98] transition-transform"
          >
            Get directions
          </button>
        </div>
      </div>
    </div>
  );
}
