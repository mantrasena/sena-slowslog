import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [needsInviteCode, setNeedsInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Listen for auth changes (e.g. after Google redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await handlePostSignIn(session.user.id);
        }
      }
    );

    // Check if already signed in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handlePostSignIn(session.user.id);
      }
      setCheckingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostSignIn = async (userId: string) => {
    // Check if profile exists (returning user)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile) {
      // Returning user — go home
      navigate("/", { replace: true });
      return;
    }

    // New user — check if invite is required
    const { data: setting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "invite_required")
      .single();

    const inviteRequired = (setting?.value as any)?.enabled ?? true;

    if (inviteRequired) {
      setNeedsInviteCode(true);
    } else {
      // No invite needed, profile will be auto-created by trigger
      // Wait a moment for the trigger to complete
      await new Promise((r) => setTimeout(r, 500));
      navigate("/", { replace: true });
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "failed to sign in with Google");
      setLoading(false);
    }
    // If redirected, page will reload and onAuthStateChange handles the rest
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setInviteLoading(true);
    const { data: valid, error } = await supabase.rpc("use_invite_code", {
      p_code: inviteCode,
    });

    if (error || !valid) {
      toast.error("invalid or expired invite code (◕︿◕)");
      setInviteLoading(false);
      return;
    }

    toast.success("welcome to sena (◕‿◕)");
    // Wait for profile trigger to complete
    await new Promise((r) => setTimeout(r, 500));
    navigate("/", { replace: true });
    setInviteLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setNeedsInviteCode(false);
    setInviteCode("");
  };

  if (checkingAuth) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xs">
        {!needsInviteCode ? (
          <>
            <div className="mb-12 text-center">
              <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">
                welcome to sena
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                sign in to continue (◕‿◕)
              </p>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 border border-border bg-transparent py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {loading ? "..." : "sign in with Google"}
            </button>
          </>
        ) : (
          <>
            <div className="mb-12 text-center">
              <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">
                almost there
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                invite only — enter your code (◕‿◕)
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
              />

              <button
                type="submit"
                disabled={inviteLoading}
                className="mt-2 w-full border border-foreground bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                {inviteLoading ? "..." : "continue"}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              wrong account?{" "}
              <button
                onClick={handleSignOut}
                className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                sign out
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
