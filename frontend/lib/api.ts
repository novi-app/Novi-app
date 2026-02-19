const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Define proper types
interface UserPreferences {
  dietary: string[];
  budget: string;
  vibes: string[];
  travelStyle: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface AnalyticsEvent {
  session_id: string;
  timestamp: number;
  event_type: string;
  [key: string]: unknown; // Allow additional properties
}

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // User endpoints
  onboardUser: (preferences: UserPreferences) =>
    apiRequest('/api/user/onboard', {
      method: 'POST',
      body: JSON.stringify({ preferences }),
    }),

  // Recommendation endpoints
  getRecommendations: (userId: string, location: Location, intent: string) =>
    apiRequest('/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, location, intent }),
    }),

  // Analytics endpoints
  logEvent: (events: AnalyticsEvent[]) =>
    apiRequest('/api/analytics/event', {
      method: 'POST',
      body: JSON.stringify({ events }),
    }),
};
