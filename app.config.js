const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env.development") });

module.exports = {
  expo: {
    name: "LovanaDatingWEB",
    slug: "lovana",
    version: "1.0.0",
    platforms: ["ios", "android", "web"],
    extra: {
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/icon.png",
    },
  },
};
