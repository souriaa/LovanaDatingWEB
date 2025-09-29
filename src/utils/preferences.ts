import { PrivateProfile } from "@/api/my-profile/types";
import { getProfile, getProfileById, toggleIncognito } from "~/service/userService";

export const memberPreferences = [
  {
    title: "I'm interested in",
    getValue: (profile: PrivateProfile) => {
      return (
        profile?.gender_preferences.map((gender) => gender.name).join(", ") ||
        "Everyone"
      );
    },
    route: "/preferences/gender",
  },
  // {
  //   title: "My neighborhood",
  //   getValue: (profile: PrivateProfile) => {
  //     return profile?.neighborhood || "None";
  //   },
  //   route: "/preferences/neighborhood",
  // },
  // {
  //   title: "Maximum distance",
  //   getValue: (profile: PrivateProfile) => {
  //     return `${profile?.max_distance_km} km`;
  //   },
  //   route: "/preferences/distance",
  // },
  {
    title: "Age range",
    getValue: (profile: PrivateProfile) => {
      return `${profile?.min_age} - ${profile?.max_age}`;
    },
    route: "/preferences/age",
  },
  // {
  //   title: "Ethnicity",
  //   getValue: (profile: PrivateProfile) => {
  //     return (
  //       profile?.ethnicity_preferences
  //         .map((ethnicity) => ethnicity.name)
  //         .join(", ") || "Open to all"
  //     );
  //   },
  //   route: "/preferences/ethnicity",
  // },
];

export const incognitoPreference = {
  title: "Incognito Mode",
  getValue: async () => {
    try {
      const profile = await getProfile();
      if (!profile) return "Unknown";
      const fullProfile = await getProfileById(profile.id);
      return fullProfile.is_incognito ? "Enabled" : "Disabled";
    } catch (err) {
      console.error("Failed to fetch incognito status:", err);
      return "Unknown";
    }
  },
  toggle: async (value: boolean) => {
    try {
      const profile = await getProfile();
      if (!profile) return null;
      const updated = await toggleIncognito(profile.id, value);
      return updated.is_incognito;
    } catch (err) {
      console.error("Failed to toggle incognito:", err);
      return null;
    }
  },
};
