import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

const Ctx = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Pega a sessão inicial de forma assíncrona
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Erro ao inicializar auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 2. Escuta mudanças reais (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Funções de Auth com tratamento de erro e garantia de referência (useCallback)
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      return await supabase.auth.signInWithPassword({ email, password });
    } catch (error: any) {
      return { error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      return await supabase.auth.signUp({ email, password });
    } catch (error: any) {
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // 4. MEMORIZAÇÃO CRÍTICA: Isso impede o loop infinito mostrado na sua imagem
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
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};