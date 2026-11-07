import { ThumbsUp, CheckCircle } from "lucide-react";
import StarRating from "./StarRating";
import { cn } from "@/lib/utils";

export interface ReviewData {
  id: string;
  rating: number;
  title: string | null;
  comment: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  reviewer_name: string;
}

interface ReviewCardProps {
  review: ReviewData;
  onHelpful?: (reviewId: string) => void;
  isHelpfulLoading?: boolean;
  className?: string;
}

const ReviewCard = ({
  review,
  onHelpful,
  isHelpfulLoading = false,
  className,
}: ReviewCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className={cn("border-b border-border pb-6 last:border-0", className)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={review.rating} size="sm" />
            {review.is_verified_purchase && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-500 font-body">
                <CheckCircle className="w-3 h-3" />
                Verified Purchase
              </span>
            )}
          </div>
          {review.title && (
            <h4 className="font-display text-foreground text-lg mb-1">
              {review.title}
            </h4>
          )}
        </div>
      </div>

      <p className="text-muted-foreground font-body text-sm leading-relaxed mb-4">
        {review.comment}
      </p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground font-body">
          <span className="text-foreground">{review.reviewer_name}</span>
          <span className="mx-2">•</span>
          <span>{formatDate(review.created_at)}</span>
        </div>

        {onHelpful && (
          <button
            onClick={() => onHelpful(review.id)}
            disabled={isHelpfulLoading}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-body disabled:opacity-50"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            Helpful ({review.helpful_count})
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewCard;
