import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCustomThemes } from "@/hooks/useCustomThemes";

const ease = [0.22, 1, 0.36, 1] as const;

const DropHero = () => {
  const { settings } = useStoreSettings();
  const { customThemes } = useCustomThemes();
  const customTheme = customThemes.find((theme) => theme.id === settings.theme);
  const headline = (customTheme?.hero as { headline?: string } | undefined)?.headline || "New drop out now";

  return (
    <section className="relative flex h-[100svh] min-h-[640px] w-full items-end overflow-hidden bg-home-hero">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease }}
        className="absolute inset-0 bg-home-hero bg-cover bg-[center_25%] bg-no-repeat"
        style={{ backgroundImage: "url(/bgpic.png)" }}
        aria-hidden="true"
      />
      {/* Neutral scrim so the headline reads on the ground of the photograph */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease }}
          className="mx-auto max-w-[1440px] px-6 text-home-hero-foreground md:px-10"
        >
          <h1 className="max-w-[14ch] font-body text-[2.5rem] font-medium leading-[1.05] tracking-[-0.02em] md:text-6xl md:tracking-[-0.03em] lg:text-7xl">
            {headline}
          </h1>
          <Link
            to="/shop"
            className="mt-6 inline-flex h-12 items-center bg-white px-6 text-sm font-medium text-black transition-colors duration-150 hover:bg-white/85"
          >
            Shop now
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default DropHero;
