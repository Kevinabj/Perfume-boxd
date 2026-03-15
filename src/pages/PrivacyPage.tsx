import { Navbar } from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">Privacy Policy</h1>
        <div className="space-y-6 text-muted-foreground text-sm leading-relaxed">
          <p><strong className="text-foreground">Last updated:</strong> March 2026</p>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">What We Collect</h2>
            <p>We collect only the information needed to provide you with a great experience: your account details (email, display name), collection data, reviews, and usage analytics to improve the platform.</p>
          </section>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">How We Use It</h2>
            <p>Your data powers your personal dashboard, recommendations, and social features. We never sell your personal information to third parties. Anonymized, aggregated data may be used for trend analysis and community insights.</p>
          </section>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Your Control</h2>
            <p>You can export or delete your data at any time from Settings. Your collection and reviews are private by default — you choose what to share publicly.</p>
          </section>
          <section>
            <h2 className="text-lg font-display font-semibold text-foreground mb-2">Contact</h2>
            <p>Questions about your privacy? Reach out at privacy@perfumisto.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
