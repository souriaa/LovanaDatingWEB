import { supabase } from "@/lib/supabase";

export const getLikes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("likes_remain")
      .select("likes_remaining, super_likes_remaining")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("getLikes error:", err.message);
    throw err;
  }
};

export const updateLikes = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from("likes_remain")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("updateLikes error:", err.message);
    throw err;
  }
};

export const incrementLikes = async (userId, { likes = 0, super_likes = 0 }) => {
  try {
    const current = await getLikes(userId);

    return await updateLikes(userId, {
      likes_remaining: current.likes_remaining + likes,
      super_likes_remaining: current.super_likes_remaining + super_likes,
    });
  } catch (err) {
    console.error("incrementLikes error:", err.message);
    throw err;
  }
};

export const decrementLikes = async (userId, { likes = 0, super_likes = 0 }) => {
  try {
    const current = await getLikes(userId);

    return await updateLikes(userId, {
      likes_remaining: Math.max(current.likes_remaining - likes, 0),
      super_likes_remaining: Math.max(current.super_likes_remaining - super_likes, 0),
    });
  } catch (err) {
    console.error("decrementLikes error:", err.message);
    throw err;
  }
};
