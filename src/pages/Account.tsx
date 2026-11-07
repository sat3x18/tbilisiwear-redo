import { useState, useEffect } from "react";
import { useNavigate, Outlet, useLocation, Link } from "react-router-dom";
import { 
  Package, 
  Heart, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight,
  ArrowRight,
  User,
  Star,
  Shield
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { motion, AnimatePresence } from "framer-motion";

const accountLinks = [
  { name: "Orders", href: "/account/orders", icon: Package },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Reviews", href: "/account/reviews", icon: Star },
  { name: "Addresses", href: "/account/addresses", icon: MapPin },
  { name: "Settings", href: "/account/settings", icon: Settings },
];

const Account = () => {
  const { user, profile, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const isAccountRoot = location.pathname === "/account";

  return (
    <Layout>
      <div className="pt-36 pb-20">
        <div className="luxury-container">
          {/* Header */}
          <div className="mb-12">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-4">
              My Account
            </h1>
            <p className="text-muted-foreground font-body">
              <span className="text-foreground">{profile?.display_name || user.email}</span>
            </p>
          </div>

          <div className="grid lg:grid-cols-[280px_1fr] gap-12">
            {/* Sidebar */}
            <aside className="space-y-2">
              {/* Profile Summary */}
              <div className="bg-card border border-border p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-foreground">
                      {profile?.display_name || "Guest"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {accountLinks.map((link) => {
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className="w-5 h-5" />
                        <span className="font-body text-sm ">{link.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  );
                })}
              </nav>

              {/* Admin Portal */}
              <AnimatePresence>
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-4"
                  >
                    <Link
                      to="/admin"
                      className="group flex items-center justify-between border border-border px-4 py-3 transition-colors duration-150 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-body text-sm text-foreground">Admin panel</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-body text-sm ">Sign Out</span>
              </button>
            </aside>

            {/* Main Content */}
            <main>
              {isAccountRoot ? <AccountOverview /> : <Outlet />}
            </main>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const AccountOverview = () => {
  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Orders", value: "0" },
          { label: "Wishlist", value: "0" },
          { label: "Addresses", value: "0" },
          { label: "Reviews", value: "0" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border p-6 text-center">
            <div className="font-display text-3xl text-foreground mb-2">{stat.value}</div>
            <div className="text-sm text-muted-foreground font-body">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-card border border-border p-8">
        <h2 className="font-display text-2xl text-foreground mb-6">Recent Activity</h2>
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-body">No recent activity</p>
          <Link
            to="/shop"
            className="inline-block mt-4 text-primary hover:text-foreground transition-colors font-body text-sm "
          >
            Start Shopping <ArrowRight aria-hidden="true" className="inline-block w-4 h-4 ml-1 align-text-bottom" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Account;
