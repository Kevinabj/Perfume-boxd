"""
Fragrantica Scraper for Perfumisto
===================================
Scrapes fragrance data from Fragrantica and merges it into the existing catalog.

Usage:
  # ── Single fragrance (good for testing) ──
  python scripts/scrape-fragrantica.py --fragrance-url "https://www.fragrantica.com/perfume/Dior/Sauvage-48100.html"

  # ── Single brand (all their fragrances) ──
  python scripts/scrape-fragrantica.py --brand-url "https://www.fragrantica.com/designers/Dior.html"

  # ── Single brand, limit to first 10 fragrances ──
  python scripts/scrape-fragrantica.py --brand-url "https://www.fragrantica.com/designers/Dior.html" --frag-limit 10

  # ── All brands for a letter ──
  python scripts/scrape-fragrantica.py --letter A

  # ── First 20 brands for a letter (test batch) ──
  python scripts/scrape-fragrantica.py --letter A --limit 20

  # ── Skip first 20 brands, scrape next 20 (manual resume) ──
  python scripts/scrape-fragrantica.py --letter A --skip 20 --limit 20

  # ── Auto-resume from where you left off (reads progress file) ──
  python scripts/scrape-fragrantica.py --letter A --resume

  # ── Dry run (scrape but don't write to catalog) ──
  python scripts/scrape-fragrantica.py --letter A --limit 2 --dry-run

Options:
  --letter LETTER          Scrape all brands starting with this letter (A-Z)
  --brand-url URL          Scrape a single brand by Fragrantica URL
  --fragrance-url URL      Scrape a single fragrance by Fragrantica URL
  --limit N                Limit number of brands to scrape
  --skip N                 Skip first N brands (manual resume)
  --frag-limit N           Limit number of fragrances per brand
  --resume                 Auto-resume from last completed brand (uses data/scraped/scrape-progress.json)
  --dry-run                Scrape but don't write to catalog

Notes:
  - Data saves incrementally after each brand, so Ctrl+C is safe
  - Progress is tracked in data/scraped/scrape-progress.json
  - Raw scraped JSON saved to data/scraped/
  - Catalog merged to data/processed/catalog-featured.json
"""

import argparse
import json
import re
import sys
import time
import random
import logging
import urllib.request
import urllib.error
from pathlib import Path

from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BASE_URL = "https://www.fragrantica.com"
FIMGS_BASE = "https://fimgs.net"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CATALOG_PATH = PROJECT_ROOT / "data" / "processed" / "catalog-featured.json"
OUTPUT_DIR = PROJECT_ROOT / "data" / "scraped"
LOG_DIR = PROJECT_ROOT / "logs"
IMG_FRAG_DIR = PROJECT_ROOT / "public" / "images" / "fragrances"
IMG_BRAND_DIR = PROJECT_ROOT / "public" / "images" / "brands"

# Mapping: letter -> designer page number
LETTER_TO_PAGE = {
    "A": 1, "B": 2, "C": 3, "D": 4, "E": 4, "F": 5, "G": 5, "H": 5,
    "I": 6, "J": 6, "K": 6, "L": 7, "M": 8, "N": 9, "O": 9, "P": 9,
    "Q": 9, "R": 10, "S": 10, "T": 11, "U": 11, "V": 11, "W": 11,
    "X": 11, "Y": 11, "Z": 11,
}

# Delay between requests (seconds) - be respectful
MIN_DELAY = 2.0
MAX_DELAY = 4.0

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_DIR / "scrape.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Browser helpers
# ---------------------------------------------------------------------------
_pw = None
_browser = None
_context = None


def get_browser(tall_viewport: bool = False):
    """Lazy-init a Playwright browser. Use tall_viewport=True for fragrance
    pages so lazy-loaded sections (performance, demographics, similar) render."""
    global _pw, _browser, _context
    height = 4000 if tall_viewport else 900
    if _browser is None:
        from playwright.sync_api import sync_playwright
        _pw = sync_playwright().start()
        _browser = _pw.chromium.launch(headless=True)
    if _context is not None:
        _context.close()
    _context = _browser.new_context(
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1280, "height": height},
    )
    return _context


def close_browser():
    global _pw, _browser, _context
    if _context:
        _context.close()
        _context = None
    if _browser:
        _browser.close()
        _browser = None
    if _pw:
        _pw.stop()
        _pw = None


def polite_delay():
    time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))


def ensure_full_url(url: str) -> str:
    if url.startswith("http"):
        return url
    return BASE_URL + url


# ---------------------------------------------------------------------------
# Image downloading
# ---------------------------------------------------------------------------
def download_image(url: str, dest: Path) -> bool:
    """Download an image from url to dest. Returns True on success."""
    if dest.exists():
        log.info(f"  Image already exists: {dest.name}")
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            dest.write_bytes(resp.read())
        log.info(f"  Downloaded image: {dest.name}")
        return True
    except Exception as e:
        log.warning(f"  Failed to download {url}: {e}")
        return False


# ---------------------------------------------------------------------------
# Step 1: Designer listing page → brand URLs
# ---------------------------------------------------------------------------
def get_brand_urls_for_letter(letter: str) -> list[dict]:
    letter = letter.upper()
    page_num = LETTER_TO_PAGE.get(letter)
    if not page_num:
        log.error(f"Unknown letter: {letter}")
        return []

    url = f"{BASE_URL}/designers-{page_num}/#{letter}"
    log.info(f"Fetching designer listing: {url}")

    ctx = get_browser(tall_viewport=False)
    page = ctx.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        brands = page.evaluate("""
            (letter) => {
                const links = document.querySelectorAll('a[href^="/designers/"]');
                const result = [];
                const seen = new Set();
                for (const a of links) {
                    const href = a.getAttribute('href');
                    if (href && href.endsWith('.html') && !seen.has(href)) {
                        const name = a.textContent.trim();
                        // Filter: only brands starting with the requested letter
                        if (name && name.toUpperCase().startsWith(letter)) {
                            seen.add(href);
                            result.push({name, url: href});
                        }
                    }
                }
                return result;
            }
        """, letter)
        log.info(f"Found {len(brands)} brands for letter '{letter}'")
        return brands
    finally:
        page.close()
        polite_delay()


# ---------------------------------------------------------------------------
# Step 2: Brand page → fragrance URLs
# ---------------------------------------------------------------------------
def get_fragrance_urls_for_brand(brand_url: str) -> list[dict]:
    url = ensure_full_url(brand_url)
    log.info(f"Fetching brand page: {url}")

    # Extract brand slug from URL: /designers/A-Bathing-Ape.html → A-Bathing-Ape
    brand_slug_match = re.search(r"/designers/(.+?)\.html", brand_url)
    brand_slug = brand_slug_match.group(1) if brand_slug_match else ""

    ctx = get_browser(tall_viewport=False)
    page = ctx.new_page()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(2000)

        fragrances = page.evaluate("""
            (brandSlug) => {
                const links = document.querySelectorAll('a[href*="/perfume/"]');
                const result = [];
                const seen = new Set();
                // Only include fragrances from THIS brand
                const prefix = '/perfume/' + brandSlug + '/';
                for (const a of links) {
                    const href = a.getAttribute('href');
                    if (href && href.startsWith(prefix) && /\\/perfume\\/.+\\/.+-\\d+\\.html$/.test(href) && !seen.has(href)) {
                        seen.add(href);
                        result.push({
                            url: href,
                            label: a.getAttribute('aria-label') || a.getAttribute('title') || ''
                        });
                    }
                }
                return result;
            }
        """, brand_slug)
        log.info(f"Found {len(fragrances)} fragrances for brand: {brand_url}")
        return fragrances
    finally:
        page.close()
        polite_delay()


# ---------------------------------------------------------------------------
# Step 3: Fragrance page → structured data
# ---------------------------------------------------------------------------
def extract_id_from_url(url: str) -> str:
    match = re.search(r"-(\d+)\.html$", url)
    return f"frag-{match.group(1)}" if match else ""


def parse_vote_count(text: str) -> int:
    """Parse vote count strings like '12.2k', '1.8k', '517' → int."""
    text = text.strip().lower().replace(",", "")
    if text.endswith("k"):
        return int(float(text[:-1]) * 1000)
    if text.endswith("m"):
        return int(float(text[:-1]) * 1_000_000)
    try:
        return int(text)
    except ValueError:
        return 0


def scrape_fragrance(url: str) -> dict | None:
    """Scrape a single fragrance page and return structured data."""
    frag_id = extract_id_from_url(url)
    if not frag_id:
        log.warning(f"Could not extract ID from URL: {url}")
        return None

    full_url = ensure_full_url(url)
    frag_num = re.search(r"-(\d+)\.html$", url).group(1)
    log.info(f"Fetching fragrance: {full_url}")

    ctx = get_browser(tall_viewport=True)
    page = ctx.new_page()
    try:
        page.goto(full_url, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(3000)

        # Extract ALL data at once via JS for reliability
        raw = page.evaluate("""
            () => {
                const r = {};

                // --- Rating & votes (schema.org) ---
                const ratingEl = document.querySelector('[itemprop="ratingValue"]');
                r.rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) || 0 : 0;
                const votesEl = document.querySelector('[itemprop="ratingCount"]');
                r.votes = votesEl ? parseInt(votesEl.getAttribute('content') || votesEl.textContent.trim()) || 0 : 0;

                // --- H1: name + gender ---
                const h1 = document.querySelector('h1[itemprop="name"]');
                r.rawTitle = h1 ? h1.textContent.trim() : '';

                // --- Brand ---
                const brandEl = document.querySelector('[itemprop="brand"]');
                if (brandEl) {
                    const nameSpan = brandEl.querySelector('[itemprop="name"]');
                    r.brand = nameSpan ? nameSpan.textContent.trim() : '';
                }

                // --- Brand logo ---
                const logoImg = document.querySelector('img[itemprop="logo"]');
                r.brandLogo = logoImg ? logoImg.src : null;

                // --- Description ---
                const descEl = document.getElementById('perfume-description-content');
                r.description = descEl ? descEl.textContent.trim() : '';

                // --- Accords ---
                const accordHeader = Array.from(document.querySelectorAll('h6'))
                    .find(el => /main accords/i.test(el.textContent));
                r.accords = [];
                if (accordHeader) {
                    const container = accordHeader.closest('.flex.flex-col');
                    if (container) {
                        container.querySelectorAll('div[style*="width:"]').forEach(bar => {
                            const span = bar.querySelector('.truncate');
                            if (!span) return;
                            const name = span.textContent.trim();
                            const widthMatch = bar.style.width.match(/([\\d.]+)%/);
                            const score = widthMatch ? Math.round(parseFloat(widthMatch[1])) : 50;
                            r.accords.push({name, score});
                        });
                    }
                }

                // --- Rating card texts (When To Wear = seasons) ---
                const cards = document.querySelectorAll('.tw-rating-card');
                r.ratingCards = Array.from(cards).map(c => c.innerText);

                // --- Performance section (longevity & sillage) ---
                const perfDiv = document.getElementById('performance');
                r.perfText = perfDiv ? perfDiv.innerText : '';

                // --- Demographics section (gender & price-value) ---
                const demoDiv = document.getElementById('demographics');
                r.demoText = demoDiv ? demoDiv.innerText : '';

                // --- Notes from pyramid section ---
                r.pyramidNotes = { top: [], heart: [], base: [] };
                const pyramid = document.getElementById('pyramid');
                if (pyramid) {
                    // Find section headers (h4 with "Top Notes", "Middle Notes", "Base Notes")
                    const h4s = pyramid.querySelectorAll('h4');
                    const sections = [];
                    h4s.forEach(h4 => {
                        const text = h4.textContent.trim().toLowerCase();
                        let key = null;
                        if (/top/i.test(text)) key = 'top';
                        else if (/middle|heart/i.test(text)) key = 'heart';
                        else if (/base/i.test(text)) key = 'base';
                        if (key) sections.push({ key, el: h4 });
                    });

                    if (sections.length > 0) {
                        // Has top/middle/base sections
                        sections.forEach(sec => {
                            // The note links are in the next sibling container after the h4's parent
                            const wrapper = sec.el.closest('.mx-auto');
                            if (!wrapper) return;
                            wrapper.querySelectorAll('.pyramid-note-label').forEach(span => {
                                const name = span.textContent.trim();
                                if (name) r.pyramidNotes[sec.key].push(name);
                            });
                        });
                    } else {
                        // No sections — all notes are flat (put them in base as "all notes")
                        const allNoteSpans = pyramid.querySelectorAll('.pyramid-note-label');
                        const flatNotes = [];
                        allNoteSpans.forEach(span => {
                            const name = span.textContent.trim();
                            if (name) flatNotes.push(name);
                        });
                        // Store flat notes as base (will be handled in Python)
                        r.pyramidNotes._flat = flatNotes;
                    }
                }

                // --- Similar perfumes ---
                const simDiv = document.getElementById('similar');
                r.similarLinks = [];
                if (simDiv) {
                    simDiv.querySelectorAll('a[href*="/perfume/"]').forEach(a => {
                        const href = a.getAttribute('href');
                        if (href) r.similarLinks.push(href);
                    });
                }

                // --- What People Say (community pros/cons) ---
                r.communityOpinions = [];
                // Find the section by looking for the heading text
                const allH3s = document.querySelectorAll('h3');
                let wpsSectionEl = null;
                for (const h3 of allH3s) {
                    if (/what people say/i.test(h3.textContent)) {
                        wpsSectionEl = h3.closest('div.w-full') || h3.parentElement?.parentElement;
                        break;
                    }
                }
                if (wpsSectionEl) {
                    // Find the two cards (Pros and Cons)
                    const cards = wpsSectionEl.querySelectorAll('.rounded-2xl');
                    cards.forEach(card => {
                        const headerSpan = card.querySelector('span.uppercase');
                        if (!headerSpan) return;
                        const type = /pros/i.test(headerSpan.textContent) ? 'pro' : 'con';
                        // Each item row has buttons with vote counts and a <p> with text
                        const items = card.querySelectorAll('[class*="group/item"]');
                        items.forEach(item => {
                            const textEl = item.querySelector('p');
                            if (!textEl) return;
                            const text = textEl.textContent.trim();
                            // Vote buttons: first is thumbs up, second is thumbs down
                            const voteSpans = item.querySelectorAll('button span.tabular-nums');
                            let thumbsUp = 0, thumbsDown = 0;
                            if (voteSpans.length >= 2) {
                                const parseVote = (s) => {
                                    const t = s.textContent.trim().toLowerCase();
                                    if (t.endsWith('k')) return Math.round(parseFloat(t) * 1000);
                                    return parseInt(t, 10) || 0;
                                };
                                thumbsUp = parseVote(voteSpans[0]);
                                thumbsDown = parseVote(voteSpans[1]);
                            }
                            r.communityOpinions.push({ text, type, thumbsUp, thumbsDown });
                        });
                    });
                }

                return r;
            }
        """)
    except Exception as e:
        log.error(f"Failed to fetch {full_url}: {e}")
        return None
    finally:
        page.close()
        polite_delay()

    # --- Post-process extracted data ---
    brand = raw.get("brand", "")
    raw_title = raw.get("rawTitle", "")

    # Name: remove brand and gender suffix
    name = raw_title
    if brand:
        name = name.replace(brand, "").strip()
    for suffix in ["for women and men", "for women", "for men"]:
        name = re.sub(rf"\s*{re.escape(suffix)}\s*$", "", name, flags=re.I)
    name = name.strip()
    # If name is empty (fragrance named same as brand), use brand as name
    if not name:
        name = brand

    # Gender from h1
    gender = None
    title_lower = raw_title.lower()
    if "for women and men" in title_lower or "unisex" in title_lower:
        gender = "unisex"
    elif "for women" in title_lower:
        gender = "women"
    elif "for men" in title_lower:
        gender = "men"

    # Description
    description = raw.get("description", "")

    # Year
    year = None
    year_match = re.search(r"was launched in (\d{4})", description)
    if year_match:
        year = int(year_match.group(1))

    # Fragrance family
    frag_family = None
    family_match = re.search(r"is a[n]?\s+(.+?)\s+fragrance", description)
    if family_match:
        frag_family = family_match.group(1).strip()

    # Concentration
    concentration = None
    conc_match = re.search(
        r"\b(Eau de Parfum|Eau de Toilette|Eau de Cologne|Parfum|Extrait)\b",
        description, re.I,
    )
    if conc_match:
        concentration = conc_match.group(1)

    # Notes: prefer pyramid DOM extraction, fall back to description parsing
    pyramid = raw.get("pyramidNotes", {})
    flat_notes = pyramid.get("_flat", [])
    pyr_top = pyramid.get("top", [])
    pyr_heart = pyramid.get("heart", [])
    pyr_base = pyramid.get("base", [])

    if pyr_top or pyr_heart or pyr_base:
        # Structured pyramid notes found
        notes = {"top": pyr_top, "heart": pyr_heart, "base": pyr_base}
        log.info(f"  Notes from pyramid: {len(pyr_top)} top, {len(pyr_heart)} heart, {len(pyr_base)} base")
    elif flat_notes:
        # Flat notes (no top/heart/base sections) — store as base
        notes = {"top": [], "heart": [], "base": flat_notes}
        log.info(f"  Notes from pyramid (flat): {len(flat_notes)} notes")
    else:
        # Fall back to description parsing
        notes = _parse_notes(description)
        log.info(f"  Notes from description: {len(notes['top'])} top, {len(notes['heart'])} heart, {len(notes['base'])} base")

    # Image — download locally
    remote_image_url = f"{FIMGS_BASE}/mdimg/perfume/o.{frag_num}.jpg"
    local_frag_img = IMG_FRAG_DIR / f"{frag_num}.jpg"
    if download_image(remote_image_url, local_frag_img):
        image_url = f"/images/fragrances/{frag_num}.jpg"
    else:
        image_url = remote_image_url  # fallback to remote

    # Brand logo — download locally
    brand_logo_remote = raw.get("brandLogo")
    brand_logo = None
    if brand_logo_remote:
        # Extract brand ID from URL like https://fimgs.net/mdimg/dizajneri/m.160.jpg
        brand_img_match = re.search(r"/m\.(\d+)\.", brand_logo_remote)
        if brand_img_match:
            brand_img_id = brand_img_match.group(1)
            local_brand_img = IMG_BRAND_DIR / f"{brand_img_id}.jpg"
            if download_image(brand_logo_remote, local_brand_img):
                brand_logo = f"/images/brands/{brand_img_id}.jpg"
            else:
                brand_logo = brand_logo_remote
        else:
            # Use brand slug as filename
            brand_fname = re.sub(r"[^a-z0-9]+", "-", brand.lower()).strip("-") + ".jpg"
            local_brand_img = IMG_BRAND_DIR / brand_fname
            if download_image(brand_logo_remote, local_brand_img):
                brand_logo = f"/images/brands/{brand_fname}"
            else:
                brand_logo = brand_logo_remote

    # --- Parse "When To Wear" card for seasons ---
    season_perf = None
    for card_text in raw.get("ratingCards", []):
        if "WHEN TO WEAR" in card_text.upper():
            season_perf = _parse_seasons_from_text(card_text)
            break

    # --- Parse Performance section for longevity & sillage ---
    perf = _parse_longevity_sillage_from_text(raw.get("perfText", ""))
    longevity = perf["longevity"]
    sillage = perf["sillage"]

    # --- Parse Demographics for gender voting & price-value ---
    gender_votes, price_value, pv_votes = _parse_demographics_from_text(raw.get("demoText", ""))

    # --- Similar scents ---
    similar_ids = []
    seen_sim = set()
    for href in raw.get("similarLinks", []):
        sid = extract_id_from_url(href)
        if sid and sid != frag_id and sid not in seen_sim:
            seen_sim.add(sid)
            similar_ids.append(sid)
    similar_ids = similar_ids[:20]

    # --- Build result ---
    slug = re.sub(r"[^a-z0-9]+", "-", f"{brand} {name}".lower()).strip("-")

    result = {
        "id": frag_id,
        "name": name,
        "brand": brand,
        "slug": slug,
        "year": year,
        "gender": gender,
        "fragrance_family": frag_family,
        "concentration": concentration,
        "description": description,
        "fragrantica_url": full_url,
        "fragrantica_rating": raw.get("rating", 0),
        "fragrantica_votes": raw.get("votes", 0),
        "main_accords": raw.get("accords", []),
        "top_notes": notes["top"],
        "heart_notes": notes["heart"],
        "base_notes": notes["base"],
        "longevity": longevity,
        "sillage": sillage,
        "season_performance": season_perf,
        "image_url": image_url,
        "brand_logo_url": brand_logo,
        "similar_scents": similar_ids,
    }

    if gender_votes:
        result["gender_votes"] = gender_votes

    # Performance vote breakdowns
    if perf["longevity_votes"]:
        result["longevity_votes"] = perf["longevity_votes"]
    if perf["sillage_votes"]:
        result["sillage_votes"] = perf["sillage_votes"]

    if price_value is not None:
        pricing = {"price_value_score": price_value}
        if pv_votes:
            pricing["price_value_votes"] = pv_votes
        result["pricing"] = pricing

    # Community opinions (What People Say)
    community = raw.get("communityOpinions", [])
    if community:
        result["community_opinions"] = community

    # Season tags (only from the 4 seasons, not day/night)
    if season_perf:
        season_only = {k: v for k, v in season_perf.items() if k in ("spring", "summer", "fall", "winter")}
        total = sum(season_only.values()) or 1
        tags = [s for s, v in season_only.items() if v / total > 0.2]
        # Add day/night tags
        if season_perf.get("day", 0) > 0 or season_perf.get("night", 0) > 0:
            if season_perf.get("day", 0) >= season_perf.get("night", 0):
                tags.append("day")
            if season_perf.get("night", 0) >= season_perf.get("day", 0):
                tags.append("night")
        result["season_tags"] = tags

    log.info(
        f"  Scraped: {brand} - {name} (ID: {frag_id}, "
        f"rating: {result['fragrantica_rating']}, votes: {result['fragrantica_votes']}, "
        f"accords: {len(result['main_accords'])}, longevity: {longevity}, "
        f"sillage: {sillage}, similar: {len(similar_ids)}, "
        f"community_opinions: {len(community)})"
    )

    return result


# ---------------------------------------------------------------------------
# Text parsers for rendered Vue content
# ---------------------------------------------------------------------------
def _parse_notes(desc: str) -> dict:
    result = {"top": [], "heart": [], "base": []}

    top_match = re.search(
        r"[Tt]op notes?\s+(?:are|is)\s+(.+?)(?:;|\.|\band\b\s+(?:middle|heart))", desc)
    if top_match:
        result["top"] = [n.strip() for n in re.split(r",\s*|\s+and\s+", top_match.group(1)) if n.strip()]

    mid_match = re.search(
        r"(?:middle|heart)\s+notes?\s+(?:are|is)\s+(.+?)(?:;|\.|\band\b\s+base)", desc)
    if mid_match:
        result["heart"] = [n.strip() for n in re.split(r",\s*|\s+and\s+", mid_match.group(1)) if n.strip()]

    base_match = re.search(r"base notes?\s+(?:are|is)\s+(.+?)(?:\.|$)", desc)
    if base_match:
        result["base"] = [n.strip() for n in re.split(r",\s*|\s+and\s+", base_match.group(1)) if n.strip()]

    return result


def _parse_seasons_from_text(text: str) -> dict | None:
    """Parse season + day/night data from 'When To Wear' card text like:
    'WHEN TO WEAR\nwinter\n9.4k\nspring\n14k\nsummer\n12.9k\nfall\n12.9k\nday\n13.8k\nnight\n12.6k'
    """
    lines = [l.strip().lower() for l in text.split("\n") if l.strip()]
    seasons = {"spring": 0, "summer": 0, "fall": 0, "winter": 0}
    time_of_day = {"day": 0, "night": 0}
    all_keys = {"winter", "spring", "summer", "fall", "autumn", "day", "night"}

    for i, line in enumerate(lines):
        if line in all_keys and i + 1 < len(lines):
            key = "fall" if line == "autumn" else line
            val = parse_vote_count(lines[i + 1])
            if key in seasons:
                seasons[key] = val
            elif key in time_of_day:
                time_of_day[key] = val

    if all(v == 0 for v in seasons.values()):
        return None

    # Convert seasons to 0-100 scale based on proportion
    total = sum(seasons.values()) or 1
    result = {k: round(v / total * 100) for k, v in seasons.items()}

    # Add day/night as 0-100 proportion
    dn_total = sum(time_of_day.values()) or 1
    if any(v > 0 for v in time_of_day.values()):
        result["day"] = round(time_of_day["day"] / dn_total * 100)
        result["night"] = round(time_of_day["night"] / dn_total * 100)

    return result


def _parse_longevity_sillage_from_text(text: str) -> dict:
    """Parse longevity/sillage from Performance section text.
    Returns dict with weighted averages AND vote breakdowns:
      { "longevity": 72, "sillage": 65,
        "longevity_votes": {"very weak": 517, "weak": 917, ...},
        "sillage_votes": {"intimate": 200, "moderate": 1500, ...} }
    """
    result = {"longevity": 0, "sillage": 0, "longevity_votes": {}, "sillage_votes": {}}
    if not text:
        return result

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Longevity categories: very weak(1), weak(2), moderate(3), long lasting(4), eternal(5)
    longevity_cats = {
        "very weak": 1, "weak": 2, "moderate": 3,
        "long lasting": 4, "eternal": 5,
    }
    # Sillage categories: intimate(1), moderate(2), strong(3), enormous(4)
    sillage_cats = {
        "intimate": 1, "moderate": 2, "strong": 3, "enormous": 4,
    }

    lon_score, lon_votes = _weighted_avg_from_lines(lines, longevity_cats, 5)
    sil_score, sil_votes = _weighted_avg_from_lines(lines, sillage_cats, 4)

    result["longevity"] = lon_score
    result["sillage"] = sil_score
    result["longevity_votes"] = lon_votes
    result["sillage_votes"] = sil_votes
    return result


def _weighted_avg_from_lines(lines: list[str], categories: dict, scale: int) -> tuple[int, dict]:
    """Parse category → vote-count pairs from text lines, compute weighted avg as 0-100.
    Returns (score, {category_name: vote_count})."""
    votes = {}
    raw_votes = {}
    lines_lower = [l.lower() for l in lines]

    for cat_name, cat_val in categories.items():
        for i, line in enumerate(lines_lower):
            if line == cat_name and i + 1 < len(lines):
                count = parse_vote_count(lines[i + 1])
                votes[cat_val] = count
                raw_votes[cat_name] = count
                break

    if not votes or sum(votes.values()) == 0:
        return 0, {}

    total_votes = sum(votes.values())
    weighted = sum(val * count for val, count in votes.items())
    avg = weighted / total_votes  # 1-scale
    return round((avg / scale) * 100), raw_votes


def _parse_demographics_from_text(text: str) -> tuple[dict | None, int | None]:
    """Parse gender votes and price-value from Demographics section text."""
    if not text:
        return None, None, None

    lines = [l.strip() for l in text.split("\n") if l.strip()]

    # Gender voting
    gender_cats = {
        "female": 1, "more female": 2, "unisex": 3,
        "more male": 4, "male": 5,
    }
    gender_votes = {}
    lines_lower = [l.lower() for l in lines]
    for cat, val in gender_cats.items():
        for i, line in enumerate(lines_lower):
            # Skip the header "GENDER" and "no vote" entries
            if line == cat and i + 1 < len(lines_lower):
                count = parse_vote_count(lines[i + 1])
                if count > 0:
                    gender_votes[cat] = count

    # Price-value
    pv_cats = {
        "way overpriced": 1, "overpriced": 2, "ok": 3,
        "good value": 4, "great value": 5,
    }
    pv_votes = {}
    for cat, val in pv_cats.items():
        for i, line in enumerate(lines_lower):
            if line == cat and i + 1 < len(lines_lower):
                count = parse_vote_count(lines[i + 1])
                if count > 0:
                    pv_votes[val] = count

    # Compute weighted price-value score (1-5)
    price_value = None
    pv_named = {}
    pv_label_map = {1: "way overpriced", 2: "overpriced", 3: "ok", 4: "good value", 5: "great value"}
    if pv_votes:
        total = sum(pv_votes.values())
        if total > 0:
            weighted = sum(val * count for val, count in pv_votes.items())
            price_value = round(weighted / total, 1)
            pv_named = {pv_label_map[k]: v for k, v in pv_votes.items()}

    return gender_votes or None, price_value, pv_named or None


# ---------------------------------------------------------------------------
# Merge scraped data into catalog
# ---------------------------------------------------------------------------
def merge_into_catalog(scraped: list[dict], catalog_path: Path, dry_run: bool = False):
    if not catalog_path.exists():
        log.warning(f"Catalog not found at {catalog_path}, creating new one")
        existing = []
    else:
        with open(catalog_path, "r", encoding="utf-8") as f:
            existing = json.load(f)

    by_id = {frag["id"]: frag for frag in existing}
    by_slug = {frag["slug"]: frag for frag in existing if "slug" in frag}

    updated = 0
    added = 0

    enrichment_fields = {
        "image_url", "fragrantica_votes", "longevity", "sillage",
        "season_performance", "season_tags", "similar_scents",
        "concentration", "pricing", "brand_logo_url", "main_accords",
        "gender_votes", "community_opinions",
    }

    for scraped_frag in scraped:
        frag_id = scraped_frag["id"]
        slug = scraped_frag.get("slug", "")
        existing_frag = by_id.get(frag_id) or by_slug.get(slug)

        if existing_frag:
            changed = False
            for key, val in scraped_frag.items():
                if val is None or val == "" or val == 0 or val == []:
                    continue
                existing_val = existing_frag.get(key)
                if key in enrichment_fields or existing_val is None or existing_val == "" or existing_val == 0 or existing_val == []:
                    if existing_val != val:
                        existing_frag[key] = val
                        changed = True
            if changed:
                updated += 1
        else:
            by_id[frag_id] = scraped_frag
            if slug:
                by_slug[slug] = scraped_frag
            existing.append(scraped_frag)
            added += 1

    log.info(f"Merge result: {updated} updated, {added} new (total: {len(existing)})")

    if dry_run:
        log.info("DRY RUN - not writing to catalog")
    else:
        with open(catalog_path, "w", encoding="utf-8") as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        log.info(f"Catalog written to {catalog_path}")

    return {"updated": updated, "added": added, "total": len(existing)}


# ---------------------------------------------------------------------------
# Main orchestration
# ---------------------------------------------------------------------------
PROGRESS_FILE = OUTPUT_DIR / "scrape-progress.json"


def _load_progress() -> dict:
    """Load progress file tracking last completed brand per letter."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_progress(progress: dict):
    """Save progress file."""
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def _load_catalog_ids() -> set[str]:
    """Load the set of fragrance IDs already present in the catalog."""
    if CATALOG_PATH.exists():
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            catalog = json.load(f)
        return {frag["id"] for frag in catalog if "id" in frag}
    return set()


def run_scrape(
    letter: str | None = None,
    brand_url: str | None = None,
    fragrance_url: str | None = None,
    limit: int | None = None,
    skip: int = 0,
    frag_limit: int | None = None,
    dry_run: bool = False,
    resume: bool = False,
    skip_existing: bool = False,
):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    total_scraped = 0
    existing_ids: set[str] = _load_catalog_ids() if skip_existing else set()

    def _save_batch(batch: list, tag: str):
        """Save raw JSON and merge into catalog incrementally."""
        if not batch:
            return
        output_file = OUTPUT_DIR / f"scraped-{tag}-{int(time.time())}.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(batch, f, ensure_ascii=False, indent=2)
        log.info(f"Raw scraped data saved to {output_file}")
        merge_into_catalog(batch, CATALOG_PATH, dry_run=dry_run)

    try:
        if fragrance_url:
            log.info(f"=== Single fragrance mode: {fragrance_url} ===")
            result = scrape_fragrance(fragrance_url)
            if result:
                _save_batch([result], "single")
                total_scraped += 1

        elif brand_url:
            log.info(f"=== Single brand mode: {brand_url} ===")
            frag_urls = get_fragrance_urls_for_brand(brand_url)
            if frag_limit:
                frag_urls = frag_urls[:frag_limit]
            brand_batch = []
            for j, frag in enumerate(frag_urls):
                if skip_existing:
                    frag_id = extract_id_from_url(frag["url"])
                    if frag_id in existing_ids:
                        log.info(f"  Fragrance {j + 1}/{len(frag_urls)} — already in catalog, skipping")
                        continue
                log.info(f"  Fragrance {j + 1}/{len(frag_urls)}")
                result = scrape_fragrance(frag["url"])
                if result:
                    brand_batch.append(result)
            _save_batch(brand_batch, "brand")
            total_scraped += len(brand_batch)

        elif letter:
            letter = letter.upper()
            log.info(f"=== Letter mode: {letter} ===")
            brands = get_brand_urls_for_letter(letter)
            total_brands = len(brands)

            # Auto-resume: load last completed brand from progress file
            if resume:
                progress = _load_progress()
                saved_skip = progress.get(letter, 0)
                if saved_skip > 0:
                    log.info(f"Resuming from progress file: skipping first {saved_skip} brands (already done)")
                    skip = max(skip, saved_skip)

            if skip:
                log.info(f"Skipping first {skip} of {total_brands} brands")
                brands = brands[skip:]
            if limit:
                brands = brands[:limit]

            for i, brand in enumerate(brands):
                brand_num = i + 1 + skip
                log.info(f"--- Brand {brand_num}/{total_brands} ({i + 1}/{len(brands)}): {brand['name']} ---")
                frag_urls = get_fragrance_urls_for_brand(brand["url"])
                if frag_limit:
                    frag_urls = frag_urls[:frag_limit]

                brand_batch = []
                for j, frag in enumerate(frag_urls):
                    if skip_existing:
                        frag_id = extract_id_from_url(frag["url"])
                        if frag_id in existing_ids:
                            log.info(f"  Fragrance {j + 1}/{len(frag_urls)} — already in catalog, skipping")
                            continue
                    log.info(f"  Fragrance {j + 1}/{len(frag_urls)}")
                    result = scrape_fragrance(frag["url"])
                    if result:
                        brand_batch.append(result)

                # Save after each brand so progress is never lost
                _save_batch(brand_batch, f"{letter}-brand{brand_num}")
                total_scraped += len(brand_batch)

                # Update progress file
                if not dry_run:
                    progress = _load_progress()
                    progress[letter] = brand_num
                    _save_progress(progress)

                log.info(f"  Brand done. {len(brand_batch)} fragrances saved. Total so far: {total_scraped}")

        else:
            log.error("Must specify --letter, --brand-url, or --fragrance-url")
            return

        log.info(f"=== Done! Scraped {total_scraped} fragrances ===")

    finally:
        close_browser()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Scrape Fragrantica data")
    parser.add_argument("--letter", type=str, help="Scrape all brands starting with this letter (A-Z)")
    parser.add_argument("--brand-url", type=str, help="Scrape a single brand by URL")
    parser.add_argument("--fragrance-url", type=str, help="Scrape a single fragrance by URL")
    parser.add_argument("--limit", type=int, help="Limit number of brands to scrape")
    parser.add_argument("--skip", type=int, default=0, help="Skip first N brands (use to resume where you left off)")
    parser.add_argument("--frag-limit", type=int, help="Limit number of fragrances per brand")
    parser.add_argument("--resume", action="store_true", help="Auto-resume from last completed brand (reads progress file)")
    parser.add_argument("--dry-run", action="store_true", help="Don't write to catalog")
    parser.add_argument("--skip-existing", action="store_true", help="Skip fragrances already in the catalog")
    args = parser.parse_args()

    if not any([args.letter, args.brand_url, args.fragrance_url]):
        parser.print_help()
        sys.exit(1)

    run_scrape(
        letter=args.letter,
        brand_url=args.brand_url,
        fragrance_url=args.fragrance_url,
        limit=args.limit,
        skip=args.skip,
        frag_limit=args.frag_limit,
        resume=args.resume,
        dry_run=args.dry_run,
        skip_existing=args.skip_existing,
    )


if __name__ == "__main__":
    main()
