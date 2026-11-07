import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import collectionWomen from "@/assets/collection-women.jpg";
import collectionMen from "@/assets/collection-men.jpg";

const collections = [
  {
    title: "Women",
    subtitle: "Effortless Sophistication",
    image: collectionWomen,
    href: "/women",
  },
  {
    title: "Men",
    subtitle: "Modern Refinement",
    image: collectionMen,
    href: "/men",
  },
];

const CollectionsSection = () => {
  return (
    <section className="py-section bg-charcoal">
      <div className="luxury-container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-foreground text-xs mb-4 font-body">
            Explore
          </p>
          <h2 className="font-display text-display-md text-foreground">
            Collections
          </h2>
        </motion.div>

        {/* Collection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <Link
                to={collection.href}
                className="group relative block aspect-[4/3] overflow-hidden"
              >
                {/* Image */}
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover transition-transform duration-300 "
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <p className="text-white/70 text-xs mb-2 font-body">
                    {collection.subtitle}
                  </p>
                  <div className="flex items-end justify-between">
                    <h3 className="font-display text-display-sm text-foreground">
                      {collection.title}
                    </h3>
                    <div className="w-12 h-12 border border-primary flex items-center justify-center transition-colors duration-300 group-hover:bg-primary">
                      <ArrowUpRight className="w-5 h-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionsSection;
