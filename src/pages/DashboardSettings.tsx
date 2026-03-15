import { Navbar } from "@/components/Navbar";
import { DashboardSubNav } from "@/components/DashboardSubNav";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, saveProfile, resizeAvatar } from "@/lib/profile";
import { useState, useRef } from "react";
import { User, Camera, Check } from "lucide-react";

export default function DashboardSettings() {
  const { user } = useAuth();

  const username =
    (user as any)?.user_metadata?.username ||
    (user as any)?.username ||
    user?.email?.split("@")[0] ||
    "";

  const [profile, setProfile] = useState(() => {
    const stored = getProfile();
    return {
      displayName: stored.displayName || username,
      bio: stored.bio,
      avatar: stored.avatar,
    };
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeAvatar(file);
      setProfile((p) => ({ ...p, avatar: dataUrl }));
    } catch {
      // ignore invalid images
    }
  }

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-4xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-display font-bold">Settings</h1>
          <DashboardSubNav />
        </div>

        <div className="glass rounded-xl p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-primary/30 overflow-hidden flex items-center justify-center">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={36} className="text-accent" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera size={20} className="text-white" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Profile picture</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click to upload. Cropped to 200×200.
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Display Name
            </label>
            <input
              value={profile.displayName}
              onChange={(e) =>
                setProfile((p) => ({ ...p, displayName: e.target.value }))
              }
              className="w-full bg-muted/20 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 border border-border/30"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) =>
                setProfile((p) => ({ ...p, bio: e.target.value }))
              }
              rows={3}
              className="w-full bg-muted/20 rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50 border border-border/30 resize-none"
            />
          </div>

          {/* Username (read-only) */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Username
            </label>
            <input
              value={username}
              readOnly
              className="w-full bg-muted/10 rounded-xl px-4 py-2.5 text-sm text-muted-foreground border border-border/20 cursor-not-allowed"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Email
            </label>
            <input
              value={user?.email || ""}
              readOnly
              className="w-full bg-muted/10 rounded-xl px-4 py-2.5 text-sm text-muted-foreground border border-border/20 cursor-not-allowed"
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
