import ScrollReveal from "@/components/ScrollReveal";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import img1 from "@/assets/code21/social-1.jpg";
import img2 from "@/assets/code21/social-2.jpg";
import img3 from "@/assets/code21/social-3.jpg";
import img4 from "@/assets/code21/social-4.jpg";

const images = [img1, img2, img3, img4];

const SocialStrip = () => {
  const { settings } = useStoreSettings();

  const instagram = settings.social_instagram;
  const parsed = (instagram || "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\/?/i, "")
    .replace(/\?.*$/, "")
    .replace(/\/$/, "")
    .replace(/^@/, "")
    .trim();
  const handle = parsed ? `@${parsed}` : "@tbilisiwear";

  return (
    <section className="bg-background pb-12 text-foreground md:pb-16">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-10">
        <ScrollReveal>
          <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
            <h2 className="font-body text-3xl font-medium leading-tight tracking-[-0.02em] md:text-4xl">
              {handle}
            </h2>
            {instagram && (
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-body text-sm underline underline-offset-4 transition-colors duration-150 hover:text-muted-foreground"
              >
                Follow
              </a>
            )}
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 [scrollbar-width:none] md:gap-4 md:px-10 [&::-webkit-scrollbar]:hidden">
          {images.map((src, i) => (
            <div
              key={i}
              className="w-[70vw] shrink-0 snap-start overflow-hidden bg-muted sm:w-[42vw] lg:w-[23vw]"
            >
              <img
                src={src}
                alt={`${settings.store_name} community look ${i + 1}`}
                loading="lazy"
                className="aspect-[3/4] h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
};

export default SocialStrip;
