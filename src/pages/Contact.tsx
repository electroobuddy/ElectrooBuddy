import { cleanText } from "@/lib/security";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Section from "@/components/Section";
import SEO from "@/components/SEO";
import { submitNativeContact } from "@/lib/nativeAdminOperations";
import { Zap, Phone, Mail, MapPin, Send, Loader2, CheckCircle, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { getSiteSettingsCached } from "@/lib/siteSettings";
import PublicApiState from "@/components/PublicApiState";

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", service: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [siteSettings, setSiteSettings] = useState({ phone_number: "", email: "", address: "" });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<Error | null>(null);

  // Dark mode effect
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' || 
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);


  const fetchSiteSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const settings = await getSiteSettingsCached();
      setSiteSettings({
        phone_number: settings.phone_number || "",
        email: settings.email || "",
        address: settings.address || "",
      });
    } catch (caught) {
      setSiteSettings({ phone_number: "", email: "", address: "" });
      setSettingsError(caught instanceof Error ? caught : new Error("Failed to load site settings"));
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSiteSettings(); }, [fetchSiteSettings]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', String(!darkMode));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: cleanText(form.name, 100),
      phone: cleanText(form.phone, 25),
      email: cleanText(form.email, 254).toLowerCase(),
      service: cleanText(form.service, 120),
      message: cleanText(form.message, 2000),
    };
    if (payload.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
        !/^[+\d][\d\s()-]{6,24}$/.test(payload.phone) || payload.message.length < 5) {
      toast.error("Please enter a valid name, phone, email and message.");
      return;
    }
    setSubmitting(true);
    let requestKey = sessionStorage.getItem("contact_request_key");
    if (!requestKey) { requestKey = crypto.randomUUID(); sessionStorage.setItem("contact_request_key", requestKey); }
    try {
      await submitNativeContact({ requestKey, ...payload, service: payload.service || null });
      sessionStorage.removeItem("contact_request_key");
      setDone(true);
      toast.success("Message sent! We'll get back to you shortly.");
      setForm({ name: "", phone: "", email: "", service: "", message: "" });
    } catch { toast.error("Failed to send message. Please try again."); }
    setSubmitting(false);
  };

  const contactItems = [
    { icon: MapPin, label: "Address", value: siteSettings.address, href: undefined },
    { icon: Phone, label: "Phone", value: siteSettings.phone_number, href: siteSettings.phone_number ? `tel:${siteSettings.phone_number}` : undefined },
    { icon: Mail, label: "Email", value: siteSettings.email, href: siteSettings.email ? `mailto:${siteSettings.email}` : undefined },
  ].filter((item) => item.value);

  const inputFields = [
    { name: "name", label: "Full Name", type: "text", placeholder: "John Doe" },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 98765 43210" },
    { name: "email", label: "Email Address", type: "email", placeholder: "you@email.com" },
    { name: "service", label: "Service Required", type: "text", placeholder: "e.g. Wiring, Panel Install..." },
  ];

  return (
    <div className="contact-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <SEO
        title="Contact Electroo Buddy - Get in Touch for Electrical Services in Ujjain"
        description="Contact Electroo Buddy for professional electrical services, support, and service enquiries in Ujjain."
        keywords="contact electrician, electrical services contact, get quote, free consultation, emergency electrician contact, electrical repair contact"
        canonical="/contact"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "url": "https://electroobuddy.com/contact",
          "description": "Contact Electroo Buddy for professional electrical services",
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": siteSettings.phone_number || undefined,
            "email": siteSettings.email || undefined,
            "contactType": "customer service",
            "availableLanguage": ["English", "Hindi"]
          }
        }}
      />
      <style>{`
        400;500;600;700&display=swap');

        .contact-page {
          font-family: 'Poppins', sans-serif;
        }

        .contact-page h1,
        .contact-page h2,
        .contact-page h3,
        .contact-page h4,
        .contact-page h5,
        .contact-page h6 {
          font-weight: 700;
        }

        .contact-hero {
          position: relative;
          padding: 112px 0 96px;
          overflow: hidden;
          text-align: center;
        }

        /* Layout */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 40px;
        }

        @media (min-width: 1024px) {
          .contact-grid { grid-template-columns: 1fr 1fr; gap: 56px; }
        }

        /* Form Panel */
        .form-panel {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 44px 40px;
          overflow: hidden;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .dark .form-panel {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        @media (max-width: 640px) {
          .form-panel { padding: 28px 20px; }
        }

        .fp-corner-tl {
          position: absolute;
          top: 0; left: 0;
          width: 72px; height: 72px;
          border-top: 2px solid hsl(var(--primary) / 0.35);
          border-left: 2px solid hsl(var(--primary) / 0.35);
          border-radius: 24px 0 0 0;
          pointer-events: none;
        }

        .fp-corner-br {
          position: absolute;
          bottom: 0; right: 0;
          width: 72px; height: 72px;
          border-bottom: 2px solid hsl(var(--primary) / 0.12);
          border-right: 2px solid hsl(var(--primary) / 0.12);
          border-radius: 0 0 24px 0;
          pointer-events: none;
        }

        .fp-bolt {
          position: absolute;
          top: -16px; right: -8px;
          width: 120px; height: 120px;
          opacity: 0.03;
          pointer-events: none;
        }

        .panel-heading {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dark .panel-heading {
          color: #60a5fa;
        }

        .panel-heading::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent);
        }

        /* ─── FIELD ─── */
        .field-group { margin-bottom: 18px; }

        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 8px;
          font-family: 'Poppins', sans-serif;
        }

        .dark .field-label {
          color: #9ca3af;
        }

        .field-opt {
          color: hsl(var(--muted-foreground) / 0.3);
          font-weight: 400;
          text-transform: lowercase;
          letter-spacing: 0;
        }

        .field-input,
        .field-textarea {
          width: 100%;
          padding: 13px 16px;
          background: rgba(59, 130, 246, 0.025);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          color: #1e3a8a;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          outline: none;
          transition: all 0.25s ease;
          box-sizing: border-box;
        }

        .dark .field-input,
        .dark .field-textarea {
          background: rgba(59, 130, 246, 0.05);
          border-color: #374151;
          color: #60a5fa;
        }

        .field-input::placeholder,
        .field-textarea::placeholder { color: hsl(var(--muted-foreground) / 0.2); }

        .field-input:focus,
        .field-textarea:focus {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .dark .field-input:focus,
        .dark .field-textarea:focus {
          background: rgba(59, 130, 246, 0.1);
        }

        .field-textarea { resize: none; min-height: 110px; }

        /* ─── SUBMIT ─── */
        .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 36px;
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          box-shadow: 0 0 28px rgba(59, 130, 246, 0.4), 0 6px 20px rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }

        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─── SUCCESS ─── */
        .success-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 32px 0;
          gap: 14px;
        }

        .success-icon-ring {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          border: 2px solid rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          box-shadow: 0 0 28px rgba(59, 130, 246, 0.18);
          animation: popIn 0.45s cubic-bezier(0.23, 1, 0.32, 1);
        }

        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .success-title {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #1e3a8a;
        }

        .dark .success-title {
          color: #60a5fa;
        }

        .success-sub {
          font-size: 14px;
          color: #6b7280;
          max-width: 280px;
          line-height: 1.6;
          font-family: 'Poppins', sans-serif;
        }

        .dark .success-sub {
          color: #9ca3af;
        }

        .success-reset {
          padding: 9px 24px;
          border: 1px solid hsl(var(--primary) / 0.3);
          border-radius: 100px;
          background: hsl(var(--primary) / 0.05);
          color: hsl(var(--secondary));
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          font-family: 'DM Sans', sans-serif;
          margin-top: 6px;
        }

        .success-reset:hover {
          background: hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.55);
        }

        /* ─── INFO PANEL ─── */
        .info-panel { display: flex; flex-direction: column; gap: 16px; }

        .info-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 22px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          transition: all 0.3s ease;
          font-family: 'Poppins', sans-serif;
          text-decoration: none;
        }

        .dark .info-card {
          background: #1f2937;
          border-color: #374151;
        }

        .info-card:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.03);
          transform: translateX(4px);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
        }

        .dark .info-card:hover {
          background: rgba(59, 130, 246, 0.05);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
        }

        .info-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.08);
          border: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .dark .info-icon-box {
          border-color: #374151;
        }

        .info-card:hover .info-icon-box {
          background: hsl(var(--primary) / 0.15);
          box-shadow: 0 0 14px hsl(var(--primary) / 0.2);
        }

        .info-label {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #3b82f6;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          line-height: 1.4;
        }

        .dark .info-value {
          color: #9ca3af;
        }
      `}</style>

      {/* Dark Mode Toggle Button */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-24 right-4 z-50 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-6 h-6 text-yellow-500" />
        ) : (
          <Moon className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Hero */}
      {/* HERO */}
      <section className="hero-gradient text-white contact-hero slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
            >
              <Zap className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">Get In Touch</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Contact Us
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl max-w-3xl mx-auto opacity-90"
            >
              We'd love to hear from you — reach out any time
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Section>
        <div className="contact-grid">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="form-panel">
              <div className="fp-corner-tl" />
              <div className="fp-corner-br" />
              <div className="panel-heading">Send a Message</div>

              {done ? (
                <div className="success-box">
                  <div className="success-icon-ring"><CheckCircle size={30} /></div>
                  <div className="success-title">Message Sent!</div>
                  <p className="success-sub">Thanks for reaching out. We'll get back to you very shortly.</p>
                  <button className="success-reset" onClick={() => setDone(false)}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {inputFields.map((f) => (
                    <div className="field-group" key={f.name}>
                      <label className="field-label">
                        {f.label}
                        {f.name === "service" && <span className="field-opt"> (optional)</span>}
                      </label>
                      <input
                        type={f.type}
                        required={f.name !== "service"}
                        placeholder={f.placeholder}
                        className="field-input"
                        value={(form as any)[f.name]}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      />
                    </div>
                  ))}

                  <div className="field-group">
                    <label className="field-label">Message</label>
                    <textarea
                      required
                      placeholder="Tell us how we can help..."
                      className="field-textarea"
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                    {submitting ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="panel-heading" style={{ fontFamily: "'Poppins',sans-serif", fontSize: 24, fontWeight: 700, color: "#1e3a8a", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
              Contact Details
              <span style={{ flex: 1, height: 1, background: "linear-gradient(90deg, rgba(59, 130, 246, 0.3), transparent)", display: "block" }} />
            </div>

            <div className="info-panel">
              {contactItems.map((c) => {
                const Wrapper = c.href ? "a" : "div";
                return (
                  <Wrapper
                    key={c.label}
                    className="info-card"
                    {...(c.href ? { href: c.href } : {})}
                  >
                    <div className="info-icon-box">
                      <c.icon size={18} />
                    </div>
                    <div>
                      <div className="info-label">{c.label}</div>
                      <div className="info-value">{c.value}</div>
                    </div>
                  </Wrapper>
                );
              })}
            </div>

            <div className="map-wrap" style={{ marginTop: 28 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d241317.11609823277!2d72.74109995709657!3d19.08219783958221!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da4ed8f8d648c69!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1600000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(0.85) contrast(0.9)" }}
                allowFullScreen
                loading="lazy"
                title="Office Location"
              />
            </div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
};

export default Contact;