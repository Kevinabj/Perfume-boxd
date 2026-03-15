import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import {
  searchFragrances,
  getAllBrands,
  getAllNotes,
  getFragrancesByBrand,
  getFragrancesByNotes,
} from "@/lib/catalog";
import { Search, FlaskConical, Building2, Droplets, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

type Section = "fragrances" | "designers" | "notes";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeSection, setActiveSection] = useState<Section>("fragrances");

  // Drill-down state: when a designer or note is clicked, show their fragrances inline
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const PAGE_SIZE = 40;
  const [visibleFragrances, setVisibleFragrances] = useState(PAGE_SIZE);
  const [visibleBrandFrags, setVisibleBrandFrags] = useState(PAGE_SIZE);
  const [visibleNoteFrags, setVisibleNoteFrags] = useState(PAGE_SIZE);

  const q = query.trim().toLowerCase();

  // Reset counts when query changes
  useEffect(() => { setVisibleFragrances(PAGE_SIZE); }, [q]);
  useEffect(() => { setVisibleBrandFrags(PAGE_SIZE); }, [expandedBrand]);
  useEffect(() => { setVisibleNoteFrags(PAGE_SIZE); }, [expandedNote]);

  const fragranceResults = useMemo(() => {
    if (!q) return [];
    return searchFragrances(query, { limit: 500 });
  }, [q]);

  const designerResults = useMemo(() => {
    if (!q) return [];
    return getAllBrands().filter((b) => b.name.toLowerCase().includes(q));
  }, [q]);

  const noteResults = useMemo(() => {
    if (!q) return [];
    return getAllNotes().filter((n) => n.toLowerCase().includes(q));
  }, [q]);

  const brandFragrances = useMemo(() => {
    if (!expandedBrand) return [];
    return getFragrancesByBrand(expandedBrand);
  }, [expandedBrand]);

  const noteFragrances = useMemo(() => {
    if (!expandedNote) return [];
    return getFragrancesByNotes([expandedNote]);
  }, [expandedNote]);

  const counts: Record<Section, number> = {
    fragrances: fragranceResults.length,
    designers: designerResults.length,
    notes: noteResults.length,
  };

  const sections: { key: Section; label: string; icon: typeof Search }[] = [
    { key: "fragrances", label: "Fragrances", icon: Droplets },
    { key: "designers", label: "Designers", icon: Building2 },
    { key: "notes", label: "Notes", icon: FlaskConical },
  ];

  function handleSearch(value: string) {
    setQuery(value);
    setExpandedBrand(null);
    setExpandedNote(null);
    if (value.trim()) {
      setSearchParams({ q: value.trim() });
    } else {
      setSearchParams({});
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-7xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Search</h1>

        {/* Search input */}
        <div className="glass rounded-xl flex items-center px-4 gap-3 mb-6">
          <Search size={18} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search fragrances, designers, notes..."
            className="w-full bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {q && (
          <>
            {/* Section tabs with counts */}
            <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
              {sections.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => {
                    setActiveSection(sec.key);
                    setExpandedBrand(null);
                    setExpandedNote(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                    activeSection === sec.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <sec.icon size={14} />
                  {sec.label}
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeSection === sec.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {counts[sec.key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Fragrance results */}
            {activeSection === "fragrances" &&
              (fragranceResults.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {fragranceResults.slice(0, visibleFragrances).map((f) => (
                      <PerfumeCard key={f.id} fragrance={f} />
                    ))}
                  </div>
                  {visibleFragrances < fragranceResults.length && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={() => setVisibleFragrances((c) => c + PAGE_SIZE)}
                        className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                      >
                        Load more ({fragranceResults.length - visibleFragrances} remaining)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">No fragrances match &ldquo;{query}&rdquo;</p>
              ))}

            {/* Designer results */}
            {activeSection === "designers" && (
              <>
                {expandedBrand ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setExpandedBrand(null)}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to designers
                    </button>
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      {expandedBrand}
                      <span className="text-sm text-muted-foreground font-normal ml-2">
                        {brandFragrances.length} fragrance{brandFragrances.length !== 1 ? "s" : ""}
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {brandFragrances.slice(0, visibleBrandFrags).map((f) => (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <PerfumeCard fragrance={f} />
                        </motion.div>
                      ))}
                    </div>
                    {visibleBrandFrags < brandFragrances.length && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVisibleBrandFrags((c) => c + PAGE_SIZE)}
                          className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                          Load more ({brandFragrances.length - visibleBrandFrags} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                ) : designerResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {designerResults.map((brand) => (
                      <button
                        key={brand.name}
                        onClick={() => setExpandedBrand(brand.name)}
                        className="glass-hover rounded-xl p-5 flex items-center justify-between group text-left"
                      >
                        <div>
                          <h3 className="font-display font-semibold text-foreground group-hover:text-accent transition-colors">
                            {brand.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {brand.count} fragrance{brand.count !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <Building2 size={18} className="text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No designers match &ldquo;{query}&rdquo;</p>
                )}
              </>
            )}

            {/* Note results */}
            {activeSection === "notes" && (
              <>
                {expandedNote ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setExpandedNote(null)}
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <ArrowLeft size={14} /> Back to notes
                    </button>
                    <h2 className="text-lg font-display font-semibold text-foreground">
                      Fragrances with {expandedNote}
                      <span className="text-sm text-muted-foreground font-normal ml-2">
                        {noteFragrances.length} result{noteFragrances.length !== 1 ? "s" : ""}
                      </span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {noteFragrances.slice(0, visibleNoteFrags).map((f) => (
                        <motion.div
                          key={f.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <PerfumeCard fragrance={f} />
                        </motion.div>
                      ))}
                    </div>
                    {visibleNoteFrags < noteFragrances.length && (
                      <div className="flex justify-center mt-8">
                        <button
                          onClick={() => setVisibleNoteFrags((c) => c + PAGE_SIZE)}
                          className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                        >
                          Load more ({noteFragrances.length - visibleNoteFrags} remaining)
                        </button>
                      </div>
                    )}
                  </div>
                ) : noteResults.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {noteResults.map((note) => (
                      <button
                        key={note}
                        onClick={() => setExpandedNote(note)}
                        className="px-4 py-2 rounded-full glass-hover text-sm text-foreground hover:text-accent transition-colors"
                      >
                        {note}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No notes match &ldquo;{query}&rdquo;</p>
                )}
              </>
            )}
          </>
        )}

        {!q && (
          <div className="text-center py-20 text-muted-foreground">
            <Search size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Start typing to search across fragrances, designers, and notes</p>
          </div>
        )}
      </div>
    </div>
  );
}
