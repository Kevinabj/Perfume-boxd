// ---------------------------------------------------------------------------
// Fragrance data model — supports Kaggle dataset fields + future enrichment
// ---------------------------------------------------------------------------

export interface Accord {
  name: string;
  score: number;
  color?: string;
}

export interface SeasonPerformance {
  spring: number;
  summer: number;
  fall: number;
  winter: number;
  day?: number;
  night?: number;
}

export interface Pricing {
  average_price?: number;
  currency?: string;
  price_value_score?: number;            // 1-5 weighted avg from community votes
  price_value_votes?: Record<string, number>; // e.g. { "way overpriced": 500, "ok": 2000, "great value": 300 }
  sellers?: { name: string; price: number; url?: string }[];
  price_history?: { date: string; price: number }[];
}

export interface CommunityOpinion {
  text: string;
  type: "pro" | "con";
  thumbsUp: number;
  thumbsDown: number;
}

/**
 * Canonical fragrance model.
 *
 * Fields marked "Kaggle" are populated from the initial dataset.
 * Fields marked "Enrichment" are placeholders for future scraping/enrichment.
 */
export interface Fragrance {
  // --- Identity (Kaggle) ---
  id: string;                          // Stable ID derived from Fragrantica URL
  name: string;                        // Fragrance name
  brand: string;                       // Designer / house
  slug: string;                        // URL-safe slug for matching

  // --- Classification (Kaggle) ---
  year?: number;                       // Launch year (parsed from description)
  gender?: string;                     // "men" | "women" | "unisex"
  fragrance_family?: string;           // e.g. "Amber Fougere" (parsed from description)
  concentration?: string;              // Enrichment: "EDP" | "EDT" | "Parfum" etc.

  // --- Content (Kaggle) ---
  description: string;                 // Full description text
  fragrantica_url?: string;            // Source URL

  // --- Ratings (Kaggle partial + Enrichment) ---
  fragrantica_rating: number;          // 0-5 scale (from Kaggle); defaults to 0
  fragrantica_votes: number;           // Enrichment: vote count; defaults to 0
  perfumisto_rating: number;           // Enrichment: platform rating; defaults to 0
  perfumisto_votes: number;            // Enrichment: platform vote count; defaults to 0

  // --- Accords (Kaggle — derived from fragrance_family) ---
  main_accords: Accord[];

  // --- Notes (Kaggle — parsed from description) ---
  top_notes: string[];
  heart_notes: string[];
  base_notes: string[];

  // --- Performance (Enrichment) ---
  longevity: number;                   // 0-100; defaults to 0
  sillage: number;                     // 0-100; defaults to 0
  longevity_votes?: Record<string, number>;  // e.g. { "very weak": 517, "weak": 917, "moderate": 6400, "long lasting": 10000, "eternal": 1800 }
  sillage_votes?: Record<string, number>;    // e.g. { "intimate": 200, "moderate": 1500, "strong": 5000, "enormous": 800 }
  season_performance?: SeasonPerformance;
  season_tags?: string[];

  // --- Demographics (Enrichment) ---
  gender_votes?: Record<string, number>;  // e.g. { female: 200, "more female": 500, unisex: 1200, ... }

  // --- Media (Enrichment) ---
  image_url?: string;
  brand_logo_url?: string;

  // --- Community (Kaggle partial + Enrichment) ---
  review_count?: number;               // From Kaggle (counted from reviews array)
  similar_scents?: string[];           // Enrichment: array of fragrance IDs

  // --- Pricing (Enrichment) ---
  pricing?: Pricing;

  // --- Community opinions (Enrichment) ---
  community_opinions?: CommunityOpinion[];
}

// ---------------------------------------------------------------------------
// User & social models (unchanged — not affected by data import)
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface UserCollectionItem {
  user_id: string;
  fragrance_id: string;
  status: "owned" | "wishlist";
  personal_rating?: number;
  wearing_seasons?: string[];
  notes?: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  fragrance_id: string;
  rating: number;
  text: string;
  tags?: string[];
  helpful_count: number;
  created_at: string;
}

export interface Friendship {
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "rejected";
}

export interface SimilarityVote {
  user_id: string;
  fragrance_a_id: string;
  fragrance_b_id: string;
  vote: "approve" | "disapprove";
}

export interface ActivityItem {
  id: string;
  user_id: string;
  type: "rated" | "added" | "reviewed" | "wishlist" | "similarity_vote";
  fragrance_id: string;
  extra?: string;
  created_at: string;
}
