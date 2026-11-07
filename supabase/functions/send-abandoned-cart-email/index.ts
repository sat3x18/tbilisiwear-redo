import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CartItemDetails {
  product_name: string;
  product_image: string | null;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface AbandonedCartUser {
  userId: string;
  email: string;
  displayName: string | null;
  cartItems: CartItemDetails[];
  totalValue: number;
  lastUpdated: string;
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("ka-GE", {
    style: "currency",
    currency: "GEL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const generateEmailHtml = (user: AbandonedCartUser): string => {
  const itemsHtml = user.cartItems.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 80px; vertical-align: top;">
              ${item.product_image 
                ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 70px; height: 90px; object-fit: cover; border-radius: 4px;">`
                : `<div style="width: 70px; height: 90px; background-color: #f0f0f0; border-radius: 4px;"></div>`
              }
            </td>
            <td style="padding-left: 15px; vertical-align: top;">
              <p style="margin: 0 0 5px; color: #333333; font-size: 14px; font-weight: 600;">${item.product_name}</p>
              <p style="margin: 0 0 5px; color: #666666; font-size: 13px;">Size: ${item.size} · Color: ${item.color}</p>
              <p style="margin: 0; color: #666666; font-size: 13px;">Qty: ${item.quantity}</p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <p style="margin: 0; color: #333333; font-size: 14px; font-weight: 600;">${formatPrice(item.price * item.quantity)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Don't forget your items!</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <tr>
                  <td style="background-color: #1a1a1a; padding: 30px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 4px;">TBILISI WEAR</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="margin: 0 0 20px; color: #333333; font-size: 22px; font-weight: 500; text-align: center;">
                      You left something behind! 👀
                    </h2>
                    
                    <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6; text-align: center;">
                      Hi ${user.displayName || 'there'},<br>
                      We noticed you have some beautiful items waiting in your cart. Don't let them slip away!
                    </p>
                    
                    <!-- Cart Items -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fafafa; border-radius: 8px; margin: 30px 0;">
                      ${itemsHtml}
                      <tr>
                        <td style="padding: 20px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="color: #333333; font-size: 16px; font-weight: 600;">Cart Total:</td>
                              <td style="text-align: right; color: #333333; font-size: 18px; font-weight: 700;">${formatPrice(user.totalValue)}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="https://tbilisiwear.shop/cart" style="display: inline-block; padding: 16px 40px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">
                            Complete Your Purchase
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 30px 0 0; color: #999999; font-size: 13px; text-align: center; line-height: 1.6;">
                      Free shipping on orders over ₾150 · Easy returns within 14 days
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f8f8; padding: 20px 40px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      © ${new Date().getFullYear()} TBILISI WEAR. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0; color: #999999; font-size: 12px;">
                      Tbilisi, Georgia
                    </p>
                    <p style="margin: 10px 0 0; color: #bbbbbb; font-size: 11px;">
                      You received this email because you have items in your cart at TBILISI WEAR.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Require admin or scheduled-job authentication
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
      const { data: roleData } = await supabaseAdmin
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


    // Parse optional parameters
    const url = new URL(req.url);
    const hoursAgo = parseInt(url.searchParams.get("hours") || "24");
    const maxHoursAgo = parseInt(url.searchParams.get("max_hours") || "168"); // 7 days default max
    
    console.log(`Looking for abandoned carts between ${hoursAgo} and ${maxHoursAgo} hours old`);

    // Find carts that were last updated between hoursAgo and maxHoursAgo
    const minTime = new Date(Date.now() - maxHoursAgo * 60 * 60 * 1000).toISOString();
    const maxTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

    // Get cart items with product details
    const { data: cartItems, error: cartError } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id,
        user_id,
        quantity,
        updated_at,
        product_variants!inner (
          id,
          size,
          color,
          products!inner (
            id,
            name,
            base_price,
            sale_price
          )
        )
      `)
      .gte("updated_at", minTime)
      .lte("updated_at", maxTime);

    if (cartError) {
      console.error("Error fetching cart items:", cartError);
      throw cartError;
    }

    if (!cartItems || cartItems.length === 0) {
      console.log("No abandoned carts found in the specified time range");
      return new Response(
        JSON.stringify({ message: "No abandoned carts found", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Group by user
    const userCarts = new Map<string, any[]>();
    for (const item of cartItems) {
      const existing = userCarts.get(item.user_id) || [];
      existing.push(item);
      userCarts.set(item.user_id, existing);
    }

    console.log(`Found ${userCarts.size} users with abandoned carts`);

    // Check if users have recent orders (don't email if they completed purchase)
    const userIds = Array.from(userCarts.keys());
    const { data: recentOrders } = await supabaseAdmin
      .from("orders")
      .select("user_id, created_at")
      .in("user_id", userIds)
      .gte("created_at", minTime);

    const usersWithRecentOrders = new Set(recentOrders?.map(o => o.user_id) || []);

    // Get product images
    const productIds = new Set<string>();
    for (const items of userCarts.values()) {
      for (const item of items) {
        productIds.add((item.product_variants as any).products.id);
      }
    }

    const { data: productImages } = await supabaseAdmin
      .from("product_images")
      .select("product_id, image_url")
      .in("product_id", Array.from(productIds))
      .eq("is_primary", true);

    const imageMap = new Map<string, string>();
    for (const img of productImages || []) {
      imageMap.set(img.product_id, img.image_url);
    }

    // Process each user
    const emailResults: { userId: string; email: string; success: boolean; error?: string }[] = [];

    for (const [userId, items] of userCarts) {
      // Skip if user has recent order
      if (usersWithRecentOrders.has(userId)) {
        console.log(`Skipping user ${userId} - has recent order`);
        continue;
      }

      // Get user email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !userData?.user?.email) {
        console.log(`Could not get email for user ${userId}`);
        continue;
      }

      // Get user display name from profile
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();

      // Build cart details
      const cartDetails: CartItemDetails[] = items.map(item => {
        const variant = item.product_variants as any;
        const product = variant.products;
        return {
          product_name: product.name,
          product_image: imageMap.get(product.id) || null,
          size: variant.size,
          color: variant.color,
          quantity: item.quantity,
          price: product.sale_price || product.base_price,
        };
      });

      const totalValue = cartDetails.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const lastUpdated = items.reduce((latest, item) => 
        item.updated_at > latest ? item.updated_at : latest, items[0].updated_at);

      const abandonedUser: AbandonedCartUser = {
        userId,
        email: userData.user.email,
        displayName: profile?.display_name || null,
        cartItems: cartDetails,
        totalValue,
        lastUpdated,
      };

      // Send email
      try {
        const emailHtml = generateEmailHtml(abandonedUser);
        
        const emailResponse = await resend.emails.send({
          from: "TBILISI WEAR <contact@tbilisiwear.shop>",
          to: [abandonedUser.email],
          subject: "You left something in your cart! 🛍️",
          html: emailHtml,
        });

        console.log(`Sent abandoned cart email to ${abandonedUser.email}:`, emailResponse);
        emailResults.push({ userId, email: abandonedUser.email, success: true });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${abandonedUser.email}:`, emailError);
        emailResults.push({ userId, email: abandonedUser.email, success: false, error: emailError.message });
      }
    }

    const successCount = emailResults.filter(r => r.success).length;
    console.log(`Sent ${successCount} abandoned cart emails`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} abandoned cart emails`,
        emailsSent: successCount,
        results: emailResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-abandoned-cart-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
