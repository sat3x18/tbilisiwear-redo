import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroMain from "@/assets/hero-main.jpg";
import heroMidnightSilver from "@/assets/hero-midnight-silver.jpg";
import heroIvoryNoir from "@/assets/hero-ivory-noir.jpg";
import heroDeepBurgundy from "@/assets/hero-deep-burgundy.jpg";
import heroForestEmerald from "@/assets/hero-forest-emerald.jpg";
import heroArcticWhite from "@/assets/hero-arctic-white.jpg";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { getThemeById, themes } from "@/lib/themes";
import { useCustomThemes } from "@/hooks/useCustomThemes";

const themeHeroImages: Record<string, string> = {
  studio: heroMain,
  "dark-gold": heroMain,
  "midnight-silver": heroMidnightSilver,
  "ivory-noir": heroIvoryNoir,
  "deep-burgundy": heroDeepBurgundy,
  "forest-emerald": heroForestEmerald,
  "arctic-white": heroArcticWhite,
};

const HeroSection = () => {
  const { settings } = useStoreSettings();
  const { customThemes } = useCustomThemes();
  
  // Check if it's a custom theme (UUID) vs preset
  const isPreset = themes.some(t => t.id === settings.theme);
  const customTheme = !isPreset ? customThemes.find(ct => ct.id === settings.theme) : null;
  
  const currentHero = customTheme?.hero_image_url || themeHeroImages[settings.theme] || heroMain;
  const theme = getThemeById(settings.theme);
  const hero = customTheme 
    ? {
        headline: (customTheme.hero as any)?.headline || "Redefining",
        highlightWord: (customTheme.hero as any)?.highlightWord || "Elegance",
        subtitle: (customTheme.hero as any)?.subtitle || "Discover curated collections.",
        tagline: (customTheme.hero as any)?.tagline || "Timeless Elegance Since 2025",
      }
    : theme.hero;

  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <motion.img
          key={settings.theme}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          src={currentHero}
          alt={`${settings.store_name} - Luxury Fashion`}
          className="w-full h-full object-cover object-[center_25%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 luxury-container text-center">
        <motion.div
          key={`hero-content-${settings.theme}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-white/90 text-sm mb-6 font-body"
          >
            {hero.tagline}
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="font-display text-display-xl text-white mb-6"
          >
            {hero.headline}
            <br />
            <span className="text-gradient-gold">{hero.highlightWord}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-white/60 text-lg font-body font-normal mb-10 max-w-xl mx-auto"
          >
            {hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/shop" className="btn-luxury group border-white/40 text-white hover:bg-white/10 hover:border-white/70">
              <span className="flex items-center gap-3">
                Explore Collection
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-px h-12 bg-gradient-to-b from-white/80 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
