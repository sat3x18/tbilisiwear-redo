import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { ReviewData } from "@/components/reviews/ReviewCard";

interface UseProductReviewsOptions {
  productId: string;
  pageSize?: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

type SortOption = "recent" | "highest" | "lowest" | "helpful";

export const useProductReviews = ({ productId, pageSize = 5 }: UseProductReviewsOptions) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [userCanReview, setUserCanReview] = useState(false);
  const [userReview, setUserReview] = useState<ReviewData | null>(null);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("product_reviews")
      .select(`
        id,
        rating,
        title,
        comment,
        is_verified_purchase,
        helpful_count,
        created_at,
        user_id
      `)
      .eq("product_id", productId)
      .eq("is_approved", true);

    // Apply sorting
    switch (sortBy) {
      case "highest":
        query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "lowest":
        query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
        break;
      case "helpful":
        query = query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
        break;
      default: // recent
        query = query.order("created_at", { ascending: false });
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to + 1); // Fetch one extra to check hasMore

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reviews:", error);
      setLoading(false);
      return;
    }

    // Check if there are more
    if (data && data.length > pageSize) {
      setHasMore(true);
      data.pop(); // Remove the extra item
    } else {
      setHasMore(false);
    }

    // Get reviewer names from profiles
    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) || []);

      const reviewsWithNames: ReviewData[] = data.map((r) => {
        const displayName = profileMap.get(r.user_id) || "Anonymous";
        // Format as "FirstName L."
        const nameParts = displayName.split(" ");
        const reviewerName =
          nameParts.length > 1
            ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
            : displayName;

        return {
          id: r.id,
          rating: r.rating,
          title: r.title,
          comment: r.comment,
          is_verified_purchase: r.is_verified_purchase,
          helpful_count: r.helpful_count,
          created_at: r.created_at,
          reviewer_name: reviewerName,
        };
      });

      setReviews(reviewsWithNames);
    } else {
      setReviews([]);
    }

    setLoading(false);
  }, [productId, page, pageSize, sortBy]);

  // Fetch stats (all reviews for distribution calculation)
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("rating")
      .eq("product_id", productId)
      .eq("is_approved", true);

    if (error) {
      console.error("Error fetching review stats:", error);
      return;
    }

    if (data && data.length > 0) {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;

      data.forEach((r) => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        total += r.rating;
      });

      setStats({
        averageRating: total / data.length,
        totalReviews: data.length,
        distribution,
      });
    }
  }, [productId]);

  // Check if user can write a review (has purchased and not already reviewed)
  const checkUserCanReview = useCallback(async () => {
    if (!user) {
      setUserCanReview(false);
      setUserReview(null);
      setEligibleOrderId(null);
      return;
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      // Get reviewer name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      const displayName = profile?.display_name || "Anonymous";
      const nameParts = displayName.split(" ");
      const reviewerName =
        nameParts.length > 1
          ? `${nameParts[0]} ${nameParts[1].charAt(0)}.`
          : displayName;

      setUserReview({
        id: existingReview.id,
        rating: existingReview.rating,
        title: existingReview.title,
        comment: existingReview.comment,
        is_verified_purchase: existingReview.is_verified_purchase,
        helpful_count: existingReview.helpful_count,
        created_at: existingReview.created_at,
        reviewer_name: reviewerName,
      });
      setUserCanReview(false);
      return;
    }

    // Check if user has a delivered order containing this product
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_items!inner(product_id)")
      .eq("user_id", user.id)
      .eq("status", "delivered");

    if (orders && orders.length > 0) {
      // Find an order with this product
      const eligibleOrder = orders.find((order) =>
        order.order_items.some((item: { product_id: string }) => item.product_id === productId)
      );

      if (eligibleOrder) {
        setUserCanReview(true);
        setEligibleOrderId(eligibleOrder.id);
        return;
      }
    }

    setUserCanReview(false);
    setEligibleOrderId(null);
  }, [user, productId]);

  // Submit a review
  const submitReview = async (data: { rating: number; title: string; comment: string }) => {
    if (!user || !eligibleOrderId) throw new Error("Cannot submit review");

    const { error } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: user.id,
      order_id: eligibleOrderId,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment,
      is_verified_purchase: true,
      is_approved: true,
    });

    if (error) throw error;

    // Refresh data
    await Promise.all([fetchReviews(), fetchStats(), checkUserCanReview()]);
  };

  // Update existing review
  const updateReview = async (
    reviewId: string,
    data: { rating: number; title: string; comment: string }
  ) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("product_reviews")
      .update({
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
      })
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Refresh data
    await Promise.all([fetchReviews(), fetchStats(), checkUserCanReview()]);
  };

  // Delete review
  const deleteReview = async (reviewId: string) => {
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("product_reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Refresh data
    await Promise.all([fetchReviews(), fetchStats(), checkUserCanReview()]);
  };

  // Mark review as helpful
  const markHelpful = async (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (review) {
      await supabase
        .from("product_reviews")
        .update({ helpful_count: review.helpful_count + 1 })
        .eq("id", reviewId);
    }
    fetchReviews();
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
      fetchStats();
      checkUserCanReview();
    }
  }, [productId, fetchReviews, fetchStats, checkUserCanReview]);

  return {
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
    refetch: () => {
      fetchReviews();
      fetchStats();
      checkUserCanReview();
    },
  };
};
