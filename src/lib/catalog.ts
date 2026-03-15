/**
 * Fragrance Catalog — central data layer for Perfumisto.
 *
 * Replaces the old mock.ts with real data from the Kaggle Fragrantica dataset.
 * Loads the processed catalog-featured.json at import time and exposes
 * lookup helpers consumed by all pages and components.
 *
 * ## Enrichment strategy
 * The catalog is designed for a two-stage data pipeline:
 *   1. Base catalog  — Kaggle dataset (current)
 *   2. Enrichment    — future scraping adds longevity, sillage, season data,
 *                      images, pricing, similar scents, vote counts, etc.
 *
 * To enrich, merge new data keyed by `id` (or match via `slug` / `fragrantica_url`).
 * Null/missing fields indicate "not yet enriched" — the UI shows graceful fallbacks.
 */

import type { Fragrance, Accord } from "@/types";
import rawCatalog from "../../data/processed/catalog-featured.json";

// ---------------------------------------------------------------------------
// Hydrate raw JSON into full Fragrance objects with safe defaults
// ---------------------------------------------------------------------------

function hydrateFragrance(raw: Record<string, unknown>): Fragrance {
  return {
    id: raw.id as string,
    name: raw.name as string,
    brand: raw.brand as string,
    slug: (raw.slug as string) || "",
    year: (raw.year as number) ?? undefined,
    gender: (raw.gender as string) ?? undefined,
    fragrance_family: (raw.fragrance_family as string) ?? undefined,
    concentration: (raw.concentration as string) ?? undefined,
    description: (raw.description as string) || "",
    fragrantica_url: (raw.fragrantica_url as string) ?? undefined,
    fragrantica_rating: (raw.fragrantica_rating as number) ?? 0,
    fragrantica_votes: (raw.fragrantica_votes as number) ?? 0,
    perfumisto_rating: (raw.perfumisto_rating as number) ?? 0,
    perfumisto_votes: (raw.perfumisto_votes as number) ?? 0,
    main_accords: ((raw.main_accords as Accord[]) || []),
    top_notes: ((raw.top_notes as string[]) || []),
    heart_notes: ((raw.heart_notes as string[]) || []),
    base_notes: ((raw.base_notes as string[]) || []),
    longevity: (raw.longevity as number) ?? 0,
    sillage: (raw.sillage as number) ?? 0,
    longevity_votes: raw.longevity_votes as Record<string, number> | undefined,
    sillage_votes: raw.sillage_votes as Record<string, number> | undefined,
    season_performance: raw.season_performance as Fragrance["season_performance"],
    season_tags: raw.season_tags as string[] | undefined,
    gender_votes: raw.gender_votes as Record<string, number> | undefined,
    image_url: (raw.image_url as string) ?? undefined,
    brand_logo_url: (raw.brand_logo_url as string) ?? undefined,
    review_count: (raw.review_count as number) ?? 0,
    similar_scents: raw.similar_scents as string[] | undefined,
    pricing: raw.pricing as Fragrance["pricing"],
    community_opinions: raw.community_opinions as Fragrance["community_opinions"],
  };
}

// ---------------------------------------------------------------------------
// Catalog singleton
// ---------------------------------------------------------------------------

const allFragrances: Fragrance[] = (rawCatalog as Record<string, unknown>[])
  .map(hydrateFragrance)
  .filter((f) => f.name && f.brand);

// Index by ID for O(1) lookups
const byId = new Map<string, Fragrance>();
for (const f of allFragrances) {
  byId.set(f.id, f);
}

// Index by slug for enrichment matching
const bySlug = new Map<string, Fragrance>();
for (const f of allFragrances) {
  if (f.slug) bySlug.set(f.slug, f);
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacements for the old mock helpers
// ---------------------------------------------------------------------------

/** All loaded fragrances. */
export const fragrances: Fragrance[] = allFragrances;

/** Total number of fragrances in the catalog. */
export const catalogSize = allFragrances.length;

/** Look up a single fragrance by ID. */
export function getFragranceById(id: string): Fragrance | undefined {
  return byId.get(id);
}

/** Look up a fragrance by slug (for enrichment matching). */
export function getFragranceBySlug(slug: string): Fragrance | undefined {
  return bySlug.get(slug);
}

/**
 * Search fragrances by name and/or brand (case-insensitive substring match).
 * Returns at most `limit` results.
 */
export function searchFragrances(
  query: string,
  { limit = 20 }: { limit?: number } = {},
): Fragrance[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results: Fragrance[] = [];
  for (const f of allFragrances) {
    if (f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)) {
      results.push(f);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/**
 * Get all unique brands with their fragrance counts.
 */
export function getAllBrands(): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const f of allFragrances) {
    map.set(f.brand, (map.get(f.brand) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get all unique notes across the catalog.
 */
export function getAllNotes(): string[] {
  const set = new Set<string>();
  for (const f of allFragrances) {
    for (const n of [...f.top_notes, ...f.heart_notes, ...f.base_notes]) {
      set.add(n);
    }
  }
  return Array.from(set).sort();
}

/**
 * Get fragrances that contain ALL of the specified notes.
 */
export function getFragrancesByNotes(notes: string[]): Fragrance[] {
  if (notes.length === 0) return [];
  const lowerNotes = notes.map((n) => n.toLowerCase());
  return allFragrances.filter((f) => {
    const allNotes = [...f.top_notes, ...f.heart_notes, ...f.base_notes].map((n) =>
      n.toLowerCase(),
    );
    return lowerNotes.every((n) => allNotes.includes(n));
  });
}

/**
 * Get fragrances by brand name (case-insensitive exact match).
 */
export function getFragrancesByBrand(brand: string): Fragrance[] {
  const b = brand.toLowerCase();
  return allFragrances.filter((f) => f.brand.toLowerCase() === b);
}

/**
 * Get the top-rated fragrances (only those with actual ratings).
 */
export function getTopRated(limit = 20): Fragrance[] {
  return allFragrances
    .filter((f) => f.fragrantica_rating > 0)
    .sort((a, b) => b.fragrantica_rating - a.fragrantica_rating)
    .slice(0, limit);
}

/**
 * Get fragrances with the most reviews.
 */
export function getMostReviewed(limit = 20): Fragrance[] {
  return allFragrances
    .filter((f) => (f.review_count ?? 0) > 0)
    .sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0))
    .slice(0, limit);
}

/**
 * Simple similarity: fragrances sharing the most notes with the given fragrance.
 * Used until enrichment provides real similar_scents data.
 */
export function getSimilarFragrances(id: string, limit = 6): Fragrance[] {
  const target = byId.get(id);
  if (!target) return [];

  const targetNotes = new Set(
    [...target.top_notes, ...target.heart_notes, ...target.base_notes].map((n) =>
      n.toLowerCase(),
    ),
  );
  if (targetNotes.size === 0) return [];

  const scored = allFragrances
    .filter((f) => f.id !== id)
    .map((f) => {
      const fNotes = [...f.top_notes, ...f.heart_notes, ...f.base_notes].map((n) =>
        n.toLowerCase(),
      );
      const overlap = fNotes.filter((n) => targetNotes.has(n)).length;
      // Bonus for same brand or family
      const brandBonus = f.brand === target.brand ? 2 : 0;
      const familyBonus = f.fragrance_family === target.fragrance_family ? 3 : 0;
      return { fragrance: f, score: overlap + brandBonus + familyBonus };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.fragrance);
}

// ---------------------------------------------------------------------------
// Trending — scored by rating × log(votes + 1)
// ---------------------------------------------------------------------------

function trendingScore(f: Fragrance): number {
  return f.fragrantica_rating * Math.log(f.fragrantica_votes + 1);
}

/** Pre-sorted trending list (computed once). */
const trendingSorted: Fragrance[] = allFragrances
  .filter((f) => f.fragrantica_rating > 0 && f.fragrantica_votes > 0)
  .sort((a, b) => trendingScore(b) - trendingScore(a));

export interface TrendingResult {
  fragrance: Fragrance;
  score: number;
}

/** Get overall trending fragrances. */
export function getTrendingFragrances(limit = 20): TrendingResult[] {
  return trendingSorted.slice(0, limit).map((f) => ({
    fragrance: f,
    score: trendingScore(f),
  }));
}

/** Get trending fragrances grouped by dominant accord (highest-scored accord). */
export function getTrendingByAccord(perAccord = 5): Record<string, TrendingResult[]> {
  const groups = new Map<string, TrendingResult[]>();

  for (const f of trendingSorted) {
    if (f.main_accords.length === 0) continue;
    const dominant = f.main_accords.reduce((best, a) =>
      a.score > best.score ? a : best,
    ).name;

    const list = groups.get(dominant);
    if (!list) {
      groups.set(dominant, [{ fragrance: f, score: trendingScore(f) }]);
    } else if (list.length < perAccord) {
      list.push({ fragrance: f, score: trendingScore(f) });
    }
  }

  // Convert to plain object, sorted by group size desc
  const entries = Array.from(groups.entries())
    .filter(([, v]) => v.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);
  const result: Record<string, TrendingResult[]> = {};
  for (const [k, v] of entries) {
    result[k] = v;
  }
  return result;
}

/** Get top trending fragrance per season. */
export function getTrendingBySeason(perSeason = 5): Record<string, TrendingResult[]> {
  const seasons = ["spring", "summer", "fall", "winter"] as const;
  const result: Record<string, TrendingResult[]> = {};

  for (const season of seasons) {
    const seasonSorted = trendingSorted
      .filter((f) => f.season_performance && f.season_performance[season] >= 50)
      .slice(0, perSeason)
      .map((f) => ({ fragrance: f, score: trendingScore(f) }));
    if (seasonSorted.length > 0) {
      result[season.charAt(0).toUpperCase() + season.slice(1)] = seasonSorted;
    }
  }

  return result;
}

/**
 * Filter fragrances based on Finder criteria.
 */
export function findFragrances(criteria: {
  accords?: string[];
  avoidAccords?: string[];
  notes?: string[];
  gender?: string;
  yearRange?: [number, number];
  minRating?: number;
  limit?: number;
}): Fragrance[] {
  const { accords, avoidAccords, notes, gender, yearRange, minRating, limit = 20 } = criteria;

  return allFragrances
    .filter((f) => {
      // Gender filter
      if (gender && f.gender && f.gender !== gender && f.gender !== "unisex") return false;

      // Year range
      if (yearRange && f.year) {
        if (f.year < yearRange[0] || f.year > yearRange[1]) return false;
      }

      // Min rating
      if (minRating && f.fragrantica_rating < minRating) return false;

      // Wanted accords (match against fragrance_family and main_accords)
      if (accords && accords.length > 0) {
        const fragAccords = [
          ...(f.fragrance_family?.toLowerCase().split(/\s+/) || []),
          ...f.main_accords.map((a) => a.name.toLowerCase()),
        ];
        if (!accords.some((a) => fragAccords.some((fa) => fa.includes(a.toLowerCase())))) {
          return false;
        }
      }

      // Avoided accords
      if (avoidAccords && avoidAccords.length > 0) {
        const fragAccords = [
          ...(f.fragrance_family?.toLowerCase().split(/\s+/) || []),
          ...f.main_accords.map((a) => a.name.toLowerCase()),
        ];
        if (avoidAccords.some((a) => fragAccords.some((fa) => fa.includes(a.toLowerCase())))) {
          return false;
        }
      }

      // Wanted notes
      if (notes && notes.length > 0) {
        const allNotes = [...f.top_notes, ...f.heart_notes, ...f.base_notes].map((n) =>
          n.toLowerCase(),
        );
        if (!notes.some((n) => allNotes.includes(n.toLowerCase()))) {
          return false;
        }
      }

      return true;
    })
    .slice(0, limit);
}
