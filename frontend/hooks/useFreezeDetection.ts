"use client";

import { useEffect, useRef, useCallback } from "react";
import { FreezeDetector, type FreezeEvent } from "@/lib/freezeDetection";
import { trackFreezeDetected } from "@/lib/analytics";

interface UseFreezeDetectionOptions {
  enabled?: boolean;
  onFreeze?: (event: FreezeEvent) => void;
  recommendations?: any[];
}

export function useFreezeDetection(options: UseFreezeDetectionOptions = {}) {
  const { enabled = true, onFreeze, recommendations = [] } = options;

  const detectorRef = useRef<FreezeDetector | null>(null);
  
  const onFreezeRef = useRef(onFreeze);
  const recommendationsRef = useRef(recommendations);

  useEffect(() => {
    onFreezeRef.current = onFreeze;
  }, [onFreeze]);

  useEffect(() => {
    recommendationsRef.current = recommendations;
  }, [recommendations]);

  // Initialize detector (only when enabled changes)
  useEffect(() => {
    if (!enabled) return;

    const detector = new FreezeDetector(
      {
        thresholds: {
          gentle: 90000,
          moderate: 120000,
          urgent: 180000,
        },
        cooldownMs: 60000,
      },
      (event) => {
        // Get latest recommendations from ref
        const currentRecs = recommendationsRef.current;
        const suggestedVenue = currentRecs.length > 0 
          ? currentRecs[0] 
          : null;

        // Enhance context with venue info
        const enhancedContext = {
          ...event.context,
          selected_venue: suggestedVenue ? {
            id: suggestedVenue.venue_id,
            name: suggestedVenue.name,
            category: suggestedVenue.category,
          } : null,
        };

        // Track to analytics
        trackFreezeDetected(event.rule, event.level, enhancedContext);

        // Call custom handler with enhanced context
        if (onFreezeRef.current) {
          onFreezeRef.current({
            ...event,
            context: enhancedContext,
          });
        }

        // Dev-only logging
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Freeze detected: ${event.rule} (${event.level})`,
            enhancedContext
          );
        }
      }
    );

    detectorRef.current = detector;

    // Cleanup on unmount or when enabled changes
    return () => {
      detector.destroy();
      detectorRef.current = null;
    };
  }, [enabled]);

  // ===== Public API =====

  const recordCardView = useCallback((venueId: string) => {
    detectorRef.current?.recordEvent("card_view", { id: venueId });
  }, []);

  const recordCardClick = useCallback((venueId: string) => {
    detectorRef.current?.recordEvent("card_click", { id: venueId });
  }, []);

  const recordScroll = useCallback(
    (direction: "up" | "down", distance: number) => {
      detectorRef.current?.recordEvent("scroll", { direction, distance });
    },
    []
  );

  const recordFilterChange = useCallback((filterValue: string) => {
    detectorRef.current?.recordEvent("filter_change", { value: filterValue });
  }, []);

  const dismissIntervention = useCallback(() => {
    detectorRef.current?.dismissIntervention();
  }, []);

  const resetDismissals = useCallback(() => {
    detectorRef.current?.resetDismissals();
  }, []);

  return {
    recordCardView,
    recordCardClick,
    recordScroll,
    recordFilterChange,
    dismissIntervention,
    resetDismissals,
  };
}
