// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js'; 
import { supabase } from '@/lib/supabaseClient'; 
import { useNavigate } from 'react-router-dom';

import { apiLogin, apiSignup, getMyProfile } from '@/lib/api';

// Helper function to decode JWT payload (only needs base64 decoding)
const decodeJwt = (token: string): any | null => {
  try {
    // A JWT is header.payload.signature
    const payload = token.split('.')[1];
    // Base64 decode, replace URL-safe chars, and parse JSON
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

export type UserRole = 'candidate' | 'recruiter';

export interface FlaskUser { 
  id: string; // The user ID from your Flask/database
  name?: string; // Optional: for compatibility if needed
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: FlaskUser | null;
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

  const navigate = useNavigate(); // Hook for navigation

  // Define the timer outside the functions so it can be managed
  let refreshTimer: NodeJS.Timeout | null = null; 

  // --- Token Refresh Mechanism ---
  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      console.log("Attempting to refresh token via Supabase...");
      
      // Use Supabase's internal mechanism to check the Refresh Token
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !session || !session.access_token) {
          throw new Error(refreshError?.message || "Supabase failed to refresh session.");
      }

      // 1. Save the new Supabase Access Token (JWT)
      localStorage.setItem('flask_access_token', session.access_token);
      
      // 2. Re-fetch the profile to ensure the state is up-to-date and token is fully validated by Flask
      const { data: profileData, error: profileError } = await getMyProfile();
      
      if (profileError || !profileData) {
          throw new Error(profileError || "Failed to fetch profile with new token.");
      }
      
      // 3. Update state
      setAuthState(prev => ({ 
        ...prev, 
        user: profileData, 
        session: session as any,
        role: profileData.role, 
        loading: false 
      }));

      console.log("Token successfully refreshed and validated.");
      return true;

    } catch (e) {
      console.error("Token refresh failed. Logging out.", e);
      // Clear all state and storage on fatal refresh error
      localStorage.removeItem('flask_access_token');
      setAuthState({ user: null, session: null, role: null, loading: false });
      return false;
    }
  };

  // --- Schedule/Expiration Check Mechanism ---
  const checkAndScheduleRefresh = (initialToken: string | null) => {
    // Clear any existing timer
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }

    const currentToken = initialToken || localStorage.getItem('flask_access_token');
    if (!currentToken) return;

    const decoded = decodeJwt(currentToken);
    if (!decoded || !decoded.exp) return;

    // Calculate time until expiry (in milliseconds)
    const expiryTimeMs = decoded.exp * 1000;
    const now = Date.now();
    const expiresInMs = expiryTimeMs - now; 
    
    // Define a safe buffer (e.g., 5 minutes = 300,000 ms) before expiry to trigger refresh
    const REFRESH_BUFFER = 5 * 60 * 1000; 
    const isExpired = expiresInMs <= 0;

    if (isExpired) {
      console.log("Token already expired. Logging out.");
      localStorage.removeItem('flask_access_token');
      setAuthState({ user: null, session: null, role: null, loading: false });
      return;
    }

    if (expiresInMs > REFRESH_BUFFER) {
      // Token is valid and has enough time remaining. Schedule the refresh.
      const timeToRefresh = expiresInMs - REFRESH_BUFFER;
      
      // Note: We use setTimeout for a single, delayed action, and then the action 
      // itself reschedules the next check/refresh via a recursive call.
      
      console.log(`Token expires in ${Math.round(expiresInMs / 1000 / 60)} min. Scheduling refresh in ${Math.round(timeToRefresh / 1000)} seconds.`);
      
      // Use setTimeout for single execution
      refreshTimer = setTimeout(async () => {
          const success = await refreshAccessToken();
          if (success) {
            // Success: Reschedule based on the new token's expiry
            checkAndScheduleRefresh(localStorage.getItem('flask_access_token'));
          }
      }, timeToRefresh);

    } else {
      // Token is valid but expiring soon (within 5 minutes). Refresh immediately.
      console.log("Token expiring soon. Triggering immediate refresh.");
      refreshAccessToken().then((success) => {
        if (success) {
          // Reschedule based on the new token's expiry
          checkAndScheduleRefresh(localStorage.getItem('flask_access_token'));
        }
      });
    }
  };
  
  // --- useEffect (Initial Load/Cleanup) ---
  useEffect(() => {
    
    const checkLocalSession = async () => {
      setAuthState(prev => ({ ...prev, loading: true }));
      const token = localStorage.getItem('flask_access_token');
      
      if (token) {
        try {
          // 1. Try to validate current token with the backend
          const { data: profileData, error: profileError } = await getMyProfile();
          
          if (profileData) {
            // Success: Token is valid, set state and schedule the refresh timer
            setAuthState({ 
              user: profileData, 
              session: { access_token: token } as any, 
              role: profileData.role, 
              loading: false 
            });
            checkAndScheduleRefresh(token);
            return;
          } else if (profileError) {
            // 2. Token expired or invalid (e.g., error from Flask), attempt one final immediate refresh
            console.warn("Initial token check failed, attempting refresh...", profileError);
            const success = await refreshAccessToken(); 
            if (success) {
                checkAndScheduleRefresh(localStorage.getItem('flask_access_token'));
                return;
            }
          }

        } catch (e) {
            console.error("Initial check failed due to exception. Clearing token.", e);
        }
      } 
      
      // If no token, or initial check/refresh failed
      localStorage.removeItem('flask_access_token');
      setAuthState({ user: null, session: null, role: null, loading: false });
    };

    checkLocalSession();
    
    // Cleanup function: CRITICAL to clear the timer when the component unmounts
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
      }
    };
    
  }, []); 

  // --- Auth Actions ---

  const signUp = async (email: string, password: string, role: UserRole, firstName: string, 
    lastName: string) => {
    const { data, error } = await apiSignup(email, password, role, firstName, lastName);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await apiLogin(email, password);

    if (error) {
      return { user: null, error };
    }
    
    if (data && data.access_token && data.user) {
      localStorage.setItem('flask_access_token', data.access_token);
      
      const flaskUser: FlaskUser = data.user as FlaskUser; 
      
      setAuthState({
        user: flaskUser,
        session: { access_token: data.access_token } as any,
        role: flaskUser.role,
        loading: false,
      });

      // 🔥 CRITICAL: Schedule the first refresh check immediately after successful sign-in
      checkAndScheduleRefresh(data.access_token);
      
      return { user: flaskUser, error: null };
    } else {
      return { user: null, error: 'Login failed: Server response missing token or user data.' };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('flask_access_token');
    
    // Clear the timer on sign out
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
    
    setAuthState({
      user: null,
      session: null,
      role: null,
      loading: false,
    });
    
    // Note: You might want to call supabase.auth.signOut() here too,
    // to destroy the refresh token and session on the server.
    
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