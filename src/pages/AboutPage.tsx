import { Navbar } from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">About Perfumisto</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground text-sm leading-relaxed">
          <p>Perfumisto is a community-driven platform built for fragrance enthusiasts who want more than just a list of perfumes. We believe your scent is an extension of your identity — and it deserves a home.</p>
          <p>Our mission is to help you discover, organize, and share your olfactory journey. Whether you're a seasoned collector with hundreds of bottles or just starting out, Perfumisto gives you the tools to track what you own, find what you'll love next, and connect with people who share your passion.</p>
          <p>From Scent DNA profiles and smart recommendations to community reviews and trend tracking, every feature is designed with one thing in mind: making the world of fragrance more personal, accessible, and fun.</p>
          <p>Built with love by fragrance nerds, for fragrance nerds. 🖤</p>
        </div>
      </div>
    </div>
  );
}
