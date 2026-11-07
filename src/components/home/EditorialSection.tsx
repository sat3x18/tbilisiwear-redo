import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const EditorialSection = () => {
  return (
    <section className="py-section-lg bg-charcoal overflow-hidden">
      <div className="luxury-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-foreground text-xs mb-6 font-body">
              The Journal
            </p>
            <h2 className="font-display text-display-lg text-foreground mb-6">
              Beyond Fashion,
              <br />
              A Lifestyle
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-8 max-w-md">
              Explore the intersection of luxury fashion and contemporary culture. 
              From designer interviews to styling guides, discover stories that 
              inspire and inform your sartorial journey.
            </p>
            <Link to="/journal" className="btn-luxury group inline-flex">
              <span className="flex items-center gap-3">
                Read the Journal
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>

          {/* Editorial Preview Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {[
              {
                title: "The Art of Quiet Luxury",
                category: "Style",
                date: "January 2025",
              },
              {
                title: "Maison Margiela: Deconstructing Fashion",
                category: "Designer Spotlight",
                date: "December 2024",
              },
              {
                title: "Investment Pieces for 2025",
                category: "Guide",
                date: "December 2024",
              },
            ].map((article, index) => (
              <Link
                key={article.title}
                to="/journal"
                className="block p-6 border border-border bg-background/50 hover:bg-background transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-muted-foreground text-xs mb-2 font-body">
                      {article.category} • {article.date}
                    </p>
                    <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-[opacity,transform,color,background-color] group-hover:translate-x-1 flex-shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;
