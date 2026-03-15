import { Link } from "react-router-dom";
import logoDark from "@/assets/logo-dark.png";
import { Search, BarChart3, Users, Star, Sparkles, Sun } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { PerfumeCard } from "@/components/PerfumeCard";
import { getTopRated } from "@/lib/catalog";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  { icon: BarChart3, title: "Build Your Collection", desc: "Track every fragrance you own with personal ratings, notes, and seasonal tags." },
  { icon: Sun, title: "Season & Accord Coverage", desc: "Visualize your collection's coverage and find gaps in your wardrobe." },
  { icon: Search, title: "Smart Finder", desc: "Find perfumes by accords, season, similarity, or fill your collection gaps." },
  { icon: Users, title: "Friends & Activity", desc: "Follow friends, see what they're wearing, and compare collections." },
  { icon: Star, title: "Reviews & Ratings", desc: "Rate fragrances, write reviews, and help the community discover gems." },
  { icon: Sparkles, title: "AI Recommendations", desc: "Get personalized suggestions based on your taste profile and collection." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-4xl md:text-6xl font-display font-bold leading-tight text-white"
            >
              Discover, collect, and{" "}
              <span className="text-[hsl(273,60%,75%)]">
                live your scent.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-white/75 max-w-lg"
            >
              Discover your scent identity, build a curated collection, and connect with a community that speaks your olfactory language.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/signup"
                className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground font-medium transition-colors glow text-center"
              >
                Get started — it's free
              </Link>
              <Link
                to="/fragrances"
                className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 font-medium text-white transition-colors text-center"
              >
                Explore fragrances
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10 max-w-md"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center px-4 gap-3">
                <Search size={18} className="text-white/60" />
                <input
                  type="text"
                  placeholder="Search fragrances, brands, notes..."
                  className="w-full bg-transparent py-3.5 text-sm text-white placeholder:text-white/50 outline-none"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-12 text-foreground">
            Everything you need for your <span className="text-primary">fragrance journey</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="glass-hover rounded-xl p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4 text-foreground">
            Discover <span className="text-primary">trending fragrances</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">Popular scents loved by the community</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {getTopRated(4).map((f) => (
              <PerfumeCard key={f.id} fragrance={f} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-muted/20 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <img src={logoDark} alt="Perfumisto" className="h-12 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your personal fragrance companion. Discover, collect, and live your scent identity with a community that speaks your olfactory language.
              </p>
            </div>

            {/* Explore */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Explore</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/fragrances" className="hover:text-foreground transition-colors">All Fragrances</Link></li>
                <li><Link to="/designers" className="hover:text-foreground transition-colors">Designers & Houses</Link></li>
                <li><Link to="/notes" className="hover:text-foreground transition-colors">Browse by Notes</Link></li>
                <li><Link to="/finder" className="hover:text-foreground transition-colors">Smart Finder</Link></li>
                <li><Link to="/trends" className="hover:text-foreground transition-colors">Trends</Link></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Community</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/news" className="hover:text-foreground transition-colors">News & Releases</Link></li>
                <li><Link to="/activity" className="hover:text-foreground transition-colors">Activity Feed</Link></li>
                <li><Link to="/friends" className="hover:text-foreground transition-colors">Friends</Link></li>
                <li><Link to="/blind-discovery" className="hover:text-foreground transition-colors">Blind Discovery</Link></li>
                <li><Link to="/compare" className="hover:text-foreground transition-colors">Compare</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/20 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-muted-foreground">© 2026 Perfumisto. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">Crafted for fragrance enthusiasts worldwide 🌍</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
