import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { fragrances as mockFragrances, getAllNotes as getCatalogNotes, getFragrancesByNotes } from "@/lib/catalog";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

function getAllNotes() {
  return getCatalogNotes();
}

export default function NotesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselected = searchParams.get("note");
  const [search, setSearch] = useState("");
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(
    preselected ? new Set(preselected.split(",")) : new Set()
  );

  const allNotes = useMemo(getAllNotes, []);

  const filteredNotes = allNotes.filter((n) =>
    !search || n.toLowerCase().includes(search.toLowerCase())
  );

  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const matchingFragrances = selectedNotes.size > 0
    ? getFragrancesByNotes(Array.from(selectedNotes))
    : [];

  // Reset when notes change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedNotes]);

  const toggleNote = (note: string) => {
    setSelectedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(note)) next.delete(note);
      else next.add(note);
      if (next.size > 0) setSearchParams({ note: Array.from(next).join(",") });
      else setSearchParams({});
      return next;
    });
  };

  const clearNotes = () => {
    setSelectedNotes(new Set());
    setSearchParams({});
  };

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    filteredNotes.forEach((n) => {
      const letter = n[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(n);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredNotes]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Browse by Notes</h1>

        <div className="glass rounded-xl flex items-center px-4 gap-3 mb-6">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes (e.g. Bergamot, Vanilla, Oud...)"
            className="w-full bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-80 shrink-0">
            {selectedNotes.size > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                {Array.from(selectedNotes).map((note) => (
                  <span key={note} className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm flex items-center gap-1.5">
                    {note}
                    <button onClick={() => toggleNote(note)}><X size={14} /></button>
                  </span>
                ))}
                <button onClick={clearNotes} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
                  Clear all
                </button>
              </div>
            )}

            <div className="glass rounded-xl p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {grouped.map(([letter, notes]) => (
                <div key={letter}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{letter}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {notes.map((n) => (
                      <button
                        key={n}
                        onClick={() => toggleNote(n)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          selectedNotes.has(n)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1">
            {selectedNotes.size > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {matchingFragrances.length} fragrance{matchingFragrances.length !== 1 ? "s" : ""} containing{" "}
                  {Array.from(selectedNotes).map((n, i) => (
                    <span key={n}>
                      {i > 0 && " + "}
                      <span className="font-medium text-foreground">{n}</span>
                    </span>
                  ))}
                </p>
                {matchingFragrances.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {matchingFragrances.slice(0, visibleCount).map((f, i) => (
                        <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 20) * 0.05 }}>
                          <PerfumeCard fragrance={f} />
                        </motion.div>
                      ))}
                    </div>
                    {visibleCount < matchingFragrances.length && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                          className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                          Load more ({matchingFragrances.length - visibleCount} remaining)
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">No fragrances found with all selected notes.</p>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Select one or more notes to see matching fragrances.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
