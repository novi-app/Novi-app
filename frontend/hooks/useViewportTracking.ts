"use client";

import { useEffect, useRef, useCallback } from "react";
import { eventBatcher } from "@/lib/firestore-events";

export function useViewportTracking(
  venueId: string,
  venueName: string,
  venueCategory: string,
  cardPosition: number
) {
  const viewStartTime = useRef<number | null>(null);
  const hasLogged = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);

  const flushView = useCallback(() => {
    if (!viewStartTime.current || hasLogged.current) return;

    const duration = Date.now() - viewStartTime.current;

    if (duration > 500) {
      hasLogged.current = true;

      eventBatcher.add("venue_view", {
        venue_id: venueId,
        venue_name: venueName,
        venue_category: venueCategory,
        card_position: cardPosition,
        time_in_viewport_ms: duration,
        scroll_position: window.scrollY,
      });
    }

    viewStartTime.current = null;
  }, [venueId, venueName, venueCategory, cardPosition]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      // If element unmounts while visible, flush first
      if (!node && nodeRef.current) {
        flushView();
        observerRef.current?.disconnect();
        observerRef.current = null;
        nodeRef.current = null;
        return;
      }

      if (!node) return;

      nodeRef.current = node;
      hasLogged.current = false;
      viewStartTime.current = null;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const now = Date.now();

            if (entry.isIntersecting) {
              if (!viewStartTime.current) {
                viewStartTime.current = now;
              }
            } else {
              flushView();
            }
          });
        },
        {
          threshold: 0.5,
        }
      );

      observerRef.current.observe(node);
    },
    [flushView]
  );

  useEffect(() => {
    return () => {
      flushView();
      observerRef.current?.disconnect();
    };
  }, [flushView]);

  return setRef;
}
