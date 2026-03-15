import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const LOCAL_KEY = "perfumisto_activity";

export interface Activity {
  id: string;
  type: "rated" | "added" | "wishlist" | "wear";
  fragrance_id: string;
  detail?: string;
  created_at: string;
}

function getLocal(): Activity[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(entries: Activity[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function useActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!user) { setActivities([]); return; }
    setActivities(getLocal());
  }, [user]);

  const logActivity = useCallback((type: Activity["type"], fragranceId: string, detail?: string) => {
    if (!user) return;
    const entry: Activity = {
      id: `act-${Date.now()}`,
      type,
      fragrance_id: fragranceId,
      detail,
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [entry, ...prev].slice(0, 100));
    const local = getLocal();
    local.unshift(entry);
    setLocal(local.slice(0, 100));
  }, [user]);

  return { activities, logActivity };
}
