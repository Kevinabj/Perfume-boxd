import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

// ---------------------------------------------------------------------------
// Local-only auth helpers (localStorage) — used when Supabase is not configured
// ---------------------------------------------------------------------------
const LOCAL_USERS_KEY = "perfumisto_local_users";
const LOCAL_SESSION_KEY = "perfumisto_local_session";

interface LocalUser { email: string; password: string; username: string; id: string }

function getLocalUsers(): LocalUser[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || "[]"); } catch { return []; }
}

function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function fakeUser(lu: LocalUser): User {
  return {
    id: lu.id,
    email: lu.email,
    user_metadata: { username: lu.username },
    app_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as unknown as User;
}

function fakeSession(u: User): Session {
  return { user: u, access_token: "local-token", refresh_token: "", expires_in: 99999, token_type: "bearer" } as unknown as Session;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Restore local session
      try {
        const stored = localStorage.getItem(LOCAL_SESSION_KEY);
        if (stored) {
          const lu: LocalUser = JSON.parse(stored);
          const u = fakeUser(lu);
          setUser(u);
          setSession(fakeSession(u));
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  // ---- Sign In ----
  async function signIn(email: string, password: string) {
    if (!supabaseConfigured) {
      const users = getLocalUsers();
      const match = users.find((u) => u.email === email && u.password === password);
      if (!match) return { error: "Invalid email or password" };
      const u = fakeUser(match);
      setUser(u);
      setSession(fakeSession(u));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(match));
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  // ---- Sign Up ----
  async function signUp(email: string, password: string, username?: string) {
    if (!supabaseConfigured) {
      const users = getLocalUsers();
      if (users.find((u) => u.email === email)) return { error: "Email already registered" };
      const lu: LocalUser = { email, password, username: username || email.split("@")[0], id: crypto.randomUUID() };
      users.push(lu);
      saveLocalUsers(users);
      const u = fakeUser(lu);
      setUser(u);
      setSession(fakeSession(u));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(lu));
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  // ---- Sign Out ----
  async function signOut() {
    if (!supabaseConfigured) {
      setUser(null);
      setSession(null);
      localStorage.removeItem(LOCAL_SESSION_KEY);
      return;
    }
    await supabase.auth.signOut();
  }

  // ---- Reset Password ----
  async function resetPassword(email: string) {
    if (!supabaseConfigured) {
      return { error: null }; // silently succeed locally
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
