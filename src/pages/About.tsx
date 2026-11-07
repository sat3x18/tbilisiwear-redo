import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const About = () => {
  const { settings } = useStoreSettings();

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-36 pb-20 bg-background">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <p className="text-foreground text-xs mb-4 font-body">
              Our Story
            </p>
            <h1 className="font-display text-display-lg text-foreground mb-8">
              About {settings.store_name}
            </h1>
            <p className="text-xl text-muted-foreground font-body leading-relaxed">
              Where Georgian heritage meets contemporary luxury. 
              We curate the finest fashion from world-renowned designers, 
              bringing exceptional style to the heart of Tbilisi.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="line-elegant" />

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="luxury-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
                Our Vision
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                Founded in the vibrant capital of Georgia, {settings.store_name} was born from 
                a passion for exceptional fashion and a desire to bring world-class 
                luxury to our beloved city. We believe that true style transcends borders, 
                and that every individual deserves access to the finest clothing and 
                accessories the world has to offer.
              </p>
              <p className="text-muted-foreground font-body leading-relaxed">
                Our carefully curated collection features pieces from the most prestigious 
                fashion houses—from the avant-garde designs of Maison Margiela to the 
                timeless elegance of Louis Vuitton. Each item is selected with an 
                unwavering commitment to quality, craftsmanship, and enduring style.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-[4/5] bg-charcoal"
            >
              <div className="w-full h-full flex items-center justify-center border border-border">
                <span className="font-display text-2xl text-muted-foreground">{settings.store_name}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-charcoal">
        <div className="luxury-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground">
              Our Values
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Authenticity",
                description: "Every piece in our collection is 100% authentic, sourced directly from authorized distributors and brand partners. We guarantee the provenance of each item."
              },
              {
                title: "Curation",
                description: "Our buyers travel the world to select only the most exceptional pieces. We don't follow trends—we seek out timeless designs that transcend seasons."
              },
              {
                title: "Service",
                description: "From personalized styling consultations to white-glove delivery, we provide an unparalleled shopping experience worthy of the luxury brands we represent."
              }
            ].map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-background/50 border border-border p-8"
              >
                <h3 className="font-display text-xl text-foreground mb-4">{value.title}</h3>
                <p className="text-muted-foreground font-body leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-20 bg-background">
        <div className="luxury-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="aspect-video bg-charcoal border border-border flex items-center justify-center"
            >
              <span className="text-muted-foreground font-body">Store Location Map</span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
                Visit Our Boutique
              </h2>
              <p className="text-muted-foreground font-body leading-relaxed mb-6">
                Experience {settings.store_name} in person at our flagship boutique in the heart 
                of Tbilisi. Our knowledgeable staff is ready to guide you through our 
                collection and help you discover your perfect pieces.
              </p>
              <div className="space-y-4 mb-8">
                <div>
                  <h4 className="font-body text-sm text-foreground mb-1">Address</h4>
                  <p className="text-foreground font-body">{settings.store_address}</p>
                </div>
                <div>
                  <h4 className="font-body text-sm text-foreground mb-1">Hours</h4>
                  <p className="text-foreground font-body">Monday - Saturday: 10:00 - 20:00<br />Sunday: 12:00 - 18:00</p>
                </div>
              </div>
              <Link to="/contact" className="btn-luxury inline-block">
                <span>Get Directions</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-charcoal border-t border-border">
        <div className="luxury-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl text-foreground mb-6">
              Begin Your Journey
            </h2>
            <p className="text-muted-foreground font-body mb-8 max-w-2xl mx-auto">
              Discover our curated collection of luxury fashion and find pieces 
              that speak to your individual style.
            </p>
            <Link to="/shop" className="btn-gold inline-block">
              Explore Collection
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
