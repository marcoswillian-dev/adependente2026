import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const Ctx = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn: (e: string, p: string) => supabase.auth.signInWithPassword({ email: e, password: p }),
    signUp: (e: string, p: string) => supabase.auth.signUp({ email: e, password: p }),
    signOut: () => supabase.auth.signOut(),
  }), [session, user, loading]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);