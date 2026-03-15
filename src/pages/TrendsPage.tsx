import { useState, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import {
  fragrances as allCatalog,
  getTrendingFragrances,
  getTrendingByAccord,
  getTrendingBySeason,
  searchFragrances,
} from "@/lib/catalog";
import { motion } from "framer-motion";
import { TrendingUp, Search, Flame, Leaf, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type View = "overall" | "accords" | "seasons";

// Generate simulated trend data from a fragrance's static score
// (real time-series data would come from Supabase reviews in a future iteration)
function generateTrendData(name: string, baseRating: number, months: number) {
  const data = [];
  const now = new Date();
  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const noise = Math.sin(i * 0.7 + name.length) * 0.3 + Math.cos(i * 0.3) * 0.15;
    const trend = (months - i) * 0.008;
    data.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      rating: Math.min(5, Math.max(2.5, baseRating + noise + trend)),
    });
  }
  return data;
}

const CHART_COLORS = [
  "hsl(273, 60%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(40, 80%, 50%)",
  "hsl(160, 55%, 45%)",
];

const timeRanges = ["6 months", "1 year", "2 years", "5 years"] as const;

export default function TrendsPage() {
  const [view, setView] = useState<View>("overall");
  const [timeRange, setTimeRange] = useState<(typeof timeRanges)[number]>("1 year");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    getTrendingFragrances(3).map((t) => t.fragrance.id),
  );

  const months =
    timeRange === "6 months" ? 6 : timeRange === "1 year" ? 12 : timeRange === "2 years" ? 24 : 60;

  const trending = useMemo(() => getTrendingFragrances(20), []);
  const byAccord = useMemo(() => getTrendingByAccord(5), []);
  const bySeason = useMemo(() => getTrendingBySeason(5), []);

  const selectedFragrances = allCatalog.filter((f) => selectedIds.includes(f.id));

  const chartData = useMemo(() => {
    if (selectedFragrances.length === 0) return [];
    const allData = selectedFragrances.map((f) => ({
      name: f.name,
      data: generateTrendData(f.name, f.fragrantica_rating, months),
    }));
    return allData[0].data.map((_, i) => {
      const point: Record<string, unknown> = { month: allData[0].data[i].month };
      allData.forEach((fd) => {
        point[fd.name] = fd.data[i]?.rating ?? 0;
      });
      return point;
    });
  }, [selectedFragrances, months]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const searchFiltered = search
    ? searchFragrances(search, { limit: 30 })
    : trending.map((t) => t.fragrance);

  const views: { key: View; label: string; icon: typeof TrendingUp }[] = [
    { key: "overall", label: "Overall", icon: TrendingUp },
    { key: "accords", label: "By Accord", icon: Flame },
    { key: "seasons", label: "By Season", icon: Leaf },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Fragrance Trends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top fragrances ranked by rating and community engagement
          </p>
        </div>

        {/* View tabs */}
        <div className="flex gap-1 glass rounded-xl p-1 w-fit mb-6">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                view === v.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <v.icon size={14} />
              {v.label}
            </button>
          ))}
        </div>

        {/* Overall view */}
        {view === "overall" && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: selector */}
            <div className="lg:w-72 shrink-0 space-y-4">
              <div className="glass rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3">
                  <Search size={14} className="text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search to add..."
                    className="w-full bg-transparent py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Select up to 5 to compare
                </p>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {searchFiltered.map((f) => {
                    const isSelected = selectedIds.includes(f.id);
                    const colorIdx = selectedIds.indexOf(f.id);
                    const score = trending.find((t) => t.fragrance.id === f.id)?.score;
                    return (
                      <button
                        key={f.id}
                        onClick={() => toggleSelect(f.id)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                          isSelected
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-muted/20"
                        }`}
                      >
                        {isSelected && (
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ background: CHART_COLORS[colorIdx] || CHART_COLORS[0] }}
                          />
                        )}
                        <span className="truncate">{f.name}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                          {score ? score.toFixed(1) : f.brand}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Top trending list */}
              <div className="glass rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-accent" /> Top Trending
                </h3>
                {trending.slice(0, 8).map((t, i) => (
                  <div key={t.fragrance.id} className="flex items-center justify-between text-sm gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-foreground truncate flex-1">{t.fragrance.name}</span>
                    <span className="text-xs text-accent font-medium shrink-0">
                      {t.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: chart */}
            <div className="flex-1 space-y-4">
              <div className="flex gap-1 glass rounded-xl overflow-hidden p-1 w-fit">
                {timeRanges.map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setTimeRange(tr)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      timeRange === tr
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-xl p-5"
              >
                {selectedFragrances.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
                    Select fragrances from the left to compare trends
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        interval={Math.max(0, Math.floor(chartData.length / 8))}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        domain={[2.5, 5]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        formatter={(value: number) => value.toFixed(2)}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                      {selectedFragrances.map((f, i) => (
                        <Line
                          key={f.id}
                          type="monotone"
                          dataKey={f.name}
                          stroke={CHART_COLORS[i]}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </motion.div>

              {/* Score cards for selected */}
              {selectedFragrances.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {selectedFragrances.slice(0, 4).map((f, i) => {
                    const score = trending.find((t) => t.fragrance.id === f.id)?.score ?? 0;
                    return (
                      <div key={f.id} className="glass rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                          <span className="text-xs font-medium text-foreground truncate">{f.name}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-bold text-foreground">{f.fragrantica_rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            Score: {score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* By Accord view */}
        {view === "accords" && (
          <div className="space-y-8">
            {Object.entries(byAccord).map(([accord, items]) => (
              <div key={accord}>
                <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Flame size={16} className="text-accent" />
                  {accord}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {items.map((t) => (
                    <motion.div
                      key={t.fragrance.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PerfumeCard fragrance={t.fragrance} />
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                        Score: {t.score.toFixed(1)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* By Season view */}
        {view === "seasons" && (
          <div className="space-y-8">
            {Object.entries(bySeason).map(([season, items]) => (
              <div key={season}>
                <h2 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Leaf size={16} className="text-accent" />
                  {season}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {items.map((t) => (
                    <motion.div
                      key={t.fragrance.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <PerfumeCard fragrance={t.fragrance} />
                      <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                        Score: {t.score.toFixed(1)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
