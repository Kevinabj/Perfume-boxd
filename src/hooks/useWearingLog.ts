import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface WearEntry {
  id: string;
  fragrance_id: string;
  worn_at: string; // ISO date string  YYYY-MM-DD
  note: string;
}

const LOCAL_KEY = "perfumisto_wearing_log";

function getLocal(): WearEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(entries: WearEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function useWearingLog() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch
  useEffect(() => {
    if (!user) { setLogs([]); setLoading(false); return; }

    if (!supabaseConfigured) {
      setLogs(getLocal().sort((a, b) => b.worn_at.localeCompare(a.worn_at)));
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("wearing_log")
      .select("*")
      .eq("user_id", user.id)
      .order("worn_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setLogs(data.map((r) => ({
            id: r.id ?? crypto.randomUUID(),
            fragrance_id: r.fragrance_id,
            worn_at: r.worn_at,
            note: r.note || "",
          })));
        }
        setLoading(false);
      });
  }, [user]);

  const logWearing = useCallback(async (fragranceId: string, note?: string, date?: string) => {
    if (!user) return;
    const entry: WearEntry = {
      id: crypto.randomUUID(),
      fragrance_id: fragranceId,
      worn_at: date || new Date().toISOString().split("T")[0],
      note: note || "",
    };

    setLogs((prev) => [entry, ...prev]);

    if (!supabaseConfigured) {
      setLocal([entry, ...getLocal()]);
      return;
    }
    await supabase.from("wearing_log").insert({
      user_id: user.id,
      fragrance_id: entry.fragrance_id,
      worn_at: entry.worn_at,
      note: entry.note,
    });
  }, [user]);

  const removeEntry = useCallback(async (entryId: string) => {
    if (!user) return;
    setLogs((prev) => prev.filter((e) => e.id !== entryId));

    if (!supabaseConfigured) {
      setLocal(getLocal().filter((e) => e.id !== entryId));
      return;
    }
    await supabase.from("wearing_log").delete().eq("id", entryId).eq("user_id", user.id);
  }, [user]);

  // Recent entries (last 30 days)
  const recent = logs.filter((e) => {
    const d = new Date(e.worn_at);
    const ago = Date.now() - d.getTime();
    return ago < 30 * 24 * 60 * 60 * 1000;
  });

  return { logs, recent, loading, logWearing, removeEntry };
}
