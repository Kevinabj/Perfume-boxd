import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LOCAL_KEY = "perfumisto_ratings";

interface RatingEntry {
  fragrance_id: string;
  rating: number;
  created_at: string;
}

function getLocal(): RatingEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(entries: RatingEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<RatingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRatings([]); setLoading(false); return; }

    if (!supabaseConfigured) {
      setRatings(getLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("ratings")
      .select("fragrance_id, rating, created_at")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) setRatings(data);
        setLoading(false);
      });
  }, [user]);

  const rate = useCallback(async (fragranceId: string, rating: number) => {
    if (!user) return;
    const now = new Date().toISOString();
    setRatings((prev) => {
      const filtered = prev.filter((r) => r.fragrance_id !== fragranceId);
      return [...filtered, { fragrance_id: fragranceId, rating, created_at: now }];
    });

    if (!supabaseConfigured) {
      const local = getLocal().filter((r) => r.fragrance_id !== fragranceId);
      local.push({ fragrance_id: fragranceId, rating, created_at: now });
      setLocal(local);
      return;
    }
    await supabase.from("ratings").upsert({
      user_id: user.id,
      fragrance_id: fragranceId,
      rating,
      created_at: now,
    });
  }, [user]);

  const removeRating = useCallback(async (fragranceId: string) => {
    if (!user) return;
    setRatings((prev) => prev.filter((r) => r.fragrance_id !== fragranceId));

    if (!supabaseConfigured) {
      setLocal(getLocal().filter((r) => r.fragrance_id !== fragranceId));
      return;
    }
    await supabase.from("ratings").delete().eq("user_id", user.id).eq("fragrance_id", fragranceId);
  }, [user]);

  const getRating = useCallback((fragranceId: string): number | null => {
    const entry = ratings.find((r) => r.fragrance_id === fragranceId);
    return entry ? entry.rating : null;
  }, [ratings]);

  return { ratings, loading, rate, removeRating, getRating };
}
