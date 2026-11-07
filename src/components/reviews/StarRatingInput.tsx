import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

const StarRatingInput = ({
  value,
  onChange,
  maxRating = 5,
  size = "md",
  disabled = false,
  className,
}: StarRatingInputProps) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "transition-transform focus:outline-none focus:ring-2 focus:ring-foreground/50 rounded",
              !disabled && "cursor-pointer"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                isFilled
                  ? "text-foreground fill-foreground"
                  : "text-muted-foreground/40 hover:text-foreground/60"
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm font-body text-muted-foreground">
          {value} star{value !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
};

export default StarRatingInput;
