import { Navbar } from "@/components/Navbar";
import { DashboardSubNav } from "@/components/DashboardSubNav";
import { getFragranceById } from "@/lib/catalog";
import { useWearingLog } from "@/hooks/useWearingLog";
import { useCollection } from "@/hooks/useCollection";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Heart, Clock, AlertTriangle, TrendingUp, Search, Loader2, Trash2 } from "lucide-react";
import type { Fragrance } from "@/types";

export default function WearingLogPage() {
  const { logs, loading, logWearing, removeEntry } = useWearingLog();
  const { items: collectionIds } = useCollection();

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFragrance, setSelectedFragrance] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Build collection fragrances for the picker
  const collectionFragrances = useMemo(
    () => collectionIds.map((id) => getFragranceById(id)).filter((f): f is Fragrance => !!f),
    [collectionIds],
  );

  // Filter picker results by search
  const filteredPicker = useMemo(() => {
    if (!searchQuery.trim()) return collectionFragrances;
    const q = searchQuery.toLowerCase();
    return collectionFragrances.filter(
      (f) => f.name.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q),
    );
  }, [collectionFragrances, searchQuery]);

  // Stats
  const wearCounts: Record<string, number> = {};
  logs.forEach((l) => {
    wearCounts[l.fragrance_id] = (wearCounts[l.fragrance_id] || 0) + 1;
  });
  const mostWornId = Object.entries(wearCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostWorn = mostWornId ? getFragranceById(mostWornId) : undefined;

  // Unique fragrances worn
  const uniqueWorn = new Set(logs.map((l) => l.fragrance_id)).size;

  // Forgotten bottles (in collection but not worn in last 60 days)
  const recentlyWornIds = new Set(
    logs.filter((l) => Date.now() - new Date(l.worn_at).getTime() < 60 * 24 * 60 * 60 * 1000).map((l) => l.fragrance_id),
  );
  const forgotten = collectionFragrances.filter((f) => !recentlyWornIds.has(f.id)).slice(0, 4);

  // Calendar heatmap data — count wears per month (current year)
  const currentYear = new Date().getFullYear();
  const monthCounts = Array(12).fill(0);
  logs.forEach((l) => {
    const d = new Date(l.worn_at);
    if (d.getFullYear() === currentYear) monthCounts[d.getMonth()]++;
  });

  async function handleSave() {
    if (!selectedFragrance) return;
    setSaving(true);
    await logWearing(selectedFragrance, note || undefined, date);
    setSaving(false);
    setSelectedFragrance("");
    setNote("");
    setSearchQuery("");
    setShowForm(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 max-w-6xl mx-auto px-4 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold">Wearing Log</h1>
              <p className="text-sm text-muted-foreground">Track what you wear and when</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors flex items-center gap-2"
            >
              <Plus size={16} /> Log Wear
            </button>
          </div>
          <DashboardSubNav />
        </div>

        {/* Log form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 mb-6 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fragrance</label>
              {collectionFragrances.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Add fragrances to your collection first.</p>
              ) : (
                <>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedFragrance(""); }}
                      placeholder="Search your collection..."
                      className="w-full bg-muted/20 border border-border/30 rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </div>
                  {(searchQuery || !selectedFragrance) && filteredPicker.length > 0 && (
                    <div className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-border/30 bg-card">
                      {filteredPicker.slice(0, 8).map((f) => (
                        <button
                          key={f.id}
                          onClick={() => { setSelectedFragrance(f.id); setSearchQuery(`${f.name} — ${f.brand}`); }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/20 flex items-center gap-2 ${selectedFragrance === f.id ? "bg-primary/10" : ""}`}
                        >
                          {f.image_url ? (
                            <img src={f.image_url} alt="" className="w-7 h-7 rounded object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded bg-deep flex items-center justify-center text-[10px] font-bold text-accent/40">{f.name[0]}</div>
                          )}
                          <span className="truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">{f.brand}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Note (optional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="How was it?" className="w-full bg-muted/20 border border-border/30 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none" />
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedFragrance || saving}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Save Log
            </button>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center">
            <TrendingUp size={20} className="mx-auto mb-2 text-primary" />
            <p className="text-lg font-bold">{logs.length}</p>
            <p className="text-xs text-muted-foreground">Total Wears</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Heart size={20} className="mx-auto mb-2 text-pink-500" />
            <p className="text-lg font-bold">{uniqueWorn}</p>
            <p className="text-xs text-muted-foreground">Unique Scents</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Calendar size={20} className="mx-auto mb-2 text-blue-500" />
            <p className="text-sm font-bold truncate">{mostWorn?.name || "—"}</p>
            <p className="text-xs text-muted-foreground">Most Worn</p>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Clock size={20} className="mx-auto mb-2 text-amber-500" />
            <p className="text-lg font-bold">{logs.length > 0 ? Math.round(logs.length / Math.max(uniqueWorn, 1) * 10) / 10 : 0}</p>
            <p className="text-xs text-muted-foreground">Avg Wears/Scent</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent wears */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-display font-semibold mb-2">Recent Wears</h3>
              {logs.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-sm text-muted-foreground">No wears logged yet. Tap "Log Wear" to start tracking!</p>
                </div>
              ) : (
                logs.slice(0, 20).map((log, i) => {
                  const frag = getFragranceById(log.fragrance_id);
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="glass rounded-xl p-4 flex items-center gap-4"
                    >
                      {frag?.image_url ? (
                        <img src={frag.image_url} alt={frag?.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-deep flex items-center justify-center">
                          <span className="text-sm font-bold text-accent/40">{frag?.name?.[0] || "?"}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{frag?.name || "Unknown"}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{log.worn_at}</span>
                          {frag && <span className="text-[10px]">{frag.brand}</span>}
                        </div>
                        {log.note && <p className="text-xs text-muted-foreground mt-1">{log.note}</p>}
                      </div>
                      <button onClick={() => removeEntry(log.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Forgotten bottles */}
              {forgotten.length > 0 && (
                <div className="glass rounded-xl p-5">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" /> Forgotten Bottles
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Not worn in 60+ days. Give them love!</p>
                  {forgotten.map((f) => (
                    <div key={f.id} className="flex items-center gap-3 py-2">
                      {f.image_url ? (
                        <img src={f.image_url} alt={f.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-deep flex items-center justify-center text-[10px] font-bold text-accent/40">{f.name[0]}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{f.brand}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seasonal distribution */}
              <div className="glass rounded-xl p-5">
                <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                  <Clock size={14} className="text-primary" /> Seasonal Distribution
                </h3>
                <div className="space-y-2">
                  {(["Winter", "Spring", "Summer", "Fall"] as const).map((s) => {
                    const count = logs.filter((l) => {
                      const m = new Date(l.worn_at).getMonth();
                      if (s === "Winter") return m === 11 || m <= 1;
                      if (s === "Spring") return m >= 2 && m <= 4;
                      if (s === "Summer") return m >= 5 && m <= 7;
                      return m >= 8 && m <= 10;
                    }).length;
                    return (
                      <div key={s} className="flex items-center gap-2 text-xs">
                        <span className="w-12 text-muted-foreground">{s}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full rounded-full bg-primary/50" style={{ width: logs.length > 0 ? `${(count / logs.length) * 100}%` : "0%" }} />
                        </div>
                        <span className="w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
