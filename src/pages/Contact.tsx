import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useToast } from "@/hooks/use-toast";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import ScrollReveal from "@/components/ScrollReveal";

const Contact = () => {
  const { toast } = useToast();
  const { settings } = useStoreSettings();
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({
      title: "Message sent",
      description: "Thank you for contacting us. We'll respond within 24 hours.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
    setSending(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-36 pb-16 bg-background">
        <div className="luxury-container">
          <ScrollReveal className="text-center max-w-3xl mx-auto">
            <p className="text-foreground text-xs mb-4 font-body">
              Get in Touch
            </p>
            <h1 className="font-display text-display-lg text-foreground mb-6">
              Contact Us
            </h1>
            <p className="text-muted-foreground font-body leading-relaxed">
              We're here to assist you with any questions about our products, 
              orders, or services. Our dedicated team is committed to providing 
              you with exceptional support.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="line-elegant" />

      <section className="py-20 bg-background">
        <div className="luxury-container">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <ScrollReveal direction="left" className="lg:col-span-1 space-y-8">
              <div>
                <h2 className="font-display text-2xl text-foreground mb-6">
                  Contact Information
                </h2>
                <p className="text-muted-foreground font-body leading-relaxed">
                  Reach out to us through any of the following channels.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { icon: MapPin, label: "Address", value: settings.store_address },
                  { icon: Phone, label: "Phone", value: settings.store_phone },
                  { icon: Mail, label: "Email", value: settings.store_email },
                  { icon: Clock, label: "Hours", value: "Mon - Sat: 10:00 - 20:00\nSunday: 12:00 - 18:00" },
                ].map((item, idx) => (
                  <ScrollReveal key={item.label} delay={idx * 0.1} direction="left">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-charcoal flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="font-body text-sm text-foreground mb-1">{item.label}</h3>
                        <p className="text-foreground font-body whitespace-pre-line">{item.value}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>

            {/* Contact Form */}
            <ScrollReveal direction="right" delay={0.2} className="lg:col-span-2">
              <div className="bg-card border border-border p-8 md:p-12">
                <h2 className="font-display text-2xl text-foreground mb-8">
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2 font-body">Your Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-2 font-body">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2 font-body">Subject</label>
                    <select name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary">
                      <option value="">Select a subject</option>
                      <option value="order">Order Inquiry</option>
                      <option value="product">Product Question</option>
                      <option value="return">Returns & Exchanges</option>
                      <option value="styling">Personal Styling</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2 font-body">Message</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} required rows={6} className="w-full px-4 py-3 bg-background border border-border text-foreground font-body focus:outline-none focus:border-primary resize-none" placeholder="How can we help you?" />
                  </div>
                  <button type="submit" disabled={sending} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-16 bg-charcoal border-t border-border">
        <div className="luxury-container text-center">
          <ScrollReveal>
            <h2 className="font-display text-2xl text-foreground mb-4">Looking for Quick Answers?</h2>
            <p className="text-muted-foreground font-body mb-6">Check our frequently asked questions for instant help.</p>
            <a href="/faq" className="btn-luxury inline-block"><span>View FAQ</span></a>
          </ScrollReveal>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
