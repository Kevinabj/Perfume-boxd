/**
 * Mock data for social/user features.
 *
 * Fragrance data has been moved to @/lib/catalog (real Kaggle dataset).
 * This file retains mock user profiles, reviews, collection items,
 * activities, and friendships until a real backend replaces them.
 */

import type { User, Review, UserCollectionItem, ActivityItem, Friendship, Fragrance } from "@/types";
import { fragrances, getFragranceById } from "@/lib/catalog";

// Re-export catalog accessors so existing imports still work
export { fragrances as mockFragrances, getFragranceById } from "@/lib/catalog";
export { getSimilarFragrances } from "@/lib/catalog";

// ---------------------------------------------------------------------------
// Users (mock — will be replaced by auth/backend later)
// ---------------------------------------------------------------------------

export const mockUsers: User[] = [
  { id: "u1", username: "scentlover", name: "Alex Rivera", avatar: "", bio: "Fragrance enthusiast. 200+ bottles and counting." },
  { id: "u2", username: "kevin_scents", name: "Kevin Cho", avatar: "", bio: "Minimalist collector. Quality over quantity." },
  { id: "u3", username: "sara_perfume", name: "Sara Mitchell", avatar: "", bio: "Seasonal scent curator." },
  { id: "u4", username: "omar_oud", name: "Omar Hassan", avatar: "", bio: "Oud and oriental specialist." },
  { id: "u5", username: "niche_nina", name: "Nina Rossi", avatar: "", bio: "Niche perfume explorer." },
];

export const currentUser = mockUsers[0];

// ---------------------------------------------------------------------------
// Reviews (mock — linked to real fragrance IDs from the catalog)
// ---------------------------------------------------------------------------

// Pick some real fragrance IDs from the catalog for mock reviews
const sampleIds = fragrances.slice(0, 8).map((f) => f.id);

export const mockReviews: Review[] = [
  { id: "r1", user_id: "u2", fragrance_id: sampleIds[0] || "frag-0", rating: 4.5, text: "An absolute beast of a fragrance. Gets compliments every single time I wear it.", tags: ["office", "date night", "versatile"], helpful_count: 42, created_at: "2025-12-15" },
  { id: "r2", user_id: "u3", fragrance_id: sampleIds[0] || "frag-0", rating: 3.5, text: "Good but overhyped. Smells nice but everyone wears it. Looking for something more unique.", tags: ["casual"], helpful_count: 18, created_at: "2025-11-20" },
  { id: "r3", user_id: "u4", fragrance_id: sampleIds[1] || "frag-0", rating: 5.0, text: "The king of fragrances. Nothing comes close. Truly iconic.", tags: ["power", "signature", "special occasion"], helpful_count: 87, created_at: "2025-10-10" },
  { id: "r4", user_id: "u5", fragrance_id: sampleIds[2] || "frag-0", rating: 4.8, text: "This is perfumery as art. Lasts forever and gets better over time.", tags: ["luxury", "evening", "special occasion"], helpful_count: 65, created_at: "2026-01-05" },
  { id: "r5", user_id: "u2", fragrance_id: sampleIds[4] || "frag-0", rating: 4.0, text: "Dark, mysterious, powerful. Not for the faint of heart. Perfect for cold winter evenings.", tags: ["evening", "bold", "winter"], helpful_count: 31, created_at: "2026-02-14" },
  { id: "r6", user_id: "u1", fragrance_id: sampleIds[6] || "frag-0", rating: 4.7, text: "Sophisticated and refined. Perfect blend of east meets west.", tags: ["luxury", "evening"], helpful_count: 28, created_at: "2026-01-20" },
];

// ---------------------------------------------------------------------------
// Collection (mock — uses real fragrance IDs)
// ---------------------------------------------------------------------------

export const mockCollection: UserCollectionItem[] = [
  { user_id: "u1", fragrance_id: sampleIds[0] || "frag-0", status: "owned", personal_rating: 4.5, wearing_seasons: ["Fall", "Winter"], created_at: "2025-06-01" },
  { user_id: "u1", fragrance_id: sampleIds[1] || "frag-0", status: "owned", personal_rating: 5.0, wearing_seasons: ["Spring", "Fall"], created_at: "2025-03-15" },
  { user_id: "u1", fragrance_id: sampleIds[2] || "frag-0", status: "owned", personal_rating: 4.8, wearing_seasons: ["Fall", "Winter"], created_at: "2025-09-20" },
  { user_id: "u1", fragrance_id: sampleIds[6] || "frag-0", status: "owned", personal_rating: 4.7, wearing_seasons: ["Winter"], created_at: "2026-01-10" },
  { user_id: "u1", fragrance_id: sampleIds[3] || "frag-0", status: "wishlist", created_at: "2025-11-01" },
  { user_id: "u1", fragrance_id: sampleIds[4] || "frag-0", status: "wishlist", created_at: "2025-12-05" },
];

// ---------------------------------------------------------------------------
// Activity feed (mock)
// ---------------------------------------------------------------------------

export const mockActivities: ActivityItem[] = [
  { id: "a1", user_id: "u2", type: "rated", fragrance_id: sampleIds[0] || "frag-0", extra: "4.5", created_at: "2026-03-01T10:30:00Z" },
  { id: "a2", user_id: "u3", type: "wishlist", fragrance_id: sampleIds[2] || "frag-0", created_at: "2026-03-01T09:15:00Z" },
  { id: "a3", user_id: "u4", type: "similarity_vote", fragrance_id: sampleIds[0] || "frag-0", extra: sampleIds[1] || "frag-0", created_at: "2026-02-28T18:00:00Z" },
  { id: "a4", user_id: "u5", type: "added", fragrance_id: sampleIds[7] || "frag-0", created_at: "2026-02-28T14:00:00Z" },
  { id: "a5", user_id: "u2", type: "reviewed", fragrance_id: sampleIds[4] || "frag-0", created_at: "2026-02-27T20:00:00Z" },
  { id: "a6", user_id: "u3", type: "rated", fragrance_id: sampleIds[6] || "frag-0", extra: "4.2", created_at: "2026-02-27T16:30:00Z" },
];

// ---------------------------------------------------------------------------
// Friendships (mock)
// ---------------------------------------------------------------------------

export const mockFriendships: Friendship[] = [
  { requester_id: "u1", addressee_id: "u2", status: "accepted" },
  { requester_id: "u1", addressee_id: "u3", status: "accepted" },
  { requester_id: "u4", addressee_id: "u1", status: "pending" },
  { requester_id: "u1", addressee_id: "u5", status: "accepted" },
];

// ---------------------------------------------------------------------------
// Helpers (backward-compatible with old consumers)
// ---------------------------------------------------------------------------

export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

export function getReviewsForFragrance(fragranceId: string): (Review & { user: User })[] {
  return mockReviews
    .filter((r) => r.fragrance_id === fragranceId)
    .map((r) => ({ ...r, user: getUserById(r.user_id)! }));
}
