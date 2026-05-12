import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const Ctx = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuta mudanças na autenticação (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Garante que o loading pare após a mudança
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Usamos useCallback para que as funções tenham a mesma referência na memória
  // Isso evita que componentes como o seu Header ou LoginPage achem que "algo mudou" sem necessidade
  const signIn = useCallback((e: string, p: string) => 
    supabase.auth.signInWithPassword({ email: e, password: p }), []);

  const signUp = useCallback((e: string, p: string) => 
    supabase.auth.signUp({ email: e, password: p }), []);

  const signOut = useCallback(() => 
    supabase.auth.signOut(), []);

  // 4. O useMemo agora fica muito mais limpo e estável
  const value = useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [session, user, loading, signIn, signUp, signOut]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => {
  const context = useContext(Ctx);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};