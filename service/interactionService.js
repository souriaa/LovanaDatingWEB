import { supabase } from "@/lib/supabase";
import { getProfile } from "./userService";

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

export const getInteractionWithOtherProfileById = async (interactionId) => {
  try {
    const currentUser = await getProfile();
    if (!currentUser) return null;

    const { data: interaction, error } = await supabase
      .from("interactions")
      .select("*")
      .eq("id", interactionId)
      .single();

    if (error) throw error;

    const otherProfileId =
      interaction.actor_id === currentUser.id
        ? interaction.target_id
        : interaction.actor_id;

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        photos:profile_photos(*),
        answers:profile_answers(*, prompt:prompts(question)),
        gender:gender_id(name),
        sexuality:sexuality_id(name),
        children:children_id(name),
        family_plan:family_plan_id(name),
        zodiac_sign:zodiac_sign_id(name),
        covid_vaccine:covid_vaccine_id(name)
      `)
      .eq("id", otherProfileId)
      .single();

    if (profileError || !data) {
      console.error("Error fetching profile:", profileError);
      return null;
    }

    const formattedAnswers = (data.answers || []).map(a => ({
      ...a,
      question: a.prompt?.question || null
    }));

    const formattedProfile = {
      ...data,
      gender: data.gender?.name || null,
      sexuality: data.sexuality?.name || null,
      children: data.children?.name || null,
      family_plan: data.family_plan?.name || null,
      zodiac_sign: data.zodiac_sign?.name || null,
      covid_vaccine: data.covid_vaccine?.name || null,
      answers: formattedAnswers
    };

    return {
      ...interaction,
      profile: formattedProfile,
    };
  } catch (err) {
    console.error("Error fetching interaction with other profile:", err);
    return null;
  }
};
