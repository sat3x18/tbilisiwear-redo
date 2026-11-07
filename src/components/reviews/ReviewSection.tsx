import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Pencil, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import StarRating from "./StarRating";
import RatingDistribution from "./RatingDistribution";
import ReviewCard from "./ReviewCard";
import ReviewForm from "./ReviewForm";
import { useProductReviews } from "@/hooks/useProductReviews";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

const ReviewSection = ({ productId, productName }: ReviewSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    reviews,
    stats,
    loading,
    page,
    setPage,
    hasMore,
    sortBy,
    setSortBy,
    userCanReview,
    userReview,
    submitReview,
    updateReview,
    deleteReview,
    markHelpful,
  } = useProductReviews({ productId });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [helpfulLoading, setHelpfulLoading] = useState<string | null>(null);

  const handleHelpful = async (reviewId: string) => {
    setHelpfulLoading(reviewId);
    await markHelpful(reviewId);
    setHelpfulLoading(null);
  };

  const handleSubmitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (isEditing && userReview) {
      await updateReview(userReview.id, data);
    } else {
      await submitReview(data);
    }
    setIsFormOpen(false);
    setIsEditing(false);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;
    try {
      await deleteReview(userReview.id);
      toast({ title: "Review deleted" });
    } catch {
      toast({ title: "Failed to delete review", variant: "destructive" });
    }
    setIsDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsFormOpen(true);
  };

  return (
    <section className="mt-16 pt-12 border-t border-border">
      <h2 className="font-display text-2xl text-foreground mb-8">Customer Reviews</h2>

      <div className="grid lg:grid-cols-[300px_1fr] gap-12">
        {/* Left: Stats Summary */}
        <div className="space-y-6">
          {/* Average Rating */}
          <div className="bg-card border border-border p-6">
            <div className="text-center mb-4">
              <div className="font-display text-4xl text-foreground mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <StarRating rating={stats.averageRating} size="md" className="justify-center mb-2" />
              <p className="text-sm text-muted-foreground font-body">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            <RatingDistribution
              distribution={stats.distribution}
              totalReviews={stats.totalReviews}
            />
          </div>

          {/* Write Review Button */}
          {userCanReview && (
            <Button
              onClick={() => {
                setIsEditing(false);
                setIsFormOpen(true);
              }}
              className="w-full font-body"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Write a Review
            </Button>
          )}

          {/* User's Existing Review */}
          {userReview && (
            <div className="bg-card border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-body text-muted-foreground">Your Review</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditClick}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit review"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <StarRating rating={userReview.rating} size="sm" className="mb-2" />
              {userReview.title && (
                <h4 className="font-display text-sm text-foreground mb-1">{userReview.title}</h4>
              )}
              <p className="text-xs text-muted-foreground font-body line-clamp-3">
                {userReview.comment}
              </p>
            </div>
          )}

          {/* Not logged in prompt */}
          {!user && (
            <div className="bg-card border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground font-body mb-3">
                Sign in to write a review
              </p>
              <Link to="/auth" className="text-sm text-primary hover:text-foreground transition-colors font-body">
                Sign In <ArrowRight aria-hidden="true" className="inline-block w-4 h-4 ml-1 align-text-bottom" />
              </Link>
            </div>
          )}

          {/* Purchased but not delivered yet */}
          {user && !userCanReview && !userReview && (
            <div className="bg-card border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground font-body">
                Purchase this product to leave a review
              </p>
            </div>
          )}
        </div>

        {/* Right: Reviews List */}
        <div>
          {/* Sort & Filters */}
          {stats.totalReviews > 0 && (
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground font-body">
                Showing {reviews.length} of {stats.totalReviews} reviews
              </span>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as "recent" | "highest" | "lowest" | "helpful");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40 font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="highest">Highest Rated</SelectItem>
                  <SelectItem value="lowest">Lowest Rated</SelectItem>
                  <SelectItem value="helpful">Most Helpful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reviews */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-secondary rounded w-24 mb-2" />
                  <div className="h-4 bg-secondary rounded w-48 mb-3" />
                  <div className="h-16 bg-secondary rounded mb-3" />
                  <div className="h-3 bg-secondary rounded w-32" />
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onHelpful={handleHelpful}
                  isHelpfulLoading={helpfulLoading === review.id}
                />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-body">No reviews yet</p>
              <p className="text-sm text-muted-foreground font-body mt-1">
                Be the first to review this product
              </p>
            </div>
          )}

          {/* Pagination */}
          {stats.totalReviews > 5 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="font-body"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground font-body">Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="font-body"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      <ReviewForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setIsEditing(false);
        }}
        onSubmit={handleSubmitReview}
        productName={productName}
        existingReview={
          isEditing && userReview
            ? {
                rating: userReview.rating,
                title: userReview.title,
                comment: userReview.comment,
              }
            : undefined
        }
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Review?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. Your review will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReview} className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default ReviewSection;
