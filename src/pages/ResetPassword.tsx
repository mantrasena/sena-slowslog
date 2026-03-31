import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasRecoveryToken(true);
      }
    });

    // Check if there's a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setHasRecoveryToken(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("passwords don't match (◕︿◕)");
      return;
    }
    if (password.length < 6) {
      toast.error("password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("password updated (◕‿◕)");
      navigate("/");
    }
    setLoading(false);
  };

  if (!hasRecoveryToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xs text-center">
          <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">
            reset password
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            waiting for recovery token... if you arrived here from an email link, please wait a moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-xl font-medium tracking-tight text-foreground">
            new password
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            enter your new password (◕‿◕)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="new password"
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
          <input
            type={showPassword ? "text" : "password"}
            placeholder="confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border-b border-border bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-foreground focus:outline-none transition-colors"
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full border border-foreground bg-foreground py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {loading ? "..." : "update password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
