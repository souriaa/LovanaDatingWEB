import { supabase } from "@/lib/supabase";

export const getInteractionByActorAndTarget = async (actorId, targetId) => {
  try {
    const { data, error } = await supabase
      .from("interactions")
      .select("*")
      .or(
        `and(actor_id.eq.${actorId},target_id.eq.${targetId}),and(actor_id.eq.${targetId},target_id.eq.${actorId})`
      )
      .single();

    if (error) {
      console.error("Failed to fetch interaction:", error.message);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

export const getInteractionsByTargetId = async (targetId) => {
  const { data, error } = await supabase
    .from("interactions")
    .select("id, actor_id, target_id, status_id, created_at")
    .eq("target_id", targetId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching interactions:", error);
    throw error;
  }

  return data;
};
