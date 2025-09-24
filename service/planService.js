import { supabase } from "@/lib/supabase";

export const getPlans = async () => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("status", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getPlans error:", err.message);
    throw err;
  }
};

export const getPlanById = async (planId) => {
  try {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error("getPlanById error:", err.message);
    throw err;
  }
};
