import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { fragrances as allFragrances } from "@/lib/catalog";
import { getAccordColor } from "@/data/accords";
import type { Fragrance } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Snowflake, Flower2, Sun, Leaf, Globe,
  Star, TrendingUp, Coffee, Zap, Gem, ArrowLeftRight,
  ChevronDown, X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Season definitions
// ---------------------------------------------------------------------------

type SeasonKey = "winter" | "spring" | "summer" | "fall" | "all";

interface SeasonMeta {
  key: SeasonKey;
  label: string;
  icon: typeof Sun;
  gradient: string;
  accent: string;
  tagline: string;
  keywords: string[];
}

const SEASONS: SeasonMeta[] = [
  {
    key: "winter",
    label: "Winter",
    icon: Snowflake,
    gradient: "from-slate-900 via-indigo-950 to-slate-800",
    accent: "text-blue-300",
    tagline: "Warm, resinous, spicy, cozy & luxurious",
    keywords: ["amber", "oud", "vanilla", "tobacco", "leather", "balsamic", "warm spicy", "smoky"],
  },
  {
    key: "spring",
    label: "Spring",
    icon: Flower2,
    gradient: "from-emerald-100 via-green-50 to-lime-100 dark:from-emerald-950 dark:via-green-950 dark:to-lime-950",
    accent: "text-emerald-600 dark:text-emerald-400",
    tagline: "Airy, floral, green & fresh",
    keywords: ["floral", "green", "fresh", "powdery", "aromatic", "white floral", "rose"],
  },
  {
    key: "summer",
    label: "Summer",
    icon: Sun,
    gradient: "from-amber-100 via-orange-50 to-yellow-100 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950",
    accent: "text-amber-600 dark:text-amber-400",
    tagline: "Fresh, citrus, aquatic, easy-wearing & bright",
    keywords: ["citrus", "aquatic", "marine", "fresh", "ozonic", "tropical", "fruity"],
  },
  {
    key: "fall",
    label: "Autumn",
    icon: Leaf,
    gradient: "from-orange-200 via-amber-100 to-red-100 dark:from-orange-950 dark:via-amber-950 dark:to-red-950",
    accent: "text-orange-600 dark:text-orange-400",
    tagline: "Warm, spicy, woody & textured",
    keywords: ["woody", "spicy", "earthy", "patchouli", "leather", "balsamic", "herbal", "warm spicy"],
  },
  {
    key: "all",
    label: "All Seasons",
    icon: Globe,
    gradient: "from-violet-100 via-purple-50 to-pink-100 dark:from-violet-950 dark:via-purple-950 dark:to-pink-950",
    accent: "text-violet-600 dark:text-violet-400",
    tagline: "Versatile fragrances for year-round wear",
    keywords: [],
  },
];

const PAGE_SIZE = 40;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSeasonScore(f: Fragrance, season: SeasonKey): number {
  if (season === "all") {
    // Versatile = all seasons roughly equal and above threshold
    const sp = f.season_performance;
    if (!sp) return 50;
    const vals = [sp.spring, sp.summer, sp.fall, sp.winter];
    const avg = vals.reduce((a, b) => a + b, 0) / 4;
    const variance = vals.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / 4;
    // Low variance + decent average = versatile
    return Math.max(0, avg - Math.sqrt(variance) * 0.5);
  }
  const sp = f.season_performance;
  if (sp && sp[season] > 0) return sp[season];

  // Fallback: infer from accords
  const meta = SEASONS.find((s) => s.key === season)!;
  const accordNames = (f.main_accords || []).map((a) => a.name.toLowerCase());
  let score = 0;
  for (const kw of meta.keywords) {
    if (accordNames.includes(kw)) score += 15;
  }
  return Math.min(score, 80);
}

function trendScore(f: Fragrance): number {
  return f.fragrantica_rating * Math.log(f.fragrantica_votes + 1);
}

// ---------------------------------------------------------------------------
// Section curators
// ---------------------------------------------------------------------------

interface CuratedSection {
  key: string;
  title: string;
  icon: typeof Star;
  description: string;
  items: Fragrance[];
}

function getCuratedSections(seasonFrags: Fragrance[], season: SeasonKey): CuratedSection[] {
  const sections: CuratedSection[] = [];

  // Best rated
  const bestRated = [...seasonFrags]
    .filter((f) => f.fragrantica_votes >= 50)
    .sort((a, b) => b.fragrantica_rating - a.fragrantica_rating)
    .slice(0, 10);
  if (bestRated.length > 0) {
    sections.push({
      key: "best-rated",
      title: "Best Rated",
      icon: Star,
      description: "Highest rated fragrances for this season",
      items: bestRated,
    });
  }

  // Trending
  const trending = [...seasonFrags]
    .sort((a, b) => trendScore(b) - trendScore(a))
    .slice(0, 10);
  if (trending.length > 0) {
    sections.push({
      key: "trending",
      title: "Trending",
      icon: TrendingUp,
      description: "Most popular picks right now",
      items: trending,
    });
  }

  // Daily wears (moderate sillage + good longevity)
  const dailyWears = [...seasonFrags]
    .filter((f) => f.sillage > 0 && f.sillage <= 60 && f.longevity >= 40 && f.fragrantica_rating >= 3.5)
    .sort((a, b) => b.fragrantica_rating - a.fragrantica_rating)
    .slice(0, 10);
  if (dailyWears.length > 0) {
    sections.push({
      key: "daily",
      title: "Easy Daily Wears",
      icon: Coffee,
      description: "Moderate projection, great longevity, crowd-pleasers",
      items: dailyWears,
    });
  }

  // Bold statement (high sillage)
  const bold = [...seasonFrags]
    .filter((f) => f.sillage >= 70 && f.fragrantica_rating >= 3.8)
    .sort((a, b) => b.sillage - a.sillage || b.fragrantica_rating - a.fragrantica_rating)
    .slice(0, 10);
  if (bold.length > 0) {
    sections.push({
      key: "bold",
      title: "Bold Statement Picks",
      icon: Zap,
      description: "High projection, unmistakable presence",
      items: bold,
    });
  }

  // Hidden gems (high rating, low votes)
  const gems = [...seasonFrags]
    .filter((f) => f.fragrantica_rating >= 4.0 && f.fragrantica_votes >= 5 && f.fragrantica_votes < 500)
    .sort((a, b) => b.fragrantica_rating - a.fragrantica_rating)
    .slice(0, 10);
  if (gems.length > 0) {
    sections.push({
      key: "gems",
      title: "Hidden Gems",
      icon: Gem,
      description: "Highly rated but under the radar",
      items: gems,
    });
  }

  // Cross-season (good score in current season AND at least one other)
  if (season !== "all") {
    const otherSeasons = (["spring", "summer", "fall", "winter"] as const).filter((s) => s !== season);
    const crossSeason = [...seasonFrags]
      .filter((f) => {
        const sp = f.season_performance;
        if (!sp) return false;
        return otherSeasons.some((os) => sp[os] >= 40);
      })
      .sort((a, b) => b.fragrantica_rating - a.fragrantica_rating)
      .slice(0, 10);
    if (crossSeason.length > 0) {
      sections.push({
        key: "cross",
        title: "Cross-Season Picks",
        icon: ArrowLeftRight,
        description: "Works great this season and transitions well to others",
        items: crossSeason,
      });
    }
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Filter sidebar component
// ---------------------------------------------------------------------------

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/20 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-1 py-2.5 text-sm font-medium text-foreground hover:text-primary transition-colors"
      >
        {title}
        <ChevronDown size={14} className={`transition-transform text-muted-foreground ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-3 px-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SeasonsPage() {
  const [activeSeason, setActiveSeason] = useState<SeasonKey>("winter");
  const [view, setView] = useState<"curated" | "browse">("curated");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filters (browse mode)
  const [minRating, setMinRating] = useState<number | null>(null);
  const [selectedAccords, setSelectedAccords] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [onlyHighlyRated, setOnlyHighlyRated] = useState(false);

  const seasonMeta = SEASONS.find((s) => s.key === activeSeason)!;

  // Reset on season change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeSeason, view, minRating, selectedAccords, selectedBrand, onlyHighlyRated]);

  // Compute season-scored fragrances
  const seasonFragrances = useMemo(() => {
    return allFragrances
      .map((f) => ({ fragrance: f, score: getSeasonScore(f, activeSeason) }))
      .filter((x) => x.score > 20)
      .sort((a, b) => b.score - a.score);
  }, [activeSeason]);

  // Get top accords for this season's fragrances
  const topAccords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { fragrance } of seasonFragrances.slice(0, 200)) {
      for (const a of fragrance.main_accords) {
        counts.set(a.name, (counts.get(a.name) || 0) + a.score);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name]) => name);
  }, [seasonFragrances]);

  // Filtered browse results
  const browseResults = useMemo(() => {
    let results = seasonFragrances.map((x) => x.fragrance);
    if (minRating !== null) {
      results = results.filter((f) => f.fragrantica_rating >= minRating);
    }
    if (selectedAccords.length > 0) {
      const accSet = new Set(selectedAccords.map((a) => a.toLowerCase()));
      results = results.filter((f) =>
        f.main_accords.some((a) => accSet.has(a.name.toLowerCase()))
      );
    }
    if (selectedBrand) {
      results = results.filter((f) => f.brand === selectedBrand);
    }
    if (onlyHighlyRated) {
      results = results.filter((f) => f.fragrantica_rating >= 4.0 && f.fragrantica_votes >= 20);
    }
    return results;
  }, [seasonFragrances, minRating, selectedAccords, selectedBrand, onlyHighlyRated]);

  // Brands for filter
  const seasonBrands = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { fragrance } of seasonFragrances.slice(0, 500)) {
      counts.set(fragrance.brand, (counts.get(fragrance.brand) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name, count]) => ({ name, count }));
  }, [seasonFragrances]);

  const filteredBrands = brandSearch
    ? seasonBrands.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
    : seasonBrands;

  // Curated sections
  const curatedSections = useMemo(() => {
    return getCuratedSections(
      seasonFragrances.slice(0, 500).map((x) => x.fragrance),
      activeSeason,
    );
  }, [seasonFragrances, activeSeason]);

  const activeFilterCount =
    (minRating !== null ? 1 : 0) +
    selectedAccords.length +
    (selectedBrand ? 1 : 0) +
    (onlyHighlyRated ? 1 : 0);

  function clearFilters() {
    setMinRating(null);
    setSelectedAccords([]);
    setSelectedBrand(null);
    setOnlyHighlyRated(false);
    setBrandSearch("");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-20">
        {/* Hero / Season selector */}
        <div className={`bg-gradient-to-br ${seasonMeta.gradient} transition-all duration-700`}>
          <div className="max-w-7xl mx-auto px-4 py-12">
            <motion.div
              key={activeSeason}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className={`text-3xl md:text-4xl font-display font-bold mb-2 ${
                activeSeason === "winter" ? "text-white" : "text-foreground"
              }`}>
                {seasonMeta.label} Fragrances
              </h1>
              <p className={`text-sm md:text-base ${
                activeSeason === "winter" ? "text-blue-200/80" : "text-muted-foreground"
              }`}>
                {seasonMeta.tagline}
              </p>
            </motion.div>

            {/* Season pills */}
            <div className="flex flex-wrap gap-2 mt-8">
              {SEASONS.map((s) => {
                const active = activeSeason === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSeason(s.key)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      active
                        ? activeSeason === "winter"
                          ? "bg-white/15 text-white ring-1 ring-white/30 shadow-lg"
                          : "bg-white dark:bg-zinc-800 text-foreground shadow-lg ring-1 ring-border/30"
                        : activeSeason === "winter"
                          ? "text-blue-200/70 hover:text-white hover:bg-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <s.icon size={16} />
                    {s.label}
                    {active && (
                      <motion.div
                        layoutId="season-indicator"
                        className="absolute inset-0 rounded-xl ring-2 ring-primary/30"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-8">
          {/* View toggle */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex gap-1 glass rounded-xl p-1">
              <button
                onClick={() => setView("curated")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "curated" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Curated
              </button>
              <button
                onClick={() => setView("browse")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === "browse" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Browse All
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {seasonFragrances.length} fragrances
            </p>
          </div>

          {/* ── Curated View ───────────────────────────────────────── */}
          {view === "curated" && (
            <div className="space-y-12">
              {curatedSections.map((section) => (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <section.icon size={18} className={seasonMeta.accent} />
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5 ml-8">
                    {section.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {section.items.map((f) => (
                      <PerfumeCard key={f.id} fragrance={f} />
                    ))}
                  </div>
                </motion.div>
              ))}

              {curatedSections.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">Not enough data yet for curated sections.</p>
                  <button
                    onClick={() => setView("browse")}
                    className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Browse all fragrances instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Browse View ────────────────────────────────────────── */}
          {view === "browse" && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar filters */}
              <aside className="lg:w-64 shrink-0">
                <div className="glass rounded-xl p-4 sticky top-24">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                        <X size={12} /> Clear ({activeFilterCount})
                      </button>
                    )}
                  </div>

                  <FilterSection title="Rating" defaultOpen>
                    <div className="flex gap-1.5">
                      {[3, 3.5, 4, 4.5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setMinRating(minRating === r ? null : r)}
                          className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${
                            minRating === r
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          {r}+
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Accords" defaultOpen>
                    <div className="flex flex-wrap gap-1.5">
                      {topAccords.map((accord) => {
                        const active = selectedAccords.includes(accord);
                        return (
                          <button
                            key={accord}
                            onClick={() =>
                              setSelectedAccords((prev) =>
                                active ? prev.filter((a) => a !== accord) : [...prev, accord]
                              )
                            }
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 ${
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: getAccordColor(accord) }}
                            />
                            {accord}
                          </button>
                        );
                      })}
                    </div>
                  </FilterSection>

                  <FilterSection title="Brand">
                    <input
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                      placeholder="Search brands..."
                      className="w-full bg-muted/20 rounded-lg px-3 py-1.5 text-xs outline-none text-foreground mb-2"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {filteredBrands.slice(0, 15).map((b) => (
                        <button
                          key={b.name}
                          onClick={() => setSelectedBrand(selectedBrand === b.name ? null : b.name)}
                          className={`w-full text-left text-xs px-2 py-1 rounded-md transition-colors truncate ${
                            selectedBrand === b.name
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                          }`}
                        >
                          {b.name} ({b.count})
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Quick Filters">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyHighlyRated}
                        onChange={(e) => setOnlyHighlyRated(e.target.checked)}
                        className="rounded border-border"
                      />
                      Only highly rated (4.0+)
                    </label>
                  </FilterSection>
                </div>
              </aside>

              {/* Results grid */}
              <div className="flex-1">
                {browseResults.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    <p className="text-lg font-display">No fragrances found</p>
                    <p className="text-sm mt-1">Try adjusting your filters.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Showing {Math.min(visibleCount, browseResults.length)} of {browseResults.length} fragrances
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {browseResults.slice(0, visibleCount).map((f) => (
                        <PerfumeCard key={f.id} fragrance={f} />
                      ))}
                    </div>
                    {visibleCount < browseResults.length && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                          className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                          Load more ({browseResults.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
