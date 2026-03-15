import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { DashboardSubNav } from "@/components/DashboardSubNav";
import { useFriends, FriendEntry } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserPlus, UserMinus, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Mock user directory for search (in production this would be a Supabase query)
const USER_DIRECTORY = [
  { id: "u1", username: "scentlover", name: "Alex Rivera", bio: "Fragrance enthusiast. 200+ bottles and counting." },
  { id: "u2", username: "kevin_scents", name: "Kevin Cho", bio: "Minimalist collector. Quality over quantity." },
  { id: "u3", username: "sara_perfume", name: "Sara Mitchell", bio: "Seasonal scent curator." },
  { id: "u4", username: "omar_oud", name: "Omar Hassan", bio: "Oud and oriental specialist." },
  { id: "u5", username: "niche_nina", name: "Nina Rossi", bio: "Niche perfume explorer." },
  { id: "u6", username: "floral_fan", name: "Lily Chen", bio: "All things floral and delicate." },
  { id: "u7", username: "woodsy_mike", name: "Mike Thornton", bio: "Woody, smoky, and leathery." },
  { id: "u8", username: "citrus_queen", name: "Jasmine Patel", bio: "Fresh citrus fanatic." },
];

export default function DashboardFriends() {
  const { user } = useAuth();
  const { friends, loading, addFriend, removeFriend, isFriend } = useFriends();
  const [search, setSearch] = useState("");

  const searchResults = search.trim().length >= 2
    ? USER_DIRECTORY.filter((u) =>
        u.id !== user?.id &&
        (u.username.toLowerCase().includes(search.toLowerCase()) ||
         u.name.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-display font-bold">Friends ({friends.length})</h1>
          <DashboardSubNav />
        </div>

        {/* Search for friends */}
        <div className="glass rounded-xl flex items-center px-4 gap-3 mb-6">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Search results */}
        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="glass rounded-xl mb-8 divide-y divide-border/20 overflow-hidden"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1">
                Search Results
              </p>
              {searchResults.map((u) => {
                const alreadyFriend = isFriend(u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User size={16} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                    {alreadyFriend ? (
                      <button
                        onClick={() => removeFriend(u.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors flex items-center gap-1"
                      >
                        <UserMinus size={12} /> Remove
                      </button>
                    ) : (
                      <button
                        onClick={() => addFriend({ id: u.id, username: u.username, name: u.name, bio: u.bio })}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 transition-colors flex items-center gap-1"
                      >
                        <UserPlus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {search.trim().length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-6 mb-8">
            <p className="text-sm text-muted-foreground">No users found for &ldquo;{search}&rdquo;</p>
          </div>
        )}

        {/* Friends list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-hover rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/user/${f.username}`} className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-accent transition-colors">{f.name}</p>
                      <p className="text-xs text-muted-foreground">@{f.username}</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => removeFriend(f.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/15 transition-colors group"
                    title="Remove friend"
                  >
                    <UserMinus size={14} className="text-muted-foreground group-hover:text-destructive" />
                  </button>
                </div>
                {f.bio && <p className="text-xs text-muted-foreground">{f.bio}</p>}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <User size={48} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-display text-muted-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Search for users above to add friends</p>
          </div>
        )}
      </div>
    </div>
  );
}
