import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderStatusEmailRequest {
  userId: string;
  customerName?: string;
  orderNumber: string;
  newStatus: string;
  trackingNumber?: string;
  orderTotal: number;
  currency: string;
}

const getStatusMessage = (status: string): { title: string; description: string; color: string } => {
  switch (status) {
    case "processing":
      return {
        title: "Your Order is Being Processed",
        description: "We've received your order and are preparing it for shipment.",
        color: "#3B82F6"
      };
    case "shipped":
      return {
        title: "Your Order Has Been Shipped!",
        description: "Great news! Your order is on its way to you.",
        color: "#8B5CF6"
      };
    case "delivered":
      return {
        title: "Your Order Has Been Delivered",
        description: "Your order has been successfully delivered. We hope you love your purchase!",
        color: "#10B981"
      };
    case "cancelled":
      return {
        title: "Your Order Has Been Cancelled",
        description: "Your order has been cancelled. If you have any questions, please contact us.",
        color: "#EF4444"
      };
    default:
      return {
        title: "Order Status Update",
        description: `Your order status has been updated to: ${status}`,
        color: "#6B7280"
      };
  }
};

const formatPriceForEmail = (amount: number, currency: string): string => {
  const currencyMap: Record<string, { code: string; locale: string }> = {
    EUR: { code: "EUR", locale: "de-DE" },
    USD: { code: "USD", locale: "en-US" },
    GBP: { code: "GBP", locale: "en-GB" },
    GEL: { code: "GEL", locale: "ka-GE" },
  };
  const currencyInfo = currencyMap[currency] || currencyMap.EUR;
  return new Intl.NumberFormat(currencyInfo.locale, {
    style: "currency",
    currency: currencyInfo.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Require authenticated admin caller
    const authHeader = req.headers.get("Authorization");
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
    const callerId = claimsData.claims.sub;
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) {
      // Allow active team members too
      const callerEmail = claimsData.claims.email as string | undefined;
      let isTeam = false;
      if (callerEmail) {
        const { data: teamData } = await supabaseAdmin
          .from("admin_team_members")
          .select("status")
          .eq("email", callerEmail.toLowerCase())
          .eq("status", "active")
          .maybeSingle();
        isTeam = !!teamData;
      }
      if (!isTeam) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { 
      userId,
      customerName, 
      orderNumber, 
      newStatus, 
      trackingNumber,
      orderTotal,
      currency 
    }: OrderStatusEmailRequest = await req.json();

    console.log("Received order status email request:", { userId, orderNumber, newStatus });

    // Fetch user email from auth.users using existing admin client

    // Fetch user email from auth.users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      console.error("Failed to fetch user email:", userError);
      return new Response(
        JSON.stringify({ error: "Could not find customer email", details: userError?.message }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const customerEmail = userData.user.email;
    console.log("Sending order status email to:", customerEmail);

    const statusInfo = getStatusMessage(newStatus);
    const formattedTotal = formatPriceForEmail(orderTotal, currency);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Status Update</title>
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
                  
                  <!-- Status Banner -->
                  <tr>
                    <td style="background-color: ${statusInfo.color}; padding: 20px 40px; text-align: center;">
                      <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 500;">${statusInfo.title}</h2>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                        Hello ${customerName || 'Valued Customer'},
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #666666; font-size: 15px; line-height: 1.6;">
                        ${statusInfo.description}
                      </p>
                      
                      <!-- Order Details Box -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f8f8; border-radius: 6px; margin: 30px 0;">
                        <tr>
                          <td style="padding: 20px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                              <tr>
                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order Number:</td>
                                <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${orderNumber}</td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Status:</td>
                                <td style="padding: 8px 0; text-align: right;">
                                  <span style="display: inline-block; padding: 4px 12px; background-color: ${statusInfo.color}; color: #ffffff; font-size: 12px; font-weight: 500; border-radius: 20px; text-transform: uppercase;">
                                    ${newStatus}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Order Total:</td>
                                <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${formattedTotal}</td>
                              </tr>
                              ${trackingNumber ? `
                              <tr>
                                <td style="padding: 8px 0; color: #666666; font-size: 14px;">Tracking Number:</td>
                                <td style="padding: 8px 0; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${trackingNumber}</td>
                              </tr>
                              ` : ''}
                            </table>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 0 0 20px; color: #666666; font-size: 14px; line-height: 1.6;">
                        If you have any questions about your order, please don't hesitate to contact us at 
                        <a href="mailto:contact@tbilisiwear.shop" style="color: ${statusInfo.color}; text-decoration: none;">contact@tbilisiwear.shop</a>
                      </p>
                      
                      <p style="margin: 30px 0 0; color: #333333; font-size: 15px;">
                        Thank you for shopping with us!
                      </p>
                      <p style="margin: 5px 0 0; color: #666666; font-size: 14px;">
                        The TBILISI WEAR Team
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
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "TBILISI WEAR <contact@tbilisiwear.shop>",
      to: [customerEmail],
      subject: `Order ${orderNumber} - ${statusInfo.title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ ...emailResponse, sentTo: customerEmail }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-status-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
