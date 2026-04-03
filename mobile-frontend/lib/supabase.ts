/**
 * Supabase Client - JB Inventory Tracker
 *
 * Configured for React Native with session persistence.
 */

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// Access env vars from app.json extra or fall back to process.env
const supabaseUrl =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL:", supabaseUrl);
  console.error("Supabase Key exists:", !!supabaseAnonKey);
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file:\n" +
      "EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co\n" +
      "EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
