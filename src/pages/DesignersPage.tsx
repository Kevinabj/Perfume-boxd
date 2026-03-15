import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { fragrances as mockFragrances, getAllBrands, getFragrancesByBrand } from "@/lib/catalog";
import { Search, X } from "lucide-react";
import { motion } from "framer-motion";

export default function DesignersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preselected = searchParams.get("brand") || "";
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(preselected);

  const brands = useMemo(() => {
    return getAllBrands().sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredBrands = brands.filter((b) =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group by first letter
  const grouped = useMemo(() => {
    const map: Record<string, typeof filteredBrands> = {};
    filteredBrands.forEach((b) => {
      const letter = b.name[0].toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(b);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredBrands]);

  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const brandFragrances = selectedBrand
    ? getFragrancesByBrand(selectedBrand)
    : [];

  // Reset when brand changes
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [selectedBrand]);

  const selectBrand = (brand: string) => {
    setSelectedBrand(brand);
    setSearchParams({ brand });
  };

  const clearBrand = () => {
    setSelectedBrand("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Designers & Houses</h1>

        <div className="glass rounded-xl flex items-center px-4 gap-3 mb-6">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search designers..."
            className="w-full bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Brands list grouped by letter */}
          <div className="lg:w-80 shrink-0">
            {selectedBrand && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Selected:</span>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm flex items-center gap-1.5">
                  {selectedBrand}
                  <button onClick={clearBrand}><X size={14} /></button>
                </span>
              </div>
            )}

            <div className="glass rounded-xl p-4 max-h-[60vh] overflow-y-auto space-y-4">
              {grouped.map(([letter, items]) => (
                <div key={letter}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">{letter}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((b) => (
                      <button
                        key={b.name}
                        onClick={() => selectBrand(b.name)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                          selectedBrand === b.name
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        {b.name} ({b.count})
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand fragrances */}
          <div className="flex-1">
            {selectedBrand ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {brandFragrances.length} fragrance{brandFragrances.length !== 1 ? "s" : ""} by <span className="font-medium text-foreground">{selectedBrand}</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {brandFragrances.slice(0, visibleCount).map((f, i) => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 20) * 0.05 }}>
                      <PerfumeCard fragrance={f} />
                    </motion.div>
                  ))}
                </div>
                {visibleCount < brandFragrances.length && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                      className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                    >
                      Load more ({brandFragrances.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Select a designer to browse their fragrances.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
