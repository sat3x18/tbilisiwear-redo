import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Heart, ShoppingBag, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import MegaMenu from "./MegaMenu";

type MenuType = "men" | "women" | "brands" | "new" | null;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<MenuType>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const { settings } = useStoreSettings();
  const isHome = location.pathname === "/";
  const onHero = isHome && !isScrolled;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setActiveMenu(null);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: "DAY2DAY", href: "/", menuType: null as MenuType },
    { name: "Outwear", href: "/shop?category=outerwear", menuType: null as MenuType },
    { name: "Bottoms", href: "/shop?category=bottoms", menuType: null as MenuType },
    { name: "Denim", href: "/shop?category=denim", menuType: null as MenuType },
    { name: "Sweats", href: "/shop?category=sweats", menuType: null as MenuType },
    { name: "Sale", href: "/sale", menuType: null as MenuType },
  ];


  const handleMenuHover = (menuType: MenuType) => {
    setActiveMenu(menuType);
  };

  const handleMenuLeave = () => {
    setActiveMenu(null);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${onHero ? "text-home-hero-foreground" : "text-foreground"}`}
      >
        {/* Fading background layer on scroll */}
        <div
          className={`absolute inset-0 -z-10 backdrop-blur-md transition-opacity duration-500 ${
            "bg-background/95 border-b border-border"
          } ${isScrolled || !isHome ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        />


        <nav className="px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">
            
            {/* Left Section - Mobile: Menu Button | Desktop: Navigation Links */}
            <div className="flex items-center lg:flex-1">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className={`lg:hidden p-1.5 -ml-1.5 touch-manipulation ${onHero ? "text-home-hero-foreground" : "text-foreground"}`}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Mobile search - right of hamburger */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`sm:hidden p-1.5 touch-manipulation ${onHero ? "text-home-hero-foreground" : "text-foreground"}`}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Desktop Navigation - Far Left */}
              <div className={`hidden lg:flex items-center ${"gap-4 xl:gap-5"}`}>
                {navLinks.map((link) => (
                  <div
                    key={link.name}
                    className="relative"
                    onMouseEnter={() => link.menuType && handleMenuHover(link.menuType)}
                  >
                    <Link
                      to={link.href}
                      className={`nav-link text-xs xl:text-sm font-body font-normal whitespace-nowrap flex items-center gap-1 py-2 ${onHero ? "text-home-hero-foreground/90 hover:text-home-hero-foreground" : "!text-foreground/70 hover:!text-foreground"}`}
                    >
                      {link.name}
                      {link.menuType && (
                        <ChevronDown 
                          className={`w-3 h-3 transition-transform duration-200 ${
                            activeMenu === link.menuType ? "rotate-180" : ""
                          }`} 
                        />
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Center - Logo (Always Centered) */}
            <Link
              to="/"
              className="flex-shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
              onMouseEnter={handleMenuLeave}
              aria-label={settings.store_name}
            >
              <img
                src="/tbilisiwear-logo-header-transparent.gif"
                alt={settings.store_name}
                className={`h-10 w-[168px] object-cover object-center sm:h-12 sm:w-[210px] lg:h-14 lg:w-[250px] ${onHero ? "" : "invert"}`}
              />
            </Link>


            {/* Right Section - Icons (Far Right) */}
            <div 
              className={`flex items-center justify-end gap-3 sm:gap-4 lg:gap-5 xl:gap-6 lg:flex-1 ${onHero ? "text-home-hero-foreground" : "text-foreground"}`}
              onMouseEnter={handleMenuLeave}
            >
              {/* Search - Hidden on mobile, shown on tablet+ */}
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`hidden sm:flex transition-colors p-1.5 touch-manipulation ${onHero ? "text-home-hero-foreground/90 hover:text-home-hero-foreground" : "text-foreground/70 hover:text-foreground"}`}
                aria-label="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* User Account - Hidden on mobile */}
              <Link
                to={user ? "/account" : "/auth"}
                className={`flex transition-colors p-1.5 touch-manipulation ${onHero ? "text-home-hero-foreground/90 hover:text-home-hero-foreground" : "text-foreground/70 hover:text-foreground"}`}
                title={user ? profile?.display_name || "Account" : "Sign In"}
                aria-label={user ? "Account" : "Sign In"}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              
              {/* Wishlist - Hidden on mobile */}
              <Link
                to={user ? "/account/wishlist" : "/auth"}
                className={`hidden md:flex transition-colors p-1.5 ${onHero ? "text-home-hero-foreground/90 hover:text-home-hero-foreground" : "text-foreground/70 hover:text-foreground"}`}
                aria-label="Wishlist"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              
              {/* Cart - Always visible */}
              <CartDrawer
                trigger={
                  <button 
                    className={`relative transition-colors p-1.5 touch-manipulation ${onHero ? "text-home-hero-foreground/90 hover:text-home-hero-foreground" : "text-foreground/70 hover:text-foreground"}`}
                    aria-label="Shopping cart"
                  >
                    <ShoppingBag className="w-5 h-5 sm:w-5 sm:h-5" />
                    {itemCount > 0 && (
                      <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 ${onHero ? "bg-white text-black" : "bg-foreground text-background"} font-body text-xs font-medium tabular-nums`}>
                        {itemCount > 99 ? "99+" : itemCount}
                      </span>
                    )}
                  </button>
                }
              />
            </div>
          </div>

          {/* Mega Menus */}
          {activeMenu && (
            <MegaMenu 
              type={activeMenu} 
              isOpen={!!activeMenu} 
              onClose={handleMenuLeave}
            />
          )}
        </nav>

        {/* Search Bar */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-border bg-background overflow-hidden"
            >
              <form onSubmit={handleSearch} className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-secondary border border-border text-foreground text-sm sm:text-base font-body focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 touch-manipulation"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Full-Screen Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 bg-background text-foreground z-[60] lg:hidden flex flex-col"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-6 flex-shrink-0">
              <span className="text-xs font-body font-medium text-muted-foreground">
                Menu
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 touch-manipulation"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto flex flex-col justify-center px-6 sm:px-10">
              <ul>
                {navLinks.map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ delay: 0.15 + index * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-border"
                  >
                    <Link
                      to={link.href}
                      className="block py-4 sm:py-5 font-body font-medium text-3xl sm:text-4xl tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </nav>

            {/* Footer links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="px-6 sm:px-10 py-6 flex flex-col gap-3 flex-shrink-0"
            >
              <div className="flex items-center gap-6">
                <Link
                  to={user ? "/account" : "/auth"}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  <span className="font-body text-xs ">
                    {user ? "Account" : "Sign In"}
                  </span>
                </Link>
                <Link
                  to={user ? "/account/wishlist" : "/auth"}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Heart className="w-4 h-4" />
                  <span className="font-body text-xs ">Wishlist</span>
                </Link>
                {user && (
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-body text-xs ">Sign Out</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-body">
                Free shipping over {parseFloat(settings.free_shipping_threshold) || 500} {settings.currency}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
