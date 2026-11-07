## Plan: Replace the home page with the Superdesign draft

Fetched draft `demo-1-9580.myshopify.com` from the Superdesign canvas. It is a stark, editorial streetwear layout — nothing like the current multi-section home page.

Canvas: https://superdesign.dev/teams/personal/projects/83558b88-9491-4087-84d0-5c3ef24daa20
Draft preview: https://p.superdesign.dev/draft/bef63791-19b8-4c2f-bab3-903b9fe73921

### What the design contains (top to bottom)

1. **Full-bleed black hero** — 100vh media (image/video), no overlay card. Headline "New drop out now" in large light-weight type, centered near the bottom, with a plain underlined "shop now" link below it. No buttons, no badges.
2. **Collection grid** — a plain left-aligned section title ("Outwear"), then a 3-column product grid (2 rows). Cards are bare: image, uppercase product name, price. Sale items show a small red "Sale" chip on the image and a struck-through original price. No hover overlays, no quick view, no borders or cards.
3. **Social strip** — big left-aligned handle ("@protect.ldn") with a "Subscribe" link right-aligned, followed by a full-width horizontally scrolling row of tall portrait images that bleeds off both edges.
4. **Footer** — minimal three-part row: copyright left, policy link center, social icons right.

### What gets built

**New home sections** (replacing everything in `src/pages/Index.tsx`):

- `src/components/home/DropHero.tsx` — 100vh black hero, existing hero image with `object-[center_25%]`, bottom-anchored headline + "shop now" link to `/shop`. Framer-motion fade-up on mount.
- `src/components/home/CollectionGrid.tsx` — reuses `useProducts` to pull a featured/collection set; renders a 3-column desktop grid (2-column on mobile per the mobile grid rule, 2/3 aspect ratio, no Quick View). Prices via `formatPrice` in GEL. Sale chip + struck-through compare-at price when the product is discounted.
- `src/components/home/SocialStrip.tsx` — handle + subscribe link header, edge-to-edge scroll row of portrait images (snap scrolling, hidden scrollbar).
- Each section wrapped in the existing `ScrollReveal` so the site-wide scroll animation behaviour is preserved.

**Reused as-is:** `Layout`, `Header`/`MegaMenu`, `Footer`, `ProductCard` styling conventions, cart drawer behaviour.

**Removed from the home page:** `FlashSaleSection`, `FeaturedProducts`, `BundleDealsSection`, `CollectionsSection`, `BrandsSection`, `EditorialSection`. Those component files stay in the repo so they can be reinstated or reused on other routes.

### Technical details

- Copy and product data come from the live database, not the draft's hard-coded Shopify demo content — the draft supplies layout, typography scale, and spacing only.
- Colours stay on existing semantic tokens (`bg-background`, `text-foreground`, `--gold` accents); the hero's black comes from a dedicated dark section token rather than a hardcoded `bg-black`.
- Currency stays GEL/₾ through `formatPrice` — the draft's `$` figures are ignored.
- Section title typography follows the draft: large, regular weight, left-aligned, generous top/bottom padding.
- The social strip uses placeholder imagery from existing assets until real campaign images are supplied.

### Open question

The draft's collection section shows a single hard-coded collection ("Outwear"). I will wire it to your featured products by default; say the word if you'd rather it pull a specific category.
