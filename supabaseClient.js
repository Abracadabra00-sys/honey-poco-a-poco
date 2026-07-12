import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://iemhxmwravbumhszjwkk.supabase.co";
const SUPABASE_KEY = "sb_publishable_QS-FVs8S7rI6cF_FbGS2Xw_DYae_zYx";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Simple key-value helpers backed by the hpp_data table.
export async function loadKey(key, fallback) {
  const { data, error } = await supabase
    .from("hpp_data")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) {
    console.error("loadKey error", key, error);
    return fallback;
  }
  return data ? data.value : fallback;
}

export async function saveKey(key, value) {
  const { error } = await supabase
    .from("hpp_data")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) {
    console.error("saveKey error", key, error);
    return false;
  }
  return true;
}
