import { Navbar } from "@/components/Navbar";
import { Upload, ArrowRight, Database } from "lucide-react";

export default function AdminImport() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-20">
        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Database size={24} className="text-accent" />
            <h1 className="text-2xl font-display font-bold">Data Import</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Admin</span>
          </div>

          <div className="space-y-6">
            {/* Upload */}
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
              <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Upload Kaggle CSV file</p>
              <button className="px-4 py-2 rounded-xl glass-hover text-sm">Choose file</button>
            </div>

            {/* Mapping preview */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Column Mapping Preview</h3>
              <div className="space-y-2 text-sm">
                {[
                  ["name", "→ fragrance.name"],
                  ["brand", "→ fragrance.brand"],
                  ["rating_value", "→ fragrance.fragrantica_rating"],
                  ["rating_count", "→ fragrance.fragrantica_votes"],
                  ["main_accords", "→ fragrance.main_accords"],
                  ["top_notes", "→ fragrance.top_notes"],
                  ["middle_notes", "→ fragrance.heart_notes"],
                  ["base_notes", "→ fragrance.base_notes"],
                  ["url", "→ fragrance.fragrantica_url"],
                ].map(([from, to]) => (
                  <div key={from} className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono text-xs w-32">{from}</span>
                    <ArrowRight size={12} className="text-accent" />
                    <span className="text-soft text-xs">{to}</span>
                  </div>
                ))}
              </div>
            </div>

            <button disabled className="w-full py-3 rounded-xl bg-primary/30 text-primary-foreground/50 text-sm cursor-not-allowed">
              Run Import (coming soon)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
