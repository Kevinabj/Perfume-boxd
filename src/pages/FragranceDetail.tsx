import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { AccordBarStack } from "@/components/AccordBarStack";
import { RatingStars } from "@/components/RatingStars";
import { LongevityMeter, SillageMeter } from "@/components/Meters";
import { ReviewCard } from "@/components/ReviewCard";
import { SimilarityCard } from "@/components/SimilarityCard";
import { PolarizationMeter } from "@/components/PolarizationMeter";
import { NoteIcon } from "@/components/NoteIcon";
import { getFragranceById, getSimilarFragrances } from "@/lib/catalog";
import { useReviews } from "@/hooks/useReviews";
import { Heart, Plus, Star, Share2, ExternalLink, User, Tag, Check, X, ThumbsUp, CheckCircle, Mail, Copy, Link as LinkIcon, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logoDark from "@/assets/logo-dark.png";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useRatings } from "@/hooks/useRatings";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/contexts/AuthContext";
import type { Fragrance, CommunityOpinion } from "@/types";

const moodTags = ["Dark", "Clean", "Seductive", "Boss Energy", "Cozy", "Dangerous", "Minimalist"];

const SEASON_GROUP = [
  { key: "spring" as const, label: "Spring", icon: "🌸", color: "#f472b6" },
  { key: "summer" as const, label: "Summer", icon: "☀️", color: "#fbbf24" },
  { key: "fall" as const,   label: "Fall",   icon: "🍂", color: "#f97316" },
  { key: "winter" as const, label: "Winter", icon: "❄️", color: "#60a5fa" },
] as const;

const TIME_GROUP = [
  { key: "day" as const,    label: "Day",    icon: "🌤️", color: "#facc15" },
  { key: "night" as const,  label: "Night",  icon: "🌙", color: "#3b82f6" },
] as const;

const GENDER_SEGMENTS = [
  { key: "female",      label: "Female",      color: "#ec4899" },
  { key: "more female", label: "More Female", color: "#f9a8d4" },
  { key: "unisex",      label: "Unisex",      color: "#a78bfa" },
  { key: "more male",   label: "More Male",   color: "#93c5fd" },
  { key: "male",        label: "Male",        color: "#3b82f6" },
] as const;

function sharedNoteCount(a: Fragrance, b: Fragrance): number {
  const aSet = new Set([...a.top_notes, ...a.heart_notes, ...a.base_notes].map((n) => n.toLowerCase()));
  return [...b.top_notes, ...b.heart_notes, ...b.base_notes].filter((n) => aSet.has(n.toLowerCase())).length;
}

export default function FragranceDetail() {
  const { id } = useParams();
  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const fragrance = getFragranceById(id || "");
  const [activeTab, setActiveTab] = useState<"overview" | "community" | "similar">("overview");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(["Dark", "Boss Energy"]);
  const { user } = useAuth();
  const { add: addToCollection, remove: removeFromCollection, isInCollection } = useCollection();
  const { add: addToWishlist, remove: removeFromWishlist, isInWishlist } = useWishlist();
  const { getRating, rate, removeRating } = useRatings();
  const { logActivity } = useActivity();
  const { getReviewsForFragrance, addReview, deleteReview, toggleHelpful, isHelpful } = useReviews();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverStar, setReviewHoverStar] = useState(0);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const inCollection = fragrance ? isInCollection(fragrance.id) : false;
  const inWishlist = fragrance ? isInWishlist(fragrance.id) : false;
  const myRating = fragrance ? getRating(fragrance.id) : null;

  if (!fragrance) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 text-center text-muted-foreground">Fragrance not found.</div>
      </div>
    );
  }

  const reviews = getReviewsForFragrance(fragrance.id);

  const REVIEW_TAGS = ["office", "date night", "casual", "fresh", "bold", "evening", "summer"];

  function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewText.trim() || reviewRating === 0) return;
    addReview(fragrance.id, reviewRating, reviewText.trim(), reviewTags);
    logActivity("rated", fragrance.id, reviewRating.toString());
    setReviewText("");
    setReviewRating(0);
    setReviewTags([]);
  }

  function toggleReviewTag(tag: string) {
    setReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  // Similar scents: use scraped IDs first, fall back to note-overlap algorithm
  const usingScrapedSimilar = !!(fragrance.similar_scents && fragrance.similar_scents.length > 0);
  const similar: Fragrance[] = usingScrapedSimilar
    ? (fragrance.similar_scents!
        .map((sid) => getFragranceById(sid))
        .filter((f): f is Fragrance => !!f)
        .slice(0, 4))
    : getSimilarFragrances(fragrance.id, 4);

  // Gender votes — computed before highlights since highlights reference them
  const genderTotal = fragrance.gender_votes
    ? GENDER_SEGMENTS.reduce((sum, s) => sum + (fragrance.gender_votes![s.key] || 0), 0)
    : 0;
  const dominantGender = genderTotal > 0
    ? GENDER_SEGMENTS.reduce((a, b) =>
        (fragrance.gender_votes![a.key] || 0) >= (fragrance.gender_votes![b.key] || 0) ? a : b)
    : null;

  // Highlights — data-driven pros/cons from Fragrantica community votes
  function fmtVotes(n: number): string {
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  }
  function topCategory(votes: Record<string, number>): { name: string; count: number; total: number } {
    const entries = Object.entries(votes);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const [name, count] = entries.reduce((a, b) => (b[1] > a[1] ? b : a));
    return { name, count, total };
  }

  const highlights: { text: string; detail: string; type: "pro" | "con" }[] = [];

  // Longevity — use vote breakdown if available
  if (fragrance.longevity_votes && Object.keys(fragrance.longevity_votes).length > 0) {
    const top = topCategory(fragrance.longevity_votes);
    const pct = Math.round((top.count / top.total) * 100);
    if (["long lasting", "eternal"].includes(top.name))
      highlights.push({ text: `${top.name === "eternal" ? "Eternal" : "Long lasting"} longevity`, detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
    else if (["very weak", "weak"].includes(top.name))
      highlights.push({ text: `${top.name === "very weak" ? "Very weak" : "Weak"} longevity`, detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "con" });
    else
      highlights.push({ text: "Moderate longevity", detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
  } else if (fragrance.longevity > 0) {
    if (fragrance.longevity >= 65)
      highlights.push({ text: "Excellent longevity", detail: `${fragrance.longevity}/100`, type: "pro" });
    else if (fragrance.longevity < 35)
      highlights.push({ text: "Short-lived", detail: `${fragrance.longevity}/100`, type: "con" });
  }

  // Sillage — use vote breakdown if available
  if (fragrance.sillage_votes && Object.keys(fragrance.sillage_votes).length > 0) {
    const top = topCategory(fragrance.sillage_votes);
    const pct = Math.round((top.count / top.total) * 100);
    if (["strong", "enormous"].includes(top.name))
      highlights.push({ text: `${top.name === "enormous" ? "Enormous" : "Strong"} projection`, detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
    else if (top.name === "intimate")
      highlights.push({ text: "Intimate sillage", detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "con" });
    else
      highlights.push({ text: "Moderate sillage", detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
  } else if (fragrance.sillage > 0) {
    if (fragrance.sillage >= 65)
      highlights.push({ text: "Strong projection", detail: `${fragrance.sillage}/100`, type: "pro" });
    else if (fragrance.sillage < 35)
      highlights.push({ text: "Weak projection", detail: `${fragrance.sillage}/100`, type: "con" });
  }

  // Season highlights
  if (fragrance.season_performance) {
    const sp = fragrance.season_performance;
    const seasonEntries: { key: keyof typeof sp; label: string }[] = [
      { key: "spring", label: "Spring" }, { key: "summer", label: "Summer" },
      { key: "fall", label: "Fall" },     { key: "winter", label: "Winter" },
    ];
    const seasonVals = seasonEntries.map((e) => sp[e.key] ?? 0);
    const seasonMax = Math.max(...seasonVals, 1);
    const seasonMin = Math.min(...seasonVals);
    const bestSeason = seasonEntries.find((e) => (sp[e.key] ?? 0) === seasonMax);
    const worstSeason = seasonEntries.find((e) => (sp[e.key] ?? 0) === seasonMin);

    if (bestSeason)
      highlights.push({ text: `Best for ${bestSeason.label}`, detail: `${((seasonMax / seasonMax) * 10).toFixed(1)}/10`, type: "pro" });
    if (worstSeason && seasonMin < seasonMax * 0.75)
      highlights.push({ text: `Less suited for ${worstSeason.label}`, detail: `${(((sp[worstSeason.key] ?? 0) / seasonMax) * 10).toFixed(1)}/10`, type: "con" });

    // Versatility — are all seasons close?
    const spread = seasonMax - seasonMin;
    if (spread <= 5 && seasonMax > 0)
      highlights.push({ text: "Versatile across all seasons", detail: "Even distribution", type: "pro" });

    // Day/Night
    const day = sp.day, night = sp.night;
    if (day !== undefined && night !== undefined) {
      const dnMax = Math.max(day, night, 1);
      if (day > night * 1.15)
        highlights.push({ text: "Better for daytime", detail: `${((day / dnMax) * 10).toFixed(1)}/10`, type: "pro" });
      else if (night > day * 1.15)
        highlights.push({ text: "Better for nighttime", detail: `${((night / dnMax) * 10).toFixed(1)}/10`, type: "pro" });
      else
        highlights.push({ text: "Versatile day and night", detail: "Even split", type: "pro" });
    }
  }

  // Price/value — use vote breakdown if available
  if (fragrance.pricing?.price_value_votes && Object.keys(fragrance.pricing.price_value_votes).length > 0) {
    const top = topCategory(fragrance.pricing.price_value_votes);
    const pct = Math.round((top.count / top.total) * 100);
    if (["good value", "great value"].includes(top.name))
      highlights.push({ text: `Rated "${top.name}"`, detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
    else if (["way overpriced", "overpriced"].includes(top.name))
      highlights.push({ text: `Rated "${top.name}"`, detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "con" });
    else
      highlights.push({ text: "Fairly priced", detail: `${fmtVotes(top.count)} votes (${pct}%)`, type: "pro" });
  } else if (fragrance.pricing?.price_value_score != null) {
    const pv = fragrance.pricing.price_value_score;
    if (pv >= 3.5) highlights.push({ text: "Good value", detail: `${pv.toFixed(1)}/5`, type: "pro" });
    else if (pv < 2.5) highlights.push({ text: "Below-average value", detail: `${pv.toFixed(1)}/5`, type: "con" });
  }

  // Rating
  if (fragrance.fragrantica_rating > 0 && fragrance.fragrantica_votes > 0) {
    if (fragrance.fragrantica_rating >= 4.0)
      highlights.push({ text: "Highly rated", detail: `${fragrance.fragrantica_rating.toFixed(2)} from ${fragrance.fragrantica_votes.toLocaleString()} votes`, type: "pro" });
    else if (fragrance.fragrantica_rating < 3.5)
      highlights.push({ text: "Polarizing", detail: `${fragrance.fragrantica_rating.toFixed(2)} from ${fragrance.fragrantica_votes.toLocaleString()} votes`, type: "con" });
  }

  // Gender dominance
  if (fragrance.gender_votes && genderTotal > 0 && dominantGender) {
    const domVotes = fragrance.gender_votes[dominantGender.key] || 0;
    const domPct = Math.round((domVotes / genderTotal) * 100);
    if (domPct >= 60) {
      highlights.push({ text: `Skews ${dominantGender.label.toLowerCase()}`, detail: `${fmtVotes(domVotes)} votes (${domPct}%)`, type: "pro" });
    }
  }

  const pros = highlights.filter((h) => h.type === "pro");
  const cons = highlights.filter((h) => h.type === "con");

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "community" as const, label: "Community" },
    { key: "similar" as const, label: "Similar Scents" },
  ];

  const toggleMood = (m: string) =>
    setSelectedMoods((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="glass rounded-2xl overflow-hidden mb-6">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">

              {fragrance.image_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="shrink-0 self-center md:self-start"
                >
                  <div className="w-48 h-64 md:w-56 md:h-72 rounded-xl overflow-hidden bg-muted/10 flex items-center justify-center">
                    <img
                      src={fragrance.image_url}
                      alt={fragrance.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  {fragrance.name}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  <Link
                    to={`/designers?brand=${encodeURIComponent(fragrance.brand)}`}
                    className="hover:text-primary transition-colors"
                  >
                    {fragrance.brand}
                  </Link>
                  {fragrance.year ? ` · ${fragrance.year}` : ""}
                </p>

                {/* Ratings + Value for Money */}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {fragrance.perfumisto_rating > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10">
                      <img src={logoDark} alt="Perfumisto" className="h-3.5" />
                      <RatingStars rating={fragrance.perfumisto_rating} size={16} />
                      <span className="text-xs text-muted-foreground">({fragrance.perfumisto_votes})</span>
                    </div>
                  )}
                  {fragrance.fragrantica_rating > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/20">
                      <ExternalLink size={12} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Fragrantica</span>
                      <RatingStars rating={fragrance.fragrantica_rating} size={14} />
                      {fragrance.fragrantica_votes > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({fragrance.fragrantica_votes.toLocaleString()})
                        </span>
                      )}
                    </div>
                  )}
                  {fragrance.fragrantica_rating === 0 && fragrance.perfumisto_rating === 0 && (
                    <span className="text-sm text-muted-foreground italic">No ratings yet</span>
                  )}

                  {/* Value for Money dots */}
                  {fragrance.pricing?.price_value_score != null && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/20">
                      <span className="text-xs text-muted-foreground">Value</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <div
                            key={dot}
                            className={`w-2.5 h-2.5 rounded-full ${
                              dot <= Math.round(fragrance.pricing!.price_value_score!)
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {fragrance.pricing.price_value_score.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>

                {fragrance.fragrance_family && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Family: <span className="text-foreground">{fragrance.fragrance_family}</span>
                    {fragrance.gender && (
                      <> · <span className="capitalize">{fragrance.gender}</span></>
                    )}
                  </p>
                )}

                {fragrance.season_tags && fragrance.season_tags.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {fragrance.season_tags.map((s) => (
                      <span key={s} className="text-xs px-3 py-1 rounded-full bg-deep text-soft">
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground leading-relaxed mt-4 max-w-xl">
                  {fragrance.description}
                </p>

                <div className="flex gap-2 flex-wrap mt-5">
                  <button
                    onClick={() => fragrance && (inCollection ? removeFromCollection(fragrance.id) : addToCollection(fragrance.id))}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${inCollection ? "bg-green-600 hover:bg-green-700 text-white" : "bg-primary hover:bg-primary/80 text-primary-foreground"}`}
                  >
                    {inCollection ? <><CheckCircle size={16} /> In Collection</> : <><Plus size={16} /> Add to Collection</>}
                  </button>
                  <button
                    onClick={() => fragrance && (inWishlist ? removeFromWishlist(fragrance.id) : addToWishlist(fragrance.id))}
                    className={`px-4 py-2 rounded-xl glass-hover text-sm flex items-center gap-2 ${inWishlist ? "text-pink-500" : ""}`}
                  >
                    <Heart size={16} className={inWishlist ? "fill-pink-500 text-pink-500" : "text-primary"} /> {inWishlist ? "Wishlisted" : "Wishlist"}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => user ? setRatingOpen(!ratingOpen) : undefined}
                      className={`px-4 py-2 rounded-xl glass-hover text-sm flex items-center gap-2 ${myRating !== null ? "text-accent" : ""}`}
                      title={user ? "Rate this fragrance" : "Log in to rate"}
                    >
                      <Star size={16} className={myRating !== null ? "fill-accent text-accent" : "text-primary"} />
                      {myRating !== null ? `Rated ${myRating}/5` : "Rate"}
                    </button>
                    <AnimatePresence>
                      {ratingOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute left-0 bottom-full mb-2 z-20 glass border border-border/30 rounded-xl p-4 shadow-lg min-w-[220px]"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-medium text-foreground">Rate this fragrance</p>
                            <button onClick={() => setRatingOpen(false)} className="p-1 rounded hover:bg-muted/30">
                              <X size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  rate(fragrance.id, s);
                                  logActivity("rated", fragrance.id, s.toString());
                                  setRatingOpen(false);
                                }}
                                onMouseEnter={() => setHoverStar(s)}
                                onMouseLeave={() => setHoverStar(0)}
                                className="p-1 transition-transform hover:scale-125"
                              >
                                <Star
                                  size={24}
                                  className={
                                    s <= (hoverStar || myRating || 0)
                                      ? "fill-accent text-accent"
                                      : "text-muted-foreground/30"
                                  }
                                />
                              </button>
                            ))}
                          </div>
                          <p className="text-center text-[10px] text-muted-foreground">
                            {hoverStar > 0
                              ? ["", "Poor", "Fair", "Good", "Great", "Masterpiece"][hoverStar]
                              : myRating
                                ? `Your rating: ${myRating}/5`
                                : "Tap a star to rate"}
                          </p>
                          {myRating !== null && (
                            <button
                              onClick={() => { removeRating(fragrance.id); setRatingOpen(false); }}
                              className="w-full mt-2 text-[10px] text-muted-foreground hover:text-destructive transition-colors"
                            >
                              Remove rating
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <Link
                    to={`/compare?ids=${fragrance.id}`}
                    className="px-4 py-2 rounded-xl glass-hover text-sm flex items-center gap-2"
                  >
                    Compare
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => {
                        const shareText = `Check out ${fragrance.name} by ${fragrance.brand} on Perfumisto!`;
                        const shareUrl = window.location.href;
                        if (navigator.share) {
                          navigator.share({ title: fragrance.name, text: shareText, url: shareUrl }).catch(() => {});
                        } else {
                          setShareOpen(!shareOpen);
                        }
                      }}
                      className="p-2 rounded-xl glass-hover"
                    >
                      <Share2 size={16} className="text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {shareOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 4 }}
                            className="absolute right-0 top-full mt-2 z-40 glass border border-border/30 rounded-xl p-3 shadow-xl min-w-[200px]"
                          >
                            <p className="text-xs font-medium text-foreground mb-2 px-1">Share this fragrance</p>
                            <div className="space-y-0.5">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(window.location.href);
                                  setLinkCopied(true);
                                  setTimeout(() => { setLinkCopied(false); setShareOpen(false); }, 1500);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/20 transition-colors"
                              >
                                {linkCopied ? <Check size={15} className="text-green-500" /> : <Copy size={15} className="text-muted-foreground" />}
                                {linkCopied ? "Copied!" : "Copy link"}
                              </button>
                              <a
                                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${fragrance.name} by ${fragrance.brand} on Perfumisto!\n${window.location.href}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShareOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/20 transition-colors"
                              >
                                <MessageCircle size={15} className="text-green-500" />
                                WhatsApp
                              </a>
                              <a
                                href={`mailto:?subject=${encodeURIComponent(`${fragrance.name} by ${fragrance.brand}`)}&body=${encodeURIComponent(`Check out ${fragrance.name} by ${fragrance.brand} on Perfumisto!\n\n${window.location.href}`)}`}
                                onClick={() => setShareOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/20 transition-colors"
                              >
                                <Mail size={15} className="text-blue-400" />
                                Email
                              </a>
                              <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${fragrance.name} by ${fragrance.brand} on Perfumisto!`)}&url=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShareOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/20 transition-colors"
                              >
                                <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] text-muted-foreground fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                X (Twitter)
                              </a>
                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShareOpen(false)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/20 transition-colors"
                              >
                                <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] text-blue-500 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                Facebook
                              </a>
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                  {fragrance.fragrantica_url && (
                    <a
                      href={fragrance.fragrantica_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl glass-hover"
                    >
                      <ExternalLink size={16} className="text-muted-foreground" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-6 glass rounded-xl p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">

            {/* ── Overview ──────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-6">

                {/* Main Accords */}
                <div className="glass rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 text-foreground">Main Accords</h3>
                  <AccordBarStack accords={fragrance.main_accords} size="lg" />
                </div>

                {/* Seasonal Performance — seasons normalized to their max, day/night to theirs */}
                {fragrance.season_performance && (() => {
                  const sp = fragrance.season_performance!;

                  const seasonMax = Math.max(...SEASON_GROUP.map((i) => sp[i.key] ?? 0), 1);
                  const timeMax = Math.max(...TIME_GROUP.map((i) => sp[i.key] ?? 0), 1);
                  const hasTime = TIME_GROUP.some((i) => sp[i.key] !== undefined);

                  function renderRing(item: { key: string; label: string; icon: string; color: string }, value: number, groupMax: number) {
                    const normalized = (value / groupMax) * 10;
                    const ringPct = (normalized / 10) * 100;
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle
                              cx="18" cy="18" r="15.5"
                              fill="none"
                              stroke="hsl(var(--muted))"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18" cy="18" r="15.5"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="3"
                              strokeDasharray={`${ringPct * 0.974} 100`}
                              strokeLinecap="round"
                              className="transition-all duration-700"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                            {normalized.toFixed(1)}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-lg">{item.icon}</span>
                          <p className="text-[11px] font-medium text-muted-foreground">{item.label}</p>
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <div className="glass rounded-xl p-6">
                      <h3 className="font-display font-semibold mb-4 text-foreground">
                        Seasonal Performance
                      </h3>
                      <div className="grid grid-cols-4 gap-4">
                        {SEASON_GROUP.map((item) => {
                          const value = sp[item.key];
                          if (value === undefined) return null;
                          return renderRing(item, value, seasonMax);
                        })}
                      </div>
                      {hasTime && (
                        <>
                          <div className="border-t border-border/20 my-5" />
                          <div className="grid grid-cols-2 gap-4 max-w-[12rem] mx-auto">
                            {TIME_GROUP.map((item) => {
                              const value = sp[item.key];
                              if (value === undefined) return null;
                              return renderRing(item, value, timeMax);
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {/* Note Pyramid */}
                {(fragrance.top_notes.length > 0 || fragrance.heart_notes.length > 0 || fragrance.base_notes.length > 0) && (
                <div className="glass rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-4 text-foreground">Note Pyramid</h3>
                  <div className="space-y-4">
                    {fragrance.top_notes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Top Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.top_notes.map((n) => (
                          <Link
                            key={n}
                            to={`/notes?note=${encodeURIComponent(n)}`}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <NoteIcon note={n} />
                            {n}
                          </Link>
                        ))}
                      </div>
                    </div>
                    )}
                    {fragrance.heart_notes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Heart Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.heart_notes.map((n) => (
                          <Link
                            key={n}
                            to={`/notes?note=${encodeURIComponent(n)}`}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                          >
                            <NoteIcon note={n} />
                            {n}
                          </Link>
                        ))}
                      </div>
                    </div>
                    )}
                    {fragrance.base_notes.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Base Notes</p>
                      <div className="flex flex-wrap gap-2">
                        {fragrance.base_notes.map((n) => (
                          <Link
                            key={n}
                            to={`/notes?note=${encodeURIComponent(n)}`}
                            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-deep text-soft hover:opacity-80 transition-opacity"
                          >
                            <NoteIcon note={n} />
                            {n}
                          </Link>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                </div>
                )}

                {/* Longevity & Sillage */}
                {(fragrance.longevity > 0 || fragrance.sillage > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="glass rounded-xl p-6">
                      <LongevityMeter value={fragrance.longevity} />
                    </div>
                    <div className="glass rounded-xl p-6">
                      <SillageMeter value={fragrance.sillage} />
                    </div>
                  </div>
                ) : (
                  <div className="glass rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Longevity & sillage data pending enrichment
                    </p>
                  </div>
                )}

                {/* Value for Money */}
                {fragrance.pricing?.price_value_score != null && (() => {
                  const score = fragrance.pricing!.price_value_score!;
                  const label =
                    score >= 4.5 ? "Exceptional value" :
                    score >= 3.5 ? "Good value" :
                    score >= 2.5 ? "Fair value" :
                    score >= 1.5 ? "Below average" : "Poor value";
                  return (
                    <div className="glass rounded-xl p-6">
                      <h3 className="font-display font-semibold mb-4 text-foreground">Value for Money</h3>
                      <div className="flex items-center gap-5">
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(score / 5) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[10px] text-muted-foreground">1</span>
                            <span className="text-[10px] text-muted-foreground">2</span>
                            <span className="text-[10px] text-muted-foreground">3</span>
                            <span className="text-[10px] text-muted-foreground">4</span>
                            <span className="text-[10px] text-muted-foreground">5</span>
                          </div>
                        </div>
                        <div className="text-center shrink-0">
                          <div className="text-2xl font-bold text-foreground leading-none">
                            {score.toFixed(1)}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Gender Audience */}
                {fragrance.gender_votes && genderTotal > 0 && (
                  <div className="glass rounded-xl p-6">
                    <h3 className="font-display font-semibold mb-4 text-foreground">Gender Audience</h3>
                    <div className="flex rounded-full overflow-hidden h-4 w-full">
                      {GENDER_SEGMENTS.map((s) => {
                        const pct = ((fragrance.gender_votes![s.key] || 0) / genderTotal) * 100;
                        if (pct === 0) return null;
                        return (
                          <div
                            key={s.key}
                            style={{ width: `${pct}%`, backgroundColor: s.color }}
                            title={`${s.label}: ${Math.round(pct)}%`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-pink-400">Female</span>
                      {dominantGender && (
                        <span className="text-xs font-medium text-foreground">
                          {dominantGender.label} dominant
                        </span>
                      )}
                      <span className="text-xs text-blue-400">Male</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                      {GENDER_SEGMENTS.map((s) => {
                        const votes = fragrance.gender_votes![s.key] || 0;
                        if (votes === 0) return null;
                        const pct = Math.round((votes / genderTotal) * 100);
                        return (
                          <div key={s.key} className="flex items-center gap-1.5">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-[11px] text-muted-foreground">
                              {s.label} {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* What People Say — scraped community opinions, or derived highlights fallback */}
                {(() => {
                  const opinions = fragrance.community_opinions;
                  const hasCommunity = opinions && opinions.length > 0;
                  const communityPros = hasCommunity ? opinions.filter((o) => o.type === "pro") : [];
                  const communityCons = hasCommunity ? opinions.filter((o) => o.type === "con") : [];

                  function renderOpinionItem(o: CommunityOpinion) {
                    const total = o.thumbsUp + o.thumbsDown;
                    const approvalPct = total > 0 ? Math.round((o.thumbsUp / total) * 100) : 0;
                    return (
                      <div key={o.text} className="group/item py-1.5 px-2 -mx-2 rounded-lg hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 shrink-0 w-16">
                            <ThumbsUp size={11} className="text-muted-foreground" />
                            <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                              {approvalPct}%
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed flex-1">{o.text}</p>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                            {fmtVotes(total)} votes
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // Show community opinions if available, otherwise fall back to derived highlights
                  if (hasCommunity) {
                    return (
                      <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-semibold text-foreground">What People Say</h3>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ExternalLink size={10} /> Fragrantica community
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {communityPros.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center">
                                  <Check size={12} className="text-emerald-400" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pros</span>
                              </div>
                              <div className="space-y-0.5">
                                {communityPros.map(renderOpinionItem)}
                              </div>
                            </div>
                          )}
                          {communityCons.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center">
                                  <X size={12} className="text-amber-400" />
                                </div>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cons</span>
                              </div>
                              <div className="space-y-0.5">
                                {communityCons.map(renderOpinionItem)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Fallback: derived highlights
                  if (pros.length > 0 || cons.length > 0) {
                    return (
                      <div className="glass rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-semibold text-foreground">Highlights</h3>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <ExternalLink size={10} /> Based on Fragrantica data
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {pros.length > 0 && (
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold text-emerald-400 mb-1">Strengths</p>
                              {pros.map((h) => (
                                <div key={h.text} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-emerald-400" />
                                  </div>
                                  <span className="text-xs text-foreground flex-1">{h.text}</span>
                                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{h.detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {cons.length > 0 && (
                            <div className="space-y-2.5">
                              <p className="text-xs font-semibold text-rose-400 mb-1">Weaknesses</p>
                              {cons.map((h) => (
                                <div key={h.text} className="flex items-center gap-2">
                                  <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                                    <X size={10} className="text-rose-400" />
                                  </div>
                                  <span className="text-xs text-foreground flex-1">{h.text}</span>
                                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{h.detail}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Mood Tags */}
                <div className="glass rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-foreground">
                    <Tag size={14} className="text-primary" /> Mood Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {moodTags.map((m) => (
                      <button
                        key={m}
                        onClick={() => toggleMood(m)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                          selectedMoods.includes(m)
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Community ─────────────────────────────────────────────── */}
            {activeTab === "community" && (
              <div className="space-y-6">
                {user ? (
                  <div className="glass rounded-xl p-6">
                    <h3 className="font-display font-semibold mb-4 text-foreground">Write a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Your rating:</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setReviewRating(s)}
                              onMouseEnter={() => setReviewHoverStar(s)}
                              onMouseLeave={() => setReviewHoverStar(0)}
                              className="p-0.5 transition-transform hover:scale-110"
                            >
                              <Star
                                size={20}
                                className={
                                  s <= (reviewHoverStar || reviewRating)
                                    ? "fill-accent text-accent"
                                    : "text-muted-foreground/30"
                                }
                              />
                            </button>
                          ))}
                        </div>
                        {reviewRating > 0 && (
                          <span className="text-xs text-muted-foreground">{reviewRating}/5</span>
                        )}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={3}
                        className="w-full bg-muted/20 rounded-xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/30 resize-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        {REVIEW_TAGS.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleReviewTag(tag)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                              reviewTags.includes(tag)
                                ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                                : "bg-muted/30 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <button
                        type="submit"
                        disabled={!reviewText.trim() || reviewRating === 0}
                        className="px-6 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Submit Review
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass rounded-xl p-6 text-center text-sm text-muted-foreground">
                    Log in to write a review.
                  </div>
                )}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((r) => (
                      <ReviewCard
                        key={r.id}
                        review={{
                          ...r,
                          user: { name: r.user_name, username: r.user_username },
                        }}
                        onToggleHelpful={toggleHelpful}
                        isHelpful={isHelpful(r.id)}
                        onDelete={deleteReview}
                        isOwn={r.user_id === user?.id}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No reviews yet. Be the first!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Similar Scents ────────────────────────────────────────── */}
            {activeTab === "similar" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {usingScrapedSimilar
                    ? "Curated by the Fragrantica community."
                    : "Based on note and accord overlap."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.map((f, i) => {
                    const shared = sharedNoteCount(fragrance, f);
                    const simPct = usingScrapedSimilar
                      ? Math.round(90 - i * 5)
                      : Math.round(85 - i * 10);
                    return (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass rounded-xl p-4 space-y-3"
                      >
                        <SimilarityCard fragrance={f} similarityPercent={simPct} sourceFragranceId={fragrance.id} />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2">
                          <span>{shared} shared note{shared !== 1 ? "s" : ""}</span>
                          <span>·</span>
                          {usingScrapedSimilar ? (
                            <span className="text-soft">Fragrantica verified</span>
                          ) : (
                            <span className="text-soft">Similarity: {simPct}%</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ─────────────────────────────────────────────── */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="glass rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-semibold">In Your Collection?</h4>
              {inCollection ? (
                <>
                  <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle size={12} /> Yes — you own this!</p>
                  <button onClick={() => fragrance && removeFromCollection(fragrance.id)} className="w-full py-2 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-sm text-foreground transition-colors">
                    Remove from Collection
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Not yet — add it!</p>
                  <button onClick={() => fragrance && addToCollection(fragrance.id)} className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-sm text-foreground transition-colors">
                    Add to Collection
                  </button>
                </>
              )}
            </div>
            <div className="glass rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-semibold">Your Rating</h4>
              {myRating !== null ? (
                <RatingStars rating={myRating} size={20} />
              ) : (
                <p className="text-xs text-muted-foreground italic">Not rated yet</p>
              )}
            </div>

            <div className="glass rounded-xl p-5">
              <h4 className="text-sm font-semibold mb-3">Controversy Meter</h4>
              <PolarizationMeter
                variance={(() => {
                  const r = fragrance.fragrantica_rating;
                  if (r <= 0) return 0.5;
                  // Ratings near the middle (2.5-3.5) tend to be more polarizing
                  const distFromCenter = Math.abs(r - 3);
                  return Math.max(0.2, 1.8 - distFromCenter * 0.5);
                })()}
                distribution={(() => {
                  const r = fragrance.fragrantica_rating;
                  if (r <= 0) return [20, 20, 20, 20, 20];
                  // Build a plausible bell-curve distribution centered on the rating
                  const dist = [0, 0, 0, 0, 0];
                  for (let i = 0; i < 5; i++) {
                    const starCenter = i + 1;
                    const diff = Math.abs(starCenter - r);
                    dist[i] = Math.exp(-diff * diff / 1.2);
                  }
                  const total = dist.reduce((a, b) => a + b, 0);
                  return dist.map((d) => Math.round((d / total) * 100));
                })()}
              />
            </div>

            <div className="glass rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-semibold">Friends Who Own It</h4>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Kevin Cho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={12} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">Sara Mitchell</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
