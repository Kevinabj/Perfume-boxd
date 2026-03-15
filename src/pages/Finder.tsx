import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { fragrances as allCatalog, getFragranceById, searchFragrances } from "@/lib/catalog";
import { getRecommendations, getTopRatedFiltered, type FinderPreferences } from "@/lib/recommender";
import { useCollection } from "@/hooks/useCollection";
import { useMemo, useState } from "react";
import { Search, Sparkles, Target, Leaf, Zap, Filter, SlidersHorizontal, ToggleLeft, ToggleRight, X, Star } from "lucide-react";
import type { Fragrance } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

const seasons = ["Spring", "Summer", "Fall", "Winter"];
const accords = ["Woody", "Citrus", "Floral", "Fresh", "Sweet", "Spicy", "Amber", "Musky", "Fruity", "Aromatic", "Aquatic", "Oriental", "Oud", "Leather", "Green"];
const notes = ["Bergamot", "Oud", "Vanilla", "Sandalwood", "Patchouli", "Rose", "Musk", "Saffron", "Lavender", "Cedar", "Tobacco", "Jasmine"];

export default function FinderPage() {
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [wantedAccords, setWantedAccords] = useState<string[]>([]);
  const [avoidAccords, setAvoidAccords] = useState<string[]>([]);
  const [avoidNotes, setAvoidNotes] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [expertMode, setExpertMode] = useState(false);
  const [longevityRange, setLongevityRange] = useState([40, 100]);
  const [projectionRange, setProjectionRange] = useState([30, 100]);
  const [accordWeights, setAccordWeights] = useState<Record<string, number>>({});
  const [fillGaps, setFillGaps] = useState(false);
  const [fillSeasonalGaps, setFillSeasonalGaps] = useState(false);
  const [minRating, setMinRating] = useState(3.5);
  const [similarToQuery, setSimilarToQuery] = useState("");
  const [similarTo, setSimilarTo] = useState<Fragrance | null>(null);
  const [similarDropdownOpen, setSimilarDropdownOpen] = useState(false);

  const { items: collectionIds } = useCollection();

  const toggleIn = (arr: string[], s: string, set: (v: string[]) => void) => {
    set(arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]);
  };

  const userCollection = useMemo(
    () => collectionIds.map((id) => getFragranceById(id)).filter(Boolean) as import("@/types").Fragrance[],
    [collectionIds],
  );

  const similarSearchResults = useMemo(() => {
    if (similarToQuery.trim().length < 2) return [];
    return searchFragrances(similarToQuery, { limit: 6 });
  }, [similarToQuery]);

  const preferences = useMemo<FinderPreferences>(
    () => ({
      seasons: selectedSeasons.length > 0 ? selectedSeasons : undefined,
      wantedAccords: wantedAccords.length > 0 ? wantedAccords : undefined,
      avoidAccords: avoidAccords.length > 0 ? avoidAccords : undefined,
      avoidNotes: avoidNotes.length > 0 ? avoidNotes : undefined,
      accordWeights: Object.keys(accordWeights).length > 0 ? accordWeights : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      fillGaps,
      fillSeasonalGaps,
      similarTo: similarTo || undefined,
    }),
    [selectedSeasons, wantedAccords, avoidAccords, avoidNotes, accordWeights, minRating, fillGaps, fillSeasonalGaps, similarTo],
  );

  const scoredResults = useMemo(() => {
    if (!showResults) return [];
    if (userCollection.length > 0) {
      return getRecommendations(userCollection, allCatalog, preferences);
    }
    return getTopRatedFiltered(allCatalog, preferences);
  }, [showResults, userCollection, preferences]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">
            <span className="gradient-text">Perfume Finder</span>
          </h1>
          <p className="text-muted-foreground">Find your perfect scent through guided discovery</p>
        </div>

        {/* Expert mode toggle */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setExpertMode(!expertMode)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expertMode ? <ToggleRight size={20} className="text-accent" /> : <ToggleLeft size={20} />}
            Expert Mode
          </button>
        </div>

        {!showResults ? (
          <div className="space-y-6">
            {/* Step 1: Seasons */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Leaf size={18} className="text-accent" />
                <h3 className="font-display font-semibold">Choose seasons</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleIn(selectedSeasons, s, setSelectedSeasons)}
                    className={`px-5 py-2.5 rounded-xl text-sm transition-all ${selectedSeasons.includes(s) ? "bg-primary text-primary-foreground glow" : "glass-hover text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Wanted accords */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-accent" />
                <h3 className="font-display font-semibold">Accords you want</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {accords.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleIn(wantedAccords, a, setWantedAccords)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${wantedAccords.includes(a) ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>

              {/* Expert: Accord weight sliders */}
              <AnimatePresence>
                {expertMode && wantedAccords.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-2 overflow-hidden"
                  >
                    <p className="text-xs text-soft mb-2">Accord Weights</p>
                    {wantedAccords.map((a) => (
                      <div key={a} className="flex items-center gap-3">
                        <span className="text-xs w-20 text-muted-foreground truncate">{a}</span>
                        <input
                          type="range" min="1" max="10"
                          value={accordWeights[a] || 5}
                          onChange={(e) => setAccordWeights((w) => ({ ...w, [a]: Number(e.target.value) }))}
                          className="flex-1 accent-primary h-1"
                        />
                        <span className="text-xs w-4 text-right">{accordWeights[a] || 5}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 3: Avoid accords */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter size={18} className="text-accent" />
                <h3 className="font-display font-semibold">Accords to avoid</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {accords.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleIn(avoidAccords, a, setAvoidAccords)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${avoidAccords.includes(a) ? "bg-destructive/60 text-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Expert: Avoid specific notes */}
            <AnimatePresence>
              {expertMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-xl p-6 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-destructive" />
                    <h3 className="font-display font-semibold">Avoid specific notes</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((n) => (
                      <button
                        key={n}
                        onClick={() => toggleIn(avoidNotes, n, setAvoidNotes)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${avoidNotes.includes(n) ? "bg-destructive/60 text-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Expert: Longevity & Projection ranges */}
            <AnimatePresence>
              {expertMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass rounded-xl p-6 space-y-4 overflow-hidden"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <SlidersHorizontal size={18} className="text-accent" />
                    <h3 className="font-display font-semibold">Performance Targets</h3>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Target Longevity: {longevityRange[0]}–{longevityRange[1]}</label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="range" min="0" max="100" value={longevityRange[0]} onChange={(e) => setLongevityRange([Number(e.target.value), longevityRange[1]])} className="flex-1 accent-primary h-1" />
                      <input type="range" min="0" max="100" value={longevityRange[1]} onChange={(e) => setLongevityRange([longevityRange[0], Number(e.target.value)])} className="flex-1 accent-primary h-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Target Projection: {projectionRange[0]}–{projectionRange[1]}</label>
                    <div className="flex gap-2 items-center mt-1">
                      <input type="range" min="0" max="100" value={projectionRange[0]} onChange={(e) => setProjectionRange([Number(e.target.value), projectionRange[1]])} className="flex-1 accent-primary h-1" />
                      <input type="range" min="0" max="100" value={projectionRange[1]} onChange={(e) => setProjectionRange([projectionRange[0], Number(e.target.value)])} className="flex-1 accent-primary h-1" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options */}
            <div className="glass rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Similar to a specific perfume</label>
                {similarTo ? (
                  <div className="glass rounded-xl px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {similarTo.image_url ? (
                        <img src={similarTo.image_url} alt="" className="w-7 h-9 object-contain rounded shrink-0" />
                      ) : (
                        <div className="w-7 h-9 rounded bg-muted/30 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{similarTo.name}</p>
                        <p className="text-xs text-muted-foreground">{similarTo.brand}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setSimilarTo(null); setSimilarToQuery(""); }}
                      className="p-1 rounded hover:bg-muted/30"
                    >
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="glass rounded-xl flex items-center px-3 gap-2">
                      <Search size={14} className="text-muted-foreground" />
                      <input
                        value={similarToQuery}
                        onChange={(e) => { setSimilarToQuery(e.target.value); setSimilarDropdownOpen(true); }}
                        onFocus={() => setSimilarDropdownOpen(true)}
                        placeholder="Search a perfume..."
                        className="w-full bg-transparent py-2.5 text-sm outline-none text-foreground"
                      />
                    </div>
                    <AnimatePresence>
                      {similarDropdownOpen && similarSearchResults.length > 0 && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setSimilarDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute left-0 right-0 top-full mt-1 z-20 glass rounded-xl border border-border/30 shadow-lg max-h-64 overflow-y-auto"
                          >
                            {similarSearchResults.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => {
                                  setSimilarTo(f);
                                  setSimilarToQuery("");
                                  setSimilarDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors text-left"
                              >
                                {f.image_url ? (
                                  <img src={f.image_url} alt="" className="w-7 h-9 object-contain rounded shrink-0" />
                                ) : (
                                  <div className="w-7 h-9 rounded bg-muted/30 shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{f.brand}</p>
                                </div>
                                {f.fragrantica_rating > 0 && (
                                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    {f.fragrantica_rating.toFixed(1)}
                                  </div>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Min Rating: {minRating}</label>
                <input type="range" min="0" max="5" step="0.5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full accent-primary" />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" className="accent-primary" checked={fillGaps} onChange={(e) => setFillGaps(e.target.checked)} />
                Fill my collection gaps (use my coverage data)
              </label>
              {expertMode && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="accent-primary" checked={fillSeasonalGaps} onChange={(e) => setFillSeasonalGaps(e.target.checked)} />
                  Fill my seasonal gaps
                </label>
              )}
            </div>

            <button
              onClick={() => setShowResults(true)}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-medium transition-colors glow flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> Find Fragrances
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={() => setShowResults(false)}
              className="text-sm text-soft hover:underline"
            >
              ← Refine search
            </button>

            {scoredResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No fragrances match your criteria. Try broadening your filters.</p>
            ) : (
              <div className="space-y-4">
                {scoredResults.map((sr, i) => (
                  <motion.div
                    key={sr.fragrance.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-2"
                  >
                    <PerfumeCard fragrance={sr.fragrance} />
                    <div className="ml-2 flex gap-2 flex-wrap">
                      {sr.reasons.slice(0, 2).map((reason) => (
                        <span key={reason} className="text-xs px-3 py-1 rounded-full bg-deep text-soft flex items-center gap-1">
                          <Zap size={10} /> {reason}
                        </span>
                      ))}
                      {expertMode && (
                        <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent">
                          Score: {Math.round(sr.score)}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
