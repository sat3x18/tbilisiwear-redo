import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

const StarRating = ({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }).map((_, index) => {
        const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100;
        
        return (
          <div key={index} className="relative">
            {/* Empty star (background) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/30"
              )}
            />
            {/* Filled star (foreground with clip) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillPercentage}%` }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-foreground fill-foreground"
                )}
              />
            </div>
          </div>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm font-body text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
