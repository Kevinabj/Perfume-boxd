import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, User, Menu, X, Compass, Sparkles, Eye, FlaskConical,
  Building2, GitCompareArrows, Newspaper, TrendingUp, Sun, Moon,
  ChevronDown, LogOut, Settings, LayoutDashboard, CloudSun, Star,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import logoDark from "@/assets/logo-dark.png";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile } from "@/lib/profile";
import { searchFragrances, getAllBrands } from "@/lib/catalog";
import type { Fragrance } from "@/types";

// ---------------------------------------------------------------------------
// Nav structure
// ---------------------------------------------------------------------------

interface NavItem {
  to: string;
  label: string;
  icon: typeof Search;
}

interface NavDropdown {
  label: string;
  icon: typeof Search;
  matchPaths: string[];          // highlight when any of these match
  children: NavItem[];
}

type NavEntry = NavItem | NavDropdown;

function isDropdown(e: NavEntry): e is NavDropdown {
  return "children" in e;
}

const navEntries: NavEntry[] = [
  {
    label: "Perfumes",
    icon: FlaskConical,
    matchPaths: ["/fragrances", "/notes", "/designers", "/seasons"],
    children: [
      { to: "/fragrances", label: "All", icon: Compass },
      { to: "/notes", label: "Notes", icon: FlaskConical },
      { to: "/designers", label: "Designers", icon: Building2 },
      { to: "/seasons", label: "Seasons", icon: CloudSun },
    ],
  },
  {
    label: "Discover",
    icon: Sparkles,
    matchPaths: ["/finder", "/compare", "/blind-discovery"],
    children: [
      { to: "/finder", label: "Finder", icon: Sparkles },
      { to: "/compare", label: "Compare", icon: GitCompareArrows },
      { to: "/blind-discovery", label: "Blind Discovery", icon: Eye },
    ],
  },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/news", label: "News", icon: Newspaper },
];

// Flatten for mobile menu
const allMobileLinks: NavItem[] = navEntries.flatMap((e) =>
  isDropdown(e) ? e.children : [e],
);

// ---------------------------------------------------------------------------
// Dropdown component (desktop)
// ---------------------------------------------------------------------------

function NavDropdownMenu({ entry, pathname }: { entry: NavDropdown; pathname: string }) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const isActive = entry.matchPaths.some((p) => pathname.startsWith(p));

  function enter() {
    clearTimeout(timeout.current);
    setOpen(true);
  }
  function leave() {
    timeout.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
      <button
        className={`text-sm font-medium transition-colors flex items-center gap-1 ${
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <entry.icon size={15} />
        {entry.label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 glass rounded-xl border border-border/30 shadow-lg overflow-hidden z-50"
          >
            <div className="py-1">
              {entry.children.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                    pathname.startsWith(child.to)
                      ? "text-primary bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  }`}
                >
                  <child.icon size={15} />
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const userMenuTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const searchRef = useRef<HTMLDivElement>(null);

  // Close search on click outside
  useEffect(() => {
    if (!searchOpen) return;
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

  // Close search on route change
  useEffect(() => { setSearchOpen(false); setSearchQuery(""); }, [location.pathname]);

  // Dynamic search results
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return { fragrances: [] as Fragrance[], brands: [] as { name: string; count: number }[] };
    const fragrances = searchFragrances(searchQuery, { limit: 6 });
    const brands = getAllBrands()
      .filter((b) => b.name.toLowerCase().includes(q))
      .slice(0, 4);
    return { fragrances, brands };
  }, [searchQuery]);

  const hasResults = searchResults.fragrances.length > 0 || searchResults.brands.length > 0;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="shrink-0">
          <img src={logoDark} alt="Perfumisto" className="h-7" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {navEntries.map((entry) =>
            isDropdown(entry) ? (
              <NavDropdownMenu key={entry.label} entry={entry} pathname={location.pathname} />
            ) : (
              <Link
                key={entry.to}
                to={entry.to}
                className={`text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith(entry.to) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <entry.icon size={15} />
                {entry.label}
              </Link>
            ),
          )}
        </div>

        {/* Search + profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {dark ? <Sun size={18} className="text-muted-foreground" /> : <Moon size={18} className="text-muted-foreground" />}
          </button>

          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <Search size={18} className="text-muted-foreground" />
          </button>

          {user ? (
            <div
              className="relative"
              onMouseEnter={() => { clearTimeout(userMenuTimeout.current); setUserMenuOpen(true); }}
              onMouseLeave={() => { userMenuTimeout.current = setTimeout(() => setUserMenuOpen(false), 150); }}
            >
              <button className="p-1 rounded-full hover:ring-2 hover:ring-primary/40 transition-all">
                {(() => {
                  const avatar = getProfile().avatar;
                  return avatar ? (
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
                      <User size={16} className="text-primary" />
                    </div>
                  );
                })()}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 glass rounded-xl border border-border/30 shadow-lg overflow-hidden z-50"
                  >
                    <div className="px-4 py-2 border-b border-border/20">
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                        <LayoutDashboard size={15} /> Dashboard
                      </Link>
                      <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors">
                        <Settings size={15} /> Settings
                      </Link>
                      <button
                        onClick={async () => { setUserMenuOpen(false); await signOut(); navigate("/login"); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="p-2 rounded-lg hover:bg-muted/30 transition-colors">
              <User size={18} className="text-muted-foreground" />
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Search bar with dynamic results */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            ref={searchRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border/20 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fragrances, brands…"
                    className="w-full bg-muted/30 rounded-lg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </form>

              {/* Dynamic results dropdown */}
              {searchQuery.trim().length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 glass rounded-xl border border-border/30 shadow-lg overflow-hidden max-h-[70vh] overflow-y-auto"
                >
                  {hasResults ? (
                    <div className="divide-y divide-border/20">
                      {/* Fragrance results */}
                      {searchResults.fragrances.length > 0 && (
                        <div className="p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                            Fragrances
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.fragrances.map((f) => (
                              <Link
                                key={f.id}
                                to={`/fragrance/${f.id}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/20 transition-colors group"
                              >
                                {f.image_url ? (
                                  <img src={f.image_url} alt="" className="w-8 h-10 object-contain rounded shrink-0" />
                                ) : (
                                  <div className="w-8 h-10 rounded bg-muted/30 shrink-0 flex items-center justify-center">
                                    <FlaskConical size={14} className="text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {f.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">{f.brand}</p>
                                </div>
                                {f.fragrantica_rating > 0 && (
                                  <div className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    {f.fragrantica_rating.toFixed(1)}
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Brand results */}
                      {searchResults.brands.length > 0 && (
                        <div className="p-3">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                            Designers
                          </p>
                          <div className="space-y-0.5">
                            {searchResults.brands.map((b) => (
                              <Link
                                key={b.name}
                                to={`/designers?brand=${encodeURIComponent(b.name)}`}
                                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/20 transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                                  <Building2 size={14} className="text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {b.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {b.count} fragrance{b.count !== 1 ? "s" : ""}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View all link */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                            setSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className="w-full text-center py-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-muted/10"
                        >
                          View all results for &ldquo;{searchQuery.trim()}&rdquo;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery.trim()}&rdquo;</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Try a different name or brand</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border/20 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {allMobileLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    location.pathname.startsWith(link.to) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/20"
                  }`}
                >
                  <link.icon size={18} />
                  {link.label}
                </Link>
              ))}
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/20"
              >
                Settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
