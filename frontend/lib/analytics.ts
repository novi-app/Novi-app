import { logEvent, isSupported } from "firebase/analytics";
import { analytics } from "@/lib/firebase";


async function safeLogEvent(
    eventName: string,
    params?: Record<string, unknown>,
): Promise<void> {
    if (typeof window === "undefined") return;

    try {
        const supported = await isSupported().catch(() => false);
        if (!supported) return;
        if (!analytics) return;

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