import { useState, useEffect, useMemo } from "react";
import { useNavigate, Outlet, useLocation, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  FolderTree,
  Building2,
  Zap,
  Upload,
  Gift,
  Palette,
  UsersRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";

const allAdminLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, section: "dashboard" },
  { name: "Products", href: "/admin/products", icon: Package, section: "products" },
  { name: "Bulk Import", href: "/admin/bulk-import", icon: Upload, section: "products" },
  { name: "Categories", href: "/admin/categories", icon: FolderTree, section: "products" },
  { name: "Brands", href: "/admin/brands", icon: Building2, section: "products" },
  { name: "Bundles", href: "/admin/bundles", icon: Gift, section: "products" },
  { name: "Flash Sales", href: "/admin/flash-sales", icon: Zap, section: "products" },
  { name: "Orders", href: "/admin/orders", icon: ShoppingCart, section: "orders" },
  { name: "Customers", href: "/admin/customers", icon: Users, section: "orders" },
  { name: "Coupons", href: "/admin/coupons", icon: Tag, section: "products" },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3, section: "dashboard" },
  { name: "Themes", href: "/admin/themes", icon: Palette, section: "settings" },
  { name: "Team", href: "/admin/team", icon: UsersRound, section: "team" },
  { name: "Settings", href: "/admin/settings", icon: Settings, section: "settings" },
];

const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isTeamMember, teamPermissions, loading } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hasAccess = isAdmin || isTeamMember;

  useEffect(() => {
    if (!loading && (!user || !hasAccess)) {
      navigate("/");
    }
  }, [user, hasAccess, loading, navigate]);

  const filteredLinks = useMemo(() => {
    if (isAdmin) return allAdminLinks;
    if (!teamPermissions) return [];

    return allAdminLinks.filter((link) => {
      if (link.section === "team") return false;
      if (link.section === "settings") return false;
      if (teamPermissions.full_access) return true;
      if (link.href === "/admin/analytics") return false;
      if (link.section === "orders" && teamPermissions.orders) return true;
      if (link.section === "products" && teamPermissions.products) return true;
      if (link.section === "dashboard") {
        return teamPermissions.orders || teamPermissions.products;
      }
      return false;
    });
  }, [isAdmin, teamPermissions]);

  const isRouteAllowed = useMemo(() => {
    if (isAdmin) return true;
    const path = location.pathname;
    if (path === "/admin") return true;
    return filteredLinks.some((link) => {
      if (link.href === "/admin") return false;
      return path.startsWith(link.href);
    });
  }, [isAdmin, filteredLinks, location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !hasAccess) {
    return null;
  }

  const isActiveLink = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <Link to="/admin" className="font-display text-xl text-foreground">
          ADMIN
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-foreground"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-card border-r border-border z-40 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <Link to="/admin" className="font-display text-xl text-foreground">
              ADMIN PANEL
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-4">
            {filteredLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex h-9 items-center justify-between px-3 transition-colors duration-150 ${
                    isActive
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className="h-4 w-4" />
                    <span className="font-body text-sm">{link.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors rounded"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-body text-sm">View Store</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-body text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {isRouteAllowed ? <Outlet /> : <Navigate to="/admin" replace />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
