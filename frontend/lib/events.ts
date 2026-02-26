/**
 * Behavioral Event Schema for Novi Analytics
 * 
 * Two-tier system:
 * 1. Firebase Analytics: Standard product metrics
 * 2. Firestore Events: Detailed behavioral data for ML training
 */

export type EventName =
  | "onboarding_started"
  | "onboarding_step_completed"
  | "onboarding_completed"
  | "onboarding_abandoned"
  
  | "recommendations_viewed"
  | "recommendation_card_clicked"
  | "recommendation_details_viewed"
  | "filter_changed"
  | "refresh_clicked"
  
  | "freeze_detected"
  | "intervention_shown"
  | "intervention_dismissed"
  | "intervention_accepted"
  
  | "directions_clicked"
  | "external_link_opened"

  | "venue_view"
  | "route_check"
  | "scroll_event"
  | "dwell_time_recorded"
  | "back_button_pressed";

export type FreezeRuleType =
  | "exploration_stall"
  | "scroll_indecision"
  | "filter_cycling"
  | "card_reclicking"
  | "full_inactivity";

export type InterventionLevel = "GENTLE" | "MODERATE" | "URGENT";

export interface BaseEventProperties {
  session_id: string;
  user_id?: string;
  timestamp: number;
  page_path: string;
  page_title: string;
  device_type: "mobile" | "tablet" | "desktop";
  browser: string;
}

export interface OnboardingStepCompletedProperties extends BaseEventProperties {
  step_number: number;
  step_name: "dietary" | "budget" | "activity";
  selections: string[] | number; // Dietary/activity = array, budget = number
  time_on_step_seconds: number;
}

export interface OnboardingCompletedProperties extends BaseEventProperties {
  total_time_seconds: number;
  dietary_selections: string[];
  budget_level: number;
  activity_selections: string[];
}

export interface OnboardingAbandonedProperties extends BaseEventProperties {
  step_abandoned: number;
  step_name: "dietary" | "budget" | "activity";
  time_before_abandon_seconds: number;
}

export interface RecommendationsViewedProperties extends BaseEventProperties {
  recommendation_count: number;
  intent_filter: string;
  user_location: { lat: number; lng: number };
}

export interface RecommendationCardClickedProperties extends BaseEventProperties {
  venue_id: string;
  venue_name: string;
  venue_category: string;
  card_position: number;
  combined_score: number;
  distance_km: number;
}

export interface FilterChangedProperties extends BaseEventProperties {
  previous_filter: string;
  new_filter: string;
  change_count: number;
}

export interface FreezeDetectedProperties extends BaseEventProperties {
  rule_type: FreezeRuleType;
  level: InterventionLevel;
  trigger_context: {
    cards_viewed?: number;
    scroll_cycles?: number;
    filter_changes?: string[];
    clicked_venue_id?: string;
    time_on_screen_seconds: number;
  };
}

export interface InterventionShownProperties extends BaseEventProperties {
  intervention_type: InterventionLevel;
  trigger_rule: FreezeRuleType;
  recommended_venue_id: string;
  recommended_venue_name: string;
  time_until_shown_seconds: number;
}

export interface InterventionResponseProperties extends BaseEventProperties {
  intervention_type: InterventionLevel;
  response: "dismissed" | "accepted";
  time_to_respond_seconds: number;
  dismissal_count: number;
}

export interface DirectionsClickedProperties extends BaseEventProperties {
  venue_id: string;
  venue_name: string;
  venue_category: string;
  distance_km: number;
}

export interface RouteCheckProperties extends BaseEventProperties {
  venue_id: string;
  venue_name: string;
  check_count: number;
  time_since_last_check_seconds?: number;
}

export interface VenueViewProperties extends BaseEventProperties {
  venue_id: string;
  venue_name: string;
  venue_category: string;
  card_position: number;
  time_in_viewport_ms: number;
  scroll_position: number;
}

export interface ScrollEventProperties extends BaseEventProperties {
  scroll_direction: "up" | "down";
  scroll_distance_px: number;
  scroll_velocity_px_per_sec: number;
  current_scroll_position: number;
  total_page_height: number;
}

export interface DwellTimeProperties extends BaseEventProperties {
  page_path: string;
  total_time_seconds: number;
  active_time_seconds: number;
  idle_time_seconds: number;
}

export interface BackButtonProperties extends BaseEventProperties {
  from_page: string;
  to_page: string;
  time_on_page_seconds: number;
}

export type EventProperties<T extends EventName> = 
  T extends "onboarding_started" ? BaseEventProperties :
  T extends "onboarding_step_completed" ? OnboardingStepCompletedProperties :
  T extends "onboarding_completed" ? OnboardingCompletedProperties :
  T extends "onboarding_abandoned" ? OnboardingAbandonedProperties :
  T extends "recommendations_viewed" ? RecommendationsViewedProperties :
  T extends "recommendation_card_clicked" ? RecommendationCardClickedProperties :
  T extends "recommendation_details_viewed" ? RecommendationCardClickedProperties :
  T extends "filter_changed" ? FilterChangedProperties :
  T extends "refresh_clicked" ? BaseEventProperties :
  T extends "freeze_detected" ? FreezeDetectedProperties :
  T extends "intervention_shown" ? InterventionShownProperties :
  T extends "intervention_dismissed" ? InterventionResponseProperties :
  T extends "intervention_accepted" ? InterventionResponseProperties :
  T extends "directions_clicked" ? DirectionsClickedProperties :
  T extends "route_check" ? RouteCheckProperties :
  T extends "external_link_opened" ? BaseEventProperties :
  T extends "venue_view" ? VenueViewProperties :
  T extends "scroll_event" ? ScrollEventProperties :
  T extends "dwell_time_recorded" ? DwellTimeProperties :
  T extends "back_button_pressed" ? BackButtonProperties :
  BaseEventProperties;


/**
 * Extract only behavioral event names (for Firestore batching)
 */
export type BehavioralEventName = Extract <EventName, "venue_view" | "scroll_event" | "dwell_time_recorded" | "back_button_pressed" | "route_check">;

/**
 * Extract only Firebase Analytics event names
 */
export type AnalyticsEventName = Exclude<EventName, BehavioralEventName>;
