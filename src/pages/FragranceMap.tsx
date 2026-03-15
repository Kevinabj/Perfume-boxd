import { Navbar } from "@/components/Navbar";
import { fragrances as catalogFragrances } from "@/lib/catalog";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Fragrance } from "@/types";

function getFreshWarm(f: Fragrance): number {
  const freshAccords = ["fresh", "citrus", "aquatic", "green", "aromatic"];
  const warmAccords = ["amber", "oriental", "oud", "sweet", "warm_spicy", "leather", "tobacco"];
  let fresh = 0, warm = 0;
  f.main_accords.forEach((a) => {
    const k = a.name.toLowerCase().replace(/[\s-]/g, "_");
    if (freshAccords.includes(k)) fresh += a.score;
    if (warmAccords.includes(k)) warm += a.score;
  });
  const total = fresh + warm || 1;
  return (warm / total) * 100; // 0=fresh, 100=warm
}

function getLightHeavy(f: Fragrance): number {
  return (f.longevity * 0.5 + f.sillage * 0.5);
}

export default function FragranceMapPage() {
  const [zoom, setZoom] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "collection" | "wishlist">("all");

  const { items: collectionItems } = useCollection();
  const { items: wishlistItems } = useWishlist();

  const ownedIds = useMemo(() => new Set(collectionItems), [collectionItems]);
  const wishlistIds = useMemo(() => new Set(wishlistItems), [wishlistItems]);

  const fragrances = useMemo(() => {
    let list = catalogFragrances;
    if (filter === "collection") list = list.filter((f) => ownedIds.has(f.id));
    if (filter === "wishlist") list = list.filter((f) => wishlistIds.has(f.id));
    return list.map((f) => ({
      ...f,
      x: getFreshWarm(f),
      y: getLightHeavy(f),
    }));
  }, [filter, ownedIds, wishlistIds]);

  const hoveredFrag = fragrances.find((f) => f.id === hovered);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">Fragrance Map</h1>
            <p className="text-sm text-muted-foreground">Explore fragrances in 2D space</p>
          </div>
          <div className="flex gap-2">
            {(["all", "collection", "wishlist"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all capitalize ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          {/* Axis labels */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50">Light</div>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50">Heavy</div>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 -rotate-90">Fresh</div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/50 rotate-90">Warm</div>

          {/* Grid */}
          <svg className="w-full aspect-square max-h-[500px]" viewBox="0 0 100 100" style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.3s" }}>
            {/* Grid lines */}
            {[25, 50, 75].map((v) => (
              <g key={v}>
                <line x1={v} y1={0} x2={v} y2={100} stroke="hsl(var(--border))" strokeWidth="0.2" opacity="0.3" />
                <line x1={0} y1={v} x2={100} y2={v} stroke="hsl(var(--border))" strokeWidth="0.2" opacity="0.3" />
              </g>
            ))}
            <line x1={50} y1={0} x2={50} y2={100} stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
            <line x1={0} y1={50} x2={100} y2={50} stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />

            {/* Data points */}
            {fragrances.map((f) => {
              const isOwned = ownedIds.has(f.id);
              const isWish = wishlistIds.has(f.id);
              const isHov = hovered === f.id;
              return (
                <g key={f.id}>
                  <circle
                    cx={f.x}
                    cy={100 - f.y}
                    r={isHov ? 3 : 2}
                    fill={isOwned ? "hsl(var(--accent))" : isWish ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    opacity={isHov ? 1 : 0.7}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHovered(f.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {isHov && (
                    <text x={f.x} y={100 - f.y - 4} textAnchor="middle" fontSize="2.5" fill="hsl(var(--foreground))">
                      {f.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 flex gap-1">
            <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="p-1.5 rounded-lg glass-hover"><ZoomIn size={14} /></button>
            <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="p-1.5 rounded-lg glass-hover"><ZoomOut size={14} /></button>
          </div>

          {/* Hover card */}
          {hoveredFrag && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 right-4 w-56 glass rounded-xl p-4 space-y-2"
            >
              <Link to={`/fragrance/${hoveredFrag.id}`} className="hover:text-accent transition-colors">
                <p className="text-sm font-semibold">{hoveredFrag.name}</p>
                <p className="text-xs text-muted-foreground">{hoveredFrag.brand}</p>
              </Link>
              <div className="flex flex-wrap gap-1">
                {hoveredFrag.main_accords.slice(0, 3).map((a) => (
                  <span key={a.name} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-soft">{a.name}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 justify-center text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent" /> Owned</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Wishlist</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Other</span>
        </div>
      </div>
    </div>
  );
}
