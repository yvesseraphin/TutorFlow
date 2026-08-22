import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "TutorFlow: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. " +
      "Google OAuth will not work. Add them to frontend/.env"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Start Google OAuth sign-in.
 * Supabase redirects the user to Google, then back to /auth/callback.
 */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (error) throw new Error(error.message);
}
