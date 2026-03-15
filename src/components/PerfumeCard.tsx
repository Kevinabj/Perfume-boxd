import { useState } from "react";
import { Fragrance } from "@/types";
import { AccordBarStack } from "./AccordBarStack";
import { Heart, Plus, Star, ExternalLink, CheckCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCollection } from "@/hooks/useCollection";
import { useWishlist } from "@/hooks/useWishlist";
import { useRatings } from "@/hooks/useRatings";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/contexts/AuthContext";
import logoDark from "@/assets/logo-dark.png";

interface PerfumeCardProps {
  fragrance: Fragrance;
}

export function PerfumeCard({ fragrance }: PerfumeCardProps) {
  const { user } = useAuth();
  const { add: addC, remove: removeC, isInCollection } = useCollection();
  const { add: addW, remove: removeW, isInWishlist } = useWishlist();
  const { getRating, rate, removeRating } = useRatings();
  const { logActivity } = useActivity();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);

  const inColl = isInCollection(fragrance.id);
  const inWish = isInWishlist(fragrance.id);
  const myRating = getRating(fragrance.id);

  const hasFragranticaRating = fragrance.fragrantica_rating > 0;

  function handleRate(value: number) {
    rate(fragrance.id, value);
    logActivity("rated", fragrance.id, value.toString());
    setRatingOpen(false);
  }

  function handleAddCollection() {
    addC(fragrance.id);
    logActivity("added", fragrance.id);
  }

  function handleAddWishlist() {
    addW(fragrance.id);
    logActivity("wishlist", fragrance.id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-hover rounded-xl overflow-hidden flex flex-col group h-full relative"
    >
      {/* Bottle image area */}
      <Link to={`/fragrance/${fragrance.id}`} className="block">
        <div className="relative flex items-end justify-center pt-4 pb-2 px-4 h-52 bg-gradient-to-b from-muted/10 to-muted/5">
          {fragrance.image_url ? (
            <img
              src={fragrance.image_url}
              alt={fragrance.name}
              className="max-h-44 w-auto object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-32 w-24 rounded-lg bg-muted/20 flex items-center justify-center">
              <span className="text-3xl font-display font-bold text-accent/30">{fragrance.name[0]}</span>
            </div>
          )}
          {fragrance.gender && (
            <span className="absolute top-2.5 right-2.5 text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground backdrop-blur-sm">
              {fragrance.gender === "unisex" ? "Unisex" : fragrance.gender === "men" ? "Men" : "Women"}
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1 border-t border-border/10">
        <Link to={`/fragrance/${fragrance.id}`} className="space-y-2.5">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {fragrance.name}
            </h3>
            <p className="text-xs text-muted-foreground">{fragrance.brand}{fragrance.year ? ` · ${fragrance.year}` : ""}</p>
          </div>

          {/* Ratings */}
          <div className="flex flex-col gap-1 text-xs">
            {/* User's own rating (Perfumisto) — shown first */}
            {myRating !== null && (
              <div className="flex items-center gap-1.5">
                <img src={logoDark} alt="Perfumisto" className="h-3 opacity-70" />
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} className={s <= myRating ? "fill-accent text-accent" : "text-muted-foreground/30"} />
                  ))}
                </div>
                <span className="text-foreground font-medium">{myRating.toFixed(1)}</span>
                <span className="text-muted-foreground">You</span>
              </div>
            )}
            {/* Fragrantica rating */}
            {hasFragranticaRating && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ExternalLink size={10} />
                <span>{fragrance.fragrantica_rating.toFixed(1)}</span>
                {fragrance.fragrantica_votes > 0 && (
                  <span>({fragrance.fragrantica_votes.toLocaleString()})</span>
                )}
              </div>
            )}
            {myRating === null && !hasFragranticaRating && (
              <span className="text-xs text-muted-foreground italic">No ratings yet</span>
            )}
          </div>

          {fragrance.main_accords.length > 0 && (
            <AccordBarStack accords={fragrance.main_accords.slice(0, 4)} size="sm" showLabels={true} />
          )}
        </Link>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          {inColl ? (
            <button onClick={() => removeC(fragrance.id)} className="flex-1 text-xs py-2 rounded-lg bg-green-600/15 hover:bg-green-600/25 text-green-600 transition-colors flex items-center justify-center gap-1">
              <CheckCircle size={14} /> Owned
            </button>
          ) : (
            <button onClick={handleAddCollection} className="flex-1 text-xs py-2 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground transition-colors flex items-center justify-center gap-1">
              <Plus size={14} /> Collection
            </button>
          )}
          <button
            onClick={() => inWish ? removeW(fragrance.id) : handleAddWishlist()}
            className={`p-2 rounded-lg transition-colors ${inWish ? "bg-pink-500/15 hover:bg-pink-500/25" : "bg-muted/30 hover:bg-muted/50"}`}
          >
            <Heart size={14} className={inWish ? "fill-pink-500 text-pink-500" : "text-accent"} />
          </button>
          <button
            onClick={() => user ? setRatingOpen(!ratingOpen) : undefined}
            className={`p-2 rounded-lg transition-colors ${myRating !== null ? "bg-accent/15 hover:bg-accent/25" : "bg-muted/30 hover:bg-muted/50"}`}
            title={user ? "Rate this fragrance" : "Log in to rate"}
          >
            <Star size={14} className={myRating !== null ? "fill-accent text-accent" : "text-accent"} />
          </button>
        </div>
      </div>

      {/* Rating popup */}
      <AnimatePresence>
        {ratingOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-x-0 bottom-0 z-10 glass border-t border-border/30 rounded-b-xl p-4 shadow-lg"
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
                  onClick={() => handleRate(s)}
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
    </motion.div>
  );
}
