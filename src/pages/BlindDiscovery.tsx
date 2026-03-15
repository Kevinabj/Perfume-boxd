import { Navbar } from "@/components/Navbar";
import { AccordBarStack } from "@/components/AccordBarStack";
import { LongevityMeter, SillageMeter } from "@/components/Meters";
import { RatingStars } from "@/components/RatingStars";
import { fragrances as mockFragrances } from "@/lib/catalog";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ThumbsUp, ThumbsDown, Star, RotateCcw, Sparkles } from "lucide-react";

export default function BlindDiscovery() {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [prediction, setPrediction] = useState<"yes" | "no" | null>(null);
  const [estimatedRating, setEstimatedRating] = useState(3);
  const [history, setHistory] = useState<{ id: string; prediction: string; rating: number; actual: string }[]>([]);

  const fragrance = mockFragrances[index % mockFragrances.length];

  const handleReveal = () => setRevealed(true);

  const handleNext = () => {
    if (prediction) {
      setHistory((h) => [...h, { id: fragrance.id, prediction, rating: estimatedRating, actual: fragrance.name }]);
    }
    setRevealed(false);
    setPrediction(null);
    setEstimatedRating(3);
    setIndex((i) => i + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold mb-2">
            <span className="gradient-text">Blind Discovery</span>
          </h1>
          <p className="text-muted-foreground text-sm">Judge fragrances by their character, not their name</p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          {/* Mystery header */}
          <div className="text-center">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
            >
              <Eye size={14} className="text-accent" />
              <span className="text-sm text-soft">Mystery Fragrance #{index + 1}</span>
            </motion.div>
          </div>

          {/* Accords */}
          <div>
            <h3 className="text-xs text-muted-foreground mb-3">Main Accords</h3>
            <AccordBarStack accords={fragrance.main_accords} size="lg" />
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Top Notes</p>
              <div className="flex flex-wrap gap-1.5">
                {fragrance.top_notes.map((n) => (
                  <span key={n} className="text-[11px] px-2.5 py-1 rounded-full bg-accent/15 text-accent">{n}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Heart Notes</p>
              <div className="flex flex-wrap gap-1.5">
                {fragrance.heart_notes.map((n) => (
                  <span key={n} className="text-[11px] px-2.5 py-1 rounded-full bg-primary/15 text-soft">{n}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Base Notes</p>
              <div className="flex flex-wrap gap-1.5">
                {fragrance.base_notes.map((n) => (
                  <span key={n} className="text-[11px] px-2.5 py-1 rounded-full bg-deep text-soft">{n}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Meters — only show if enrichment data is available */}
          {(fragrance.longevity > 0 || fragrance.sillage > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4">
                <LongevityMeter value={fragrance.longevity} />
              </div>
              <div className="glass rounded-xl p-4">
                <SillageMeter value={fragrance.sillage} />
              </div>
            </div>
          )}

          {/* Community rating */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Community Rating:</span>
            {(fragrance.fragrantica_rating > 0 || fragrance.perfumisto_rating > 0) ? (
              <RatingStars rating={fragrance.fragrantica_rating || fragrance.perfumisto_rating} size={14} />
            ) : (
              <span className="text-xs text-muted-foreground italic">Not rated</span>
            )}
          </div>

          {/* Prediction */}
          {!revealed && (
            <div className="space-y-4 pt-2">
              <div>
                <p className="text-sm font-medium mb-3">Would you wear this?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPrediction("yes")}
                    className={`flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${prediction === "yes" ? "bg-accent/20 text-accent border border-accent/30" : "glass-hover text-muted-foreground"}`}
                  >
                    <ThumbsUp size={16} /> Yes, I'd wear it
                  </button>
                  <button
                    onClick={() => setPrediction("no")}
                    className={`flex-1 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${prediction === "no" ? "bg-destructive/20 text-destructive border border-destructive/30" : "glass-hover text-muted-foreground"}`}
                  >
                    <ThumbsDown size={16} /> Not for me
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Estimated Rating: {estimatedRating}/5</p>
                <input
                  type="range" min="1" max="5" step="0.5"
                  value={estimatedRating}
                  onChange={(e) => setEstimatedRating(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <button
                onClick={handleReveal}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-medium transition-colors glow flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> Reveal Fragrance
              </button>
            </div>
          )}

          {/* Reveal */}
          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="space-y-4"
              >
                <div className="text-center p-6 rounded-xl bg-gradient-to-b from-primary/20 to-transparent border border-accent/20">
                  {fragrance.image_url && (
                    <motion.img
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      src={fragrance.image_url}
                      alt={fragrance.name}
                      className="w-32 h-32 rounded-xl object-cover mx-auto mb-4"
                    />
                  )}
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-display font-bold gradient-text"
                  >
                    {fragrance.name}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground"
                  >
                    {fragrance.brand} {fragrance.year && `· ${fragrance.year}`}
                  </motion.p>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl glass-hover text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} /> Next Mystery Fragrance
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8 glass rounded-xl p-6">
            <h3 className="font-display font-semibold mb-4">Your Discovery History</h3>
            <div className="space-y-2">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/10">
                  <span className={h.prediction === "yes" ? "text-accent" : "text-destructive"}>
                    {h.prediction === "yes" ? "👍" : "👎"}
                  </span>
                  <span className="flex-1">{h.actual}</span>
                  <span className="text-xs text-muted-foreground">Rated: {h.rating}★</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
