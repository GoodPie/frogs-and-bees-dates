import { useState, useEffect } from 'react';
import { auth } from '@/FirebaseConfig';
import type { User } from 'firebase/auth';

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
}

/**
 * Custom hook to manage Firebase authentication state
 * Provides loading state to prevent routing decisions before auth initialises
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged fires immediately with current state
    // then fires again whenever auth state changes
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
