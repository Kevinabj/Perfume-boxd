import { motion } from "framer-motion";
import { useState } from "react";

interface CalendarHeatmapProps {
  data: { month: string; value: number }[];
  insight: string;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CalendarHeatmap({ data, insight }: CalendarHeatmapProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const getIntensityColor = (value: number) => {
    const intensity = value / maxVal;
    if (intensity === 0) return "bg-muted/40";
    if (intensity <= 0.25) return "bg-primary/15";
    if (intensity <= 0.5) return "bg-primary/30";
    if (intensity <= 0.75) return "bg-primary/50";
    return "bg-primary/70";
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
        {data.map((d, i) => {
          const intensity = d.value / maxVal;
          const isGap = d.value === 0;
          return (
            <motion.div
              key={d.month}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex flex-col items-center gap-1.5"
            >
              <span className="text-[10px] font-medium text-muted-foreground">{months[i]}</span>
              <div
                className={`w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${getIntensityColor(d.value)} ${
                  hovered === i ? "ring-2 ring-primary/40 scale-105" : ""
                } ${isGap ? "border-2 border-dashed border-destructive/25" : ""}`}
              >
                <span className={`text-sm font-bold ${intensity > 0.5 ? "text-primary-foreground" : "text-foreground"}`}>
                  {d.value}
                </span>
              </div>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-card border border-border shadow-sm text-[10px] text-foreground whitespace-nowrap z-10"
                >
                  {d.value} fragrance{d.value !== 1 ? "s" : ""}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 justify-center">
        <span className="text-[10px] text-muted-foreground">Less</span>
        <div className="w-3.5 h-3.5 rounded bg-muted/40" />
        <div className="w-3.5 h-3.5 rounded bg-primary/15" />
        <div className="w-3.5 h-3.5 rounded bg-primary/30" />
        <div className="w-3.5 h-3.5 rounded bg-primary/50" />
        <div className="w-3.5 h-3.5 rounded bg-primary/70" />
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>

      <div className="p-3 rounded-lg bg-deep text-xs text-soft">
        💡 {insight}
      </div>
    </div>
  );
}
