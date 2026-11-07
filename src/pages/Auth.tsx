import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import authModelImage from "@/assets/auth-model.jpg";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user, signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useStoreSettings();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    confirmPassword: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = (location.state as { from?: string })?.from || "/account";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await resetPassword(formData.email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setResetEmailSent(true);
        }
        setLoading(false);
        return;
      }

      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.name);
        if (error) {
          toast({
            title: "Registration failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account created",
            description: "You can sign in now",
          });
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
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

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setMode(newMode);
    setResetEmailSent(false);
    setFormData({ email: "", password: "", name: "", confirmPassword: "" });
  };

  // If reset email was sent, show success screen
  if (mode === "forgot" && resetEmailSent) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Left Side - Form */}
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
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-foreground" />
              </div>
              <h2 className="font-display text-2xl text-foreground mb-3">
                Check Your Email
              </h2>
              <p className="text-muted-foreground font-body mb-6">
                We've sent a password reset link to<br />
                <span className="text-foreground">{formData.email}</span>
              </p>
              <p className="text-sm text-muted-foreground font-body mb-8">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setResetEmailSent(false)}
                  className="text-foreground hover:underline"
                >
                  try again
                </button>
              </p>
              <button
                onClick={() => switchMode("login")}
                className="btn-luxury"
              >
                <span>Back to Sign In</span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
          <img 
            src={authModelImage} 
            alt="Fashion model" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <h2 className="font-display text-4xl text-white mb-3">
              {settings.store_name}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back Link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-body text-sm">Back to store</span>
          </Link>

          {/* Logo */}
          <Link to="/" className="block mb-12">
            <h1 className="font-display text-3xl text-foreground">
              {settings.store_name}
            </h1>
          </Link>

          {/* Title */}
          <div className="mb-10">
            <h2 className="font-display text-4xl text-foreground mb-3">
              {mode === "login" ? "Sign in" : mode === "register" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-muted-foreground font-body">
              {mode === "login" 
                ? "Sign in to access your account" 
                : mode === "register" 
                  ? "Create an account to track orders and save items"
                  : "Enter your email to receive a reset link"}
            </p>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {mode === "register" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2 font-body">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-secondary border border-border text-foreground font-body focus:outline-none focus:border-primary transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2 font-body">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-secondary border border-border text-foreground font-body focus:outline-none focus:border-primary transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2 font-body">
                    Password
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
              )}

              {mode === "register" && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2 font-body">
                    Confirm Password
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
              )}

              {mode === "login" && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Send Reset Link"}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Switch Mode */}
          <div className="mt-8 text-center">
            {mode === "forgot" ? (
              <p className="text-muted-foreground font-body">
                Remember your password?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-muted-foreground font-body">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="text-foreground hover:text-foreground transition-colors"
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src={authModelImage} 
          alt="Fashion model" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12">
          <h2 className="font-display text-4xl text-white mb-3">
            {settings.store_name}
          </h2>
        </div>
      </div>
    </div>
  );
};

export default Auth;
