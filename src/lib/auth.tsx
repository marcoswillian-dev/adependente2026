import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

import type {
  Session,
  User,
} from "@supabase/supabase-js";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;

  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("AUTH ERROR:", err);
      }
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ) => {
    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      return {
        error: error?.message ?? null,
      };
    } catch (err) {
      console.error(err);

      return {
        error: "Erro ao fazer login",
      };
    }
  };

  const signUp = async (
    email: string,
    password: string
  ) => {
    try {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      return {
        error: error?.message ?? null,
      };
    } catch (err) {
      console.error(err);

      return {
        error: "Erro ao criar conta",
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const context = useContext(Ctx);

  if (!context) {
    throw new Error(
      "useAuth must be inside AuthProvider"
    );
  }

  return context;
}