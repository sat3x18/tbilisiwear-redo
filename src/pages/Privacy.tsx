import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Privacy = () => {
  const { settings } = useStoreSettings();

  return (
    <Layout>
      <section className="pt-36 pb-20 bg-background">
        <div className="luxury-container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-display-lg text-foreground mb-8 text-center">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground font-body text-center mb-12">
              Last updated: January 2026
            </p>

            <div className="prose prose-invert max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    {settings.store_name} ("we", "us", or "our") is committed to protecting your privacy. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your 
                    information when you visit our website or make a purchase.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">2. Information We Collect</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    <strong className="text-foreground">Personal Information:</strong> When you create an account, make a purchase, 
                    or contact us, we may collect your name, email address, phone number, shipping address, 
                    and payment information.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    <strong className="text-foreground">Automatic Information:</strong> We automatically collect certain information 
                    when you visit our website, including your IP address, browser type, operating system, 
                    referring URLs, and browsing behavior.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    <strong className="text-foreground">Cookies:</strong> We use cookies and similar technologies to enhance your 
                    experience, analyze trends, and administer the website.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">3. How We Use Your Information</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    We use your information to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground font-body space-y-2">
                    <li>Process and fulfill your orders</li>
                    <li>Communicate with you about your orders and account</li>
                    <li>Send promotional emails and newsletters (with your consent)</li>
                    <li>Improve our website and services</li>
                    <li>Detect and prevent fraud</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">4. Information Sharing</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information with:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground font-body space-y-2">
                    <li>Service providers who assist with order fulfillment, payment processing, and shipping</li>
                    <li>Analytics providers to help us understand website usage</li>
                    <li>Law enforcement when required by law</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">5. Data Security</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    We implement industry-standard security measures to protect your information, 
                    including SSL encryption, secure payment processing, and regular security audits. 
                    However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">6. Your Rights</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    Depending on your location, you may have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground font-body space-y-2">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your personal information</li>
                    <li>Opt out of marketing communications</li>
                    <li>Data portability</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">7. Cookies Policy</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    We use essential cookies for website functionality, analytics cookies to understand 
                    how visitors use our site, and marketing cookies for personalized advertising. 
                    You can manage cookie preferences through your browser settings.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">8. Third-Party Links</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    Our website may contain links to third-party websites. We are not responsible for 
                    the privacy practices of these websites. We encourage you to read the privacy 
                    policies of any third-party sites you visit.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">9. Children's Privacy</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    Our website is not intended for children under 16. We do not knowingly collect 
                    personal information from children. If you believe we have collected information 
                    from a child, please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">10. Changes to This Policy</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any 
                    changes by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">11. Contact Us</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    If you have questions about this Privacy Policy, please contact us at:<br />
                    Email: {settings.store_email}<br />
                    Address: {settings.store_address}
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
