import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AccordBarStack } from "@/components/AccordBarStack";
import { RatingStars } from "@/components/RatingStars";
import { LongevityMeter, SillageMeter } from "@/components/Meters";
import { fragrances as allFragrances, getFragranceById, searchFragrances } from "@/lib/catalog";
import { getAccordColor } from "@/data/accords";
import { Plus, X, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Fragrance } from "@/types";

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const initialIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = selectedIds.map((id) => getFragranceById(id)).filter(Boolean) as Fragrance[];

  const addFragrance = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
      setSearch("");
      setSearchOpen(false);
    }
  };

  const removeFragrance = (id: string) => {
    setSelectedIds(selectedIds.filter((x) => x !== id));
  };

  const searchResults = search
    ? searchFragrances(search, { limit: 20 }).filter((f) => !selectedIds.includes(f.id))
    : [];

  // Collect all unique notes across selected
  const allNotes = useMemo(() => {
    const noteSet = new Set<string>();
    selected.forEach((f) => {
      [...f.top_notes, ...f.heart_notes, ...f.base_notes].forEach((n) => noteSet.add(n));
    });
    return Array.from(noteSet);
  }, [selected]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Compare Fragrances</h1>

        {/* Selection bar */}
        <div className="glass rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            {selected.map((f) => (
              <div key={f.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                {f.image_url && <img src={f.image_url} alt={f.name} className="w-6 h-6 rounded object-contain" />}
                <span className="text-sm font-medium">{f.name}</span>
                <button onClick={() => removeFragrance(f.id)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            ))}
            {selectedIds.length < 4 && (
              <div className="relative">
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 text-muted-foreground hover:bg-muted/50 text-sm transition-colors"
                >
                  <Plus size={14} /> Add fragrance
                </button>
                {searchOpen && (
                  <div className="absolute top-full mt-2 left-0 w-72 glass rounded-xl p-2 z-20 shadow-lg">
                    <div className="flex items-center gap-2 px-2 mb-2">
                      <Search size={14} className="text-muted-foreground" />
                      <input
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search..."
                        className="w-full bg-transparent text-sm outline-none text-foreground"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {searchResults.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => addFragrance(f.id)}
                          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm hover:bg-muted/20 transition-colors text-left"
                        >
                          {f.image_url && <img src={f.image_url} alt={f.name} className="w-7 h-7 rounded object-contain" />}
                          <div>
                            <p className="font-medium text-foreground">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.brand}</p>
                          </div>
                        </button>
                      ))}
                      {search && searchResults.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2 py-3 text-center">No results</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {selected.length < 2 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-2">Add at least 2 fragrances to compare.</p>
            <p className="text-xs text-muted-foreground">You can compare up to 4 fragrances side by side.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header row with images */}
            <div className="glass rounded-xl overflow-hidden">
              <div className={`grid gap-0 divide-x divide-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4" />
                {selected.map((f) => (
                  <div key={f.id} className="p-4 text-center">
                    <Link to={`/fragrance/${f.id}`}>
                      {f.image_url && (
                        <img src={f.image_url} alt={f.name} className="w-20 h-28 object-contain mx-auto mb-3" />
                      )}
                      <p className="font-display font-semibold text-sm text-foreground hover:text-primary transition-colors">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.brand}</p>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Ratings */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Rating</span>
                </div>
                {selected.map((f) => {
                  const rating = f.perfumisto_rating > 0 ? f.perfumisto_rating : f.fragrantica_rating;
                  const votes = f.perfumisto_rating > 0 ? f.perfumisto_votes : f.fragrantica_votes;
                  return (
                    <div key={f.id} className="p-4 text-center">
                      {rating > 0 ? (
                        <>
                          <RatingStars rating={rating} size={14} />
                          {votes > 0 && <p className="text-[10px] text-muted-foreground mt-1">({votes.toLocaleString()} votes)</p>}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No rating</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Longevity */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Longevity</span>
                </div>
                {selected.map((f) => (
                  <div key={f.id} className="p-4">
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${f.longevity}%` }}
                        className="h-full rounded-full bg-primary/50"
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-muted-foreground">{f.longevity}%</p>
                  </div>
                ))}
              </div>

              {/* Sillage */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Sillage</span>
                </div>
                {selected.map((f) => (
                  <div key={f.id} className="p-4">
                    <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${f.sillage}%` }}
                        className="h-full rounded-full bg-accent/50"
                      />
                    </div>
                    <p className="text-xs text-center mt-1 text-muted-foreground">{f.sillage}%</p>
                  </div>
                ))}
              </div>

              {/* Seasons */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Seasons</span>
                </div>
                {selected.map((f) => (
                  <div key={f.id} className="p-4">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {f.season_tags?.map((s) => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-deep text-soft">{s}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main Accords */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Main Accords</span>
                </div>
                {selected.map((f) => (
                  <div key={f.id} className="p-4">
                    <div className="space-y-1">
                      {f.main_accords.slice(0, 4).map((a) => (
                        <div key={a.name} className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getAccordColor(a.name) }} />
                          <span className="text-[10px] text-muted-foreground truncate flex-1">{a.name}</span>
                          <span className="text-[10px] text-muted-foreground">{a.score}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Shared Notes */}
              <div className={`grid gap-0 divide-x divide-border/20 border-t border-border/20`} style={{ gridTemplateColumns: `200px repeat(${selected.length}, 1fr)` }}>
                <div className="p-4 flex items-center">
                  <span className="text-xs font-medium text-muted-foreground">Notes</span>
                </div>
                {selected.map((f) => {
                  const fNotes = [...f.top_notes, ...f.heart_notes, ...f.base_notes];
                  return (
                    <div key={f.id} className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {fNotes.slice(0, 6).map((n) => {
                          // Check if shared with other selected fragrances
                          const isShared = selected.some(
                            (other) =>
                              other.id !== f.id &&
                              [...other.top_notes, ...other.heart_notes, ...other.base_notes].includes(n)
                          );
                          return (
                            <span
                              key={n}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                isShared ? "bg-primary/15 text-primary font-medium" : "bg-muted/20 text-muted-foreground"
                              }`}
                            >
                              {n}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
