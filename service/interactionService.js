import { supabase } from "@/lib/supabase";

export const getInteractionIdByActorAndTarget = async (actorId, targetId) => {
  try {
    const { data, error } = await supabase
      .from("interactions")
      .select("id")
      .or(
        `and(actor_id.eq.${actorId},target_id.eq.${targetId}),and(actor_id.eq.${targetId},target_id.eq.${actorId})`
      )
      .single();

    if (error) {
      console.error("Failed to fetch interaction:", error.message);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
};

