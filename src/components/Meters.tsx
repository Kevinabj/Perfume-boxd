interface MeterProps {
  value: number; // 0-100
  label?: string;
}

const longevityLabels = [
  { max: 20, label: "Weak", color: "bg-red-400" },
  { max: 40, label: "Moderate", color: "bg-yellow-400" },
  { max: 60, label: "Long", color: "bg-green-400" },
  { max: 80, label: "Very Long", color: "bg-emerald-500" },
  { max: 100, label: "Eternal", color: "bg-accent" },
];

const sillageLabels = [
  { max: 20, label: "Intimate", color: "bg-blue-300" },
  { max: 40, label: "Moderate", color: "bg-blue-400" },
  { max: 60, label: "Strong", color: "bg-purple-400" },
  { max: 80, label: "Heavy", color: "bg-purple-500" },
  { max: 100, label: "Enormous", color: "bg-accent" },
];

function getMeterInfo(value: number, labels: typeof longevityLabels) {
  return labels.find((l) => value <= l.max) || labels[labels.length - 1];
}

export function LongevityMeter({ value }: MeterProps) {
  const info = getMeterInfo(value, longevityLabels);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Longevity</span>
        <span className="text-foreground font-medium">{info.label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${info.color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function SillageMeter({ value }: MeterProps) {
  const info = getMeterInfo(value, sillageLabels);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Sillage</span>
        <span className="text-foreground font-medium">{info.label}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${info.color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
