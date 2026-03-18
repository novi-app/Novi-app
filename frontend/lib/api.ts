import type { Venue, TrendingVenue, UserProfile, UserPreferences, SessionPreferences } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "APIError";
  }
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new APIError(response.status, error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof APIError) throw error;
    throw new Error("Network error. Please check your connection.");
  }
}

export async function getRecommendations(
  userId: string,
  location: { latitude: number; longitude: number },
  activity: string = "any",
  sessionPreferences?: SessionPreferences
): Promise<{ recommendations: Venue[]; count: number }> {
  return fetchAPI("/api/recommendations", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      location,
      activity,
      session_preferences: sessionPreferences,
    }),
  });
}

export async function getTrendingVenues(): Promise<{ venues: TrendingVenue[]; count: number }> {
  return fetchAPI("/api/recommendations/trending");
}

export async function saveVenue(userId: string, venueId: string): Promise<void> {
  await fetchAPI("/api/venues/save", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, venue_id: venueId }),
  });
}

export async function unsaveVenue(userId: string, venueId: string): Promise<void> {
  await fetchAPI("/api/venues/save", {
    method: "DELETE",
    body: JSON.stringify({ user_id: userId, venue_id: venueId }),
  });
}

export async function getSavedVenues(userId: string): Promise<{ venues: Venue[]; count: number }> {
  return fetchAPI(`/api/venues/saved/${userId}`);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  return fetchAPI(`/api/user/${userId}`);
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<{ status: string; preferences: UserPreferences }> {
  return fetchAPI(`/api/user/${userId}/preferences`, {
    method: "PATCH",
    body: JSON.stringify(preferences),
  });
}
