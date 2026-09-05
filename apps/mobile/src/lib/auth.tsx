import type { Session, User } from '@supabase/supabase-js';
import type { NotificationPrefs, Profile } from '@wmc/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ProfileRow } from './database.types';
import { supabase } from './supabase';

const DEFAULT_PREFS: NotificationPrefs = {
  connections: true,
  events: true,
  activities: true,
  communities: true,
  messages: true,
  nearby: true,
};

export const PROFILE_COLUMNS =
  'id, first_name, photo_url, age, gender, city_id, bio, languages, looking_for, profession, location_visibility, role, status, onboarding_completed, notification_prefs, last_active_at, created_at, updated_at';

type ProfileSelection = Pick<
  ProfileRow,
  | 'id'
  | 'first_name'
  | 'photo_url'
  | 'age'
  | 'gender'
  | 'city_id'
  | 'bio'
  | 'languages'
  | 'looking_for'
  | 'profession'
  | 'location_visibility'
  | 'role'
  | 'status'
  | 'onboarding_completed'
  | 'notification_prefs'
  | 'last_active_at'
  | 'created_at'
  | 'updated_at'
>;

export function toProfile(row: ProfileSelection): Profile {
  const prefs =
    row.notification_prefs && typeof row.notification_prefs === 'object' && !Array.isArray(row.notification_prefs)
      ? { ...DEFAULT_PREFS, ...(row.notification_prefs as Partial<NotificationPrefs>) }
      : DEFAULT_PREFS;
  return { ...row, notification_prefs: prefs };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until the initial session lookup finishes. */
  loading: boolean;
  /** True once the profile row for the current session has been fetched (or confirmed missing). */
  profileReady: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      // The profile row is created by a DB trigger; retry briefly right after sign-up.
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const p = await fetchProfile(userId);
        if (p) {
          setProfile(p);
          setProfileReady(true);
          return p;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
    setProfile(null);
    setProfileReady(true);
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setProfileReady(false);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setProfileReady(false);
        void loadProfile(nextSession.user.id);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    return loadProfile(session.user.id);
  }, [session?.user, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, profile, loading, profileReady, refreshProfile, signOut }),
    [session, profile, loading, profileReady, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** Convenience: current user id, throws if unauthenticated (only call inside gated screens). */
export function useUserId(): string {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user.id;
}
