import { supabase } from "@/lib/supabase";

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error fetching user:", error);
    return null;
  }
  return user;
}

export async function getProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, first_name")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

export async function getProfileById(profileId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleIncognito(profileId, value) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_incognito: value })
    .eq("id", profileId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function isProfileComplete() {
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, first_name, dob, gender_id")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("Error fetching profile:", profileError);
    return false;
  }

  if (!profile.first_name || !profile.dob || !profile.gender_id) return false;

  const { data: photos, error: photosError } = await supabase
    .from("profile_photos")
    .select("id")
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .limit(1);

  if (photosError) {
    console.error("Error fetching profile photos:", photosError);
    return false;
  }

  return photos.length > 0;
}
