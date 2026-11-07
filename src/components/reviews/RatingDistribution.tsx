import { cn } from "@/lib/utils";

interface RatingDistributionProps {
  distribution: Record<number, number>;
  totalReviews: number;
  className?: string;
}

const RatingDistribution = ({
  distribution,
  totalReviews,
  className,
}: RatingDistributionProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {[5, 4, 3, 2, 1].map((rating) => {
        const count = distribution[rating] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-3">
            <span className="text-xs font-body text-muted-foreground w-12">
              {rating} star{rating !== 1 ? "s" : ""}
            </span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground rounded-full transition-colors duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-body text-muted-foreground w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
