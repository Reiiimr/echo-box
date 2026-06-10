import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { getMyProfile } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null); // Firebase user
  const [dbUser,      setDbUser]      = useState(null); // Supabase profile
  const [loading,     setLoading]     = useState(true); // true until BOTH Firebase + profile resolve
  const [needsSetup,  setNeedsSetup]  = useState(false);

  // Fetch Supabase profile after Firebase auth is confirmed.
  // Returns true if profile was found, false if not.
  const fetchProfile = async () => {
    try {
      const { data } = await getMyProfile();
      setDbUser(data);
      setNeedsSetup(false);
      return true;
    } catch (err) {
      if (err.response?.status === 404) {
        // Logged in via Firebase, but no Supabase profile yet
        setNeedsSetup(true);
        setDbUser(null);
      }
      return false;
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Always wait for the profile fetch to complete before
        // setting loading=false — this prevents the /setup flash
        await fetchProfile();
      } else {
        setDbUser(null);
        setNeedsSetup(false);
      }

      // Only mark loading done AFTER profile is resolved
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setDbUser(null);
    setCurrentUser(null);
    setNeedsSetup(false);
  };

  // Call this after setup or profile update to refresh dbUser
  const refreshProfile = async () => {
    if (currentUser) await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      dbUser,
      loading,
      needsSetup,
      loginWithGoogle,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);