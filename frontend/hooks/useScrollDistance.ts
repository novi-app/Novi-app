"use client";

import { useEffect, useRef } from "react";

interface UseScrollDistanceOptions {
  onScroll: (direction: "up" | "down", distance: number) => void;
  throttleMs?: number;
}

export function useScrollDistance({ onScroll, throttleMs = 100 }: UseScrollDistanceOptions) {
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef<number>(0);
  const throttleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    lastScrollTime.current = Date.now();

    const handleScroll = () => {
      if (throttleTimer.current) return;

      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;

        const currentScrollY = window.scrollY;
        const distance = Math.abs(currentScrollY - lastScrollY.current);
        const direction = currentScrollY > lastScrollY.current ? "down" : "up";

        if (distance > 50) {
          onScroll(direction, distance);
        }

        lastScrollY.current = currentScrollY;
        lastScrollTime.current = Date.now();
      }, throttleMs);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (throttleTimer.current) clearTimeout(throttleTimer.current);
    };
  }, [onScroll, throttleMs]);
}
