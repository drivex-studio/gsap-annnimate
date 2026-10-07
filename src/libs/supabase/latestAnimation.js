import { createClient } from "@supabase/supabase-js";
function getSupabaseClient() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("getLatestAnimation: missing Supabase env vars");
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function getLatestAnimation() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("animations")
    .select("id, title, slug, preview_image_url, preview_video_url, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestAnimation:", error.message);
    return null;
  }

  return data;
}
