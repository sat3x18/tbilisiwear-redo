// Theme definitions for TBILISI WEAR
// Each theme defines all CSS custom property values (HSL format without hsl() wrapper)

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  border: string;
  input: string;
  ring: string;
  gold: string;
  "gold-muted": string;
  champagne: string;
  charcoal: string;
  "charcoal-light": string;
  cream: string;
  "cream-muted": string;
}

export interface ThemeHeroContent {
  headline: string;
  highlightWord: string;
  subtitle: string;
  tagline: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; primary: string; text: string; card: string };
  colors: ThemeColors;
  hero: ThemeHeroContent;
}

export const themes: Theme[] = [
  {
    id: "studio",
    name: "Studio",
    description: "Black on white, no accent",
    preview: { bg: "#fafafa", primary: "#171717", text: "#171717", card: "#ffffff" },
    hero: {
      headline: "New drop out now",
      highlightWord: "",
      subtitle: "",
      tagline: "",
    },
    colors: {
      background: "0 0% 98%",
      foreground: "0 0% 9%",
      card: "0 0% 100%",
      "card-foreground": "0 0% 9%",
      popover: "0 0% 100%",
      "popover-foreground": "0 0% 9%",
      primary: "0 0% 9%",
      "primary-foreground": "0 0% 98%",
      secondary: "0 0% 96%",
      "secondary-foreground": "0 0% 9%",
      muted: "0 0% 96%",
      "muted-foreground": "0 0% 45%",
      accent: "0 0% 96%",
      "accent-foreground": "0 0% 9%",
      destructive: "0 72% 51%",
      "destructive-foreground": "0 0% 100%",
      border: "0 0% 90%",
      input: "0 0% 90%",
      ring: "0 0% 9%",
      gold: "0 0% 9%",
      "gold-muted": "0 0% 45%",
      champagne: "0 0% 96%",
      charcoal: "0 0% 96%",
      "charcoal-light": "0 0% 93%",
      cream: "0 0% 9%",
      "cream-muted": "0 0% 45%",
    },
  },
  {
    id: "dark-gold",
    name: "Dark Gold",
    description: "Signature black & gold luxury",
    preview: { bg: "#0a0a0a", primary: "#c9a96e", text: "#ede4d3", card: "#0f0f0f" },
    hero: {
      headline: "Redefining",
      highlightWord: "Elegance",
      subtitle: "Discover curated collections from the world's most prestigious fashion houses.",
      tagline: "Timeless Elegance Since 2025",
    },
    colors: {
      background: "0 0% 4%",
      foreground: "40 20% 92%",
      card: "0 0% 6%",
      "card-foreground": "40 20% 92%",
      popover: "0 0% 6%",
      "popover-foreground": "40 20% 92%",
      primary: "40 30% 75%",
      "primary-foreground": "0 0% 4%",
      secondary: "0 0% 12%",
      "secondary-foreground": "40 20% 92%",
      muted: "0 0% 14%",
      "muted-foreground": "40 10% 55%",
      accent: "38 40% 50%",
      "accent-foreground": "0 0% 4%",
      destructive: "0 62% 45%",
      "destructive-foreground": "40 20% 92%",
      border: "0 0% 18%",
      input: "0 0% 18%",
      ring: "40 30% 75%",
      gold: "38 60% 58%",
      "gold-muted": "38 30% 40%",
      champagne: "40 30% 85%",
      charcoal: "0 0% 8%",
      "charcoal-light": "0 0% 14%",
      cream: "40 30% 92%",
      "cream-muted": "40 15% 70%",
    },
  },
  {
    id: "midnight-silver",
    name: "Midnight Silver",
    description: "Cool dark tones with silver accents",
    preview: { bg: "#0c0c10", primary: "#a8b2c1", text: "#e0e4ea", card: "#12121a" },
    hero: {
      headline: "Beyond",
      highlightWord: "Midnight",
      subtitle: "Where modern sophistication meets the allure of the night sky.",
      tagline: "Refined Cool Since 2025",
    },
    colors: {
      background: "230 12% 5%",
      foreground: "220 15% 90%",
      card: "230 15% 7%",
      "card-foreground": "220 15% 90%",
      popover: "230 15% 7%",
      "popover-foreground": "220 15% 90%",
      primary: "215 18% 72%",
      "primary-foreground": "230 12% 5%",
      secondary: "230 10% 14%",
      "secondary-foreground": "220 15% 90%",
      muted: "230 10% 16%",
      "muted-foreground": "220 8% 50%",
      accent: "215 25% 55%",
      "accent-foreground": "230 12% 5%",
      destructive: "0 62% 45%",
      "destructive-foreground": "220 15% 90%",
      border: "230 8% 20%",
      input: "230 8% 20%",
      ring: "215 18% 72%",
      gold: "215 30% 60%",
      "gold-muted": "215 15% 40%",
      champagne: "215 18% 82%",
      charcoal: "230 12% 9%",
      "charcoal-light": "230 10% 16%",
      cream: "220 15% 90%",
      "cream-muted": "220 8% 65%",
    },
  },
  {
    id: "ivory-noir",
    name: "Ivory & Noir",
    description: "Light cream with dark accents",
    preview: { bg: "#f5f0e8", primary: "#1a1a1a", text: "#1a1a1a", card: "#ffffff" },
    hero: {
      headline: "Pure",
      highlightWord: "Contrast",
      subtitle: "The art of light and shadow, woven into every thread.",
      tagline: "Classic Minimalism Since 2025",
    },
    colors: {
      background: "38 30% 94%",
      foreground: "0 0% 10%",
      card: "0 0% 100%",
      "card-foreground": "0 0% 10%",
      popover: "0 0% 100%",
      "popover-foreground": "0 0% 10%",
      primary: "0 0% 10%",
      "primary-foreground": "38 30% 94%",
      secondary: "38 15% 88%",
      "secondary-foreground": "0 0% 10%",
      muted: "38 10% 90%",
      "muted-foreground": "0 0% 45%",
      accent: "38 40% 45%",
      "accent-foreground": "38 30% 94%",
      destructive: "0 62% 45%",
      "destructive-foreground": "0 0% 100%",
      border: "38 10% 82%",
      input: "38 10% 82%",
      ring: "0 0% 10%",
      gold: "38 40% 45%",
      "gold-muted": "38 20% 60%",
      champagne: "38 15% 30%",
      charcoal: "38 15% 92%",
      "charcoal-light": "38 10% 90%",
      cream: "0 0% 10%",
      "cream-muted": "0 0% 40%",
    },
  },
  {
    id: "deep-burgundy",
    name: "Deep Burgundy",
    description: "Rich wine tones with warm gold",
    preview: { bg: "#100608", primary: "#c4787a", text: "#ede0df", card: "#180a0c" },
    hero: {
      headline: "Embrace",
      highlightWord: "Passion",
      subtitle: "Rich, bold, and unapologetically luxurious fashion statements.",
      tagline: "Bold Heritage Since 2025",
    },
    colors: {
      background: "350 30% 4%",
      foreground: "5 20% 90%",
      card: "350 25% 6%",
      "card-foreground": "5 20% 90%",
      popover: "350 25% 6%",
      "popover-foreground": "5 20% 90%",
      primary: "358 30% 62%",
      "primary-foreground": "350 30% 4%",
      secondary: "350 15% 13%",
      "secondary-foreground": "5 20% 90%",
      muted: "350 12% 15%",
      "muted-foreground": "5 10% 50%",
      accent: "35 40% 50%",
      "accent-foreground": "350 30% 4%",
      destructive: "0 62% 45%",
      "destructive-foreground": "5 20% 90%",
      border: "350 10% 18%",
      input: "350 10% 18%",
      ring: "358 30% 62%",
      gold: "35 50% 55%",
      "gold-muted": "35 25% 38%",
      champagne: "358 25% 80%",
      charcoal: "350 20% 8%",
      "charcoal-light": "350 12% 15%",
      cream: "5 20% 90%",
      "cream-muted": "5 10% 65%",
    },
  },
  {
    id: "forest-emerald",
    name: "Forest Emerald",
    description: "Deep greens with warm highlights",
    preview: { bg: "#060d08", primary: "#7aad8a", text: "#dde8e0", card: "#0a140c" },
    hero: {
      headline: "Nature's",
      highlightWord: "Luxury",
      subtitle: "Organic elegance inspired by the depths of ancient forests.",
      tagline: "Earth & Elegance Since 2025",
    },
    colors: {
      background: "140 25% 4%",
      foreground: "140 15% 90%",
      card: "140 20% 6%",
      "card-foreground": "140 15% 90%",
      popover: "140 20% 6%",
      "popover-foreground": "140 15% 90%",
      primary: "145 22% 58%",
      "primary-foreground": "140 25% 4%",
      secondary: "140 12% 13%",
      "secondary-foreground": "140 15% 90%",
      muted: "140 10% 15%",
      "muted-foreground": "140 8% 48%",
      accent: "38 35% 50%",
      "accent-foreground": "140 25% 4%",
      destructive: "0 62% 45%",
      "destructive-foreground": "140 15% 90%",
      border: "140 8% 18%",
      input: "140 8% 18%",
      ring: "145 22% 58%",
      gold: "38 45% 55%",
      "gold-muted": "38 20% 38%",
      champagne: "145 18% 78%",
      charcoal: "140 18% 8%",
      "charcoal-light": "140 10% 15%",
      cream: "140 15% 90%",
      "cream-muted": "140 8% 62%",
    },
  },
  {
    id: "arctic-white",
    name: "Arctic White",
    description: "Clean white minimalist",
    preview: { bg: "#fafafa", primary: "#111111", text: "#111111", card: "#ffffff" },
    hero: {
      headline: "Simply",
      highlightWord: "Iconic",
      subtitle: "Stripped back to perfection. Clean lines, pure intention.",
      tagline: "Modern Purity Since 2025",
    },
    colors: {
      background: "0 0% 98%",
      foreground: "0 0% 7%",
      card: "0 0% 100%",
      "card-foreground": "0 0% 7%",
      popover: "0 0% 100%",
      "popover-foreground": "0 0% 7%",
      primary: "0 0% 7%",
      "primary-foreground": "0 0% 98%",
      secondary: "0 0% 93%",
      "secondary-foreground": "0 0% 7%",
      muted: "0 0% 94%",
      "muted-foreground": "0 0% 45%",
      accent: "220 10% 35%",
      "accent-foreground": "0 0% 98%",
      destructive: "0 62% 45%",
      "destructive-foreground": "0 0% 100%",
      border: "0 0% 88%",
      input: "0 0% 88%",
      ring: "0 0% 7%",
      gold: "0 0% 95%",
      "gold-muted": "0 0% 80%",
      champagne: "0 0% 90%",
      charcoal: "0 0% 96%",
      "charcoal-light": "0 0% 94%",
      cream: "0 0% 7%",
      "cream-muted": "0 0% 40%",
    },
  },
];

// "dark-gold" was the original default. Stores that saved it get the new default.
export const LEGACY_DEFAULT_THEME_ID = "dark-gold";

export function getThemeById(id: string): Theme {
  if (id === LEGACY_DEFAULT_THEME_ID) return themes[0];
  return themes.find((t) => t.id === id) || themes[0];
}

export function applyCustomThemeColors(colors: ThemeColors) {
  const root = document.documentElement;

  const style = document.createElement("style");
  style.id = "theme-transition-block";
  style.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.appendChild(style);

  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty("--gradient-gold", `hsl(${colors.gold})`);

  const bg = colors.background;
  root.style.setProperty("--gradient-dark", `linear-gradient(180deg, hsl(${colors.card}) 0%, hsl(${bg}) 100%)`);
  root.style.setProperty("--gradient-overlay", `linear-gradient(180deg, transparent 0%, hsl(${bg} / 0.8) 100%)`);

  root.style.setProperty("--sidebar-background", colors.card);
  root.style.setProperty("--sidebar-foreground", colors.foreground);
  root.style.setProperty("--sidebar-primary", colors.primary);
  root.style.setProperty("--sidebar-primary-foreground", colors["primary-foreground"]);
  root.style.setProperty("--sidebar-accent", colors.secondary);
  root.style.setProperty("--sidebar-accent-foreground", colors["secondary-foreground"]);
  root.style.setProperty("--sidebar-border", colors.border);
  root.style.setProperty("--sidebar-ring", colors.ring);

  requestAnimationFrame(() => {
    const blocker = document.getElementById("theme-transition-block");
    if (blocker) blocker.remove();
  });
}

export function applyTheme(themeId: string) {
  const theme = getThemeById(themeId);
  const root = document.documentElement;

  // Disable all CSS transitions to prevent white fog/flash during theme switch
  const style = document.createElement("style");
  style.id = "theme-transition-block";
  style.textContent = "*, *::before, *::after { transition: none !important; }";
  document.head.appendChild(style);

  Object.entries(theme.colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });

  root.style.setProperty("--gradient-gold", `hsl(${theme.colors.gold})`);

  const bg = theme.colors.background;
  root.style.setProperty(
    "--gradient-dark",
    `linear-gradient(180deg, hsl(${theme.colors.card}) 0%, hsl(${bg}) 100%)`
  );
  root.style.setProperty(
    "--gradient-overlay",
    `linear-gradient(180deg, transparent 0%, hsl(${bg} / 0.8) 100%)`
  );

  // Update sidebar vars
  root.style.setProperty("--sidebar-background", theme.colors.card);
  root.style.setProperty("--sidebar-foreground", theme.colors.foreground);
  root.style.setProperty("--sidebar-primary", theme.colors.primary);
  root.style.setProperty("--sidebar-primary-foreground", theme.colors["primary-foreground"]);
  root.style.setProperty("--sidebar-accent", theme.colors.secondary);
  root.style.setProperty("--sidebar-accent-foreground", theme.colors["secondary-foreground"]);
  root.style.setProperty("--sidebar-border", theme.colors.border);
  root.style.setProperty("--sidebar-ring", theme.colors.ring);

  // Re-enable transitions after a frame so the browser paints the new theme first
  requestAnimationFrame(() => {
    const blocker = document.getElementById("theme-transition-block");
    if (blocker) blocker.remove();
  });
}
