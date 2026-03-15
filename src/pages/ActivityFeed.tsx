import { Navbar } from "@/components/Navbar";
import { useActivity } from "@/hooks/useActivity";
import { useAuth } from "@/contexts/AuthContext";
import { getFragranceById } from "@/lib/catalog";
import { Star, Heart, Plus, FlaskConical, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const icons: Record<string, typeof Star> = {
  rated: Star,
  added: Plus,
  wishlist: Heart,
  wear: FlaskConical,
};

const labels: Record<string, string> = {
  rated: "Rated",
  added: "Added to collection",
  wishlist: "Added to wishlist",
  wear: "Wore",
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityFeed() {
  const { user } = useAuth();
  const { activities } = useActivity();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-2xl font-display font-bold mb-6">Activity Feed</h1>

        {!user ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Log in to see your activity feed.</p>
            <Link
              to="/auth"
              className="inline-block mt-4 px-6 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors"
            >
              Log in
            </Link>
          </div>
        ) : activities.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center text-muted-foreground">
            No activity yet. Start rating, collecting, and wearing fragrances!
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((act) => {
              const fragrance = getFragranceById(act.fragrance_id);
              if (!fragrance) return null;
              const Icon = icons[act.type] || Activity;

              return (
                <div key={act.id} className="glass rounded-xl p-4 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="text-muted-foreground">{labels[act.type] || act.type}</span>{" "}
                      <Link
                        to={`/fragrance/${fragrance.id}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {fragrance.name}
                      </Link>
                      {act.type === "rated" && act.detail && (
                        <span className="text-muted-foreground"> — {act.detail}/5</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{getTimeAgo(act.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
