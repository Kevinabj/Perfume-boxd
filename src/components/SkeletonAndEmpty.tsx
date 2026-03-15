export function SkeletonCard() {
  return (
    <div className="glass rounded-xl p-5 space-y-3 animate-pulse">
      <div className="h-5 bg-muted/40 rounded w-3/4" />
      <div className="h-3 bg-muted/30 rounded w-1/2" />
      <div className="space-y-2 mt-3">
        <div className="h-2 bg-muted/30 rounded" />
        <div className="h-2 bg-muted/30 rounded w-4/5" />
        <div className="h-2 bg-muted/30 rounded w-3/5" />
      </div>
      <div className="flex gap-2 mt-3">
        <div className="h-8 bg-muted/30 rounded-lg flex-1" />
        <div className="h-8 w-8 bg-muted/30 rounded-lg" />
        <div className="h-8 w-8 bg-muted/30 rounded-lg" />
      </div>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
        <span className="text-2xl">✨</span>
      </div>
      <h3 className="text-lg font-display font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/80 text-primary-foreground text-sm transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
