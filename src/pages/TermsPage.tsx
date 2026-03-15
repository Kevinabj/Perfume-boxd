import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">Terms of Service</h1>
        <div className="space-y-6 text-muted-foreground text-sm leading-relaxed">
          <p><strong className="text-foreground">Effective:</strong> March 2026</p>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Using Perfumisto</h2>
            <p>By creating an account, you agree to use the platform respectfully. You may add fragrances to your collection, write honest reviews, and interact with other members. Any abusive, spammy, or misleading behavior may result in account suspension.</p>
          </section>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Your Content</h2>
            <p>Reviews, ratings, and notes you submit remain yours. By posting, you grant Perfumisto a license to display your content on the platform. You can delete your content at any time.</p>
          </section>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Limitations</h2>
            <p>Perfumisto is provided "as is." We strive for accuracy in fragrance data but rely on community contributions and cannot guarantee completeness. Retail prices and availability are estimates.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
