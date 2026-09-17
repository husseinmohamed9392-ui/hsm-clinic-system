import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const isConfigured = Boolean(url && key && !url.includes("YOUR_PROJECT"));
export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder", {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@hsm-clinic.local`;
}

export function validUsername(username: string) {
  return /^[a-z0-9._-]{3,30}$/.test(username.trim().toLowerCase());
}
