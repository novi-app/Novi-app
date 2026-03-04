"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { trackDirectionsClicked } from "@/lib/analytics";


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
  photos?: string[];
}

interface VenueDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  venue: Venue | null;
}


function triggerHaptic(style: "light" | "medium" | "heavy" = "medium") {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30] };
    navigator.vibrate(patterns[style]);
  }
}

function PriceLevel({ level }: { level?: number }) {
  if (!level || level === 0) return <span className="text-sm text-secondary/40">Free</span>;

  const symbols = "$".repeat(level);
  return <span className="text-sm font-medium text-secondary">{symbols}</span>;
}

export function VenueDetailModal({ isOpen, onClose, venue }: VenueDetailModalProps) {
  const [selectedPhoto, setSelectedPhoto] = React.useState(0);

  // Reset photo index when venue changes
  React.useEffect(() => {
    if (venue) setSelectedPhoto(0);
  }, [venue]);

  // Haptic on open
  React.useEffect(() => {
    if (isOpen) triggerHaptic("light");
  }, [isOpen]);

  // ESC to close
  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        triggerHaptic("light");
        onClose();
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Lock scroll
  React.useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  const handleGetDirections = () => {
    if (!venue) return;

    triggerHaptic("heavy");

    trackDirectionsClicked(
      venue.venue_id,
      venue.name,
      venue.category,
      venue.distance_km
    );

    const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.location.lat},${venue.location.lng}`;
    window.open(url, "_blank");
  };

  const handleClose = () => {
    triggerHaptic("light");
    onClose();
  };

  if (!venue) return null;

  // Use photos if available, otherwise show numbered placeholders
  const hasPhotos = venue.photos && venue.photos.length > 0;
  const photoCount = hasPhotos ? Math.min(venue.photos!.length, 4) : 4;

  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle (mobile) - purely visual, drag to dismiss not implemented */}
            <div
              className="mx-auto mt-3 mb-1 h-1 w-12 rounded-full bg-secondary/20 flex-shrink-0 sm:hidden"
              aria-hidden="true"
            />

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 border-2 border-secondary/20 bg-white text-secondary hover:border-secondary/40 hover:bg-secondary/5 transition-colors shadow-sm"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1">
              {/* Photo Gallery (2×2 grid) */}
              <div className="grid grid-cols-2 gap-1 p-1">
                {Array.from({ length: photoCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedPhoto(i);
                    }}
                    className={`relative aspect-square overflow-hidden rounded-xl transition-all ${selectedPhoto === i ? "ring-2 ring-primary" : "ring-1 ring-secondary/10"
                      }`}
                  >
                    {hasPhotos && venue.photos![i] ? (
                      <img
                        src={venue.photos![i]}
                        alt={`${venue.name} - Photo ${i + 1}`}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className={`w-full h-full bg-secondary flex items-center justify-center`}>
                        <div className="text-white/30 font-bold" style={{ fontSize: "clamp(48px, 8vw, 72px)" }}>
                          {i + 1}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-secondary leading-tight">
                      {venue.name}
                    </h1>
                    {venue.rating && (
                      <div className="flex items-center gap-1 bg-secondary/5 px-2 py-1 rounded-lg flex-shrink-0">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-semibold text-secondary">
                          {venue.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-sm text-secondary/60">
                    <span className="capitalize">{venue.category}</span>
                    <span>•</span>
                    <PriceLevel level={venue.price_level} />
                    <span>•</span>
                    <span>{venue.distance_km.toFixed(1)} km away</span>
                  </div>
                </div>

                {/* Address */}
                {venue.address && (
                  <div className="flex items-start gap-2 text-sm text-secondary/60">
                    <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-relaxed">{venue.address}</span>
                  </div>
                )}

                {/* Solo Score */}
                {venue.solo_score !== undefined && venue.solo_score > 0 && (
                  <div className="bg-secondary/5 border border-secondary/10 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-secondary">
                        Solo Score: {venue.solo_score}/100
                      </span>
                    </div>
                    {venue.solo_reason && (
                      <p className="text-sm text-secondary/70 leading-relaxed">
                        {venue.solo_reason}
                      </p>
                    )}
                  </div>
                )}

                {/* Pro Tip */}
                {venue.pro_tip && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-secondary">Pro Tip</span>
                    </div>
                    <p className="text-sm text-secondary/70 leading-relaxed">
                      {venue.pro_tip}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer with CTA */}
            <div className="flex-shrink-0 border-t border-secondary/10 bg-white p-4">
              <button
                onClick={handleGetDirections}
                className="w-full h-14 rounded-full font-semibold text-white transition-all active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #e8923a 0%, #D97D3E 60%, #c96d2a 100%)",
                  boxShadow: "0 8px 24px rgba(217,125,62,0.4)",
                }}
              >
                Get Directions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
