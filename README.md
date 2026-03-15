# Perfumisto

A fragrance discovery, collection, and tracking app built with React, TypeScript, Vite, Tailwind CSS, and shadcn/ui. Backed by a real 6,000+ fragrance catalog from the Kaggle Fragrantica dataset, enriched via a custom Playwright scraper.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm (comes with Node)
- Python 3.10+ (only needed for scraping / data processing)

### Install & Run

```bash
git clone <repo-url>
cd fragrant-finder-lab
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Environment Variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

If these are not set, the app falls back to **localStorage** for all user data (collections, wishlist, wearing log, ratings, activity). This is useful for local development and testing without a backend.

## Supabase Setup

When you're ready to use a real backend, create a Supabase project and add these tables:

| Table | Columns |
|-------|---------|
| `collections` | `user_id` (uuid, FK to auth.users), `fragrance_id` (text), primary key on both |
| `wishlists` | `user_id` (uuid), `fragrance_id` (text), primary key on both |
| `wearing_log` | `id` (uuid, default gen_random_uuid()), `user_id` (uuid), `fragrance_id` (text), `worn_at` (date), `note` (text) |
| `reviews` | `id` (uuid), `user_id` (uuid), `fragrance_id` (text), `rating` (int), `body` (text) |

Enable **Email/Password** auth (and optionally Google / Apple OAuth) in the Supabase dashboard under Authentication > Providers.

## Data Pipeline

The fragrance catalog flows through a two-stage pipeline:

```
Kaggle CSV (84K fragrances)
  │
  ├─ scripts/process-kaggle-dataset.py
  │    ├─ data/processed/catalog-featured.json   (6K curated, loaded by app)
  │    ├─ data/processed/catalog.json            (84K full archive)
  │    └─ public/data/catalog-search.json        (84K search index)
  │
  └─ scripts/scrape-fragrantica.py               (enrichment scraper)
       └─ merges into catalog-featured.json
```

See [DATA-ARCHITECTURE.md](DATA-ARCHITECTURE.md) for the full field mapping and enrichment strategy.

### Re-processing the Kaggle Dataset

```bash
python scripts/process-kaggle-dataset.py
```

This reads `data/raw/perfume_table.csv` and outputs the processed JSON files.

### Running the Scraper

The scraper uses Playwright to fetch live data from Fragrantica (images, ratings, votes, accords, performance, season data, similar scents, community opinions). It merges results into the existing catalog incrementally.

**Install Python dependencies:**

```bash
pip install beautifulsoup4 playwright
python -m playwright install chromium
```

**Usage examples:**

```bash
# Single fragrance (good for testing)
python scripts/scrape-fragrantica.py \
  --fragrance-url "https://www.fragrantica.com/perfume/Dior/Sauvage-48100.html"

# Single brand (all their fragrances)
python scripts/scrape-fragrantica.py \
  --brand-url "https://www.fragrantica.com/designers/Dior.html"

# Single brand, limit to 10 fragrances
python scripts/scrape-fragrantica.py \
  --brand-url "https://www.fragrantica.com/designers/Dior.html" --frag-limit 10

# All brands for a letter
python scripts/scrape-fragrantica.py --letter A

# First 20 brands for a letter (test batch)
python scripts/scrape-fragrantica.py --letter A --limit 20

# Auto-resume from where you left off
python scripts/scrape-fragrantica.py --letter A --resume

# Auto-resume from where you left off + limit
python scripts/scrape-fragrantica.py --letter A --limit 20 --resume

# Skip fragrances already in the catalog (resume within a brand)
python scripts/scrape-fragrantica.py \
  --brand-url "https://www.fragrantica.com/designers/Dior.html" --skip-existing

# Combine with letter mode + resume to skip already-scraped fragrances
python scripts/scrape-fragrantica.py --letter A --resume --skip-existing

# Dry run (scrape but don't write to catalog)
python scripts/scrape-fragrantica.py --letter A --limit 2 --dry-run
```

**Key behaviors:**
- Saves incrementally after each brand (Ctrl+C is safe)
- Progress tracked in `data/scraped/scrape-progress.json`
- Raw scraped JSON saved to `data/scraped/`
- Images downloaded to `public/images/fragrances/` and `public/images/brands/`
- Logs written to `logs/scrape.log`
- Polite 2-4s delay between requests

## Project Structure

```
fragrant-finder-lab/
├── scripts/
│   ├── process-kaggle-dataset.py    # CSV -> JSON processor
│   └── scrape-fragrantica.py        # Playwright enrichment scraper
├── data/
│   ├── raw/                         # Original Kaggle CSV
│   ├── processed/
│   │   ├── catalog-featured.json    # 6K records (loaded by app)
│   │   └── catalog.json             # 84K full archive
│   └── scraped/                     # Raw scraper output + progress
├── public/
│   ├── data/catalog-search.json     # 84K search index
│   └── images/                      # Downloaded fragrance & brand images
├── src/
│   ├── components/                  # Reusable UI components
│   ├── contexts/
│   │   └── AuthContext.tsx           # Auth state (Supabase or localStorage)
│   ├── hooks/
│   │   ├── useCollection.ts         # Collection CRUD
│   │   ├── useWishlist.ts           # Wishlist CRUD
│   │   ├── useWearingLog.ts         # Wearing log entries
│   │   ├── useRatings.ts            # User ratings
│   │   ├── useActivity.ts           # Activity feed
│   │   └── useFriends.ts            # Social / friends
│   ├── lib/
│   │   ├── catalog.ts               # Catalog singleton + search/filter helpers
│   │   └── supabase.ts              # Supabase client init
│   ├── pages/                       # Route pages
│   ├── types/
│   │   └── index.ts                 # Fragrance, User, Review types
│   └── data/
│       ├── mock.ts                  # Re-exports catalog + mock social data
│       └── accords.ts               # Accord color mapping
├── .env.example
├── DATA-ARCHITECTURE.md             # Detailed data field docs
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite, hot reload) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint check |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite + SWC
- **Styling:** Tailwind CSS + shadcn/ui + Framer Motion
- **Routing:** React Router v6
- **Backend:** Supabase (auth, Postgres) — optional, falls back to localStorage
- **Charts:** Recharts
- **Data:** Kaggle Fragrantica dataset + Playwright scraper
- **Testing:** Vitest + React Testing Library
