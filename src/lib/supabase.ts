import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";
import { Database } from "../types/database.types";

let storage: any;

if (Platform.OS !== "web") {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  storage = AsyncStorage;
} else {
  storage =
    typeof window !== "undefined" && window.localStorage
      ? {
          getItem: async (key: string) => window.localStorage.getItem(key),
          setItem: async (key: string, value: string) =>
            window.localStorage.setItem(key, value),
          removeItem: async (key: string) =>
            window.localStorage.removeItem(key),
        }
      : undefined;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
