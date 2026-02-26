"use client";

import { useEffect, useRef } from "react";
import { eventBatcher } from "@/lib/firestore-events";

export function useScrollTracking() {
  const lastScrollY = useRef<number | null>(null);
  const lastScrollTime = useRef<number | null>(null);

  useEffect(() => {
    // Initialize lazily to avoid impure render work
    lastScrollY.current = window.scrollY;
    lastScrollTime.current = Date.now();

    const handleScroll = () => {
      if (lastScrollY.current === null || lastScrollTime.current === null) return;

      const currentScrollY = window.scrollY;
      const currentTime = Date.now();

      const timeDiff = (currentTime - lastScrollTime.current) / 1000; // seconds
      if (timeDiff <= 0) return; // avoid divide-by-zero

      const scrollDistance = Math.abs(currentScrollY - lastScrollY.current);
      const scrollDirection = currentScrollY > lastScrollY.current ? "down" : "up";
      const scrollVelocity = scrollDistance / timeDiff;

      // Only track significant scrolls (> 50px)
      if (scrollDistance > 50) {
        eventBatcher.add("scroll_event", {
          scroll_direction: scrollDirection,
          scroll_distance_px: scrollDistance,
          scroll_velocity_px_per_sec: Math.round(scrollVelocity),
          current_scroll_position: currentScrollY,
          total_page_height: document.documentElement.scrollHeight,
        });
      }

      lastScrollY.current = currentScrollY;
      lastScrollTime.current = currentTime;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
}
