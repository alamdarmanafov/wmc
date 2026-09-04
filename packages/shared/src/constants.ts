/** Interests users can select during onboarding. `slug` is stored in DB. */
export const INTERESTS = [
  { slug: 'football', name: 'Football', emoji: '⚽' },
  { slug: 'fitness', name: 'Fitness', emoji: '🏋️' },
  { slug: 'running', name: 'Running', emoji: '🏃' },
  { slug: 'travel', name: 'Travel', emoji: '✈️' },
  { slug: 'business', name: 'Business', emoji: '💼' },
  { slug: 'technology', name: 'Technology', emoji: '💻' },
  { slug: 'books', name: 'Books', emoji: '📚' },
  { slug: 'gaming', name: 'Gaming', emoji: '🎮' },
  { slug: 'food', name: 'Food', emoji: '🍽️' },
  { slug: 'photography', name: 'Photography', emoji: '📷' },
  { slug: 'volunteering', name: 'Volunteering', emoji: '🤝' },
  { slug: 'quran', name: 'Quran / Islamic studies', emoji: '📖' },
  { slug: 'family', name: 'Family', emoji: '👨‍👩‍👧' },
  { slug: 'coffee', name: 'Coffee', emoji: '☕' },
  { slug: 'hiking', name: 'Hiking', emoji: '🥾' },
  { slug: 'art', name: 'Art & Design', emoji: '🎨' },
  { slug: 'languages', name: 'Languages', emoji: '🗣️' },
  { slug: 'entrepreneurship', name: 'Entrepreneurship', emoji: '🚀' },
] as const;
export type InterestSlug = (typeof INTERESTS)[number]['slug'];

/** What a user is looking for. Stored as text[] on profiles.looking_for */
export const LOOKING_FOR = [
  { slug: 'friends', name: 'New friends', emoji: '👋' },
  { slug: 'activities', name: 'Activities', emoji: '⚽' },
  { slug: 'networking', name: 'Networking', emoji: '💼' },
  { slug: 'study', name: 'Study groups', emoji: '📚' },
  { slug: 'community', name: 'Local community', emoji: '🌍' },
] as const;
export type LookingForSlug = (typeof LOOKING_FOR)[number]['slug'];

/** Quick actions on Home — "What do you want to do?" (activity-first positioning) */
export const QUICK_ACTIVITIES = [
  { slug: 'football', label: 'Play football', emoji: '⚽', category: 'sports' },
  { slug: 'coffee', label: 'Grab coffee', emoji: '☕', category: 'social' },
  { slug: 'running', label: 'Go running', emoji: '🏃', category: 'fitness' },
  { slug: 'network', label: 'Network', emoji: '💼', category: 'business' },
  { slug: 'study', label: 'Study', emoji: '📖', category: 'islamic_studies' },
  { slug: 'explore', label: 'Explore the city', emoji: '🌆', category: 'social' },
  { slug: 'volunteer', label: 'Volunteer', emoji: '🤝', category: 'volunteering' },
] as const;

export const COMMUNITY_CATEGORIES = [
  { slug: 'sports', name: 'Sports', emoji: '⚽' },
  { slug: 'business', name: 'Business', emoji: '💼' },
  { slug: 'students', name: 'Students', emoji: '🎓' },
  { slug: 'women', name: 'Women', emoji: '🧕' },
  { slug: 'families', name: 'Families', emoji: '👨‍👩‍👧' },
  { slug: 'islamic_studies', name: 'Islamic Studies', emoji: '📖' },
  { slug: 'volunteering', name: 'Volunteering', emoji: '🤝' },
  { slug: 'gaming', name: 'Gaming', emoji: '🎮' },
  { slug: 'fitness', name: 'Fitness', emoji: '🏃' },
  { slug: 'travel', name: 'Travel', emoji: '✈️' },
  { slug: 'food', name: 'Food', emoji: '🍽️' },
  { slug: 'social', name: 'Social', emoji: '☕' },
  { slug: 'general', name: 'General', emoji: '🌍' },
  { slug: 'other', name: 'Other', emoji: '✨' },
] as const;
export type CategorySlug = (typeof COMMUNITY_CATEGORIES)[number]['slug'];

export const REPORT_REASONS = [
  { slug: 'harassment', name: 'Harassment' },
  { slug: 'spam', name: 'Spam' },
  { slug: 'fake_profile', name: 'Fake profile' },
  { slug: 'inappropriate_content', name: 'Inappropriate content' },
  { slug: 'hate_speech', name: 'Hate speech' },
  { slug: 'other', name: 'Other' },
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number]['slug'];

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ur', name: 'Urdu' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'ru', name: 'Russian' },
  { code: 'fa', name: 'Persian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'es', name: 'Spanish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'so', name: 'Somali' },
  { code: 'sw', name: 'Swahili' },
] as const;

/** Launch cities in order of rollout */
export const LAUNCH_CITIES = [
  { slug: 'london', name: 'London', country: 'GB', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  { slug: 'berlin', name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.405, tz: 'Europe/Berlin' },
  { slug: 'dubai', name: 'Dubai', country: 'AE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  { slug: 'toronto', name: 'Toronto', country: 'CA', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' },
  { slug: 'new-york', name: 'New York', country: 'US', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  { slug: 'paris', name: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  { slug: 'amsterdam', name: 'Amsterdam', country: 'NL', lat: 52.3676, lng: 4.9041, tz: 'Europe/Amsterdam' },
  { slug: 'istanbul', name: 'Istanbul', country: 'TR', lat: 41.0082, lng: 28.9784, tz: 'Europe/Istanbul' },
  { slug: 'baku', name: 'Baku', country: 'AZ', lat: 40.4093, lng: 49.8671, tz: 'Asia/Baku' },
] as const;

/**
 * Matching weights — simple, explainable scoring. No AI in MVP.
 * Mirrors `public.discover_people()` in supabase/migrations.
 */
export const MATCH_WEIGHTS = {
  sameCity: 30,
  perSharedInterest: 10,
  maxInterestPoints: 40,
  sharedLanguage: 15,
  sharedGoal: 20,
  similarAge: 10, // within 5 years
  maxScore: 115,
} as const;

/** Distance is never exact. Buckets shown to other users. */
export const DISTANCE_BUCKETS = [
  { maxKm: 1, label: 'Near you' },
  { maxKm: 3, label: '~2 km away' },
  { maxKm: 6, label: '~5 km away' },
  { maxKm: 15, label: '~10 km away' },
  { maxKm: Infinity, label: 'In your city' },
] as const;

export const LIMITS = {
  bioMaxLength: 200,
  minAge: 16,
  maxAge: 99,
  maxInterests: 8,
  minInterests: 3,
  activityTextMax: 140,
  eventTitleMax: 80,
  messageMax: 2000,
  pendingConnectionRequestsPerDay: 20,
} as const;
