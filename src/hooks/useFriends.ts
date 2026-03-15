import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LOCAL_KEY = "perfumisto_friends";

export interface FriendEntry {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  added_at: string;
}

function getLocal(): FriendEntry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function setLocal(entries: FriendEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setFriends([]); setLoading(false); return; }

    if (!supabaseConfigured) {
      setFriends(getLocal());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from("friendships")
      .select("friend_id, friend_username, friend_name, friend_avatar, friend_bio, created_at")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!error && data) {
          setFriends(data.map((r) => ({
            id: r.friend_id,
            username: r.friend_username,
            name: r.friend_name,
            avatar: r.friend_avatar,
            bio: r.friend_bio,
            added_at: r.created_at,
          })));
        }
        setLoading(false);
      });
  }, [user]);

  const addFriend = useCallback(async (friend: Omit<FriendEntry, "added_at">) => {
    if (!user) return;
    const entry: FriendEntry = { ...friend, added_at: new Date().toISOString() };
    setFriends((prev) => prev.some((f) => f.id === friend.id) ? prev : [...prev, entry]);

    if (!supabaseConfigured) {
      const local = getLocal();
      if (!local.some((f) => f.id === friend.id)) {
        local.push(entry);
        setLocal(local);
      }
      return;
    }
    await supabase.from("friendships").upsert({
      user_id: user.id,
      friend_id: friend.id,
      friend_username: friend.username,
      friend_name: friend.name,
      friend_avatar: friend.avatar,
      friend_bio: friend.bio,
    });
  }, [user]);

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user) return;
    setFriends((prev) => prev.filter((f) => f.id !== friendId));

    if (!supabaseConfigured) {
      setLocal(getLocal().filter((f) => f.id !== friendId));
      return;
    }
    await supabase.from("friendships").delete().eq("user_id", user.id).eq("friend_id", friendId);
  }, [user]);

  const isFriend = useCallback((friendId: string) => friends.some((f) => f.id === friendId), [friends]);

  return { friends, loading, addFriend, removeFriend, isFriend };
}
