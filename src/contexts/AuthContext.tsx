import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // getSession() only reads localStorage; it does not validate the token
      // against the server. A session left over from a previous Supabase project
      // (different JWT signing key) parses fine locally but is rejected
      // server-side as "bad_jwt". Validate once and purge only a genuinely
      // REJECTED token so the user lands logged-out and can sign in cleanly.
      //
      // IMPORTANT: only sign out on a real auth rejection (401/403 / bad_jwt).
      // A transient network error or 5xx (e.g. the DB briefly overloaded) must
      // NOT purge a valid session — doing so was booting admins out on every
      // slow request. On a transient failure, keep the stored session and
      // proceed; the token is still valid.
      if (session) {
        const { error } = await supabase.auth.getUser();
        const status = (error as { status?: number } | null)?.status;
        const code = (error as { code?: string } | null)?.code;
        const isAuthRejection =
          status === 401 || status === 403 ||
          code === "bad_jwt" || code === "session_not_found" || code === "user_not_found";
        if (error && isAuthRejection) {
          await supabase.auth.signOut({ scope: "local" });
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        // Transient error (network/5xx/timeout): trust the stored session.
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
