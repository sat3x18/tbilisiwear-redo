import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Terms = () => {
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
              Terms & Conditions
            </h1>
            <p className="text-muted-foreground font-body text-center mb-12">
              Last updated: January 2026
            </p>

            <div className="prose prose-invert max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    Welcome to {settings.store_name}. These Terms and Conditions govern your use of our website 
                    and services. By accessing or using our website, you agree to be bound by these terms. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">2. Products and Pricing</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    All products displayed on our website are subject to availability. We reserve the 
                    right to discontinue any product at any time. Prices are displayed in Georgian Lari (₾) and are 
                    subject to change without notice.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    We make every effort to display accurate product images and descriptions. However, 
                    slight variations in color may occur due to screen settings. All products are guaranteed 
                    to be 100% authentic.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">3. Orders and Payment</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    When you place an order, you are making an offer to purchase the product. We reserve 
                    the right to accept or decline your order. Payment must be made at the time of order.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    We accept major credit cards, debit cards, and other payment methods as displayed 
                    at checkout. All transactions are processed securely.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">4. Shipping and Delivery</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    Delivery times are estimates and may vary. We are not responsible for delays caused 
                    by shipping carriers, customs, or other factors beyond our control.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    Risk of loss and title for items pass to you upon delivery. You are responsible for 
                    inspecting items upon receipt and reporting any damage or discrepancies immediately.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">5. Returns and Refunds</h2>
                  <p className="text-muted-foreground font-body leading-relaxed mb-4">
                    We accept returns within 14 days of delivery for items in original, unworn condition 
                    with all tags attached. Items must be returned in their original packaging.
                  </p>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    Refunds will be processed to the original payment method within 5-7 business days 
                    after we receive and inspect the returned item. Shipping costs are non-refundable.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">6. Intellectual Property</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    All content on this website, including text, images, logos, and graphics, is the 
                    property of {settings.store_name} or its content suppliers and is protected by copyright laws. 
                    You may not reproduce, distribute, or use any content without our written permission.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">7. User Accounts</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials 
                    and for all activities that occur under your account. You must notify us immediately 
                    of any unauthorized use of your account.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">8. Limitation of Liability</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    To the fullest extent permitted by law, {settings.store_name} shall not be liable for any 
                    indirect, incidental, special, or consequential damages arising from your use of 
                    our website or products.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">9. Governing Law</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    These terms shall be governed by and construed in accordance with the laws of Georgia. 
                    Any disputes shall be subject to the exclusive jurisdiction of the courts of Tbilisi.
                  </p>
                </section>

                <section>
                  <h2 className="font-display text-xl text-foreground mb-4">10. Contact Information</h2>
                  <p className="text-muted-foreground font-body leading-relaxed">
                    For questions about these terms, please contact us at:<br />
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

export default Terms;
