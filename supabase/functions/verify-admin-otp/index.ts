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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { otpCode } = await req.json();

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from("admin_otp_verifications")
      .select("*")
      .eq("admin_user_id", userId)
      .eq("otp_code", otpCode)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid or expired verification code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark OTP as used
    await supabaseAdmin
      .from("admin_otp_verifications")
      .update({ used: true })
      .eq("id", otpRecord.id);

    // Execute the action based on type
    if (otpRecord.action_type === "add_team_member") {
      const payload = otpRecord.action_payload as { email: string; permissions: Record<string, boolean> };

      // Verify the email has a registered account
      const { data: allUsers, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      const memberUser = allUsers.users.find(
        (u: any) => u.email?.toLowerCase() === payload.email.toLowerCase()
      );

      if (!memberUser) {
        return new Response(JSON.stringify({ error: "No registered account found with that email. The team member must sign up first." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if member already exists
      const { data: existing } = await supabaseAdmin
        .from("admin_team_members")
        .select("id")
        .eq("email", payload.email.toLowerCase())
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("admin_team_members")
          .update({ permissions: payload.permissions, status: "active", invited_by: userId })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("admin_team_members")
          .insert({
            email: payload.email.toLowerCase(),
            permissions: payload.permissions,
            invited_by: userId,
          });
      }
    } else if (otpRecord.action_type === "change_admin_email") {
      const payload = otpRecord.action_payload as { newEmail: string };

      // Verify the new email has an existing auth account
      const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;

      const targetUser = usersData.users.find(
        (u: any) => u.email?.toLowerCase() === payload.newEmail.toLowerCase()
      );

      if (!targetUser) {
        return new Response(JSON.stringify({ error: "No account exists with that email. The new email must have a registered account." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Transfer admin role: remove from current user, add to new user
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      // Check if new user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", targetUser.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: targetUser.id, role: "admin" });
      }
    }

    return new Response(JSON.stringify({ success: true, actionType: otpRecord.action_type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
