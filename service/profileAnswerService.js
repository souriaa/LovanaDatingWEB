import { supabase } from "@/lib/supabase";

export const deleteProfileAnswer = async (answerId: string) => {
  try {
    const { data, error } = await supabase
      .from("profile_answers")
      .delete()
      .eq("id", answerId);

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("deleteProfileAnswer error:", err.message);
    throw err;
  }
};