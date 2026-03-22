import { useEffect, useRef } from "react";
import { trackOnboardingAbandoned } from "@/lib/analytics";
import type { StepName } from "@/lib/events";

/**
 * Fires onboarding_abandoned if the user closes/backgrounds the app
 * without completing the step. Call markCompleted() when navigating forward.
 */
export function useOnboardingAbandoned(step: number, stepName: StepName) {
  const completedRef = useRef(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !completedRef.current) {
        trackOnboardingAbandoned(step, stepName, Math.round((Date.now() - startTime.current) / 1000));
      }
    };
    const onUnload = () => {
      if (!completedRef.current) {
        trackOnboardingAbandoned(step, stepName, Math.round((Date.now() - startTime.current) / 1000));
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return () => { completedRef.current = true; };
}
