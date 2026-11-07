import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import StarRatingInput from "./StarRatingInput";
import { useToast } from "@/hooks/use-toast";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { rating: number; title: string; comment: string }) => Promise<void>;
  productName: string;
  existingReview?: {
    rating: number;
    title: string | null;
    comment: string;
  };
}

const ReviewForm = ({
  isOpen,
  onClose,
  onSubmit,
  productName,
  existingReview,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.title || "");
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({});
  const { toast } = useToast();

  const validate = () => {
    const newErrors: { rating?: string; comment?: string } = {};

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    if (comment.trim().length < 20) {
      newErrors.comment = "Review must be at least 20 characters";
    } else if (comment.length > 1000) {
      newErrors.comment = "Review must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      toast({
        title: existingReview ? "Review updated" : "Review submitted",
        description: "Your feedback helps other customers make better decisions.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {existingReview ? "Edit Your Review" : "Write a Review"}
          </DialogTitle>
          <DialogDescription className="font-body">
            {productName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="font-body text-sm">Your Rating *</Label>
            <StarRatingInput
              value={rating}
              onChange={setRating}
              size="lg"
            />
            {errors.rating && (
              <p className="text-xs text-destructive font-body">{errors.rating}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-body text-sm">
              Review Title (optional)
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your review in a few words"
              maxLength={100}
              className="font-body"
            />
            <p className="text-xs text-muted-foreground font-body">
              {title.length}/100 characters
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="font-body text-sm">
              Your Review *
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              rows={4}
              className="font-body resize-none"
            />
            <div className="flex justify-between">
              {errors.comment && (
                <p className="text-xs text-destructive font-body">{errors.comment}</p>
              )}
              <p className="text-xs text-muted-foreground font-body ml-auto">
                {comment.length}/1000 characters (min 20)
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-body"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {existingReview ? "Update Review" : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
