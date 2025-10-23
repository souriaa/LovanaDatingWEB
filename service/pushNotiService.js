import { supabase } from "@/lib/supabase";

export async function getPushTokensByProfileId(profileId) {
  try {
    const { data, error } = await supabase
      .from("user_push_tokens")
      .select("token")
      .eq("profile_id", profileId);

    if (error) throw error;

    return data?.map((row) => row.token) || [];
  } catch (err) {
    console.error("Error fetching push tokens:", err);
    return [];
  }
}