import { motion } from "framer-motion";
import { Snowflake, Droplets, Volume2, Flower, Diamond } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: "winter" | "fresh" | "beast" | "rose" | "niche";
  earned: boolean;
}

const iconMap = {
  winter: Snowflake,
  fresh: Droplets,
  beast: Volume2,
  rose: Flower,
  niche: Diamond,
};

export const mockAchievements: Achievement[] = [
  { id: "a1", name: "Winter Dominant", description: "Own 5+ winter fragrances", icon: "winter", earned: true },
  { id: "a2", name: "Fresh Collector", description: "Own 3+ fresh/citrus fragrances", icon: "fresh", earned: true },
  { id: "a3", name: "Beast Mode", description: "Average sillage above 70", icon: "beast", earned: true },
  { id: "a4", name: "Rose Enthusiast", description: "Own 3+ rose-noted fragrances", icon: "rose", earned: false },
  { id: "a5", name: "Niche Explorer", description: "Own fragrances from 5+ niche houses", icon: "niche", earned: false },
];

export function AchievementBadges({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {achievements.map((a, i) => {
        const Icon = iconMap[a.icon];
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
              a.earned
                ? "border-accent/30 bg-accent/5 hover:bg-accent/10"
                : "border-border/20 bg-muted/10 opacity-40"
            }`}
          >
            <Icon size={14} className={a.earned ? "text-accent" : "text-muted-foreground"} />
            <span className={`text-xs font-medium ${a.earned ? "text-foreground" : "text-muted-foreground"}`}>
              {a.name}
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-card border border-border text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {a.description}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
