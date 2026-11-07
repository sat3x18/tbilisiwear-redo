import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star, Pencil, Trash2, Loader2, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StarRating from "@/components/reviews/StarRating";
import ReviewForm from "@/components/reviews/ReviewForm";
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

interface UserReview {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string;
  created_at: string;
  product_name: string;
  product_image: string | null;
  product_slug: string;
}

const Reviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState<UserReview | null>(null);
  const [deletingReview, setDeletingReview] = useState<UserReview | null>(null);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch user's reviews
    const { data: reviewsData, error } = await supabase
      .from("product_reviews")
      .select("id, product_id, rating, title, comment, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
      return;
    }

    if (!reviewsData || reviewsData.length === 0) {
      setReviews([]);
      setLoading(false);
      return;
    }

    // Get product details for each review
    const productIds = [...new Set(reviewsData.map((r) => r.product_id))];
    const { data: products } = await supabase
      .from("products")
      .select("id, name, slug")
      .in("id", productIds);

    const { data: productImages } = await supabase
      .from("product_images")
      .select("product_id, image_url")
      .in("product_id", productIds)
      .eq("is_primary", true);

    const productMap = new Map(products?.map((p) => [p.id, p]) || []);
    const imageMap = new Map(productImages?.map((i) => [i.product_id, i.image_url]) || []);

    const enrichedReviews: UserReview[] = reviewsData.map((r) => {
      const product = productMap.get(r.product_id);
      return {
        id: r.id,
        product_id: r.product_id,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        created_at: r.created_at,
        product_name: product?.name || "Unknown Product",
        product_image: imageMap.get(r.product_id) || null,
        product_slug: product?.slug || "",
      };
    });

    setReviews(enrichedReviews);
    setLoading(false);
  };

  const handleUpdateReview = async (data: { rating: number; title: string; comment: string }) => {
    if (!editingReview || !user) return;

    const { error } = await supabase
      .from("product_reviews")
      .update({
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
      })
      .eq("id", editingReview.id)
      .eq("user_id", user.id);

    if (error) throw error;

    toast({ title: "Review updated" });
    setEditingReview(null);
    fetchReviews();
  };

  const handleDeleteReview = async () => {
    if (!deletingReview || !user) return;

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", deletingReview.id)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Failed to delete review", variant: "destructive" });
      return;
    }

    toast({ title: "Review deleted" });
    setDeletingReview(null);
    fetchReviews();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-foreground">My Reviews</h2>
        <span className="text-sm text-muted-foreground font-body">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-xl text-foreground mb-2">No reviews yet</h3>
          <p className="text-muted-foreground font-body mb-4">
            Purchase products to leave reviews
          </p>
          <Link
            to="/shop"
            className="text-primary hover:text-foreground transition-colors font-body text-sm "
          >
            Start Shopping <ArrowRight aria-hidden="true" className="inline-block w-4 h-4 ml-1 align-text-bottom" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border border-border p-6"
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <Link
                  to={`/product/${review.product_slug}`}
                  className="w-20 h-24 bg-secondary flex-shrink-0"
                >
                  {review.product_image ? (
                    <img
                      src={review.product_image}
                      alt={review.product_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </Link>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <Link
                        to={`/product/${review.product_slug}`}
                        className="font-display text-foreground hover:text-primary transition-colors"
                      >
                        {review.product_name}
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-muted-foreground font-body">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingReview(review)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit review"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingReview(review)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="font-display text-foreground mb-1">{review.title}</h4>
                  )}
                  <p className="text-sm text-muted-foreground font-body line-clamp-3">
                    {review.comment}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewForm
          isOpen={true}
          onClose={() => setEditingReview(null)}
          onSubmit={handleUpdateReview}
          productName={editingReview.product_name}
          existingReview={{
            rating: editingReview.rating,
            title: editingReview.title,
            comment: editingReview.comment,
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReview} onOpenChange={(open) => !open && setDeletingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete Review?</AlertDialogTitle>
            <AlertDialogDescription className="font-body">
              This action cannot be undone. Your review for "{deletingReview?.product_name}" will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="font-body bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reviews;
