import { motion } from "framer-motion";
import { Heart, Music, Sun, Droplets } from "lucide-react";

interface CompatibilityProps {
  overallPercent: number;
  accordOverlap: number;
  collectionOverlap: number;
  ratingSimilarity: number;
  seasonalAlignment: number;
  sharedAccords: string[];
  sharedFragrances: string[];
}

export function CompatibilityCard({
  overallPercent, accordOverlap, collectionOverlap, ratingSimilarity, seasonalAlignment, sharedAccords, sharedFragrances
}: CompatibilityProps) {
  const metrics = [
    { label: "Accord Overlap", value: accordOverlap, icon: Droplets },
    { label: "Collection Overlap", value: collectionOverlap, icon: Music },
    { label: "Rating Similarity", value: ratingSimilarity, icon: Heart },
    { label: "Seasonal Alignment", value: seasonalAlignment, icon: Sun },
  ];

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-20 h-20 rounded-full border-2 border-accent/40 flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(hsl(var(--accent)) ${overallPercent * 3.6}deg, hsl(var(--muted) / 0.2) 0deg)`,
          }}
        >
          <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center">
            <span className="text-xl font-bold text-accent">{overallPercent}%</span>
          </div>
        </motion.div>
        <div>
          <p className="font-display font-semibold">Scent Compatibility</p>
          <p className="text-xs text-muted-foreground">
            {overallPercent >= 75 ? "You two have very similar taste!" : overallPercent >= 50 ? "Some overlap in preferences." : "Different scent personalities."}
          </p>
        </div>
      </div>

      {/* Metric bars */}
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <m.icon size={12} /> {m.label}
              </span>
              <span className="text-foreground font-medium">{m.value}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.value}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Shared accords */}
      {sharedAccords.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Shared Top Accords</p>
          <div className="flex flex-wrap gap-1.5">
            {sharedAccords.map((a) => (
              <span key={a} className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Shared fragrances */}
      {sharedFragrances.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Shared Favorites</p>
          <div className="flex flex-wrap gap-1.5">
            {sharedFragrances.map((f) => (
              <span key={f} className="text-[10px] px-2.5 py-1 rounded-full bg-primary/10 text-soft border border-primary/20">{f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
