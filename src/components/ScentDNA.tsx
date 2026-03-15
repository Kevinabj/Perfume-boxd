import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface ScentDNAProps {
  accords: { name: string; score: number }[];
  warmFreshRatio: number;
  sweetDryScale: number;
  projectionPref: number;
  seasonalBias: { season: string; percent: number }[];
  summary: string;
}

export function ScentDNA({ accords, warmFreshRatio, sweetDryScale, projectionPref, seasonalBias, summary }: ScentDNAProps) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

  const top5 = accords.slice(0, 5);
  const cx = 140, cy = 140, r = 100;
  const axes = top5.map((_, i) => {
    const angle = (Math.PI * 2 * i) / top5.length - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle };
  });

  const points = top5.map((a, i) => {
    const angle = (Math.PI * 2 * i) / top5.length - Math.PI / 2;
    const dist = (a.score / 100) * r;
    return `${cx + dist * Math.cos(angle)},${cy + dist * Math.sin(angle)}`;
  }).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        {/* Radar chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="shrink-0"
        >
          <svg width="280" height="280" viewBox="0 0 280 280">
            {rings.map((scale) => (
              <polygon
                key={scale}
                points={top5.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / top5.length - Math.PI / 2;
                  const d = r * scale;
                  return `${cx + d * Math.cos(angle)},${cy + d * Math.sin(angle)}`;
                }).join(" ")}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="0.5"
                opacity={0.5}
              />
            ))}
            {axes.map((a, i) => (
              <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.3} />
            ))}
            <motion.polygon
              points={animated ? points : top5.map(() => `${cx},${cy}`).join(" ")}
              fill="hsl(var(--primary) / 0.2)"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              style={{ transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            />
            {top5.map((a, i) => {
              const angle = (Math.PI * 2 * i) / top5.length - Math.PI / 2;
              const dist = animated ? (a.score / 100) * r : 0;
              const px = cx + dist * Math.cos(angle);
              const py = cy + dist * Math.sin(angle);
              const lx = cx + (r + 20) * Math.cos(angle);
              const ly = cy + (r + 20) * Math.sin(angle);
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="4" fill="hsl(var(--accent))" style={{ transition: "all 1s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                  <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="Inter">
                    {a.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Scales */}
        <div className="flex-1 space-y-5 w-full">
          {/* Warm vs Fresh */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Fresh</span><span>Warm</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${warmFreshRatio}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Sweet vs Dry */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Dry</span><span>Sweet</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sweetDryScale}%` }}
                transition={{ duration: 1, delay: 0.4 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Projection */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Subtle</span><span>Powerful</span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${projectionPref}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Seasonal bias */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Seasonal Bias</p>
            <div className="flex gap-2">
              {seasonalBias.map((s) => (
                <div key={s.season} className="flex-1 text-center">
                  <div className="h-16 rounded-lg bg-muted/20 relative overflow-hidden mb-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${s.percent}%` }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="absolute bottom-0 left-0 right-0 rounded-lg bg-primary"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{s.season}</span>
                  <p className="text-xs font-medium">{s.percent}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="p-4 rounded-xl bg-deep/50 border border-accent/10"
      >
        <p className="text-sm text-soft italic leading-relaxed">"{summary}"</p>
      </motion.div>
    </div>
  );
}
