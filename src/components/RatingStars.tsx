import { Star, StarHalf } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  showValue?: boolean;
}

export function RatingStars({ rating, maxRating = 5, size = 16, showValue = true }: RatingStarsProps) {
  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} size={size} className="fill-accent text-accent" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<StarHalf key={i} size={size} className="fill-accent text-accent" />);
    } else {
      stars.push(<Star key={i} size={size} className="text-muted-foreground/30" />);
    }
  }
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {showValue && <span className="text-sm text-muted-foreground ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}
