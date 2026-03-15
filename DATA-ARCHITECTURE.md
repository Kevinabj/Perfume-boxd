# Perfumisto Data Architecture

## Overview

The fragrance catalog is powered by a real dataset from the **Kaggle Fragrantica dataset** (~84,000 fragrances). The app loads a curated subset of **6,000 most complete records** for performance. The data layer is designed for a two-stage pipeline: **base catalog** (current) + **future enrichment**.

## Data Flow

```
perfumes_table.csv (84K records, raw Kaggle data)
  │
  ├── scripts/process-kaggle-dataset.py
  │     │
  │     ├── data/processed/catalog-featured.json  (6K records, app-ready)
  │     ├── data/processed/catalog.json           (84K records, full archive)
  │     └── public/data/catalog-search.json       (84K search index)
  │
  └── src/lib/catalog.ts  ← app loads catalog-featured.json
        │
        └── src/data/mock.ts  ← re-exports catalog + keeps mock user/social data
              │
              └── All pages & components consume from here
```

## Fields from Kaggle Dataset

| Field | Source | Notes |
|-------|--------|-------|
| `id` | Derived from URL | Stable ID (e.g. `frag-31861`) |
| `name` | Parsed from `title` | Brand name stripped |
| `brand` | Parsed from `designer` | Cleaned (suffix removed, title-cased) |
| `slug` | Generated | `brand-name` lowercase for matching |
| `year` | Parsed from `description` | "was launched in YYYY" pattern |
| `gender` | Parsed from `title` + `description` | "men" / "women" / "unisex" |
| `fragrance_family` | Parsed from `description` | e.g. "Amber Fougere" |
| `description` | Direct from dataset | Full Fragrantica description |
| `fragrantica_url` | Direct from dataset | Source URL |
| `fragrantica_rating` | Direct from dataset | 0-5 scale (only ~2,500 have ratings) |
| `main_accords` | Derived from `fragrance_family` | Split into weighted accords |
| `top_notes` | Parsed from `description` | "Top notes are..." pattern |
| `heart_notes` | Parsed from `description` | "middle notes are..." pattern |
| `base_notes` | Parsed from `description` | "base notes are..." pattern |
| `review_count` | Counted from `reviews` array | ~54K have reviews |

## Fields Pending Future Enrichment

These fields exist in the `Fragrance` TypeScript interface but are **not yet populated**. The UI handles them gracefully (shows fallbacks or hides sections).

| Field | Expected Source | UI Impact |
|-------|----------------|-----------|
| `image_url` | Scraping | Cards show letter placeholder instead of image |
| `fragrantica_votes` | Scraping | Vote count hidden when 0 |
| `perfumisto_rating` | Platform users | Perfumisto rating badge hidden |
| `perfumisto_votes` | Platform users | Vote count hidden |
| `longevity` (0-100) | Scraping | Meter hidden, shows "pending enrichment" |
| `sillage` (0-100) | Scraping | Meter hidden, shows "pending enrichment" |
| `season_performance` | Scraping | Seasonal circles hidden |
| `season_tags` | Scraping / derived | Season badges hidden |
| `similar_scents` | Scraping + algo | Uses note-overlap algorithm as fallback |
| `concentration` | Scraping | Not displayed yet |
| `pricing` | Scraping | Collection value section uses placeholder |

## How to Enrich Data

### Matching Strategy

Each fragrance has multiple stable identifiers for matching:

1. **`id`** — derived from the Fragrantica URL number (e.g. `frag-31861`)
2. **`slug`** — normalized `brand-name` string (e.g. `dior-sauvage`)
3. **`fragrantica_url`** — original source URL

When enriching, match by `id` first (most reliable), then fall back to `slug` matching.

### Merge Strategy

```
1. Load existing catalog
2. For each enrichment record:
   a. Find matching fragrance by id → slug → fragrantica_url
   b. If found: merge non-null enrichment fields into existing record
   c. If not found: insert as new fragrance
3. Write updated catalog
```

### Adding New Fields

1. Add the field to `src/types/index.ts` (Fragrance interface)
2. Add hydration logic in `src/lib/catalog.ts` (hydrateFragrance function)
3. Update the processing script if the field comes from a new data source
4. Update relevant UI components to display the new field

### Re-processing

```bash
python scripts/process-kaggle-dataset.py
cp data/processed/catalog-featured.json public/data/catalog-featured.json
```

## Directory Structure

```
fragrant-finder-lab/
├── scripts/
│   └── process-kaggle-dataset.py    # CSV → JSON transformer
├── data/
│   ├── processed/
│   │   ├── catalog-featured.json    # 6K records for app (imported at build)
│   │   └── catalog.json             # 84K full archive
│   └── raw/                         # (place future raw data here)
├── public/data/
│   ├── catalog-featured.json        # Runtime copy
│   └── catalog-search.json          # Full 84K search index
├── src/
│   ├── types/index.ts               # Canonical Fragrance interface
│   ├── lib/catalog.ts               # Data catalog service layer
│   ├── data/
│   │   ├── mock.ts                  # Re-exports catalog + mock user data
│   │   └── accords.ts               # Accord color mapping
│   └── ...
```

## Performance Notes

- Featured catalog (6K records): ~4.8 MB JSON, embedded in JS bundle (~1.1 MB gzipped)
- Full catalog (84K): ~97 MB, not loaded by the app (for backend/enrichment use)
- All filtering, search, and lookup happens client-side with O(1) ID lookups via Map
- Results are capped at 60 items per page to keep rendering fast
