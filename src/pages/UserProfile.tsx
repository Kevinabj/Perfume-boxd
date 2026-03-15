import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useRatings } from "@/hooks/useRatings";
import { useWearingLog } from "@/hooks/useWearingLog";
import { useFriends } from "@/hooks/useFriends";
import { useReviews } from "@/hooks/useReviews";
import { getFragranceById } from "@/lib/catalog";
import { getProfile } from "@/lib/profile";
import { AccordBarStack } from "@/components/AccordBarStack";
import { ScentDNA } from "@/components/ScentDNA";
import { User as UserIcon, Star } from "lucide-react";
import { useMemo } from "react";
import type { Fragrance } from "@/types";

export default function UserProfile() {
  const { username } = useParams();
  const { user } = useAuth();
  const { items: collectionIds } = useCollection();
  const { items: wishlistIds } = useWishlist();
  const { ratings } = useRatings();
  const { logs } = useWearingLog();
  const { friends } = useFriends();
  const { reviews } = useReviews();

  const profile = getProfile();

  const currentUsername =
    (user as any)?.user_metadata?.username ||
    (user as any)?.username ||
    user?.email?.split("@")[0] ||
    "";

  const isOwnProfile = !!user && username === currentUsername;

  // ---------- Not own profile ----------
  if (!isOwnProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 max-w-md mx-auto px-4 text-center">
          <div className="glass rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-4">
              <UserIcon size={28} className="text-accent" />
            </div>
            <h2 className="text-lg font-display font-semibold mb-2">@{username}</h2>
            <p className="text-sm text-muted-foreground">
              Profile viewing for other users coming soon.
            </p>
            <Link
              to="/me"
              className="inline-block mt-4 px-5 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors"
            >
              Go to your dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Own profile — real data ----------
  const ownedFragrances = collectionIds
    .map((id) => getFragranceById(id))
    .filter((f): f is Fragrance => !!f);

  const displayName = profile.displayName || currentUsername;

  // Season coverage
  const seasonCoverage = (() => {
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
  })();

  // ScentDNA computation (same logic as Dashboard)
  const scentDNA = useMemo(() => {
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

    const warmKeys = ["woody", "amber", "oud", "spicy", "sweet", "oriental", "warm spicy", "balsamic", "leather"];
    const freshKeys = ["fresh", "citrus", "aquatic", "green", "aromatic", "ozonic"];
    let warmScore = 0, freshScore = 0;
    for (const [name, score] of accordMap) {
      const lower = name.toLowerCase();
      if (warmKeys.some((k) => lower.includes(k))) warmScore += score;
      if (freshKeys.some((k) => lower.includes(k))) freshScore += score;
    }
    const warmFreshRatio = warmScore + freshScore > 0 ? Math.round((warmScore / (warmScore + freshScore)) * 100) : 50;

    const sweetKeys = ["sweet", "vanilla", "caramel", "fruity"];
    const dryKeys = ["woody", "leather", "smoky", "dry"];
    let sweetScore = 0, dryScore = 0;
    for (const [name, score] of accordMap) {
      const lower = name.toLowerCase();
      if (sweetKeys.some((k) => lower.includes(k))) sweetScore += score;
      if (dryKeys.some((k) => lower.includes(k))) dryScore += score;
    }
    const sweetDryScale = sweetScore + dryScore > 0 ? Math.round((sweetScore / (sweetScore + dryScore)) * 100) : 50;

    const sillageFrags = ownedFragrances.filter((f) => f.sillage > 0);
    const projectionPref = sillageFrags.length > 0
      ? Math.round(sillageFrags.reduce((s, f) => s + f.sillage, 0) / sillageFrags.length)
      : 50;

    const seasonalBias = seasonCoverage.map((s) => ({
      season: s.season.charAt(0).toUpperCase() + s.season.slice(1),
      percent: s.percent,
    }));
    const totalPct = seasonalBias.reduce((s, b) => s + b.percent, 0) || 1;
    const normalizedBias = seasonalBias.map((b) => ({ ...b, percent: Math.round((b.percent / totalPct) * 100) }));

    const topAccord = accords[0]?.name || "varied";
    const warmOrFresh = warmFreshRatio > 60 ? "warm" : warmFreshRatio < 40 ? "fresh" : "balanced";
    const seasonPref = [...normalizedBias].sort((a, b) => b.percent - a.percent)[0]?.season.toLowerCase() || "versatile";
    const summary = ownedFragrances.length > 0
      ? `${displayName}'s scent identity leans ${warmOrFresh} with a ${topAccord.toLowerCase()} signature and a ${seasonPref} bias.`
      : "Add fragrances to your collection to see your scent identity.";

    return { accords, warmFreshRatio, sweetDryScale, projectionPref, seasonalBias: normalizedBias, summary };
  }, [ownedFragrances, seasonCoverage, displayName]);

  // Top-rated fragrances
  const topRated = useMemo(() => {
    return [...ratings]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((r) => ({ fragrance: getFragranceById(r.fragrance_id), rating: r.rating }))
      .filter((r): r is { fragrance: Fragrance; rating: number } => !!r.fragrance);
  }, [ratings]);

  const reviewCount = reviews.filter((r) => r.user_id === user?.id).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
        {/* Profile header */}
        <div className="glass rounded-2xl p-8 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/30 overflow-hidden flex items-center justify-center mx-auto mb-4">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={32} className="text-accent" />
            )}
          </div>
          <h1 className="text-2xl font-display font-bold">{displayName}</h1>
          <p className="text-sm text-muted-foreground">@{currentUsername}</p>
          {profile.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{profile.bio}</p>
          )}
          <div className="flex justify-center gap-6 mt-6 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg">{collectionIds.length}</p>
              <p className="text-xs text-muted-foreground">Collection</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{reviewCount}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{friends.length}</p>
              <p className="text-xs text-muted-foreground">Friends</p>
            </div>
          </div>
        </div>

        {/* Scent Identity */}
        {ownedFragrances.length > 0 && (
          <div className="glass rounded-xl p-6 mb-6">
            <h3 className="font-display font-semibold mb-4">Scent Identity</h3>
            <ScentDNA {...scentDNA} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Accords */}
          {scentDNA.accords.length > 0 && (
            <div className="glass rounded-xl p-6">
              <h3 className="font-display font-semibold mb-4">Top Accords</h3>
              <AccordBarStack accords={scentDNA.accords} />
            </div>
          )}

          {/* Highest Rated */}
          <div className="glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4">Highest Rated</h3>
            {topRated.length > 0 ? (
              <div className="space-y-3">
                {topRated.map(({ fragrance, rating }) => (
                  <Link
                    key={fragrance.id}
                    to={`/fragrance/${fragrance.id}`}
                    className="flex items-center gap-3 hover:bg-muted/10 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                  >
                    {fragrance.image_url ? (
                      <img src={fragrance.image_url} alt="" className="w-8 h-10 rounded object-contain shrink-0" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-muted/20 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fragrance.name}</p>
                      <p className="text-xs text-muted-foreground">{fragrance.brand}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-accent shrink-0">
                      <Star size={12} className="fill-accent" />
                      {rating}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Rate fragrances to see your favorites here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
