import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // 1) Token hash flow (preferred - avoids hash fragments being stripped by email clients)
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") || hashParams.get("type");
      
      if (type === "recovery" && tokenHash) {
        console.log("Verifying recovery token hash...");
        const { error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });

        if (error) {
          console.error("Token hash verification error:", error);
          setError("Invalid or expired reset link. Please request a new one.");
          setIsValidSession(false);
        } else {
          console.log("Token hash verified successfully");
          setIsValidSession(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
        return;
      }

      // 2) PKCE flow (fallback)
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Code exchange error:", error);
          setError("Invalid or expired reset link. Please request a new one.");
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
        return;
      }

      // 3) Access token flow (can be in search or hash depending on provider)
      const accessToken =
        hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken =
        hashParams.get("refresh_token") || searchParams.get("refresh_token") || "";

      if (type === "recovery" && accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Set session error:", error);
          setError("Invalid or expired reset link. Please request a new one.");
          setIsValidSession(false);
        } else {
          setIsValidSession(true);
          window.history.replaceState({}, "", window.location.pathname);
        }
        return;
      }

      // 4) Existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        setError("Invalid or expired reset link. Please request a new one.");
        setIsValidSession(false);
      }
    };

    checkSession();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(formData.password);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Success",
          description: "Your password has been updated.",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  // Error state - invalid/expired link
  if (!isValidSession || error) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-body text-sm">Back to store</span>
            </Link>

            <Link to="/" className="block mb-12">
              <h1 className="font-display text-3xl text-foreground">
                {settings.store_name}
              </h1>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-3">
                Link Expired
              </h2>
              <p className="text-muted-foreground font-body mb-8">
                {error || "This password reset link is invalid or has expired. Please request a new one."}
              </p>
              <Link to="/auth" className="btn-gold inline-block">
                Back to Sign In
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 bg-charcoal relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-5xl text-foreground mb-4 ">
                {settings.store_name}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link to="/" className="block mb-12">
              <h1 className="font-display text-3xl text-foreground">
                {settings.store_name}
              </h1>
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-3">
                Password Updated
              </h2>
              <p className="text-muted-foreground font-body mb-8">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/account")}
                className="btn-gold"
              >
                Go to Account
              </button>
            </motion.div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 bg-charcoal relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h2 className="font-display text-5xl text-foreground mb-4 ">
                {settings.store_name}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-body text-sm">Back to store</span>
          </Link>

          <Link to="/" className="block mb-12">
            <h1 className="font-display text-3xl text-foreground">
              {settings.store_name}
            </h1>
          </Link>

          <div className="mb-10">
            <h2 className="font-display text-4xl text-foreground mb-3">
              Set New Password
            </h2>
            <p className="text-muted-foreground font-body">
              Enter your new password below
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm text-muted-foreground mb-2 font-body">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-12 py-4 bg-secondary border border-border text-foreground font-body focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2 font-body">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-4 bg-secondary border border-border text-foreground font-body focus:outline-none focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </motion.form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground font-body">
              Remember your password?{" "}
              <Link
                to="/auth"
                className="text-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 bg-charcoal relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-display text-5xl text-foreground mb-4 ">
              {settings.store_name}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
