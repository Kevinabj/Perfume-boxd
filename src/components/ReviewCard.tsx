import { RatingStars } from "./RatingStars";
import { ThumbsUp, Trash2, User as UserIcon } from "lucide-react";

interface ReviewUser {
  name: string;
  username: string;
}

interface ReviewData {
  id: string;
  rating: number;
  text: string;
  tags?: string[];
  helpful_count: number;
  created_at: string;
  user: ReviewUser;
}

interface ReviewCardProps {
  review: ReviewData;
  onToggleHelpful?: (reviewId: string) => void;
  isHelpful?: boolean;
  onDelete?: (reviewId: string) => void;
  isOwn?: boolean;
}

export function ReviewCard({ review, onToggleHelpful, isHelpful, onDelete, isOwn }: ReviewCardProps) {
  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center">
            <UserIcon size={14} className="text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{review.user.name}</p>
            <p className="text-xs text-muted-foreground">@{review.user.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} size={14} />
          {isOwn && onDelete && (
            <button
              onClick={() => onDelete(review.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              title="Delete review"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>

      {review.tags && review.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {review.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-deep text-soft">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>{new Date(review.created_at).toLocaleDateString()}</span>
        <button
          onClick={() => onToggleHelpful?.(review.id)}
          className={`flex items-center gap-1 transition-colors ${
            isHelpful ? "text-accent" : "hover:text-accent"
          }`}
        >
          <ThumbsUp size={12} className={isHelpful ? "fill-accent" : ""} />
          <span>{review.helpful_count} helpful</span>
        </button>
      </div>
    </div>
  );
}
