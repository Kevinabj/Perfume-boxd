import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LOCAL_KEY = "perfumisto_reviews";
const HELPFUL_KEY = "perfumisto_helpful";

export interface ReviewEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_username: string;
  fragrance_id: string;
  rating: number;
  text: string;
  tags: string[];
  helpful_count: number;
  created_at: string;
}

function getLocal(): ReviewEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(entries: ReviewEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

function getHelpfulLocal(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(HELPFUL_KEY) || "{}"); } catch { return {}; }
}
function setHelpfulLocal(map: Record<string, boolean>) {
  localStorage.setItem(HELPFUL_KEY, JSON.stringify(map));
}

export function useReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewEntry[]>([]);
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      setReviews(getLocal());
      setHelpfulMap(getHelpfulLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("reviews")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) setReviews(data);
        setLoading(false);
      });
  }, [user]);

  const getReviewsForFragrance = useCallback(
    (fragranceId: string) =>
      reviews.filter((r) => r.fragrance_id === fragranceId),
    [reviews],
  );

  const addReview = useCallback(
    async (fragranceId: string, rating: number, text: string, tags: string[]) => {
      if (!user) return;
      const entry: ReviewEntry = {
        id: `rev-${Date.now()}`,
        user_id: user.id,
        user_name: (user as any).user_metadata?.username || (user as any).username || user.email?.split("@")[0] || "User",
        user_username: (user as any).user_metadata?.username || (user as any).username || user.email?.split("@")[0] || "user",
        fragrance_id: fragranceId,
        rating,
        text,
        tags,
        helpful_count: 0,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [entry, ...prev]);

      if (!supabaseConfigured) {
        const local = getLocal();
        local.unshift(entry);
        setLocal(local);
        return;
      }
      await supabase.from("reviews").insert(entry);
    },
    [user],
  );

  const deleteReview = useCallback(
    async (reviewId: string) => {
      if (!user) return;
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      if (!supabaseConfigured) {
        setLocal(getLocal().filter((r) => r.id !== reviewId));
        return;
      }
      await supabase.from("reviews").delete().eq("id", reviewId).eq("user_id", user.id);
    },
    [user],
  );

  const toggleHelpful = useCallback(
    async (reviewId: string) => {
      const alreadyHelpful = helpfulMap[reviewId] ?? false;
      const delta = alreadyHelpful ? -1 : 1;

      setHelpfulMap((prev) => ({ ...prev, [reviewId]: !alreadyHelpful }));
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: Math.max(0, r.helpful_count + delta) } : r,
        ),
      );

      if (!supabaseConfigured) {
        const hMap = getHelpfulLocal();
        if (alreadyHelpful) delete hMap[reviewId];
        else hMap[reviewId] = true;
        setHelpfulLocal(hMap);

        const local = getLocal().map((r) =>
          r.id === reviewId ? { ...r, helpful_count: Math.max(0, r.helpful_count + delta) } : r,
        );
        setLocal(local);
        return;
      }

      if (alreadyHelpful) {
        await supabase.from("review_helpful").delete().eq("review_id", reviewId).eq("user_id", user?.id);
      } else {
        await supabase.from("review_helpful").insert({ review_id: reviewId, user_id: user?.id });
      }
      await supabase.rpc("update_helpful_count", { rid: reviewId, delta });
    },
    [user, helpfulMap],
  );

  const isHelpful = useCallback(
    (reviewId: string) => helpfulMap[reviewId] ?? false,
    [helpfulMap],
  );

  return { reviews, loading, getReviewsForFragrance, addReview, deleteReview, toggleHelpful, isHelpful };
}
