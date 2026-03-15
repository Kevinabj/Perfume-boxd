import { useState, useMemo, useCallback, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { SkeletonCard } from "@/components/SkeletonAndEmpty";
import { fragrances, getAllBrands, getAllNotes, searchFragrances } from "@/lib/catalog";
import { Fragrance } from "@/types";
import { Search, ChevronUp, ChevronDown, Star } from "lucide-react";

// ---------------------------------------------------------------------------
// Sort options
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "longevity", label: "The longest lasting (longevity)" },
  { value: "sillage", label: "The biggest projection (sillage)" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "az", label: "Name A-Z" },
] as const;

type SortKey = (typeof SORT_OPTIONS)[number]["value"];

// ---------------------------------------------------------------------------
// Gender options with catalog counts
// ---------------------------------------------------------------------------

const GENDER_OPTIONS = ["unisex", "female", "male"] as const;

// ---------------------------------------------------------------------------
// Rating tiers
// ---------------------------------------------------------------------------

const RATING_TIERS = [4, 3, 2, 1] as const;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 60;
const SHOW_MORE_DEFAULT = 5;

// ---------------------------------------------------------------------------
// Collapsible filter section
// ---------------------------------------------------------------------------

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/30 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-primary hover:bg-muted/10 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ExplorePage() {
  // Search
  const [search, setSearch] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState<SortKey>("popular");

  // Gender filter
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);

  // Designers filter
  const [selectedDesigners, setSelectedDesigners] = useState<string[]>([]);
  const [designerSearch, setDesignerSearch] = useState("");
  const [designerShowAll, setDesignerShowAll] = useState(false);

  // Notes filter
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [noteShowAll, setNoteShowAll] = useState(false);

  // Rating filter
  const [minRating, setMinRating] = useState<number | null>(null);

  // Year filter
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");

  // ------ Precomputed data ------

  // Gender counts
  const genderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of fragrances) {
      const g = (f.gender || "unisex").toLowerCase();
      // Normalize: "men" -> "male", "women" -> "female"
      const key = g === "men" ? "male" : g === "women" ? "female" : g;
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, []);

  // Brands with counts
  const allBrands = useMemo(() => getAllBrands(), []);

  // Notes with counts
  const notesWithCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of fragrances) {
      for (const n of [...f.top_notes, ...f.heart_notes, ...f.base_notes]) {
        const key = n.toLowerCase();
        map.set(key, (map.get(key) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, []);

  // Filtered brands for display
  const filteredBrands = useMemo(() => {
    let list = allBrands;
    if (designerSearch) {
      const q = designerSearch.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }
    return designerShowAll ? list : list.slice(0, SHOW_MORE_DEFAULT);
  }, [allBrands, designerSearch, designerShowAll]);

  // Filtered notes for display
  const filteredNotes = useMemo(() => {
    let list = notesWithCounts;
    if (noteSearch) {
      const q = noteSearch.toLowerCase();
      list = list.filter((n) => n.name.includes(q));
    }
    return noteShowAll ? list : list.slice(0, SHOW_MORE_DEFAULT);
  }, [notesWithCounts, noteSearch, noteShowAll]);

  // ------ Toggle helpers ------

  const toggleGender = useCallback((g: string) => {
    setSelectedGenders((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }, []);

  const toggleDesigner = useCallback((d: string) => {
    setSelectedDesigners((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }, []);

  const toggleNote = useCallback((n: string) => {
    setSelectedNotes((prev) => prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]);
  }, []);

  // ------ Main filter + sort ------

  const results = useMemo(() => {
    let result: Fragrance[];

    if (search) {
      result = searchFragrances(search, { limit: 500 });
    } else {
      result = [...fragrances];
    }

    // Gender
    if (selectedGenders.length > 0) {
      result = result.filter((f) => {
        const g = (f.gender || "unisex").toLowerCase();
        const normalized = g === "men" ? "male" : g === "women" ? "female" : g;
        return selectedGenders.includes(normalized);
      });
    }

    // Designers
    if (selectedDesigners.length > 0) {
      const designerSet = new Set(selectedDesigners.map((d) => d.toLowerCase()));
      result = result.filter((f) => designerSet.has(f.brand.toLowerCase()));
    }

    // Notes
    if (selectedNotes.length > 0) {
      result = result.filter((f) => {
        const allN = [...f.top_notes, ...f.heart_notes, ...f.base_notes].map((n) => n.toLowerCase());
        return selectedNotes.every((n) => allN.includes(n));
      });
    }

    // Rating
    if (minRating !== null) {
      result = result.filter((f) => f.fragrantica_rating >= minRating);
    }

    // Year range
    const yFrom = yearFrom ? parseInt(yearFrom, 10) : null;
    const yTo = yearTo ? parseInt(yearTo, 10) : null;
    if (yFrom || yTo) {
      result = result.filter((f) => {
        if (!f.year) return true;
        if (yFrom && f.year < yFrom) return false;
        if (yTo && f.year > yTo) return false;
        return true;
      });
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.fragrantica_rating - a.fragrantica_rating);
        break;
      case "longevity":
        result.sort((a, b) => b.longevity - a.longevity);
        break;
      case "sillage":
        result.sort((a, b) => b.sillage - a.sillage);
        break;
      case "newest":
        result.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
        break;
      case "oldest":
        result.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
        break;
      case "az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
      default:
        // Default: sort by review count then rating
        result.sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0) || b.fragrantica_rating - a.fragrantica_rating);
        break;
    }

    return result;
  }, [search, selectedGenders, selectedDesigners, selectedNotes, minRating, yearFrom, yearTo, sortBy]);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, selectedGenders, selectedDesigners, selectedNotes, minRating, yearFrom, yearTo, sortBy]);

  // Active filter count
  const activeFilterCount =
    selectedGenders.length +
    selectedDesigners.length +
    selectedNotes.length +
    (minRating !== null ? 1 : 0) +
    (yearFrom || yearTo ? 1 : 0);

  // ------ Render ------

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">All Fragrances</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {results.length === PAGE_SIZE ? `${PAGE_SIZE}+` : results.length} results
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedGenders([]);
                    setSelectedDesigners([]);
                    setSelectedNotes([]);
                    setMinRating(null);
                    setYearFrom("");
                    setYearTo("");
                    setSearch("");
                  }}
                  className="ml-2 text-primary hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex-1 md:w-80 glass rounded-xl flex items-center px-3 gap-2">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fragrances..."
                className="w-full bg-transparent py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar filters ────────────────────────────────────── */}
          <aside className="hidden md:block w-64 shrink-0 space-y-4 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">

            {/* Sort */}
            <FilterSection title="Sort by" defaultOpen={true}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FilterSection>

            {/* Gender */}
            <FilterSection title="Gender" defaultOpen={true}>
              <div className="space-y-2">
                {GENDER_OPTIONS.map((g) => (
                  <label key={g} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes(g)}
                        onChange={() => toggleGender(g)}
                        className="accent-primary rounded"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground capitalize transition-colors">
                        {g}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {(genderCounts[g] || 0).toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
            </FilterSection>

            {/* Designers */}
            <FilterSection title="Designers" defaultOpen={false}>
              <div className="mb-3">
                <div className="glass rounded-lg flex items-center px-3 gap-2">
                  <Search size={14} className="text-muted-foreground" />
                  <input
                    value={designerSearch}
                    onChange={(e) => setDesignerSearch(e.target.value)}
                    placeholder="Search for designers"
                    className="w-full bg-transparent py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {filteredBrands.map((b) => (
                  <label key={b.name} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedDesigners.includes(b.name)}
                        onChange={() => toggleDesigner(b.name)}
                        className="accent-primary rounded"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[140px]">
                        {b.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {b.count}
                    </span>
                  </label>
                ))}
              </div>
              {!designerSearch && allBrands.length > SHOW_MORE_DEFAULT && (
                <button
                  onClick={() => setDesignerShowAll(!designerShowAll)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  {designerShowAll ? "Show less" : "Show more"}
                </button>
              )}
            </FilterSection>

            {/* Notes */}
            <FilterSection title="Notes" defaultOpen={false}>
              <div className="mb-3">
                <div className="glass rounded-lg flex items-center px-3 gap-2">
                  <Search size={14} className="text-muted-foreground" />
                  <input
                    value={noteSearch}
                    onChange={(e) => setNoteSearch(e.target.value)}
                    placeholder="Search for ingredients"
                    className="w-full bg-transparent py-1.5 text-xs outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {filteredNotes.map((n) => (
                  <label key={n.name} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedNotes.includes(n.name)}
                        onChange={() => toggleNote(n.name)}
                        className="accent-primary rounded"
                      />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors capitalize truncate max-w-[140px]">
                        {n.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {n.count.toLocaleString()}
                    </span>
                  </label>
                ))}
              </div>
              {!noteSearch && notesWithCounts.length > SHOW_MORE_DEFAULT && (
                <button
                  onClick={() => setNoteShowAll(!noteShowAll)}
                  className="text-xs text-primary hover:underline mt-2"
                >
                  {noteShowAll ? "Show less" : "Show more"}
                </button>
              )}
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Rating" defaultOpen={false}>
              <div className="space-y-2">
                {RATING_TIERS.map((tier) => {
                  const count = fragrances.filter((f) => f.fragrantica_rating >= tier).length;
                  return (
                    <label key={tier} className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === tier}
                          onChange={() => setMinRating(minRating === tier ? null : tier)}
                          className="accent-primary"
                        />
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < tier ? "fill-primary text-primary" : "text-muted-foreground/30"}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">& Up</span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {count.toLocaleString()}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
                Your votes, likes, and dislikes are used to calculate fragrance rating.
              </p>
            </FilterSection>

            {/* Year */}
            <FilterSection title="Year" defaultOpen={false}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">From year</label>
                  <input
                    type="number"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    placeholder="1920"
                    min="1900"
                    max="2027"
                    className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-muted-foreground mb-1 block">to year</label>
                  <input
                    type="number"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    placeholder="2027"
                    min="1900"
                    max="2027"
                    className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-2 text-sm text-foreground outline-none"
                  />
                </div>
              </div>
            </FilterSection>
          </aside>

          {/* ── Grid ───────────────────────────────────────────────── */}
          <div className="flex-1">
            {results.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-display">No fragrances found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {Math.min(visibleCount, results.length)} of {results.length} fragrances
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {results.slice(0, visibleCount).map((f) => (
                    <PerfumeCard key={f.id} fragrance={f} />
                  ))}
                </div>
                {visibleCount < results.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                    >
                      Load more ({results.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
