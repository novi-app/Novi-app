"use client";

import { useEffect, useRef, useCallback } from "react";
import { FreezeDetector, type FreezeEvent } from "@/lib/freezeDetection";
import { trackFreezeDetected } from "@/lib/analytics";

interface UseFreezeDetectionOptions {
  enabled?: boolean;
  onFreeze?: (event: FreezeEvent) => void;
}

export function useFreezeDetection(options: UseFreezeDetectionOptions = {}) {
  const { enabled = true, onFreeze } = options;

  const detectorRef = useRef<FreezeDetector | null>(null);

  // Stabilize external callback without recreating detector
  const onFreezeRef = useRef(onFreeze);

  useEffect(() => {
    onFreezeRef.current = onFreeze;
  }, [onFreeze]);

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
        // Analytics
        trackFreezeDetected(event.rule, event.level, event.context);

        // External handler
        onFreezeRef.current?.(event);

        // Dev-only logging
        if (process.env.NODE_ENV === "development") {
          console.log(
            `Freeze detected: ${event.rule} (${event.level})`,
            event.context
          );
        }
      }
    );

    detectorRef.current = detector;

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
