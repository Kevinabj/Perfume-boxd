import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LOCAL_KEY = "perfumisto_wishlist";

function getLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(ids: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(ids));
}

export function useWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch
  useEffect(() => {
    if (!user) { setItems([]); setLoading(false); return; }

    if (!supabaseConfigured) {
      setItems(getLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("wishlists")
      .select("fragrance_id")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) setItems(data.map((r) => r.fragrance_id));
        setLoading(false);
      });
  }, [user]);

  const add = useCallback(async (fragranceId: string) => {
    if (!user) return;
    setItems((prev) => (prev.includes(fragranceId) ? prev : [...prev, fragranceId]));

    if (!supabaseConfigured) {
      const next = [...new Set([...getLocal(), fragranceId])];
      setLocal(next);
      return;
    }
    await supabase.from("wishlists").upsert({ user_id: user.id, fragrance_id: fragranceId });
  }, [user]);

  const remove = useCallback(async (fragranceId: string) => {
    if (!user) return;
    setItems((prev) => prev.filter((id) => id !== fragranceId));

    if (!supabaseConfigured) {
      setLocal(getLocal().filter((id) => id !== fragranceId));
      return;
    }
    await supabase.from("wishlists").delete().eq("user_id", user.id).eq("fragrance_id", fragranceId);
  }, [user]);

  const isInWishlist = useCallback((fragranceId: string) => items.includes(fragranceId), [items]);

  return { items, loading, add, remove, isInWishlist };
}
