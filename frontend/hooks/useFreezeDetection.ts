"use client";

import { useEffect, useRef } from "react";
import { FreezeDetector } from "@/lib/freezeDetection";
import type { FreezeEvent } from "@/lib/freezeDetection";

interface UseFreezeDetectionOptions {
  enabled: boolean;
  recommendations: any[];
  onFreeze: (event: FreezeEvent) => void;
}

export function useFreezeDetection({
  enabled,
  recommendations,
  onFreeze,
}: UseFreezeDetectionOptions) {
  const detectorRef = useRef<FreezeDetector | null>(null);
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
        cooldownMs: 120000,
      },
      (event) => {
        onFreezeRef.current(event);
      }
    );

    detectorRef.current = detector;

    return () => {
      detector.destroy();
      detectorRef.current = null;
    };
  }, [enabled]);

  return {
    recordCardView: (venueId: string) => {
      detectorRef.current?.recordCardView(venueId);
    },
    recordDetailsView: (venueId: string) => {
      detectorRef.current?.recordDetailsView(venueId);
    },
    recordScroll: (direction: "up" | "down", distance: number) => {
      detectorRef.current?.recordScroll(direction, distance);
    },
    dismissIntervention: () => {
      detectorRef.current?.dismissIntervention();
    },
    resetDismissals: () => {
      detectorRef.current?.resetDismissals();
    },
  };
}
