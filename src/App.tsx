import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import AuthCallbackRedirect from "@/components/auth/AuthCallbackRedirect";
import SeoManager from "@/components/seo/SeoManager";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { AdminProvider } from "@/hooks/useAdmin";
import { StoreSettingsProvider } from "@/hooks/useStoreSettings";

// Public pages
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Women from "./pages/Women";
import Men from "./pages/Men";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Brands from "./pages/Brands";
import Sale from "./pages/Sale";
import FlashSale from "./pages/FlashSale";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

// Account pages
import Account from "./pages/Account";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import Wishlist from "./pages/account/Wishlist";
import Reviews from "./pages/account/Reviews";
import Addresses from "./pages/account/Addresses";
import Settings from "./pages/account/Settings";

// Admin pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminProductForm from "./pages/admin/ProductForm";
import AdminCategories from "./pages/admin/Categories";
import AdminCategoryForm from "./pages/admin/CategoryForm";
import AdminBrands from "./pages/admin/Brands";
import AdminBrandForm from "./pages/admin/BrandForm";
import AdminOrders from "./pages/admin/Orders";
import AdminOrderDetail from "./pages/admin/OrderDetail";
import AdminCustomers from "./pages/admin/Customers";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCouponForm from "./pages/admin/CouponForm";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/Settings";
import AdminThemes from "./pages/admin/Themes";
import AdminFlashSales from "./pages/admin/FlashSales";
import AdminBulkImport from "./pages/admin/BulkImport";
import AdminBundles from "./pages/admin/Bundles";
import AdminBundleForm from "./pages/admin/BundleForm";
import BundlesPage from "./pages/BundlesPage";
import BundleDetail from "./pages/BundleDetail";
import AdminTeamMembers from "./pages/admin/TeamMembers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreSettingsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <SeoManager />
          <AuthCallbackRedirect />
          <AuthProvider>
            <AdminProvider>
              <CartProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/women" element={<Women />} />
                  <Route path="/men" element={<Men />} />
                  <Route path="/product/:slug" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/bundles" element={<BundlesPage />} />
                  <Route path="/bundle/:slug" element={<BundleDetail />} />
                  <Route path="/sale" element={<Sale />} />
                  <Route path="/flash-sale" element={<FlashSale />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />

                  {/* Account Routes */}
                  <Route path="/account" element={<Account />}>
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:orderId" element={<OrderDetail />} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="reviews" element={<Reviews />} />
                    <Route path="addresses" element={<Addresses />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route path="products/:productId" element={<AdminProductForm />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="categories/new" element={<AdminCategoryForm />} />
                    <Route path="categories/:id" element={<AdminCategoryForm />} />
                    <Route path="brands" element={<AdminBrands />} />
                    <Route path="brands/new" element={<AdminBrandForm />} />
                    <Route path="brands/:id" element={<AdminBrandForm />} />
                    <Route path="flash-sales" element={<AdminFlashSales />} />
                    <Route path="bulk-import" element={<AdminBulkImport />} />
                    <Route path="bundles" element={<AdminBundles />} />
                    <Route path="bundles/new" element={<AdminBundleForm />} />
                    <Route path="bundles/:bundleId" element={<AdminBundleForm />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/:orderId" element={<AdminOrderDetail />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="coupons/new" element={<AdminCouponForm />} />
                    <Route path="coupons/:couponId" element={<AdminCouponForm />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="themes" element={<AdminThemes />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="team" element={<AdminTeamMembers />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CartProvider>
            </AdminProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </StoreSettingsProvider>
  </QueryClientProvider>
);

export default App;