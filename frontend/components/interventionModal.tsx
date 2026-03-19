"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

export interface InterventionVenue {
  id: string;
  name: string;
  photo?: string;
  category: string;
  rating?: number;
  reviews_count?: number;
  price_level?: number;
  tags?: string[];
  solo_reason?: string;
  distance_km?: number;
}

interface InterventionModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onAccept: () => void;
  level: "GENTLE" | "MODERATE" | "URGENT";
  message: string;
  suggestedAction: string;
  venue: InterventionVenue | null;
}

const COLLAPSED_H = 190; 
const EXPANDED_H = 660;

function triggerHaptic(style: "light" | "medium" | "heavy" = "medium") {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator) {
    const patterns = {
      light: [50],
      medium: [100, 50, 100],
      heavy: [150, 50, 150, 50, 150],
    };
    navigator.vibrate(patterns[style]);
  }
  if ("HapticsEngine" in window) {
    (window as any).HapticsEngine?.impact(style);
  }
}

function priceLabel(level?: number) {
  if (!level) return null;
  return "¥".repeat(level);
}

function walkMins(distance_km?: number) {
  if (!distance_km) return null;
  return Math.max(1, Math.round((distance_km / 5) * 60));
}

export function InterventionModal({
  isOpen,
  onDismiss,
  onAccept,
  level,
  message,
  venue,
}: InterventionModalProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      const hapticStyle = level === "GENTLE" ? "light" : level === "MODERATE" ? "medium" : "heavy";
      triggerHaptic(hapticStyle);
    }
  }, [isOpen, level]);

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

  const handleDismiss = () => {
    triggerHaptic("light");
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
      setIsExiting(false);
    }, 300);
  };

  const handleAccept = () => {
    triggerHaptic("heavy");
    onAccept();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y < -300 || info.offset.y < -60) {
      if (venue) { setIsExpanded(true); triggerHaptic("light"); }
    } else if (info.velocity.y > 300 || info.offset.y > 60) {
      if (isExpanded) { setIsExpanded(false); triggerHaptic("light"); }
      else { handleDismiss(); }
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDismiss();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  if (!isOpen && !isExiting) return null;

  const mins = walkMins(venue?.distance_km);
  const price = priceLabel(venue?.price_level);
  const targetHeight = isExpanded && venue ? EXPANDED_H : COLLAPSED_H;

  const content = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: venue ? 0.08 : 0, bottom: 0.3 }}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%", height: COLLAPSED_H }}
            animate={{ y: 0, height: targetHeight }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
            className="relative w-full max-w-md mx-auto bg-[#F0EBE1] rounded-t-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full justify-center pt-4 pb-3"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                if (!venue) return;
                setIsExpanded((v) => !v);
                triggerHaptic("light");
              }}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <div className="h-1 w-12 rounded-full bg-neutral-300 pointer-events-none" />
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleDismiss}
                  className="absolute right-4 top-3 z-10 flex items-center justify-center rounded-full bg-white shadow-sm text-neutral-500 hover:bg-neutral-100 transition-colors"
                  style={{ width: 36, height: 36 }}
                  aria-label="Dismiss"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="mx-4 mt-2 mb-4 rounded-2xl bg-[#0B4F4A] px-5 py-6">
              <p className="text-white font-bold text-base leading-snug">{message}</p>
            </div>

            {venue && (
              <motion.div
                animate={{ opacity: isExpanded ? 1 : 0 }}
                transition={{ duration: 0.2, delay: isExpanded ? 0.1 : 0 }}
              >
                <div className="mx-4 mb-4 bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative w-full" style={{ height: 192 }}>
                    {venue.photo ? (
                      <img
                        src={venue.photo}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>

                  <div className="px-4 pt-3 pb-4">
                    <h3 className="font-bold text-secondary text-lg leading-tight mb-1">
                      {venue.name}
                    </h3>

                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-sm text-gray-500 mb-2">
                      {venue.rating != null && (
                        <>
                          <span style={{ color: "#F59E0B" }}>★</span>
                          <span className="font-semibold text-secondary">
                            {venue.rating.toFixed(1)}
                          </span>
                        </>
                      )}
                      {price && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{price}</span>
                        </>
                      )}
                      {mins && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="flex items-center gap-0.5">
                            <svg
                              width="11" height="11" fill="none"
                              stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                              className="shrink-0"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {mins} min walk
                          </span>
                        </>
                      )}
                      <span className="text-gray-300">·</span>
                      <span>{venue.category}</span>
                    </div>

                    {venue.tags?.[0] && (
                      <div className="mb-2">
                        <span
                          className="inline-block px-3 py-1 rounded-full text-xs font-medium border"
                          style={{ color: "#E8700A", borderColor: "#E8700A" }}
                        >
                          {venue.tags[0]}
                        </span>
                      </div>
                    )}

                    {venue.solo_reason && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <span className="mr-1">🧍</span>
                        <strong>Solo-friendly because</strong> {venue.solo_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mx-4 mb-6">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 h-14 rounded-full font-semibold transition-all active:scale-[0.97] border-2 bg-transparent"
                    style={{ color: "#E8700A", borderColor: "#E8700A" }}
                  >
                    Details
                  </button>
                  <button
                    onClick={handleAccept}
                    className="flex-1 h-14 rounded-full font-semibold text-white transition-all active:scale-[0.97]"
                    style={{ background: "#E8700A" }}
                  >
                    Let's go
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
