import { Accord } from "@/types";
import { getAccordColor } from "@/data/accords";

interface AccordBarStackProps {
  accords: Accord[];
  maxWidth?: number;
  showLabels?: boolean;
  size?: "sm" | "md" | "lg";
}

export function AccordBarStack({ accords, showLabels = true, size = "md" }: AccordBarStackProps) {
  const heights = { sm: "h-2", md: "h-3", lg: "h-4" };
  const h = heights[size];

  return (
    <div className="space-y-1.5 w-full">
      {accords.map((accord) => (
        <div key={accord.name} className="flex items-center gap-2">
          {showLabels && (
            <span className="text-xs text-muted-foreground w-24 truncate shrink-0">
              {accord.name}
            </span>
          )}
          <div className="flex-1 rounded-full overflow-hidden bg-muted/30">
            <div
              className={`${h} rounded-full transition-all duration-500`}
              style={{
                width: `${accord.score}%`,
                backgroundColor: getAccordColor(accord.name),
              }}
            />
          </div>
          {showLabels && (
            <span className="text-xs text-muted-foreground w-8 text-right">{accord.score}</span>
          )}
        </div>
      ))}
    </div>
  );
}
