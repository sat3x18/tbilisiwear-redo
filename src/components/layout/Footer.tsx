import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import ScrollReveal from "@/components/ScrollReveal";

interface FooterProps {
  minimal?: boolean;
}

const Footer = ({ minimal = false }: FooterProps) => {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();
  const { settings } = useStoreSettings();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already subscribed",
            description: "This email is already subscribed.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Subscribed",
          description: "You are on the list.",
        });
        setEmail("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not subscribe. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  if (minimal) {
    return (
      <footer className="bg-background px-6 pb-8 pt-14 text-foreground md:px-10 md:pb-10 md:pt-16">
        <ScrollReveal direction="none">
          <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-5 font-body text-xs md:flex-row md:items-center">
            <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</p>
            <Link to="/terms" className="underline underline-offset-4 transition-opacity hover:opacity-60">Terms and Policies</Link>
            <div className="flex gap-5">
              <a href={settings.social_instagram || "https://instagram.com"} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-opacity hover:opacity-60"><Instagram className="h-4 w-4" /></a>
              <a href={settings.social_facebook || "https://facebook.com"} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="transition-opacity hover:opacity-60"><Facebook className="h-4 w-4" /></a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="transition-opacity hover:opacity-60"><Youtube className="h-4 w-4" /></a>
            </div>
          </div>
        </ScrollReveal>
      </footer>
    );
  }

  return (
    <footer className="bg-charcoal border-t border-border">
      {/* Newsletter Section */}
      <div className="luxury-container py-16 md:py-20">
        <ScrollReveal direction="up" className="max-w-xl mx-auto text-center">
          <h3 className="font-display text-display-sm text-foreground mb-2">
            New drops by email
          </h3>
          <p className="text-muted-foreground font-body text-sm mb-6">
            Get new arrivals and sale dates in your inbox.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="flex-1 bg-transparent border-b border-border px-0 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-body"
              required
            />
            <button
              type="submit"
              disabled={isSubscribing}
              className="btn-luxury group disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {isSubscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </button>
          </form>
        </ScrollReveal>
      </div>

      <div className="line-elegant" />

      {/* Main Footer */}
      <div className="luxury-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <ScrollReveal delay={0}>
            <Link to="/" className="block mb-6">
              <h2 className="font-display text-2xl text-foreground">
                {settings.store_name}
              </h2>
            </Link>
            <p className="text-muted-foreground text-sm font-body leading-relaxed mb-6">
              Outerwear, denim and sweats, delivered across Georgia
            </p>
            <div className="flex gap-5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </ScrollReveal>

          {/* Shop */}
          <ScrollReveal delay={0.1}>
            <h4 className="font-body text-sm font-medium text-foreground mb-4">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/shop?sort=newest" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">New Arrivals</Link></li>
              <li><Link to="/women" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Women</Link></li>
              <li><Link to="/men" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Men</Link></li>
              <li><Link to="/shop?category=shoes" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Shoes</Link></li>
              <li><Link to="/shop?category=accessories" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Accessories</Link></li>
              <li><Link to="/sale" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Sale</Link></li>
            </ul>
          </ScrollReveal>

          {/* Brands */}
          <ScrollReveal delay={0.2}>
            <h4 className="font-body text-sm font-medium text-foreground mb-4">Brands</h4>
            <ul className="space-y-3">
              <li><Link to="/shop?brand=maison-margiela" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Maison Margiela</Link></li>
              <li><Link to="/shop?brand=moncler" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Moncler</Link></li>
              <li><Link to="/shop?brand=isabel-marant" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Isabel Marant</Link></li>
              <li><Link to="/shop?brand=louis-vuitton" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Louis Vuitton</Link></li>
              <li><Link to="/shop?brand=bottega-veneta" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Bottega Veneta</Link></li>
              <li><Link to="/brands" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">View All</Link></li>
            </ul>
          </ScrollReveal>

          {/* Customer Service */}
          <ScrollReveal delay={0.3}>
            <h4 className="font-body text-sm font-medium text-foreground mb-4">Customer Care</h4>
            <ul className="space-y-3">
              <li><Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">FAQ</Link></li>
              <li><Link to="/faq#shipping" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Shipping & Returns</Link></li>
              <li><Link to="/faq#size-guide" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Size Guide</Link></li>
              <li><Link to="/account/orders" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">Track Order</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-foreground text-sm font-body transition-colors">About Us</Link></li>
            </ul>
          </ScrollReveal>
        </div>
      </div>

      <div className="line-elegant" />

      {/* Bottom Bar */}
      <div className="luxury-container py-6">
        <ScrollReveal direction="none">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-body">
            <p>© {new Date().getFullYear()} {settings.store_name}</p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
};

export default Footer;
