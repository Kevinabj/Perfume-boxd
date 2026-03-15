import { Navbar } from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Eye, Bell, Palette, Image, LogOut, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, saveProfile } from "@/lib/profile";

const PRIVACY_KEY = "perfumisto_privacy";
const NOTIF_KEY = "perfumisto_notifications";

interface PrivacyData {
  showCollection: boolean;
  showWishlist: boolean;
}

interface NotifData {
  friendRequests: boolean;
  reviewInteractions: boolean;
  newRecommendations: boolean;
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data));
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const defaultName = (user as any)?.user_metadata?.username
    || (user as any)?.username
    || user?.email?.split("@")[0]
    || "";

  const [profile, setProfile] = useState(() => {
    const stored = getProfile();
    return { displayName: stored.displayName || defaultName, bio: stored.bio };
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const [privacy, setPrivacy] = useState<PrivacyData>(() =>
    loadJson(PRIVACY_KEY, { showCollection: true, showWishlist: false }),
  );

  const [notif, setNotif] = useState<NotifData>(() =>
    loadJson(NOTIF_KEY, { friendRequests: true, reviewInteractions: true, newRecommendations: false }),
  );

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  // Sync privacy changes
  useEffect(() => { saveJson(PRIVACY_KEY, privacy); }, [privacy]);

  // Sync notification changes
  useEffect(() => { saveJson(NOTIF_KEY, notif); }, [notif]);

  // Sync theme with DOM + Navbar
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function handleSaveProfile() {
    const existing = getProfile();
    saveProfile({ ...existing, displayName: profile.displayName, bio: profile.bio });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold mb-8">Settings</h1>

        {/* Profile */}
        <section className="glass rounded-xl p-6 mb-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <User size={18} className="text-accent" /> Profile
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
                <User size={24} className="text-accent" />
              </div>
              <button className="text-sm text-soft hover:underline">Change avatar</button>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Display Name</label>
              <input
                value={profile.displayName}
                onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                className="w-full bg-muted/20 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 border border-border/30"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={2}
                className="w-full bg-muted/20 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 border border-border/30 resize-none"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors flex items-center gap-2"
            >
              {profileSaved ? <><Check size={14} /> Saved!</> : "Save changes"}
            </button>
          </div>
        </section>

        {/* Privacy */}
        <section className="glass rounded-xl p-6 mb-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Eye size={18} className="text-accent" /> Privacy
          </h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-sm">Show collection publicly</span>
              <button
                onClick={() => setPrivacy((p) => ({ ...p, showCollection: !p.showCollection }))}
                className={`w-10 h-6 rounded-full transition-colors ${privacy.showCollection ? "bg-primary" : "bg-muted"} relative`}
              >
                <div className={`w-4 h-4 bg-foreground rounded-full absolute top-1 transition-transform ${privacy.showCollection ? "left-5" : "left-1"}`} />
              </button>
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm">Show wishlist publicly</span>
              <button
                onClick={() => setPrivacy((p) => ({ ...p, showWishlist: !p.showWishlist }))}
                className={`w-10 h-6 rounded-full transition-colors ${privacy.showWishlist ? "bg-primary" : "bg-muted"} relative`}
              >
                <div className={`w-4 h-4 bg-foreground rounded-full absolute top-1 transition-transform ${privacy.showWishlist ? "left-5" : "left-1"}`} />
              </button>
            </label>
          </div>
        </section>

        {/* Notifications */}
        <section className="glass rounded-xl p-6 mb-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Bell size={18} className="text-accent" /> Notifications
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notif.friendRequests}
                onChange={(e) => setNotif((n) => ({ ...n, friendRequests: e.target.checked }))}
                className="accent-primary rounded"
              />
              Friend requests
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notif.reviewInteractions}
                onChange={(e) => setNotif((n) => ({ ...n, reviewInteractions: e.target.checked }))}
                className="accent-primary rounded"
              />
              Review interactions
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notif.newRecommendations}
                onChange={(e) => setNotif((n) => ({ ...n, newRecommendations: e.target.checked }))}
                className="accent-primary rounded"
              />
              New recommendations
            </label>
          </div>
        </section>

        {/* Theme */}
        <section className="glass rounded-xl p-6 mb-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Palette size={18} className="text-accent" /> Theme
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setDark(true)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${dark ? "bg-primary text-primary-foreground" : "glass-hover text-muted-foreground"}`}
            >
              Dark
            </button>
            <button
              onClick={() => setDark(false)}
              className={`px-4 py-2 rounded-xl text-sm transition-colors ${!dark ? "bg-primary text-primary-foreground" : "glass-hover text-muted-foreground"}`}
            >
              Light
            </button>
          </div>
        </section>

        {/* Account / Sign out */}
        <section className="glass rounded-xl p-6 mb-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <LogOut size={18} className="text-accent" /> Account
          </h2>
          {user && (
            <p className="text-sm text-muted-foreground mb-4">
              Signed in as <span className="text-foreground">{user.email}</span>
            </p>
          )}
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-destructive/15 hover:bg-destructive/25 text-destructive text-sm transition-colors"
          >
            Sign out
          </button>
        </section>

        {/* Logo placeholders */}
        <section className="glass rounded-xl p-6">
          <h2 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Image size={18} className="text-accent" /> Brand Assets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-dashed border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-2">Dark Logo</p>
              <div className="h-12 flex items-center justify-center text-muted-foreground/30 text-xs">Uploaded ✓</div>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-2">White Logo</p>
              <div className="h-12 flex items-center justify-center text-muted-foreground/30 text-xs">Uploaded ✓</div>
            </div>
            <div className="p-4 rounded-xl border border-dashed border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-2">Favicon</p>
              <div className="h-12 flex items-center justify-center text-muted-foreground/30 text-xs">Uploaded ✓</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
