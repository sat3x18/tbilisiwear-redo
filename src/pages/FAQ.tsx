import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ScrollReveal from "@/components/ScrollReveal";

const faqData = [
  {
    category: "Orders & Shipping",
    questions: [
      { q: "How long does shipping take?", a: "Standard shipping within Georgia takes 2-3 business days. International shipping typically takes 5-10 business days depending on your location. Express shipping options are available at checkout." },
      { q: "Do you offer free shipping?", a: "Yes! We offer complimentary shipping on all orders over €500. Orders under €500 incur a flat shipping fee of €15 for domestic delivery." },
      { q: "Can I track my order?", a: "Absolutely. Once your order ships, you'll receive an email with tracking information. You can also track your order status in your account dashboard." },
      { q: "Do you ship internationally?", a: "Yes, we ship to most countries worldwide. International shipping costs and delivery times vary by destination and are calculated at checkout." }
    ]
  },
  {
    category: "Returns & Exchanges",
    questions: [
      { q: "What is your return policy?", a: "We accept returns within 14 days of delivery for items in original, unworn condition with all tags attached. Items must be in their original packaging." },
      { q: "How do I initiate a return?", a: "To start a return, log into your account, navigate to your order history, and select 'Return Item'. You'll receive a prepaid return label via email." },
      { q: "When will I receive my refund?", a: "Once we receive and inspect your return, refunds are processed within 5-7 business days. The refund will be credited to your original payment method." },
      { q: "Can I exchange an item for a different size?", a: "Yes, exchanges are available for different sizes subject to availability. Contact our customer service team to arrange an exchange." }
    ]
  },
  {
    category: "Products & Authenticity",
    questions: [
      { q: "Are all products authentic?", a: "100% guaranteed. Every item we sell is authentic and sourced directly from authorized distributors and brand partners. We stand behind the authenticity of every piece." },
      { q: "How do I find my size?", a: "Each product page includes a size guide with detailed measurements. If you're unsure, our styling team is available to help you find your perfect fit." },
      { q: "Do you offer price matching?", a: "We are confident in our competitive pricing. If you find the same authentic item at a lower price from an authorized retailer, please contact us." }
    ]
  },
  {
    category: "Payment & Security",
    questions: [
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, Apple Pay, Google Pay, and bank transfers. All payments are processed securely." },
      { q: "Is my payment information secure?", a: "Yes, we use industry-standard SSL encryption and PCI-compliant payment processing to ensure your information is always protected." },
      { q: "Do you offer installment payments?", a: "Yes, we partner with Klarna to offer 'Pay in 4' interest-free installments on eligible purchases." }
    ]
  },
  {
    category: "Account & Services",
    questions: [
      { q: "Do I need an account to shop?", a: "While you can checkout as a guest, creating an account allows you to track orders, save items to your wishlist, and enjoy a faster checkout experience." },
      { q: "Do you offer personal styling services?", a: "Yes! Our complimentary personal styling service is available by appointment. Contact us to schedule a consultation with one of our expert stylists." },
      { q: "How do I subscribe to your newsletter?", a: "Enter your email in the footer subscription form or during account creation. Subscribers receive early access to sales and exclusive offers." }
    ]
  }
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-36 pb-16 bg-background">
        <div className="luxury-container">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <p className="text-foreground text-xs mb-4 font-body">Help Center</p>
            <h1 className="font-display text-display-lg text-foreground mb-6">Frequently Asked Questions</h1>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Find answers to common questions about our products, orders, and services.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search questions..." className="w-full pl-12 pr-4 py-3 bg-card border border-border text-foreground font-body focus:outline-none focus:border-primary" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="line-elegant" />

      {/* FAQ Content */}
      <section className="py-20 bg-background">
        <div className="luxury-container max-w-4xl">
          {filteredFAQ.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-body text-lg mb-4">No results found for "{searchQuery}"</p>
              <button onClick={() => setSearchQuery("")} className="text-primary hover:text-foreground transition-colors">Clear search</button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFAQ.map((category, categoryIndex) => (
                <ScrollReveal key={category.category} delay={categoryIndex * 0.1}>
                  <h2 className="font-display text-2xl text-foreground mb-6">{category.category}</h2>
                  <div className="space-y-0 border-t border-border">
                    {category.questions.map((item, index) => {
                      const itemId = `${category.category}-${index}`;
                      const isOpen = openItems.includes(itemId);
                      return (
                        <div key={index} className="border-b border-border">
                          <button onClick={() => toggleItem(itemId)} className="w-full flex items-center justify-between py-5 text-left group">
                            <span className="font-body text-foreground group-hover:text-primary transition-colors pr-8">{item.q}</span>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                <p className="pb-5 text-muted-foreground font-body leading-relaxed">{item.a}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-charcoal border-t border-border">
        <div className="luxury-container text-center">
          <ScrollReveal>
            <h2 className="font-display text-2xl text-foreground mb-4">Still Have Questions?</h2>
            <p className="text-muted-foreground font-body mb-6">Our customer service team is here to help.</p>
            <Link to="/contact" className="btn-gold inline-block">Contact Us</Link>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default FAQ;
