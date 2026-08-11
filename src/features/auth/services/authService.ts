import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../../../services/supabase';
import { invalidateDashboardCache } from '../../dashboard/hooks/useDashboard';
import {
  AuthResult,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth';

/**
 * Fetches the database-authoritative user profile from public.users table.
 * Strictly derives application role from public.users.role, ignoring client metadata.
 */
export async function fetchUserProfile(
  userId: string
): Promise<{ role: 'user' | 'admin'; fullName?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      role: (data.role as 'user' | 'admin') || 'user',
      fullName: data.full_name || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Maps Supabase User object and database profile to application User model.
 * Trusted source for role is public.users (profile.role), falling back to 'user'.
 */
export function mapSupabaseUserWithProfile(
  sbUser: SupabaseUser,
  profile?: { role: 'user' | 'admin'; fullName?: string } | null
): User {
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    fullName:
      profile?.fullName ||
      sbUser.user_metadata?.full_name ||
      sbUser.email?.split('@')[0] ||
      'Developer',
    role: profile?.role || 'user',
    createdAt: sbUser.created_at || new Date().toISOString(),
  };
}

/**
 * Real Supabase Authentication Service Boundary.
 */
export const authService = {
  /**
   * Log in user with email and password via Supabase Auth.
   * Resolves trusted application role from public.users table.
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Authentication failed. No session established.');
    }

    const profile = await fetchUserProfile(data.user.id);
    const user = mapSupabaseUserWithProfile(data.user, profile);
    const session: AuthSession = {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at
        ? data.session.expires_at * 1000
        : Date.now() + 3600 * 1000,
      user,
    };

    return { user, session };
  },

  /**
   * Register new user with email and password via Supabase Auth.
   * New users are strictly assigned role = 'user' by database triggers.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim(),
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName || credentials.email.split('@')[0],
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Registration failed.');
    }

    const requiresEmailConfirmation = !data.session;
    const profile = await fetchUserProfile(data.user.id);
    const user = mapSupabaseUserWithProfile(data.user, profile);
    const session: AuthSession | null = data.session
      ? {
          accessToken: data.session.access_token,
          expiresAt: data.session.expires_at
            ? data.session.expires_at * 1000
            : Date.now() + 3600 * 1000,
          user,
        }
      : null;

    return { user, session, requiresEmailConfirmation };
  },

  /**
   * Log out active user via Supabase Auth.
   */
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    invalidateDashboardCache();
  },

  /**
   * Asynchronously retrieves current active session from Supabase client.
   * Resolves trusted application role from public.users table.
   */
  async getCurrentSession(): Promise<AuthSession | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;

    const profile = await fetchUserProfile(data.session.user.id);
    const user = mapSupabaseUserWithProfile(data.session.user, profile);

    return {
      accessToken: data.session.access_token,
      expiresAt: data.session.expires_at
        ? data.session.expires_at * 1000
        : Date.now() + 3600 * 1000,
      user,
    };
  },

  /**
   * Subscribes to Supabase Auth state changes.
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, sbSession) => {
      if (!sbSession) {
        callback(null);
        return;
      }

      // Fetch profile asynchronously on auth state change
      void fetchUserProfile(sbSession.user.id).then((profile) => {
        const user = mapSupabaseUserWithProfile(sbSession.user, profile);
        callback({
          accessToken: sbSession.access_token,
          expiresAt: sbSession.expires_at ? sbSession.expires_at * 1000 : Date.now() + 3600 * 1000,
          user,
        });
      });
    });

    return data.subscription;
  },
};
