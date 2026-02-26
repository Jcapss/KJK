import { createClient } from "@supabase/supabase-js";
// Accessing environment variables correctly with VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log(supabaseUrl); // For testing purposes
console.log(supabaseAnonKey); // For testing purposes
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
