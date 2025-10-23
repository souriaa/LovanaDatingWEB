import { supabase } from "@/lib/supabase";

export async function getCompatibilityMembersInfo(conversationId) {
  try {
    const { data, error } = await supabase
      .from("conversation_members")
      .select(`
        profiles (
          first_name,
          last_name,
          children ( id, name ),
          family_plan:family_plans ( id, name ),
          zodiac_sign:zodiac_signs ( id, name ),
          sexuality:sexualities ( id, name ),
          answers:profile_answers (
            id,
            prompt_id,
            answer_text,
            answer_order,
            is_active,
            prompt:prompts ( question )
          ),
          ethnicities:profile_ethnicities ( ethnicity:ethnicities ( id, name ) ),
          pets:profile_pets ( pet:pets ( id, name ) )
        )
      `)
      .eq("conversation_id", conversationId);

    if (error) {
      console.error("Error fetching conversation members:", error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Unexpected error:", err);
    return null;
  }
}

export async function getConversationCompatibility(conversationId) {
  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("compatibility_percent")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching compatibility:", error);
      return null;
    }

    return data?.compatibility_percent ?? null;
  } catch (err) {
    console.error("Unexpected error fetching compatibility:", err);
    return null;
  }
}

export async function setConversationCompatibility(conversationId, percent) {
  try {
    const { error } = await supabase
      .from("conversations")
      .update({ compatibility_percent: percent })
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating compatibility:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error updating compatibility:", err);
    return false;
  }
}
