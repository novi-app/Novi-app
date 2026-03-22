import { getAnalytics, logEvent, isSupported } from "firebase/analytics";
import mixpanel from "mixpanel-browser";
import type { StepName, EventName, EventProperties, BaseEventProperties, FreezeRuleType, InterventionLevel } from "./events";


let firebaseAnalytics: ReturnType<typeof getAnalytics> | null = null;
let mixpanelInitialized = false;
let sessionId: string | null = null;


async function initFirebase() {
  if (typeof window === "undefined") return null;
  
  const supported = await isSupported();
  if (!supported) return null;
  
  if (!firebaseAnalytics) {
    const { getAnalytics } = await import("firebase/analytics");
    const app = await import("./firebase").then(m => m.default);
    firebaseAnalytics = getAnalytics(app);
  }
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  
  return firebaseAnalytics;
}

function initMixpanel() {
  if (mixpanelInitialized) return;
  if (typeof window === "undefined") return;
  
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    console.warn("Mixpanel token not found, skipping Mixpanel initialization");
    return;
  }
  
  try {
    mixpanel.init(token, {
      track_pageview: false,
      persistence: "localStorage",
      ignore_dnt: false,
    });
    mixpanelInitialized = true;
    console.log("Mixpanel initialized");
  } catch (error) {
    console.error("Failed to initialize Mixpanel:", error);
  }
}

const sessionStartedAt = typeof window !== "undefined" ? Date.now() : 0;

async function initAnalytics() {
  await initFirebase();
  initMixpanel();

  const isReturning = !!localStorage.getItem("novi_user_id");
  trackEvent("session_started", {
    entry_page: window.location.pathname,
    is_returning_user: isReturning,
  });

  window.addEventListener("beforeunload", () => {
    trackEvent("session_ended", {
      session_duration_seconds: Math.round((Date.now() - sessionStartedAt) / 1000),
      exit_page: window.location.pathname,
    });
  }, { once: true });
}

if (typeof window !== "undefined") {
  initAnalytics();
}

function getBaseProperties(): Omit<BaseEventProperties, "session_id" | "timestamp"> {
  const userId = typeof window !== "undefined" 
    ? localStorage.getItem("novi_user_id") 
    : null;
  
  return {
    user_id: userId || undefined,
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    page_title: typeof window !== "undefined" ? document.title : "",
    device_type: getDeviceType(),
    browser: getBrowser(),
  };
}

export function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edge")) return "Edge";
  return "Other";
}

export async function trackEvent<T extends EventName>(
  eventName: T,
  properties?: Omit<EventProperties<T>, keyof BaseEventProperties>
) {
  try {
    const fullProperties = {
      ...getBaseProperties(),
      session_id: sessionId,
      timestamp: Date.now(),
      ...properties,
    };
    
    if (firebaseAnalytics || (await initFirebase())) {
      logEvent(firebaseAnalytics!, eventName, fullProperties);
    }
    
    if (mixpanelInitialized) {
      mixpanel.track(eventName, fullProperties);
    }
    
    console.log(`Event tracked: ${eventName}`, fullProperties);
    
  } catch (error) {
    console.error("Failed to track event:", error);
  }
}

export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (!mixpanelInitialized) return;
  
  try {
    mixpanel.identify(userId);
    
    if (properties) {
      mixpanel.people.set({
        ...properties,
        $name: properties.username || properties.name,
        last_seen: new Date().toISOString(),
      });
    }
    
  } catch (error) {
    console.error("Failed to identify user:", error);
  }
}

export const trackOnboardingStarted = () => 
  trackEvent("onboarding_started");

export const trackOnboardingStepCompleted = (
  stepNumber: number,
  stepName: StepName,
  selections: string | string[] | number,
  timeOnStepSeconds: number
) => 
  trackEvent("onboarding_step_completed", {
    step_number: stepNumber,
    step_name: stepName,
    selections,
    time_on_step_seconds: timeOnStepSeconds,
  });

export const trackOnboardingCompleted = (
  totalTimeSeconds: number,
  username: string,
  dietarySelections: string[],
  budgetLevel: number,
  activitySelections: string[]
) => 
  trackEvent("onboarding_completed", {
    username,
    total_time_seconds: totalTimeSeconds,
    dietary_selections: dietarySelections,
    budget_level: budgetLevel,
    activity_selections: activitySelections,
  });

export const trackOnboardingAbandoned = (
  stepAbandoned: number,
  stepName: StepName,
  timeBeforeAbandonSeconds: number
) =>
  trackEvent("onboarding_abandoned", {
    step_abandoned: stepAbandoned,
    step_name: stepName,
    time_before_abandon_seconds: timeBeforeAbandonSeconds,
  });

export const trackRecommendationsViewed = (
  count: number,
  activityFilter: string,
  userLocation: { latitude: number; longitude: number }
) => 
  trackEvent("recommendations_viewed", {
    recommendation_count: count,
    activity_filter: activityFilter,
    user_location: userLocation,
  });

export const trackRecommendationCardClicked = (
  venueId: string,
  venueName: string,
  venueCategory: string,
  cardPosition: number,
  combinedScore: number,
  distanceKm: number
) => 
  trackEvent("recommendation_card_clicked", {
    venue_id: venueId,
    venue_name: venueName,
    venue_category: venueCategory,
    card_position: cardPosition,
    combined_score: combinedScore,
    distance_km: distanceKm,
  });

export const trackFreezeDetected = (
  ruleType: string,
  level: "GENTLE" | "MODERATE" | "URGENT",
  triggerContext: any
) => 
  trackEvent("freeze_detected", {
    rule_type: ruleType as any,
    level,
    trigger_context: triggerContext,
  });

export const trackInterventionShown = (
  interventionType: InterventionLevel,
  triggerRule: FreezeRuleType,
  recommendedVenueId: string,
  recommendedVenueName: string,
  timeUntilShownSeconds: number
) => 
  trackEvent("intervention_shown", {
    intervention_type: interventionType,
    trigger_rule: triggerRule,
    recommended_venue_id: recommendedVenueId,
    recommended_venue_name: recommendedVenueName,
    time_until_shown_seconds: timeUntilShownSeconds,
  });

export const trackInterventionResponse = (
  interventionType: InterventionLevel,
  response: "dismissed" | "accepted",
  timeToRespondSeconds: number,
  dismissalCount: number
) => 
  trackEvent(
    response === "dismissed" ? "intervention_dismissed" : "intervention_accepted",
    {
      intervention_type: interventionType,
      response,
      time_to_respond_seconds: timeToRespondSeconds,
      dismissal_count: dismissalCount,
    }
  );

export const trackDirectionsClicked = (
  venueId: string,
  venueName: string,
  venueCategory: string,
  distanceKm: number
) => 
  trackEvent("directions_clicked", {
    venue_id: venueId,
    venue_name: venueName,
    venue_category: venueCategory,
    distance_km: distanceKm,
  });
  
export const trackRecommendationDetailsViewed = (
  venueId: string,
  venueName: string,
  venueCategory: string,
  cardPosition: number,
  combinedScore: number,
  distanceKm: number
) => 
  trackEvent("recommendation_details_viewed", {
    venue_id: venueId,
    venue_name: venueName,
    venue_category: venueCategory,
    card_position: cardPosition,
    combined_score: combinedScore,
    distance_km: distanceKm,
  });

export const trackVenueSaved = (
  venueId: string,
  venueName: string,
  venueCategory: string,
  action: "saved" | "unsaved",
  source: "home" | "recommendations" | "saved"
) =>
  (trackEvent as (name: string, props: Record<string, unknown>) => void)("venue_save_toggled", {
    venue_id: venueId,
    venue_name: venueName,
    venue_category: venueCategory,
    action,
    source,
  });

export const trackRouteCheck = (
  venueId: string,
  venueName: string,
  checkCount: number,
  timeSinceLastCheck?: number
) => 
  trackEvent("route_check", {
    venue_id: venueId,
    venue_name: venueName,
    check_count: checkCount,
    time_since_last_check_seconds: timeSinceLastCheck,
  });
