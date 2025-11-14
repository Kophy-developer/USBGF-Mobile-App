import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { saveAuth, getStoredAuth, clearAuthStorage, StoredUser } from '../storage/auth';

interface AuthContextValue {
  token: string | null;
  user: StoredUser | null;
  initializing: boolean;
  signIn: (token: string, user: StoredUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredAuth();
        if (stored.token) {
          setToken(stored.token);
          setUser(stored.user);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: StoredUser) => {
    setToken(newToken);
    setUser(newUser);
    await saveAuth(newToken, newUser);
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    await clearAuthStorage();
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      signIn,
      signOut,
    }),
    [token, user, initializing, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



