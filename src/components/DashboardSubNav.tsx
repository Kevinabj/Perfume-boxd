import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FolderHeart, Heart, BookOpen, Users, Settings } from "lucide-react";

const links = [
  { to: "/me", label: "Dashboard", icon: LayoutDashboard },
  { to: "/me/collection", label: "Collection", icon: FolderHeart },
  { to: "/me/wishlist", label: "Wishlist", icon: Heart },
  { to: "/me/log", label: "Wearing Log", icon: BookOpen },
  { to: "/me/friends", label: "Friends", icon: Users },
  { to: "/me/settings", label: "Settings", icon: Settings },
];

export function DashboardSubNav() {
  const location = useLocation();

  return (
    <div className="flex gap-2 flex-wrap">
      {links.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <link.icon size={15} />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
