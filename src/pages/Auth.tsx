import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
    } else {
      // Validate invite code first
      const { data: codeValid, error: rpcError } = await supabase.rpc("use_invite_code", {
        p_code: inviteCode,
      });

      if (rpcError || !codeValid) {
        toast.error("invalid or expired invite code (◕︿◕)");
        setLoading(false);
        return;
      }

      const { data: signUpData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: displayName || username },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (signUpData.session) {
        // Auto-confirmed, already logged in
        toast.success("account created (◕‿◕)");
        navigate("/");
      } else {
        // Fallback: auto-login
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          toast.success("account created — please sign in (◕‿◕)");
          setIsLogin(true);
        } else {
          toast.success("account created (◕‿◕)");
          navigate("/");
        }
      }
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("reset link sent — check your email (◕‿◕)");
      setShowForgot(false);
      setForgotEmail("");
    }
    setForgotLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">
            {isLogin ? "welcome back" : "join sena"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLogin ? "sign in to continue (◕‿◕)" : "invite only — enter your code (◕‿◕)"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                className="w-full border-b border-border bg-transparent py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="display name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
              />
            </>
          )}
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-b border-border bg-transparent py-2 pr-8 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full border border-foreground bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {loading ? "..." : isLogin ? "sign in" : "create account"}
          </button>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowForgot(!showForgot)}
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-opacity"
            >
              forgot password?
            </button>
          </div>
        )}

        {showForgot && (
          <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
            <input
              type="email"
              placeholder="your email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={forgotLoading}
              className="w-full border border-foreground bg-transparent py-2 text-sm font-medium text-foreground transition-opacity hover:opacity-70 disabled:opacity-40"
            >
              {forgotLoading ? "..." : "send reset link"}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {isLogin ? "no account? " : "have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setShowForgot(false); }}
            className="text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
          >
            {isLogin ? "sign up" : "sign in"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
