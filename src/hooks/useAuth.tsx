import { logger } from '@/lib/logger';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import {
  nativeLogin,
  nativeLogout,
  nativeLogoutAll,
  nativeRegister,
  nativeRestoreSession,
} from '@/lib/apiClient';
import type { AppUser, AuthRegisterResult } from '@/lib/apiContracts';
import { releaseOwnedPushSubscription } from '@/utils/firebaseNotifications';
import { clearPrivateQueryCache } from '@/lib/queryClient';

type AuthResult = { error: unknown | null };
type SignUpResult = { error: unknown | null; data?: AuthRegisterResult };

interface AuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTechnician: boolean;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  refreshUser: () => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const roles = user?.roles ?? [];
  const isAdmin = roles.includes('admin');
  const isTechnician = roles.includes('technician');

  const refreshUser = async () => {
    try {
      const nextUser = await nativeRestoreSession();
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      logger.error('[useAuth] session restore failed', error);
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string, _rememberMe = true): Promise<AuthResult> => {
    try {
      const data = await nativeLogin(email, password);
      await clearPrivateQueryCache();
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    try {
      const data = await nativeRegister(email, password);
      return { error: null, data };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      if (user?.id) await releaseOwnedPushSubscription(user.id).catch(() => false);
      await nativeLogout();
    } catch (error) {
      logger.error('[useAuth] signOut error', error);
    } finally {
      await clearPrivateQueryCache();
      setUser(null);
    }
  };

  const signOutAll = async () => {
    try {
      if (user?.id) await releaseOwnedPushSubscription(user.id).catch(() => false);
      await nativeLogoutAll();
    } catch (error) {
      logger.error('[useAuth] signOutAll error', error);
      throw error;
    } finally {
      await clearPrivateQueryCache();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      isTechnician,
      loading,
      signIn,
      signUp,
      signOut,
      signOutAll,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
