import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// export const getAccessToken = async (): Promise<string | null> => {
//   try {
//     const { data: { session } } = await supabase.auth.getSession();
//     return session?.access_token || null;
//   } catch {
//     return null;
//   }
// };


// Inside src/lib/supabaseClient.ts (or wherever getAccessToken is defined)

// NOTE: You may need to import/use localStorage if it's not globally available 
// in your specific environment, but generally, this works in the browser.
export async function getAccessToken(): Promise<string | null> {
    // Read the token saved manually after a successful Flask login
    const token = localStorage.getItem('flask_access_token'); 
    return token;
}