import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const CANONICAL_ORIGIN = "https://tbilisiwear.shop";

function ensureMetaTag(selector: string, create: () => HTMLElement) {
  const existing = document.head.querySelector(selector);
  if (existing) return existing as HTMLElement;
  const el = create();
  document.head.appendChild(el);
  return el;
}

function setMetaName(name: string, content: string) {
  const el = ensureMetaTag(`meta[name="${name}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("name", name);
    return m;
  }) as HTMLMetaElement;
  el.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string) {
  const el = ensureMetaTag(`meta[property="${property}"]`, () => {
    const m = document.createElement("meta");
    m.setAttribute("property", property);
    return m;
  }) as HTMLMetaElement;
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  const el = ensureMetaTag('link[rel="canonical"]', () => {
    const l = document.createElement("link");
    l.setAttribute("rel", "canonical");
    return l;
  }) as HTMLLinkElement;
  el.setAttribute("href", href);
}

type RouteSeo = { title: (s: string) => string; description: string; ogType?: string };

const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: (s) => `${s} — Luxury Fashion for Men & Women`,
    description: "Discover premium luxury fashion at TBILISI WEAR. Curated collections, timeless design, and made-to-last quality for men and women.",
  },
  "/shop": {
    title: (s) => `Shop All | ${s}`,
    description: "Browse the full TBILISI WEAR collection. Premium clothing and accessories for every season, hand-picked for quality and style.",
  },
  "/women": {
    title: (s) => `Women's Collection | ${s}`,
    description: "Shop women's luxury fashion at TBILISI WEAR — elevated essentials, statement pieces, and curated edits for the modern wardrobe.",
  },
  "/men": {
    title: (s) => `Men's Collection | ${s}`,
    description: "Shop men's luxury fashion at TBILISI WEAR — refined tailoring, premium staples, and contemporary pieces built to last.",
  },
  "/sale": {
    title: (s) => `Sale | ${s}`,
    description: "Premium fashion at reduced prices. Shop the TBILISI WEAR sale for limited-time savings on curated luxury essentials.",
  },
  "/flash-sale": {
    title: (s) => `Flash Sale | ${s}`,
    description: "Limited-time flash deals on TBILISI WEAR luxury pieces. Shop now before the timer runs out.",
  },
  "/bundles": {
    title: (s) => `Bundle Deals | ${s}`,
    description: "Save more when you style together. Discover curated TBILISI WEAR bundles built for effortless, complete looks.",
  },
  "/brands": {
    title: (s) => `Brands | ${s}`,
    description: "Explore the designers and labels we carry at TBILISI WEAR — a curated lineup of luxury and emerging brands.",
  },
  "/about": {
    title: (s) => `About | ${s}`,
    description: "TBILISI WEAR is a minimalist luxury fashion house from Tbilisi. Learn about our story, craft, and design philosophy.",
  },
  "/contact": {
    title: (s) => `Contact | ${s}`,
    description: "Get in touch with the TBILISI WEAR team. Customer care, wholesale, and press inquiries — we're here to help.",
  },
  "/faq": {
    title: (s) => `FAQ | ${s}`,
    description: "Answers to common questions about TBILISI WEAR orders, shipping, returns, sizing, and customer care.",
  },
  "/terms": {
    title: (s) => `Terms & Conditions | ${s}`,
    description: "Read the terms and conditions for shopping with TBILISI WEAR, including orders, payment, shipping, and returns policies.",
  },
  "/privacy": {
    title: (s) => `Privacy Policy | ${s}`,
    description: "Learn how TBILISI WEAR collects, uses, and protects your personal information when you shop with us.",
  },
  "/cart": {
    title: (s) => `Your Cart | ${s}`,
    description: "Review the items in your TBILISI WEAR shopping cart and proceed to a secure checkout.",
  },
  "/checkout": {
    title: (s) => `Checkout | ${s}`,
    description: "Complete your TBILISI WEAR order with secure checkout and fast delivery options.",
  },
  "/auth": {
    title: (s) => `Sign In | ${s}`,
    description: "Sign in or create a TBILISI WEAR account to manage orders, wishlists, and a faster checkout.",
  },
  "/reset-password": {
    title: (s) => `Reset Password | ${s}`,
    description: "Reset the password for your TBILISI WEAR account.",
  },
};

function resolveSeo(storeName: string, pathname: string): RouteSeo {
  const exact = ROUTE_SEO[pathname];
  if (exact) return exact;

  if (pathname.startsWith("/product/")) {
    return {
      title: (s) => `${s} | Product`,
      description: "Discover this piece from the TBILISI WEAR collection — premium materials, considered design, and timeless style.",
      ogType: "product",
    };
  }
  if (pathname.startsWith("/bundle/")) {
    return {
      title: (s) => `Bundle | ${s}`,
      description: "Shop this curated TBILISI WEAR bundle and save when you style the pieces together.",
      ogType: "product",
    };
  }
  if (pathname.startsWith("/account")) {
    return {
      title: (s) => `Account | ${s}`,
      description: "Manage your TBILISI WEAR account, orders, addresses, wishlist, and preferences.",
    };
  }
  if (pathname.startsWith("/admin")) {
    return {
      title: (s) => `Admin | ${s}`,
      description: "TBILISI WEAR admin panel.",
    };
  }

  return {
    title: (s) => s,
    description: `Discover premium luxury fashion at ${storeName}. Curated collections for men and women.`,
  };
}

const SeoManager = () => {
  const location = useLocation();
  const { settings } = useStoreSettings();

  const storeName = settings.store_name || "TBILISI WEAR";

  const seo = useMemo(() => resolveSeo(storeName, location.pathname), [storeName, location.pathname]);
  const title = useMemo(() => seo.title(storeName), [seo, storeName]);
  const description = seo.description;
  const ogType = seo.ogType || "website";

  const canonicalUrl = useMemo(
    () => `${CANONICAL_ORIGIN}${location.pathname}`,
    [location.pathname]
  );

  useEffect(() => {
    document.title = title;

    setMetaName("description", description);
    setMetaName("robots", "index, follow");

    setCanonical(canonicalUrl);
    setMetaProperty("og:url", canonicalUrl);
    setMetaProperty("og:type", ogType);

    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);

    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
  }, [title, description, canonicalUrl, ogType]);

  return null;
};

export default SeoManager;
