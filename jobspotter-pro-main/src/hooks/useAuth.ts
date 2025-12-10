import { useState, useEffect } from 'react';
// We are keeping these types for structural compatibility, but they are technically 'mocked' now.
import { User, Session } from '@supabase/supabase-js'; 
import { supabase } from '@/lib/supabaseClient'; 
import { useNavigate } from 'react-router-dom';

// 🔥 FIX 1: Import getMyProfile
import { apiLogin, apiSignup, getMyProfile } from '@/lib/api';
// NOTE: You will also need to import an API function to fetch the user's profile
// based on their token (e.g., getProfile) if your Flask backend supports it.

export type UserRole = 'candidate' | 'recruiter';

// 🔑 STEP 1: Define the FlaskUser interface to match your backend response
export interface FlaskUser { 
  id: string; // The user ID from your Flask/database
  // NOTE: If you are using 'name' in your components, keep it. 
  // But if the backend only sends first_name/last_name, you can remove 'name' here.
  name?: string; 
  
  // 🔥 FIX 2: Add first_name and last_name
  first_name: string;
  last_name: string;
  
  email: string;
  role: UserRole;
  // Add company or any other required fields here
}

// Update AuthState to use FlaskUser instead of Supabase's User type
interface AuthState {
  user: FlaskUser | null; // Changed to FlaskUser
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true,
  });

  // 🔑 STEP 3: Update useEffect to read the manual token and load profile
  useEffect(() => {
    // 1. Clear Supabase listeners and session checks
    // We are commenting out the Supabase-specific logic since we are manual now.
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(...);
    // supabase.auth.getSession().then(...); 
    
    const checkLocalSession = async () => {
      const token = localStorage.getItem('flask_access_token');
      
      if (token) {
        // 🔥 CRITICAL FIX: Attempt to fetch the profile using the stored token
        try {
          const { data: profileData, error: profileError } = await getMyProfile();
          
          if (profileData) {
            // Success: Profile data fetched and token is valid
            setAuthState({ 
              user: profileData, 
              session: { access_token: token } as any, 
              role: profileData.role, 
              loading: false 
            });
            return; // Exit, successfully loaded profile
          } else if (profileError) {
            // Token failed validation (e.g., expired/invalid or profile fetch failed)
            localStorage.removeItem('flask_access_token'); // Clear the bad token
            console.error("Token validation failed or profile not found. Clearing token.", profileError);
          }

        } catch (e) {
            // Catch network or unexpected errors
            localStorage.removeItem('flask_access_token');
            console.error("Failed to fetch profile due to exception. Clearing token.", e);
        }
      } 
      
      // If no token was found, or the token failed validation, set the final state
      setAuthState({ user: null, session: null, role: null, loading: false });
    };

    checkLocalSession();
    
  }, []); // Dependecy array is empty, runs once on mount

  const signUp = async (email: string, password: string, role: UserRole, name: string) => {
    const { data, error } = await apiSignup(email, password, role, name);
    
    // NOTE: For signup, you usually just return the success/error and let the user log in.
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    // 1. Call the Flask API
    const { data, error } = await apiLogin(email, password);

    if (error) {
      // Return the error string back to Auth.tsx
      return { user: null, error };
    }
    
    // 2. CRITICAL: Manually save the token and update state
    // We assume data = { access_token: '...', user: { id: '...', role: '...', etc. } }
    if (data && data.access_token && data.user) {
      // Save the token for subsequent API calls (used by getAccessToken)
      localStorage.setItem('flask_access_token', data.access_token);
      
      // Manually set the user state based on Flask's response
      // Cast the incoming user data to the FlaskUser interface
      const flaskUser: FlaskUser = data.user as FlaskUser; 
      
      setAuthState({
        user: flaskUser, // Set the new user data
        session: { access_token: data.access_token } as any, // Mock a session object for compatibility
        role: flaskUser.role,
        loading: false,
      });

      return { user: flaskUser, error: null };
    } else {
      // Handle case where Flask returns success but no token/user data
      return { user: null, error: 'Login failed: Server response missing token or user data.' };
    }
  };

  const signOut = async () => {
    // Clear the manually saved token
    localStorage.removeItem('flask_access_token');
    
    // Reset state
    setAuthState({
      user: null,
      session: null,
      role: null,
      loading: false,
    });
    
    // You can also add a call to your Flask backend to invalidate the token if you have such a route.
    
    return { error: null };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    isCandidate: authState.role === 'candidate',
    isRecruiter: authState.role === 'recruiter',
  };
}

// ... useRequireAuth logic remains the same ...
// This now relies on auth.user being a FlaskUser object

export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.loading) {
      if (!auth.user) {
        navigate('/auth');
      } else if (requiredRole && auth.role !== requiredRole) {
        navigate('/');
      }
    }
  }, [auth.loading, auth.user, auth.role, requiredRole, navigate]);

  return auth;
}