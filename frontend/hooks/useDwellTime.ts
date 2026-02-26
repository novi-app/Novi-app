"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logBehavioralEvent } from "@/lib/firestore-events";

export function useDwellTime() {
  const pathname = usePathname();

  const pageStartTime = useRef<number | null>(null);
  const lastActivityTime = useRef<number | null>(null);
  const activeTime = useRef(0);

  useEffect(() => {
    // Lazy init to avoid impure render
    const now = Date.now();
    pageStartTime.current = now;
    lastActivityTime.current = now;
    activeTime.current = 0;

    const trackActivity = () => {
      if (lastActivityTime.current === null) return;

      const now = Date.now();
      const delta = now - lastActivityTime.current;

      // Only count as active if user hasn't been idle >5s
      if (delta < 5000) {
        activeTime.current += delta;
      }

      lastActivityTime.current = now;
    };

    const events: (keyof WindowEventMap)[] = [
      "click",
      "scroll",
      "keydown",
      "mousemove",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      // Cleanup listeners first
      events.forEach((event) => {
        window.removeEventListener(event, trackActivity);
      });

      if (pageStartTime.current === null) return;

      const totalTime = (Date.now() - pageStartTime.current) / 1000;
      const active = activeTime.current / 1000;
      const idle = Math.max(0, totalTime - active);

      // Avoid noise + React StrictMode double-fire
      if (totalTime > 5 && process.env.NODE_ENV === "production") {
        logBehavioralEvent("dwell_time_recorded", {
          page_path: pathname,
          total_time_seconds: Math.round(totalTime),
          active_time_seconds: Math.round(active),
          idle_time_seconds: Math.round(idle),
        });
      }
    };
  }, [pathname]);
}
