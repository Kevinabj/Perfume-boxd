import { Navbar } from "@/components/Navbar";
import { DashboardSubNav } from "@/components/DashboardSubNav";
import { PerfumeCard } from "@/components/PerfumeCard";
import { EmptyState } from "@/components/SkeletonAndEmpty";
import { getFragranceById } from "@/lib/catalog";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useState, useEffect, useCallback } from "react";
import { useRatings } from "@/hooks/useRatings";
import { Search, Grid3X3, List, Download, Loader2 } from "lucide-react";
import type { Fragrance } from "@/types";

const PAGE_SIZE = 40;

export function CollectionPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { items, loading } = useCollection();
  const { getRating } = useRatings();

  const fragrances = items
    .map((id) => getFragranceById(id))
    .filter((f): f is Fragrance => !!f);
  const filtered = fragrances.filter(
    (f) => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.brand.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search]);

  const exportCSV = useCallback(() => {
    if (fragrances.length === 0) return;
    const escape = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };
    const header = "Name,Brand,Year,Rating,Accords,Fragrantica URL";
    const rows = fragrances.map((f) => {
      const myRating = getRating(f.id);
      const rating = myRating !== null ? myRating.toString() : (f.fragrantica_rating > 0 ? f.fragrantica_rating.toString() : "");
      const accords = f.main_accords.map((a) => a.name).join("; ");
      return [
        escape(f.name),
        escape(f.brand),
        f.year ? f.year.toString() : "",
        rating,
        escape(accords),
        f.fragrantica_url || "",
      ].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `perfumisto-collection-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fragrances, getRating]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-display font-bold">My Collection ({items.length})</h1>
          <DashboardSubNav />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex gap-3">
            <div className="glass rounded-xl flex items-center px-3 gap-2">
              <Search size={14} className="text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter..." className="bg-transparent py-2 text-sm outline-none text-foreground w-40" />
            </div>
            <button onClick={() => setView(view === "grid" ? "list" : "grid")} className="p-2.5 rounded-xl glass-hover">
              {view === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
            </button>
            <button onClick={exportCSV} className="p-2.5 rounded-xl glass-hover text-muted-foreground" title="Export collection as CSV">
              <Download size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
              {filtered.slice(0, visibleCount).map((f) => (
                <PerfumeCard key={f.id} fragrance={f} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  Load more ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="No fragrances found" description="Your collection is empty or doesn't match the filter." action={{ label: "Explore fragrances", onClick: () => window.location.href = "/fragrances" }} />
        )}
      </div>
    </div>
  );
}

export function WishlistPage() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { items, loading } = useWishlist();

  const fragrances = items
    .map((id) => getFragranceById(id))
    .filter((f): f is Fragrance => !!f);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-display font-bold">Wishlist ({items.length})</h1>
          <DashboardSubNav />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : fragrances.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fragrances.slice(0, visibleCount).map((f) => (
                <PerfumeCard key={f.id} fragrance={f} />
              ))}
            </div>
            {visibleCount < fragrances.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-6 py-2.5 rounded-xl glass-hover text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  Load more ({fragrances.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Your wishlist is empty" description="Browse fragrances and add ones you want to try." action={{ label: "Explore fragrances", onClick: () => window.location.href = "/fragrances" }} />
        )}
      </div>
    </div>
  );
}
