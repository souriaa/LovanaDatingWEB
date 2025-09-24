import { supabase } from "@/lib/supabase";

export const getProfilePlans = async () => {
  try {
    const { data, error } = await supabase
      .from("profile_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getProfilePlans error:", err.message);
    throw err;
  }
};

export const getProfilePlansByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("profile_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getProfilePlansByUser error:", err.message);
    throw err;
  }
};

export const getProfilePlanById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("profile_plans")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getProfilePlanById error:", err.message);
    throw err;
  }
};
