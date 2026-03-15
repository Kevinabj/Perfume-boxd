import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useFriends } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { Search, UserMinus, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function FriendsPage() {
  const { user } = useAuth();
  const { friends, loading, removeFriend } = useFriends();
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? friends.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.username.toLowerCase().includes(search.toLowerCase()),
      )
    : friends;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold mb-6">Friends ({friends.length})</h1>

        {!user ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Log in to see your friends.</p>
            <Link
              to="/login"
              className="inline-block mt-4 px-6 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors"
            >
              Log in
            </Link>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="glass rounded-xl flex items-center px-4 gap-3 mb-8">
              <Search size={16} className="text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter friends..."
                className="w-full bg-transparent py-3 text-sm outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Friends list */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 size={24} className="animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-hover rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Link to={`/user/${f.username}`} className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                          <User size={20} className="text-accent" />
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
            ) : search.trim() ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No friends matching "{search}"</p>
              </div>
            ) : (
              <div className="text-center py-20">
                <User size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-display text-muted-foreground">No friends yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Add friends from the{" "}
                  <Link to="/me/friends" className="text-primary hover:underline">
                    Dashboard
                  </Link>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
