import { useState } from "react";
import { Shirt, Thermometer, Sparkles } from "lucide-react";
import { mockFragrances } from "@/data/mock";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const occasions = ["Office", "Date", "Casual", "Gym", "Formal"];
const moods = ["Dark", "Clean", "Seductive", "Cozy", "Fresh", "Boss Energy", "Dangerous", "Minimalist"];

const occasionAccordMap: Record<string, string[]> = {
  Office: ["Fresh", "Citrus", "Aromatic", "Aquatic"],
  Date: ["Sweet", "Amber", "Oriental", "Rose"],
  Casual: ["Citrus", "Fresh", "Fruity", "Aromatic"],
  Gym: ["Fresh", "Citrus", "Aquatic"],
  Formal: ["Woody", "Oud", "Amber", "Leather"],
};

export function RotationOptimizer() {
  const [occasion, setOccasion] = useState("");
  const [temp, setTemp] = useState(20);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const toggleMood = (m: string) =>
    setSelectedMoods((p) => p.includes(m) ? p.filter((x) => x !== m) : [...p, m]);

  const getReasons = (i: number) => {
    const reasons = [
      occasion && `Fits ${occasion} setting`,
      temp < 15 ? "Great for cold weather" : temp > 25 ? "Perfect for warm weather" : "Versatile temperature range",
      selectedMoods.length > 0 && `Matches ${selectedMoods[0]} mood`,
    ].filter(Boolean);
    return reasons[i % reasons.length] || "Top match from your collection";
  };

  const results = mockFragrances.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Occasion */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Shirt size={12} /> Occasion
        </p>
        <div className="flex flex-wrap gap-2">
          {occasions.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(o === occasion ? "" : o)}
              className={`text-xs px-3 py-1.5 rounded-full transition-all ${occasion === o ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Thermometer size={12} /> Temperature: {temp}°C
        </p>
        <input
          type="range" min="-10" max="45" value={temp}
          onChange={(e) => setTemp(Number(e.target.value))}
          className="w-full accent-primary h-1"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>-10°C</span><span>45°C</span>
        </div>
      </div>

      {/* Moods */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sparkles size={12} /> Mood
        </p>
        <div className="flex flex-wrap gap-1.5">
          {moods.map((m) => (
            <button
              key={m}
              onClick={() => toggleMood(m)}
              className={`text-[11px] px-2.5 py-1 rounded-full transition-all ${selectedMoods.includes(m) ? "bg-accent/20 text-accent border border-accent/30" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setShowResults(true)}
        className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Sparkles size={14} /> Suggest
      </button>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {results.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/fragrance/${f.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors">
                  {f.image_url && <img src={f.image_url} alt={f.name} className="w-10 h-10 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-[10px] text-soft">{getReasons(i)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
