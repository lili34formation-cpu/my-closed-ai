import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: "Token invalide" }), { status: 401, headers: corsHeaders });

  const userId = user.id;

  // Delete all user data
  await supabaseAdmin.from("outfit_suggestions").delete().eq("user_id", userId);
  await supabaseAdmin.from("wardrobe_items").delete().eq("user_id", userId);
  await supabaseAdmin.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) return new Response(JSON.stringify({ error: "Erreur suppression compte" }), { status: 500, headers: corsHeaders });

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
