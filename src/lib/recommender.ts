/**
 * Recommendation engine for Perfumisto.
 *
 * Scores candidate fragrances against the user's collection profile and
 * optional wizard preferences. Returns the top 20 results sorted by score.
 */

import type { Fragrance, Accord } from "@/types";

export interface FinderPreferences {
  seasons?: string[];
  wantedAccords?: string[];
  avoidAccords?: string[];
  avoidNotes?: string[];
  accordWeights?: Record<string, number>;
  minRating?: number;
  fillGaps?: boolean;
  fillSeasonalGaps?: boolean;
  similarTo?: Fragrance;
}

interface ScoredFragrance {
  fragrance: Fragrance;
  score: number;
  reasons: string[];
}

// ---------------------------------------------------------------------------
// Profile building — summarise user's collection into accord/season profiles
// ---------------------------------------------------------------------------

interface CollectionProfile {
  /** Accumulated accord scores across collection, normalized to 0-1 */
  accordProfile: Map<string, number>;
  /** Average season coverage across collection (0-1 per season) */
  seasonCoverage: Record<string, number>;
  /** Set of brands the user already owns */
  ownedBrands: Set<string>;
  /** Accord vectors per owned fragrance (for similarity check) */
  accordVectors: Map<string, Map<string, number>>;
}

function buildProfile(collection: Fragrance[]): CollectionProfile {
  const accordTotals = new Map<string, number>();
  const seasonTotals: Record<string, number> = { spring: 0, summer: 0, fall: 0, winter: 0 };
  const ownedBrands = new Set<string>();
  const accordVectors = new Map<string, Map<string, number>>();

  for (const f of collection) {
    ownedBrands.add(f.brand);

    // Accumulate accord scores
    const vec = new Map<string, number>();
    for (const a of f.main_accords) {
      const key = a.name.toLowerCase();
      accordTotals.set(key, (accordTotals.get(key) || 0) + a.score);
      vec.set(key, a.score);
    }
    accordVectors.set(f.id, vec);

    // Accumulate season performance
    if (f.season_performance) {
      seasonTotals.spring += f.season_performance.spring;
      seasonTotals.summer += f.season_performance.summer;
      seasonTotals.fall += f.season_performance.fall;
      seasonTotals.winter += f.season_performance.winter;
    }
  }

  // Normalize accord profile
  const maxAccord = Math.max(...accordTotals.values(), 1);
  const accordProfile = new Map<string, number>();
  for (const [k, v] of accordTotals) {
    accordProfile.set(k, v / maxAccord);
  }

  // Normalize season coverage (average per fragrance, then normalize)
  const n = collection.length || 1;
  for (const s of Object.keys(seasonTotals)) {
    seasonTotals[s] /= n * 100; // season values are 0-100, normalize to 0-1
  }

  return { accordProfile, seasonCoverage: seasonTotals, ownedBrands, accordVectors };
}

// ---------------------------------------------------------------------------
// Scoring functions
// ---------------------------------------------------------------------------

/** 1. Accord affinity (0-40 pts) */
function scoreAccordAffinity(
  candidate: Fragrance,
  profile: CollectionProfile,
  prefs?: FinderPreferences,
): number {
  if (profile.accordProfile.size === 0 && !prefs?.wantedAccords?.length) return 20; // neutral

  let score = 0;
  let maxPossible = 0;

  for (const a of candidate.main_accords) {
    const key = a.name.toLowerCase();
    // Collection-based affinity
    const profileWeight = profile.accordProfile.get(key) || 0;
    // Preference-based boost
    let prefWeight = 0;
    if (prefs?.wantedAccords) {
      const wanted = prefs.wantedAccords.find((w) => w.toLowerCase() === key);
      if (wanted) {
        const w = prefs.accordWeights?.[wanted] ?? 5;
        prefWeight = w / 10; // normalize 1-10 to 0.1-1.0
      }
    }

    const weight = Math.max(profileWeight, prefWeight);
    score += weight * (a.score / 100);
    maxPossible += a.score / 100;
  }

  if (maxPossible === 0) return 0;
  return (score / maxPossible) * 40;
}

/** 2. Quality score (0-20 pts) */
function scoreQuality(candidate: Fragrance, maxQuality: number): number {
  const raw = candidate.fragrantica_rating * Math.log(candidate.fragrantica_votes + 1);
  if (maxQuality === 0) return 0;
  return (raw / maxQuality) * 20;
}

/** 3. Gap fill (0-25 pts) */
function scoreGapFill(
  candidate: Fragrance,
  profile: CollectionProfile,
  prefs?: FinderPreferences,
): number {
  let score = 0;

  // Season gap filling (0-15 pts)
  if (prefs?.fillSeasonalGaps || prefs?.seasons?.length) {
    const sp = candidate.season_performance;
    if (sp) {
      const seasonMap: Record<string, number> = {
        spring: sp.spring,
        summer: sp.summer,
        fall: sp.fall,
        winter: sp.winter,
      };

      for (const [season, candidateStrength] of Object.entries(seasonMap)) {
        const userCoverage = profile.seasonCoverage[season] || 0;
        const gap = 1 - userCoverage; // how much the user lacks in this season

        // Boost if user explicitly selected this season
        const selectedBoost =
          prefs?.seasons?.some((s) => s.toLowerCase() === season) ? 1.5 : 1;

        score += gap * (candidateStrength / 100) * selectedBoost;
      }
      // Normalize to 0-15 range (max gap=4 seasons × 1.5 boost × 1.0 strength)
      score = Math.min((score / 4) * 15, 15);
    }
  }

  // Accord gap filling (0-10 pts)
  if (prefs?.fillGaps) {
    const userAccords = profile.accordProfile;
    let accordGapScore = 0;
    for (const a of candidate.main_accords) {
      const key = a.name.toLowerCase();
      const userHas = userAccords.get(key) || 0;
      if (userHas < 0.2) {
        // User is underrepresented in this accord
        accordGapScore += (1 - userHas) * (a.score / 100);
      }
    }
    score += Math.min(accordGapScore * 10, 10);
  }

  return Math.min(score, 25);
}

/** 4. Novelty score (0-15 pts): penalize too-similar fragrances */
function scoreNovelty(
  candidate: Fragrance,
  profile: CollectionProfile,
): number {
  let penalty = 0;

  // Brand penalty: if user already owns same brand, small penalty
  if (profile.ownedBrands.has(candidate.brand)) {
    penalty += 4;
  }

  // Accord similarity penalty: cosine-like check against each owned fragrance
  const candidateVec = new Map<string, number>();
  for (const a of candidate.main_accords) {
    candidateVec.set(a.name.toLowerCase(), a.score);
  }

  let maxSimilarity = 0;
  for (const [, ownedVec] of profile.accordVectors) {
    const similarity = cosineSimilarity(candidateVec, ownedVec);
    if (similarity > maxSimilarity) maxSimilarity = similarity;
  }

  // High similarity (>0.9) gets penalized heavily
  if (maxSimilarity > 0.7) {
    penalty += (maxSimilarity - 0.7) * (11 / 0.3); // scales 0-11 for 0.7-1.0 range
  }

  return Math.max(15 - penalty, 0);
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  const allKeys = new Set([...a.keys(), ...b.keys()]);
  for (const k of allKeys) {
    const va = a.get(k) || 0;
    const vb = b.get(k) || 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Hard filters
// ---------------------------------------------------------------------------

function passesFilters(candidate: Fragrance, prefs?: FinderPreferences): boolean {
  if (prefs?.minRating && candidate.fragrantica_rating < prefs.minRating) {
    return false;
  }

  if (prefs?.avoidAccords?.length) {
    const candidateAccords = candidate.main_accords.map((a) => a.name.toLowerCase());
    if (prefs.avoidAccords.some((avoid) => candidateAccords.includes(avoid.toLowerCase()))) {
      return false;
    }
  }

  if (prefs?.avoidNotes?.length) {
    const allNotes = [
      ...candidate.top_notes,
      ...candidate.heart_notes,
      ...candidate.base_notes,
    ].map((n) => n.toLowerCase());
    if (prefs.avoidNotes.some((avoid) => allNotes.includes(avoid.toLowerCase()))) {
      return false;
    }
  }

  return true;
}

/** 5. Similarity anchor boost (0-30 pts) */
function scoreSimilarity(candidate: Fragrance, anchor: Fragrance): number {
  // Note overlap
  const anchorNotes = new Set(
    [...anchor.top_notes, ...anchor.heart_notes, ...anchor.base_notes].map((n) => n.toLowerCase()),
  );
  const candidateNotes = [...candidate.top_notes, ...candidate.heart_notes, ...candidate.base_notes];
  const sharedNotes = candidateNotes.filter((n) => anchorNotes.has(n.toLowerCase())).length;
  const noteScore = anchorNotes.size > 0 ? (sharedNotes / anchorNotes.size) * 15 : 0;

  // Accord overlap (cosine)
  const anchorVec = new Map<string, number>();
  for (const a of anchor.main_accords) anchorVec.set(a.name.toLowerCase(), a.score);
  const candidateVec = new Map<string, number>();
  for (const a of candidate.main_accords) candidateVec.set(a.name.toLowerCase(), a.score);
  const accordScore = cosineSimilarity(anchorVec, candidateVec) * 15;

  return Math.min(noteScore + accordScore, 30);
}

// ---------------------------------------------------------------------------
// Reason generation
// ---------------------------------------------------------------------------

function generateReasons(
  candidate: Fragrance,
  profile: CollectionProfile,
  prefs?: FinderPreferences,
): string[] {
  const reasons: string[] = [];

  // Accord match reason
  const matchingAccords = candidate.main_accords.filter(
    (a) => (profile.accordProfile.get(a.name.toLowerCase()) || 0) > 0.3,
  );
  if (matchingAccords.length >= 2) {
    reasons.push(`Shares ${matchingAccords.length} key accords with your collection`);
  }

  // Season gap reason
  if (candidate.season_performance) {
    const seasons = [
      { name: "Spring", val: candidate.season_performance.spring, cov: profile.seasonCoverage.spring },
      { name: "Summer", val: candidate.season_performance.summer, cov: profile.seasonCoverage.summer },
      { name: "Fall", val: candidate.season_performance.fall, cov: profile.seasonCoverage.fall },
      { name: "Winter", val: candidate.season_performance.winter, cov: profile.seasonCoverage.winter },
    ];
    const gapSeason = seasons.find((s) => (s.cov || 0) < 0.3 && s.val > 60);
    if (gapSeason) {
      reasons.push(`Fills your ${gapSeason.name} gap`);
    }
  }

  // Quality reason
  if (candidate.fragrantica_rating >= 4.0 && candidate.fragrantica_votes > 100) {
    reasons.push("Highly rated by the community");
  }

  // Novelty reason
  if (!profile.ownedBrands.has(candidate.brand)) {
    reasons.push("New brand for your collection");
  }

  // Wanted accord match
  if (prefs?.wantedAccords?.length) {
    const matching = prefs.wantedAccords.filter((w) =>
      candidate.main_accords.some((a) => a.name.toLowerCase() === w.toLowerCase()),
    );
    if (matching.length > 0) {
      reasons.push(`Matches wanted: ${matching.join(", ")}`);
    }
  }

  // Similarity anchor reason
  if (prefs?.similarTo) {
    const anchorNotes = new Set(
      [...prefs.similarTo.top_notes, ...prefs.similarTo.heart_notes, ...prefs.similarTo.base_notes].map((n) => n.toLowerCase()),
    );
    const shared = [...candidate.top_notes, ...candidate.heart_notes, ...candidate.base_notes]
      .filter((n) => anchorNotes.has(n.toLowerCase()));
    if (shared.length > 0) {
      reasons.push(`Similar to ${prefs.similarTo.name} (${shared.length} shared notes)`);
    }
  }

  return reasons.length > 0 ? reasons : ["Fits your scent profile"];
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export function getRecommendations(
  userCollection: Fragrance[],
  allFragrances: Fragrance[],
  preferences?: FinderPreferences,
): ScoredFragrance[] {
  const ownedIds = new Set(userCollection.map((f) => f.id));
  const profile = buildProfile(userCollection);

  // Pre-compute max quality for normalization
  const maxQuality = allFragrances.reduce(
    (max, f) => Math.max(max, f.fragrantica_rating * Math.log(f.fragrantica_votes + 1)),
    1,
  );

  const anchorId = preferences?.similarTo?.id;
  const candidates = allFragrances.filter(
    (f) => !ownedIds.has(f.id) && f.id !== anchorId && passesFilters(f, preferences),
  );

  const scored: ScoredFragrance[] = candidates.map((f) => {
    const accord = scoreAccordAffinity(f, profile, preferences);
    const quality = scoreQuality(f, maxQuality);
    const gap = scoreGapFill(f, profile, preferences);
    const novelty = scoreNovelty(f, profile);
    const similarity = preferences?.similarTo ? scoreSimilarity(f, preferences.similarTo) : 0;
    const total = accord + quality + gap + novelty + similarity;

    return {
      fragrance: f,
      score: total,
      reasons: generateReasons(f, profile, preferences),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}

/**
 * Fallback for users with no collection: top-rated fragrances filtered by
 * the wizard's preference selections.
 */
export function getTopRatedFiltered(
  allFragrances: Fragrance[],
  preferences?: FinderPreferences,
): ScoredFragrance[] {
  const anchorId = preferences?.similarTo?.id;
  const filtered = allFragrances.filter((f) => f.id !== anchorId && passesFilters(f, preferences));

  // Score by quality + preference match
  const maxQuality = filtered.reduce(
    (max, f) => Math.max(max, f.fragrantica_rating * Math.log(f.fragrantica_votes + 1)),
    1,
  );

  const scored: ScoredFragrance[] = filtered.map((f) => {
    let score = scoreQuality(f, maxQuality);

    // Boost for matching wanted accords
    if (preferences?.wantedAccords?.length) {
      const candidateAccords = f.main_accords.map((a) => a.name.toLowerCase());
      const matchCount = preferences.wantedAccords.filter((w) =>
        candidateAccords.includes(w.toLowerCase()),
      ).length;
      score += (matchCount / preferences.wantedAccords.length) * 40;
    }

    // Boost for matching seasons
    if (preferences?.seasons?.length && f.season_performance) {
      const seasonMap: Record<string, number> = {
        spring: f.season_performance.spring,
        summer: f.season_performance.summer,
        fall: f.season_performance.fall,
        winter: f.season_performance.winter,
      };
      let seasonScore = 0;
      for (const s of preferences.seasons) {
        seasonScore += (seasonMap[s.toLowerCase()] || 0) / 100;
      }
      score += (seasonScore / preferences.seasons.length) * 20;
    }

    // Similarity anchor boost
    if (preferences?.similarTo) {
      score += scoreSimilarity(f, preferences.similarTo);
    }

    const reasons: string[] = [];
    if (preferences?.similarTo) {
      const anchorNotes = new Set(
        [...preferences.similarTo.top_notes, ...preferences.similarTo.heart_notes, ...preferences.similarTo.base_notes].map((n) => n.toLowerCase()),
      );
      const shared = [...f.top_notes, ...f.heart_notes, ...f.base_notes]
        .filter((n) => anchorNotes.has(n.toLowerCase()));
      if (shared.length > 0) {
        reasons.push(`Similar to ${preferences.similarTo.name} (${shared.length} shared notes)`);
      }
    }
    if (f.fragrantica_rating >= 4.0) reasons.push("Top rated");
    if (preferences?.wantedAccords?.length) {
      const matching = preferences.wantedAccords.filter((w) =>
        f.main_accords.some((a) => a.name.toLowerCase() === w.toLowerCase()),
      );
      if (matching.length) reasons.push(`Matches: ${matching.join(", ")}`);
    }
    if (reasons.length === 0) reasons.push("Highly rated fragrance");

    return { fragrance: f, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 20);
}
