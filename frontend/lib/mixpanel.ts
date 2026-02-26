import mixpanel, { type Dict } from "mixpanel-browser";

let _initialized = false;

export function initMixpanel(): void {
    if (_initialized) return;
    if (typeof window === "undefined") return;

    const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (!token) return;

    mixpanel.init(token, {
        track_pageview: false,
        persistence: "localStorage",
    });

    _initialized = true;
}

function safeTrack(eventName: string, props?: Dict): void {
    try {
        initMixpanel();
        if (!_initialized) return;

        mixpanel.track(eventName, props);
    } catch (err) {
        console.warn(`[mixpanel] failed to track '${eventName}'`, err);
    }
}


export function trackEvent(eventName: string, props?: Dict): void {
    safeTrack(eventName, props);
}

export function trackOnboardingStart(props?: Dict): void {
    safeTrack("onboarding_start", props);
}

export function trackOnboardingComplete(props?: Dict): void {
    safeTrack("onboarding_complete", props);
}

export function trackRecommendationsRequested(props?: Dict): void {
    safeTrack("recommendations_requested", props);
}

export function trackRecommendationViewed(props?: Dict): void {
    safeTrack("recommendation_viewed", props);
}

export function trackInterventionShown(props?: Dict): void {
    safeTrack("intervention_shown", props);
}

export function trackInterventionEngaged(props?: Dict): void {
    safeTrack("intervention_engaged", props);
}