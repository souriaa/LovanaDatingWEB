import { Platform } from "react-native";

const PROFILE_AI_KEY = "ai_profile_limit";
const LIMIT = 5;
const RESET_TIME = 60 * 60 * 1000;

const storage =
  Platform.OS === "web"
    ? {
        getItem: async (key: string) =>
          Promise.resolve(localStorage.getItem(key)),
        setItem: async (key: string, value: string) =>
          Promise.resolve(localStorage.setItem(key, value)),
      }
    : require("@react-native-async-storage/async-storage");

export async function getAIProfileStatus() {
  try {
    const data = await storage.getItem(PROFILE_AI_KEY);
    const now = Date.now();

    if (!data) return { count: 0, timestamp: now };

    const { count, timestamp } = JSON.parse(data);

    if (now - timestamp > RESET_TIME) {
      await storage.setItem(
        PROFILE_AI_KEY,
        JSON.stringify({ count: 0, timestamp: now })
      );
      return { count: 0, timestamp: now };
    }

    return { count, timestamp };
  } catch (err) {
    console.error("Error reading AI profile status:", err);
    return { count: 0, timestamp: Date.now() };
  }
}

export async function useAIProfileResponse() {
  try {
    const { count, timestamp } = await getAIProfileStatus();
    const now = Date.now();

    if (now - timestamp > RESET_TIME) {
      await storage.setItem(
        PROFILE_AI_KEY,
        JSON.stringify({ count: 1, timestamp: now })
      );
      return 1;
    }

    await storage.setItem(
      PROFILE_AI_KEY,
      JSON.stringify({ count: count + 1, timestamp })
    );
    return count + 1;
  } catch (err) {
    console.error("Error updating AI profile usage:", err);
    return null;
  }
}

export { LIMIT, RESET_TIME };
