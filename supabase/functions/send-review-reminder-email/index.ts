import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image: string | null;
}

interface EligibleReview {
  user_id: string;
  user_email: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_slug: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("Starting review reminder email job...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require admin or cron-secret authentication
    const authHeader = req.headers.get("Authorization");
    const cronSecret = req.headers.get("x-cron-secret");
    const CRON_SECRET = Deno.env.get("CRON_SECRET");
    const isCron = !!(CRON_SECRET && cronSecret && cronSecret === CRON_SECRET);

    if (!isCron) {
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const supabaseAuth = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", claimsData.claims.sub)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }


    // Find orders delivered 7+ days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get delivered orders with their items
    const { data: deliveredOrders, error: ordersError } = await supabase
      .from("orders")
      .select(`
        id,
        user_id,
        order_items (
          product_id,
          product_name,
          product_image
        )
      `)
      .eq("status", "delivered")
      .lte("updated_at", sevenDaysAgo.toISOString());

    if (ordersError) {
      console.error("Error fetching delivered orders:", ordersError);
      throw ordersError;
    }

    if (!deliveredOrders || deliveredOrders.length === 0) {
      console.log("No eligible orders found for review reminders.");
      return new Response(
        JSON.stringify({ message: "No eligible orders", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${deliveredOrders.length} delivered orders to check.`);

    const eligibleReviews: EligibleReview[] = [];

    for (const order of deliveredOrders) {
      const items = order.order_items as OrderItem[];

      for (const item of items) {
        // Check if review already exists
        const { data: existingReview } = await supabase
          .from("product_reviews")
          .select("id")
          .eq("user_id", order.user_id)
          .eq("product_id", item.product_id)
          .maybeSingle();

        if (existingReview) {
          continue; // Already reviewed
        }

        // Check if reminder was already sent
        const { data: existingReminder } = await supabase
          .from("review_reminders_sent")
          .select("id")
          .eq("user_id", order.user_id)
          .eq("order_id", order.id)
          .eq("product_id", item.product_id)
          .maybeSingle();

        if (existingReminder) {
          continue; // Already sent reminder
        }

        // Get product slug
        const { data: product } = await supabase
          .from("products")
          .select("slug")
          .eq("id", item.product_id)
          .single();

        // Get user email from auth.users
        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);

        if (userData?.user?.email && product) {
          eligibleReviews.push({
            user_id: order.user_id,
            user_email: userData.user.email,
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image,
            product_slug: product.slug,
          });
        }
      }
    }

    console.log(`Found ${eligibleReviews.length} products needing review reminders.`);

    if (eligibleReviews.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible products for review reminders", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by user to avoid sending multiple emails
    const userGroups = eligibleReviews.reduce((acc, review) => {
      if (!acc[review.user_email]) {
        acc[review.user_email] = [];
      }
      acc[review.user_email].push(review);
      return acc;
    }, {} as Record<string, EligibleReview[]>);

    let sentCount = 0;

    for (const [email, reviews] of Object.entries(userGroups)) {
      // Send one email per user with all unreviewed products (max 3)
      const productsToReview = reviews.slice(0, 3);
      
      const productHtml = productsToReview
        .map(
          (r) => `
          <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border: 1px solid #e5e5e5; margin-bottom: 12px;">
            ${
              r.product_image
                ? `<img src="${r.product_image}" alt="${r.product_name}" style="width: 80px; height: 100px; object-fit: cover;" />`
                : `<div style="width: 80px; height: 100px; background: #f5f5f5;"></div>`
            }
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; font-family: serif; color: #000;">${r.product_name}</h3>
              <a href="https://tbilisiwear.shop/product/${r.product_slug}" 
                 style="display: inline-block; padding: 8px 16px; background: #000; color: #fff; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Write Review
              </a>
            </div>
          </div>
        `
        )
        .join("");

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto;">
            <!-- Header -->
            <div style="text-align: center; padding-bottom: 32px; border-bottom: 1px solid #e5e5e5; margin-bottom: 32px;">
              <h1 style="font-family: serif; font-size: 24px; font-weight: normal; margin: 0; letter-spacing: 4px; color: #000;">
                TBILISI WEAR
              </h1>
            </div>

            <!-- Content -->
            <div style="padding: 20px 0;">
              <h2 style="font-family: serif; font-size: 22px; font-weight: normal; color: #000; margin: 0 0 16px 0; text-align: center;">
                We'd Love to Hear From You!
              </h2>
              <p style="font-size: 14px; color: #666; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                How was your recent purchase? Your review helps other customers make better decisions and helps us improve our products.
              </p>

              <!-- Products -->
              ${productHtml}

              ${
                reviews.length > 3
                  ? `<p style="font-size: 12px; color: #999; text-align: center; margin-top: 16px;">+ ${reviews.length - 3} more products awaiting your review</p>`
                  : ""
              }
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding-top: 32px; border-top: 1px solid #e5e5e5; margin-top: 32px;">
              <p style="font-size: 12px; color: #999; margin: 0;">
                Thank you for shopping with us.
              </p>
              <p style="font-size: 11px; color: #ccc; margin: 16px 0 0 0;">
                © ${new Date().getFullYear()} TBILISI WEAR. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const { error: emailError } = await resend.emails.send({
          from: "TBILISI WEAR <contact@tbilisiwear.shop>",
          to: [email],
          subject: "How was your purchase? Leave a review!",
          html,
        });

        if (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
          continue;
        }

        // Record sent reminders
        for (const review of productsToReview) {
          await supabase.from("review_reminders_sent").insert({
            user_id: review.user_id,
            order_id: review.order_id,
            product_id: review.product_id,
          });
        }

        sentCount++;
        console.log(`Sent review reminder to ${email} for ${productsToReview.length} products.`);
      } catch (emailErr) {
        console.error(`Error sending email to ${email}:`, emailErr);
      }
    }

    console.log(`Review reminder job completed. Sent ${sentCount} emails.`);

    return new Response(
      JSON.stringify({ message: "Review reminders sent", sent: sentCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in review reminder function:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
