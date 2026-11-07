import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
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

    const { orderNumber, orderTotal, currency, customerName, shippingAddress, itemCount } = await req.json();
    console.log("Received order notification request:", { orderNumber, orderTotal, currency, customerName, itemCount });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get store email
    const { data: storeEmailSetting, error: storeError } = await supabaseAdmin
      .from("store_settings")
      .select("value")
      .eq("key", "store_email")
      .maybeSingle();

    if (storeError) {
      console.error("Error fetching store email:", storeError);
    }

    const storeEmail = storeEmailSetting?.value;
    if (!storeEmail) {
      console.error("No store email configured in store_settings");
      return new Response(JSON.stringify({ success: false, reason: "no_store_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Store email:", storeEmail);

    // Get additional notification recipients (team members with orders permission)
    const { data: teamMembers } = await supabaseAdmin
      .from("admin_team_members")
      .select("email, permissions")
      .eq("status", "active");

    const recipients = [storeEmail];
    if (teamMembers) {
      for (const member of teamMembers) {
        const perms = member.permissions as Record<string, boolean>;
        if (perms?.orders || perms?.full_access) {
          if (!recipients.includes(member.email)) {
            recipients.push(member.email);
          }
        }
      }
    }

    console.log("Recipients:", recipients);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("RESEND_API_KEY not configured");
    }

    const addressStr = typeof shippingAddress === "object"
      ? `${shippingAddress.full_name}, ${shippingAddress.street_address}, ${shippingAddress.city} ${shippingAddress.postal_code}`
      : String(shippingAddress);

    const currencySymbol = currency === "GEL" ? "₾" : currency === "USD" ? "$" : "€";

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa;">
        <div style="background: #1a1a1a; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 24px; letter-spacing: 3px; margin: 0;">NEW ORDER RECEIVED</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="font-size: 20px; margin-bottom: 24px;">Order ${orderNumber}</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr><td style="padding: 8px 0; color: #666;">Customer</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${customerName || "Guest"}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Items</td><td style="padding: 8px 0; text-align: right; font-weight: 600;">${itemCount}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Total</td><td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 18px;">${currencySymbol}${Number(orderTotal).toFixed(2)}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Shipping</td><td style="padding: 8px 0; text-align: right;">${addressStr}</td></tr>
          </table>
          <a href="https://tbilisiwear.shop/admin/orders" style="display: inline-block; background: #1a1a1a; color: #ffffff; padding: 12px 32px; text-decoration: none; letter-spacing: 1px; font-size: 14px;">VIEW ORDER</a>
        </div>
      </div>
    `;

    // Send to all recipients with error checking
    const results = [];
    for (const recipient of recipients) {
      console.log("Sending email to:", recipient);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TBILISI WEAR <contact@tbilisiwear.shop>",
          to: [recipient],
          subject: `New Order ${orderNumber} - ${currencySymbol}${Number(orderTotal).toFixed(2)}`,
          html: emailHtml,
        }),
      });

      const resBody = await res.text();
      if (!res.ok) {
        console.error(`Resend error for ${recipient}:`, res.status, resBody);
        results.push({ recipient, success: false, status: res.status, error: resBody });
      } else {
        console.log(`Email sent to ${recipient}:`, resBody);
        results.push({ recipient, success: true });
      }
    }

    return new Response(JSON.stringify({ success: true, recipientCount: recipients.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending order notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
