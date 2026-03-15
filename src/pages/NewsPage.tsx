import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Newspaper, Tag, Clock, ArrowRight, Flame, PackageX, Handshake, Sparkles, Filter } from "lucide-react";

type NewsCategory = "all" | "release" | "discontinued" | "collab" | "reformulation" | "award";

interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  date: string;
  image?: string;
  brand: string;
  tags: string[];
}

const categoryConfig: Record<NewsCategory, { label: string; icon: typeof Flame; color: string }> = {
  all: { label: "All News", icon: Newspaper, color: "text-foreground" },
  release: { label: "New Release", icon: Flame, color: "text-emerald-600" },
  discontinued: { label: "Discontinued", icon: PackageX, color: "text-red-500" },
  collab: { label: "Collaboration", icon: Handshake, color: "text-blue-500" },
  reformulation: { label: "Reformulation", icon: Sparkles, color: "text-amber-500" },
  award: { label: "Award", icon: Tag, color: "text-purple-500" },
};

const mockNews: NewsItem[] = [
  {
    id: "n1", title: "Dior Sauvage Elixir Parfum — New Flanker Arriving Fall 2026",
    excerpt: "Dior announces a new ultra-concentrated flanker in the Sauvage line, featuring deeper amber and oud notes for an evening-ready interpretation.",
    category: "release", date: "2026-03-10", brand: "Dior", tags: ["Sauvage", "Elixir", "Fall 2026"],
  },
  {
    id: "n2", title: "Tom Ford Ombré Leather Officially Discontinued",
    excerpt: "After years of speculation, Tom Ford confirms Ombré Leather is being removed from the permanent lineup. Stock is expected to run out by Q2 2026.",
    category: "discontinued", date: "2026-03-08", brand: "Tom Ford", tags: ["Ombré Leather", "Discontinued"],
  },
  {
    id: "n3", title: "Maison Francis Kurkdjian x Palace Skateboards Capsule",
    excerpt: "MFK teams up with London streetwear brand Palace for a limited-edition scent blending oud, lime, and asphalt-inspired accords.",
    category: "collab", date: "2026-03-05", brand: "MFK", tags: ["MFK", "Palace", "Streetwear", "Limited Edition"],
  },
  {
    id: "n4", title: "Chanel No. 5 Reformulated with Sustainable Jasmine",
    excerpt: "Chanel quietly updates the No. 5 formula, sourcing jasmine from a new sustainable partner in Grasse. Early reviewers say the scent is 'nearly identical.'",
    category: "reformulation", date: "2026-03-01", brand: "Chanel", tags: ["No. 5", "Sustainability", "Grasse"],
  },
  {
    id: "n5", title: "Fragrantica Awards 2025 — Best in Show Winners",
    excerpt: "The annual community-voted awards crown Baccarat Rouge 540 Extrait as Fragrance of the Year for the third consecutive time.",
    category: "award", date: "2026-02-28", brand: "Various", tags: ["Awards", "BR540", "Community"],
  },
  {
    id: "n6", title: "Creed Aventus Batch Variations — 2026 Update",
    excerpt: "New batches of Aventus show a return to the smokier profile beloved by early adopters, following years of community feedback.",
    category: "reformulation", date: "2026-02-25", brand: "Creed", tags: ["Aventus", "Batch Variation"],
  },
  {
    id: "n7", title: "Byredo x IKEA Home Scent Collection Launches Globally",
    excerpt: "The much-anticipated collaboration between Byredo and IKEA brings luxury home fragrances to the mainstream market at accessible prices.",
    category: "collab", date: "2026-02-20", brand: "Byredo", tags: ["IKEA", "Home Fragrance"],
  },
  {
    id: "n8", title: "Versace Eros Flame — Limited Edition Summer 2026",
    excerpt: "Versace launches a vibrant summer flanker of Eros Flame with tropical fruit and sun-kissed woods.",
    category: "release", date: "2026-02-15", brand: "Versace", tags: ["Eros", "Summer", "Limited Edition"],
  },
];

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("all");

  const filtered = activeCategory === "all" ? mockNews : mockNews.filter((n) => n.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-5xl mx-auto px-4 pb-20">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-foreground">Fragrance News</h1>
          <p className="text-sm text-muted-foreground mt-1">Latest releases, discontinuations, collabs & more</p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-8">
          {(Object.entries(categoryConfig) as [NewsCategory, typeof categoryConfig["all"]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`text-xs px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeCategory === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <cfg.icon size={13} />
              {cfg.label}
            </button>
          ))}
        </div>

        {/* News list */}
        <div className="space-y-4">
          {filtered.map((item, i) => {
            const cat = categoryConfig[item.category];
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-hover rounded-xl p-5 group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${cat.color}`}>
                        <cat.icon size={11} />
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{item.brand}</span>
                    </div>
                    <h2 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
                      {item.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.excerpt}</p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {item.tags.map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
