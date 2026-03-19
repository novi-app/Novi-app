export interface Venue {
  venue_id: string;
  name: string;
  activity: "food" | "social" | "explore";
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  distance_km: number;
  rating: number;
  reviews_count: number;
  price_level: number;
  website?: string;
  phone?: string;
  opening_hours?: any;
  photo?: string;
  tags: string[];
  pro_tip?: string;
  solo_score: number;
  solo_reason?: string;
  similarity_score: number;
  combined_score: number;
}

export interface TrendingVenue {
  venue_id: string;
  name: string;
  activity: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  rating: number;
  reviews_count: number;
  price_level: number;
  photo?: string;
  tags: string[];
}

export interface UserPreferences {
  dietary: string[];
  budget: number;
  activity_preference: string[];
  excluded_categories?: string[];
}

export interface UserProfile {
  user_id: string;
  username: string;
  preferences: UserPreferences;
  saved_venues: string[];
  created_at: string;
}

export interface SessionPreferences {
  activity?: string;
  vibe?: string[];
  mood?: string;
}
