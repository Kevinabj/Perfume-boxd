#!/usr/bin/env python3
"""
Kaggle Fragrantica Dataset Processor for Perfumisto

Reads the raw perfumes_table.csv and produces:
  1. data/processed/catalog.json         — full compact catalog (all fragrances, minimal fields)
  2. data/processed/catalog-featured.json — richly populated fragrances for immediate app use
  3. public/data/catalog-search.json      — search index loadable at runtime

Fields extracted / derived from the CSV:
  - id (stable, derived from URL slug)
  - name, brand (parsed from title + designer)
  - year, gender, fragrance_family (parsed from description)
  - rating (from rating column)
  - notes flat list + top/heart/base breakdown (from notes + description)
  - main_accords (from fragrance_family)
  - description
  - url (fragrantica_url)
  - review_count
  - slug (for future matching / enrichment)

Run:
  python scripts/process-kaggle-dataset.py
"""

import csv
import json
import re
import sys
import hashlib
from pathlib import Path

csv.field_size_limit(2**30)

ROOT = Path(__file__).resolve().parent.parent
RAW_CSV = ROOT / "src" / "data" / "perfumes_table.csv"
OUT_DIR = ROOT / "data" / "processed"
PUBLIC_DATA = ROOT / "public" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PUBLIC_DATA.mkdir(parents=True, exist_ok=True)

# Max fragrances in the featured catalog (loaded directly by the app)
FEATURED_LIMIT = 6000

# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

def clean_designer(raw: str) -> str:
    raw = raw.strip()
    for suffix in [
        " perfumes and colognes", " perfumes & colognes",
        " fragrances", " perfumes",
    ]:
        if raw.lower().endswith(suffix):
            raw = raw[: -len(suffix)]
            break
    if raw.isupper() and len(raw) <= 5:
        return raw
    return raw.strip().title() if raw.islower() else raw.strip()


def parse_name_from_title(title: str, brand: str) -> str:
    name = re.sub(r"\s+for\s+(women and men|men and women|women|men|unisex)$", "", title, flags=re.IGNORECASE).strip()
    if brand and name.lower().endswith(brand.lower()):
        name = name[: -len(brand)].strip()
    if brand and name.lower().startswith(brand.lower()):
        name = name[len(brand):].strip()
    return name.strip() if name.strip() else title


def parse_gender(title: str, description: str) -> str | None:
    text = title + " " + description
    if re.search(r"for women and men|for men and women|for unisex", text, re.IGNORECASE):
        return "unisex"
    if re.search(r"for women", text, re.IGNORECASE):
        return "women"
    if re.search(r"for men", text, re.IGNORECASE):
        return "men"
    return None


def parse_year(description: str) -> int | None:
    m = re.search(r"was launched in (\d{4})", description)
    if m:
        y = int(m.group(1))
        if 1700 <= y <= 2030:
            return y
    return None


def parse_fragrance_family(description: str) -> str | None:
    m = re.search(r"is a[n]? (.+?) fragrance for", description, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return None


def parse_notes_from_description(description: str) -> tuple[list[str], list[str], list[str]]:
    top, heart, base = [], [], []
    m = re.search(r"[Tt]op notes? (?:is|are) (.+?)(?:;|\.)", description)
    if m:
        top = [n.strip() for n in re.split(r",\s*(?:and\s+)?", m.group(1)) if n.strip()]
    m = re.search(r"[Mm]iddle notes? (?:is|are) (.+?)(?:;|\.)", description)
    if m:
        heart = [n.strip() for n in re.split(r",\s*(?:and\s+)?", m.group(1)) if n.strip()]
    m = re.search(r"[Bb]ase notes? (?:is|are) (.+?)(?:\.|$)", description)
    if m:
        base = [n.strip() for n in re.split(r",\s*(?:and\s+)?", m.group(1)) if n.strip()]
    return top, heart, base


def parse_notes_list(raw: str) -> list[str]:
    if not raw or raw == "[]":
        return []
    try:
        import ast
        result = ast.literal_eval(raw)
        if isinstance(result, list):
            return [str(n).strip() for n in result if str(n).strip()]
    except Exception:
        pass
    raw = raw.strip("[]")
    return [n.strip().strip("'\"") for n in raw.split(",") if n.strip().strip("'\"")]


def count_reviews(raw: str) -> int:
    if not raw or raw == "[]":
        return 0
    count = raw.count("', '") + raw.count("', \"") + raw.count("\", '") + raw.count("\", \"")
    if count == 0 and len(raw) > 4:
        return 1
    return count + 1 if count > 0 else 0


def make_slug(name: str, brand: str) -> str:
    text = f"{brand} {name}".lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s-]+", "-", text).strip("-")
    return text


def extract_id_from_url(url: str) -> str:
    m = re.search(r"-(\d+)\.html$", url)
    if m:
        return f"frag-{m.group(1)}"
    return f"frag-{hashlib.md5(url.encode()).hexdigest()[:8]}"


def family_to_accords(family: str | None) -> list[dict]:
    """Convert fragrance family string to accord entries with weighted scores."""
    if not family:
        return []
    # Common compound accord names to keep together
    compounds = {
        "fresh spicy", "warm spicy", "soft spicy", "sweet spicy",
        "floral fruity", "floral woody", "floral green", "floral aquatic",
        "woody aromatic", "woody floral", "woody spicy", "woody aquatic",
        "amber vanilla", "amber woody", "amber floral",
        "citrus aromatic", "citrus gourmand",
        "aromatic fougere", "aromatic aquatic", "aromatic green",
        "chypre floral", "chypre fruity", "chypre woody",
    }

    family_lower = family.lower().strip()
    accords = []
    remaining = family_lower

    # Try to match compound names first
    for compound in sorted(compounds, key=len, reverse=True):
        if compound in remaining:
            accords.append(compound)
            remaining = remaining.replace(compound, " ").strip()

    # Split remaining into single words
    for word in remaining.split():
        word = word.strip()
        if word and len(word) > 1:
            accords.append(word)

    # Title case and assign decreasing scores
    result = []
    score = 85
    for a in accords[:6]:
        result.append({"name": a.title(), "score": max(score, 30)})
        score -= 12
    return result


def completeness_score(entry: dict) -> float:
    """Score how complete a fragrance record is (for sorting/selection)."""
    score = 0
    if entry["fragrantica_rating"] is not None:
        score += 40
    if entry["review_count"] and entry["review_count"] > 0:
        score += min(entry["review_count"], 30)  # Cap contribution at 30
    if entry["top_notes"]:
        score += 5
    if entry["heart_notes"]:
        score += 5
    if entry["base_notes"]:
        score += 5
    if entry["year"]:
        score += 3
    if entry["fragrance_family"]:
        score += 3
    if entry["description"] and len(entry["description"]) > 50:
        score += 4
    if entry["main_accords"]:
        score += 5
    return score


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def process():
    if not RAW_CSV.exists():
        print(f"ERROR: Cannot find {RAW_CSV}")
        sys.exit(1)

    print(f"Reading {RAW_CSV}...")
    catalog = []
    skipped = 0

    with open(RAW_CSV, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i % 10000 == 0 and i > 0:
                print(f"  Processed {i} rows...")

            url = (row.get("url") or "").strip()
            title = (row.get("title") or "").strip()
            description = (row.get("description") or "").strip()
            designer_raw = (row.get("designer") or "").strip()
            rating_raw = (row.get("rating") or "").strip()
            notes_raw = (row.get("notes") or "").strip()
            reviews_raw = (row.get("reviews") or "").strip()

            if not title or not url:
                skipped += 1
                continue

            brand = clean_designer(designer_raw)
            name = parse_name_from_title(title, brand)
            frag_id = extract_id_from_url(url)
            gender = parse_gender(title, description)
            year = parse_year(description)
            family = parse_fragrance_family(description)
            all_notes = parse_notes_list(notes_raw)
            top, heart, base = parse_notes_from_description(description)
            review_count = count_reviews(reviews_raw)

            rating = None
            if rating_raw:
                try:
                    rating = round(float(rating_raw), 2)
                except ValueError:
                    pass

            main_accords = family_to_accords(family)

            # If description didn't yield note pyramid, distribute flat notes
            if all_notes and not top and not heart and not base:
                n = len(all_notes)
                if n <= 3:
                    top = all_notes
                elif n <= 6:
                    top = all_notes[: n // 2]
                    heart = all_notes[n // 2:]
                else:
                    third = n // 3
                    top = all_notes[:third]
                    heart = all_notes[third: 2 * third]
                    base = all_notes[2 * third:]

            slug = make_slug(name, brand)

            entry = {
                "id": frag_id,
                "name": name,
                "brand": brand,
                "slug": slug,
                "year": year,
                "gender": gender,
                "fragrance_family": family,
                "description": description,
                "fragrantica_url": url,
                "fragrantica_rating": rating,
                "fragrantica_votes": None,
                "main_accords": main_accords,
                "top_notes": top,
                "heart_notes": heart,
                "base_notes": base,
                "all_notes": all_notes,
                "review_count": review_count,
                # Enrichment placeholders
                "image_url": None,
                "perfumisto_rating": None,
                "perfumisto_votes": None,
                "longevity": None,
                "sillage": None,
                "season_performance": None,
                "season_tags": None,
                "similar_scents": None,
                "pricing": None,
                "concentration": None,
                "_source": "kaggle-fragrantica-2023",
                "_last_updated": None,
            }

            catalog.append(entry)

    print(f"Parsed {len(catalog)} fragrances ({skipped} skipped)")

    # Sort all by completeness
    catalog.sort(key=lambda x: -completeness_score(x))

    # --- Featured catalog (top N most complete) ---
    featured = catalog[:FEATURED_LIMIT]
    # Secondary sort: rated first, then by review count, then alphabetical
    featured.sort(key=lambda x: (
        x["fragrantica_rating"] is None,
        -(x["review_count"] or 0),
        x["name"].lower()
    ))

    # Strip internal fields for the featured JSON consumed by the app
    def clean_for_app(entry):
        e = dict(entry)
        del e["all_notes"]  # Redundant with top/heart/base
        del e["_source"]
        del e["_last_updated"]
        # Remove null enrichment fields to save space
        for key in ["image_url", "perfumisto_rating", "perfumisto_votes",
                     "longevity", "sillage", "season_performance", "season_tags",
                     "similar_scents", "pricing", "concentration", "fragrantica_votes"]:
            if e.get(key) is None:
                del e[key]
        return e

    featured_clean = [clean_for_app(e) for e in featured]

    featured_path = OUT_DIR / "catalog-featured.json"
    with open(featured_path, "w", encoding="utf-8") as f:
        json.dump(featured_clean, f, ensure_ascii=False)
    size_mb = featured_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {featured_path} ({size_mb:.1f} MB, {len(featured_clean)} fragrances)")

    # --- Full catalog (all records, for archival / future backend) ---
    full_path = OUT_DIR / "catalog.json"
    with open(full_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False)
    size_mb = full_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {full_path} ({size_mb:.1f} MB, {len(catalog)} fragrances)")

    # --- Search index for public directory (runtime fetch) ---
    search_index = [
        {
            "id": e["id"],
            "n": e["name"],       # short keys to save space
            "b": e["brand"],
            "s": e["slug"],
            "y": e["year"],
            "g": e["gender"],
            "r": e["fragrantica_rating"],
            "f": e["fragrance_family"],
        }
        for e in catalog
    ]
    search_path = PUBLIC_DATA / "catalog-search.json"
    with open(search_path, "w", encoding="utf-8") as f:
        json.dump(search_index, f, ensure_ascii=False, separators=(",", ":"))
    size_mb = search_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {search_path} ({size_mb:.1f} MB)")

    # Stats
    has_rating = sum(1 for e in featured if e["fragrantica_rating"] is not None)
    has_notes = sum(1 for e in featured if e["top_notes"] or e["heart_notes"] or e["base_notes"])
    has_year = sum(1 for e in featured if e["year"] is not None)
    has_gender = sum(1 for e in featured if e["gender"] is not None)
    has_family = sum(1 for e in featured if e["fragrance_family"] is not None)
    has_reviews = sum(1 for e in featured if (e["review_count"] or 0) > 0)
    print(f"\nFeatured catalog stats ({len(featured)} fragrances):")
    print(f"  Has rating: {has_rating}")
    print(f"  Has notes: {has_notes}")
    print(f"  Has year: {has_year}")
    print(f"  Has gender: {has_gender}")
    print(f"  Has family: {has_family}")
    print(f"  Has reviews: {has_reviews}")


if __name__ == "__main__":
    process()
