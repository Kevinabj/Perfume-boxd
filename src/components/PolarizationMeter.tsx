import { motion } from "framer-motion";

interface PolarizationMeterProps {
  variance: number; // 0-2
  distribution: number[]; // [1star%, 2star%, 3star%, 4star%, 5star%]
}

export function PolarizationMeter({ variance, distribution }: PolarizationMeterProps) {
  const polarizationScore = Math.min(100, Math.round(variance * 50));
  const label = polarizationScore >= 60 ? "Highly Polarizing" : polarizationScore >= 35 ? "Moderately Divisive" : "Universally Loved";
  const labelColor = polarizationScore >= 60 ? "text-destructive" : polarizationScore >= 35 ? "text-yellow-400" : "text-accent";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Polarization</span>
        <span className={`text-xs font-medium ${labelColor}`}>{label}</span>
      </div>

      {/* Distribution bars */}
      <div className="flex items-end gap-1 h-12">
        {distribution.map((pct, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(pct, 4)}%` }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="flex-1 rounded-t-sm"
            style={{
              background: i <= 1 ? "hsl(var(--destructive) / 0.6)" : i === 2 ? "hsl(var(--muted-foreground) / 0.4)" : "hsl(var(--accent) / 0.6)",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>1★</span><span>2★</span><span>3★</span><span>4★</span><span>5★</span>
      </div>

      {/* Score bar */}
      <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${polarizationScore}%` }}
          transition={{ duration: 0.8 }}
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, hsl(var(--accent)), hsl(var(--destructive)))`,
          }}
        />
      </div>
    </div>
  );
}
