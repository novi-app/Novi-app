import { getAnalytics, logEvent, isSupported, Analytics } from "firebase/analytics";
import app from "@/lib/firebase";

// Initialize analytics (lazy - only in browser)
let analytics: Analytics | null = null;

if (typeof window !== "undefined") {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    })
    .catch(() => {
      console.warn("[analytics] Firebase Analytics not supported");
    });
}

async function safeLogEvent(
  eventName: string,
  params?: Record<string, unknown>
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const supported = await isSupported().catch(() => false);
    if (!supported || !analytics) return;

    logEvent(analytics, eventName, params);
  } catch (err) {
    console.warn(`[analytics] failed to log '${eventName}'`, err);
  }
}


export async function trackPageView(path: string): Promise<void> {
  await safeLogEvent("page_view", { page_path: path });
}


export async function trackOnboardingStart(): Promise<void> {
  await safeLogEvent("onboarding_start");
}


export async function trackOnboardingComplete(): Promise<void> {
  await safeLogEvent("onboarding_complete");
}

export async function trackRecommendationView(venueId: string): Promise<void> {
  await safeLogEvent("recommendation_view", { venue_id: venueId });
}

export async function trackInterventionShown(triggerType: string): Promise<void> {
  await safeLogEvent("intervention_shown", { trigger_type: triggerType });
}
