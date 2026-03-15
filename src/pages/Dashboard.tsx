import { Navbar } from "@/components/Navbar";
import { DashboardSubNav } from "@/components/DashboardSubNav";
import { getFragranceById } from "@/lib/catalog";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useWearingLog } from "@/hooks/useWearingLog";
import { useRatings } from "@/hooks/useRatings";
import { useActivity } from "@/hooks/useActivity";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { BarChart3, Heart, Star, BookOpen, TrendingUp, Sparkles, Shirt, Tag, Activity, Users, Plus, FlaskConical, User as UserIcon } from "lucide-react";
import { getProfile } from "@/lib/profile";
import { CalendarHeatmap } from "@/components/CalendarHeatmap";
import { ScentDNA } from "@/components/ScentDNA";
import { motion } from "framer-motion";
import { useMemo } from "react";
import type { Fragrance } from "@/types";

// ---------------------------------------------------------------------------
// Season helpers
// ---------------------------------------------------------------------------
function getCurrentSeason(): "spring" | "summer" | "fall" | "winter" {
  const m = new Date().getMonth(); // 0-11
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}

export default function Dashboard() {
  const { user } = useAuth();
  const { items: collectionIds } = useCollection();
  const { items: wishlistIds } = useWishlist();
  const { logs } = useWearingLog();
  const { ratings } = useRatings();
  const { activities } = useActivity();
  const { friends } = useFriends();

  // ---- Owned fragrances ----
  const ownedFragrances = useMemo(
    () => collectionIds.map((id) => getFragranceById(id)).filter((f): f is Fragrance => !!f),
    [collectionIds],
  );

  // ---- Avg rating (user's own Perfumisto ratings) ----
  const avgRating = useMemo(() => {
    if (ratings.length === 0) return 0;
    return ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
  }, [ratings]);

  // ---- Seasonal coverage ----
  const seasonCoverage = useMemo(() => {
    const seasons = ["spring", "summer", "fall", "winter"] as const;
    if (ownedFragrances.length === 0) return seasons.map((s) => ({ season: s, percent: 0 }));
    return seasons.map((s) => {
      const covered = ownedFragrances.filter((f) => {
        const perf = f.season_performance;
        if (!perf) return false;
        return (perf[s] ?? 0) > 50;
      }).length;
      return { season: s, percent: Math.round((covered / ownedFragrances.length) * 100) };
    });
  }, [ownedFragrances]);

  // ---- Top accords (aggregate) ----
  const topAccords = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of ownedFragrances) {
      for (const a of f.main_accords) {
        map.set(a.name, (map.get(a.name) || 0) + a.score);
      }
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, score]) => ({ name, count: score }));
  }, [ownedFragrances]);

  const maxAccordCount = Math.max(...topAccords.map((a) => a.count), 1);

  // ---- ScentDNA data ----
  const scentDNA = useMemo(() => {
    // Top 5 accords as radar
    const accordMap = new Map<string, number>();
    for (const f of ownedFragrances) {
      for (const a of f.main_accords) {
        accordMap.set(a.name, (accordMap.get(a.name) || 0) + a.score);
      }
    }
    const sortedAccords = Array.from(accordMap.entries()).sort(([, a], [, b]) => b - a);
    const maxScore = sortedAccords[0]?.[1] || 1;
    const accords = sortedAccords.slice(0, 5).map(([name, score]) => ({
      name,
      score: Math.round((score / maxScore) * 100),
    }));

    // Warm/Fresh — simple heuristic from accord names
    const warmKeys = ["woody", "amber", "oud", "spicy", "sweet", "oriental", "warm spicy", "balsamic", "leather"];
    const freshKeys = ["fresh", "citrus", "aquatic", "green", "aromatic", "ozonic"];
    let warmScore = 0, freshScore = 0;
    for (const [name, score] of accordMap) {
      const lower = name.toLowerCase();
      if (warmKeys.some((k) => lower.includes(k))) warmScore += score;
      if (freshKeys.some((k) => lower.includes(k))) freshScore += score;
    }
    const warmFreshRatio = warmScore + freshScore > 0 ? Math.round((warmScore / (warmScore + freshScore)) * 100) : 50;

    // Sweet/Dry
    const sweetKeys = ["sweet", "vanilla", "caramel", "fruity"];
    const dryKeys = ["woody", "leather", "smoky", "dry"];
    let sweetScore = 0, dryScore = 0;
    for (const [name, score] of accordMap) {
      const lower = name.toLowerCase();
      if (sweetKeys.some((k) => lower.includes(k))) sweetScore += score;
      if (dryKeys.some((k) => lower.includes(k))) dryScore += score;
    }
    const sweetDryScale = sweetScore + dryScore > 0 ? Math.round((sweetScore / (sweetScore + dryScore)) * 100) : 50;

    // Projection preference (avg sillage)
    const sillageFrags = ownedFragrances.filter((f) => f.sillage > 0);
    const projectionPref = sillageFrags.length > 0
      ? Math.round(sillageFrags.reduce((s, f) => s + f.sillage, 0) / sillageFrags.length)
      : 50;

    // Seasonal bias
    const seasonalBias = seasonCoverage.map((s) => ({
      season: s.season.charAt(0).toUpperCase() + s.season.slice(1),
      percent: s.percent,
    }));
    const totalPct = seasonalBias.reduce((s, b) => s + b.percent, 0) || 1;
    const normalizedBias = seasonalBias.map((b) => ({ ...b, percent: Math.round((b.percent / totalPct) * 100) }));

    // Summary
    const topAccord = accords[0]?.name || "varied";
    const warmOrFresh = warmFreshRatio > 60 ? "warm" : warmFreshRatio < 40 ? "fresh" : "balanced";
    const seasonPref = normalizedBias.sort((a, b) => b.percent - a.percent)[0]?.season.toLowerCase() || "versatile";
    const summary = ownedFragrances.length > 0
      ? `Your scent identity leans ${warmOrFresh} with a ${topAccord.toLowerCase()} signature and a ${seasonPref} bias.`
      : "Add fragrances to your collection to see your scent identity.";

    return { accords, warmFreshRatio, sweetDryScale, projectionPref, seasonalBias: normalizedBias, summary };
  }, [ownedFragrances, seasonCoverage]);

  // ---- Calendar heatmap (wearing log per month) ----
  const calendarData = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    const counts = Array(12).fill(0);
    logs.forEach((l) => {
      const d = new Date(l.worn_at);
      if (d.getFullYear() === currentYear) counts[d.getMonth()]++;
    });
    return months.map((m, i) => ({ month: m, value: counts[i] }));
  }, [logs]);

  const calendarInsight = useMemo(() => {
    const gaps = calendarData.filter((d) => d.value === 0).map((d) => d.month);
    if (gaps.length === 12) return "Start logging your wears to see patterns here.";
    if (gaps.length > 0) return `You have no wears logged in ${gaps.slice(0, 3).join(", ")}${gaps.length > 3 ? "..." : ""}. Fill the gaps!`;
    return "Great coverage! You're wearing fragrances year-round.";
  }, [calendarData]);

  // ---- What Should I Wear Today ----
  const todaySuggestion = useMemo(() => {
    const season = getCurrentSeason();
    return ownedFragrances
      .filter((f) => f.season_performance)
      .sort((a, b) => ((b.season_performance?.[season] ?? 0) - (a.season_performance?.[season] ?? 0)))
      .slice(0, 3);
  }, [ownedFragrances]);

  const seasonLabel = getCurrentSeason().charAt(0).toUpperCase() + getCurrentSeason().slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {(() => {
              const avatar = getProfile().avatar;
              return avatar ? (
                <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                  <UserIcon size={20} className="text-primary" />
                </div>
              );
            })()}
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back{(() => { const name = getProfile().displayName || user?.user_metadata?.username; return name ? `, ${name}` : ""; })()}</p>
            </div>
          </div>
          <DashboardSubNav />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { icon: BarChart3, label: "Owned", value: collectionIds.length, color: "text-primary" },
            { icon: Heart, label: "Wishlist", value: wishlistIds.length, color: "text-pink-500" },
            { icon: BookOpen, label: "Wears", value: logs.length, color: "text-blue-500" },
            { icon: Star, label: "Avg Rating", value: avgRating > 0 ? `${avgRating.toFixed(1)} (${ratings.length})` : "—", color: "text-amber-500" },
            { icon: Users, label: "Friends", value: friends.length, color: "text-violet-500" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 text-center"
            >
              <stat.icon size={24} className={`mx-auto mb-2 ${stat.color}`} />
              <p className="text-2xl font-bold font-display">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scent Identity */}
        {ownedFragrances.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Scent Identity
            </h3>
            <ScentDNA {...scentDNA} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Heatmap */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" /> Wearing Calendar
            </h3>
            <CalendarHeatmap data={calendarData} insight={calendarInsight} />
          </div>

          {/* Accord coverage */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-primary" /> Top Accords
            </h3>
            {topAccords.length > 0 ? (
              <div className="space-y-3">
                {topAccords.map((a) => (
                  <div key={a.name} className="flex items-center gap-3">
                    <span className="text-sm w-28 text-muted-foreground truncate">{a.name}</span>
                    <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(a.count / maxAccordCount) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-primary/60"
                      />
                    </div>
                    <span className="text-sm w-8 text-right">{Math.round(a.count)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Add fragrances to see your accord profile.</p>
            )}
          </div>

          {/* What Should I Wear Today */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Shirt size={18} className="text-primary" /> What Should I Wear?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">Best picks for {seasonLabel} from your collection:</p>
            {todaySuggestion.length > 0 ? (
              <div className="space-y-2">
                {todaySuggestion.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link to={`/fragrance/${f.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                      {f.image_url ? (
                        <img src={f.image_url} alt={f.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-deep flex items-center justify-center text-xs font-bold text-accent/40">{f.name[0]}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.brand}</p>
                      </div>
                      <span className="text-xs text-soft shrink-0">
                        {f.season_performance?.[getCurrentSeason()] ?? 0}% {seasonLabel}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Add fragrances with season data to get suggestions.</p>
            )}
          </div>

          {/* Seasonal Coverage */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
              <Tag size={18} className="text-primary" /> Seasonal Coverage
            </h3>
            <p className="text-xs text-muted-foreground mb-3">% of your collection suited for each season (score &gt; 50):</p>
            <div className="space-y-3">
              {seasonCoverage.map((s) => (
                <div key={s.season} className="flex items-center gap-3">
                  <span className="text-sm w-16 capitalize text-muted-foreground">{s.season}</span>
                  <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.percent}%` }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-accent/60"
                    />
                  </div>
                  <span className="text-sm w-10 text-right">{s.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My Activity */}
        <div className="glass rounded-xl p-6 mt-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary" /> My Activity
          </h3>
          {activities.length > 0 ? (
            <div className="space-y-2">
              {activities.slice(0, 10).map((act) => {
                const f = getFragranceById(act.fragrance_id);
                if (!f) return null;
                const icons: Record<string, typeof Star> = { rated: Star, added: Plus, wishlist: Heart, wear: FlaskConical };
                const Icon = icons[act.type] || Activity;
                const labels: Record<string, string> = { rated: "Rated", added: "Added to collection", wishlist: "Added to wishlist", wear: "Wore" };
                const timeAgo = getTimeAgo(act.created_at);
                return (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/10 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">{labels[act.type]}</span>{" "}
                        <Link to={`/fragrance/${f.id}`} className="font-medium hover:text-accent transition-colors">{f.name}</Link>
                        {act.type === "rated" && act.detail && (
                          <span className="text-muted-foreground"> — {act.detail}/5</span>
                        )}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Your activity will appear here as you rate, collect, and wear fragrances.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
