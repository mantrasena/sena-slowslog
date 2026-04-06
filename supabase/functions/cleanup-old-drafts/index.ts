import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Delete drafts not updated in 14 days (only non-trashed ones)
    const draftCutoff = new Date();
    draftCutoff.setDate(draftCutoff.getDate() - 14);

    const { data: deletedDrafts, error: draftError } = await supabase
      .from("stories")
      .delete()
      .eq("is_draft", true)
      .is("deleted_at", null)
      .lt("updated_at", draftCutoff.toISOString())
      .select("id");

    if (draftError) throw draftError;

    // Permanently delete trashed stories older than 24 hours
    const trashCutoff = new Date();
    trashCutoff.setHours(trashCutoff.getHours() - 24);

    const { data: deletedTrash, error: trashError } = await supabase
      .from("stories")
      .delete()
      .not("deleted_at", "is", null)
      .lt("deleted_at", trashCutoff.toISOString())
      .select("id");

    if (trashError) throw trashError;

    return new Response(
      JSON.stringify({
        deleted_drafts: deletedDrafts?.length ?? 0,
        deleted_trash: deletedTrash?.length ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
