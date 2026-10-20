import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Section from "@/components/Section";
import SEO from "@/components/SEO";
import { Zap, Loader2, Sun, Moon } from "lucide-react";
import { useServicesStore } from "@/stores/servicesStore";
import ServiceCard2 from "@/components/ServiceCard2";
import PublicApiState from "@/components/PublicApiState";
import { getSiteSettingsCached } from "@/lib/siteSettings";

const Services = () => {
  const { services, loading, error, fetchServices, refreshServices } = useServicesStore();
  const [darkMode, setDarkMode] = useState(false);
  const [preselectedService, setPreselectedService] = useState<string>("");
  const [supportPhone, setSupportPhone] = useState("");
  const [settingsError, setSettingsError] = useState<Error | null>(null);

  // Fetch services on mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    let mounted = true;
    getSiteSettingsCached().then((settings) => {
      if (!mounted) return;
      setSupportPhone(settings.phone_number || "");
      setSettingsError(null);
    }).catch((caught) => {
      if (!mounted) return;
      setSupportPhone("");
      setSettingsError(caught instanceof Error ? caught : new Error("Failed to load site settings"));
    });
    return () => { mounted = false; };
  }, []);

  // Dark mode effect
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true' ||
      (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', String(!darkMode));
  };

  const handleBookService = (serviceTitle: string) => {
    setPreselectedService(serviceTitle);
    // Scroll to booking section or navigate to booking page
    window.location.href = `/booking?service=${encodeURIComponent(serviceTitle)}`;
  };

  return (
    <div className="services-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <SEO
        title="Electrical Services in Ujjain | Installation, Repair & Maintenance"
        description="Comprehensive electrical services including installation, repair, maintenance for residential, commercial and industrial properties. Emergency services available 24/7 with certified professionals."
        keywords="electrical services, electrical installation, electrical repair, wiring services, maintenance services, emergency electrician, panel upgrade, lighting installation, ceiling fan installation, electrical troubleshooting"
        canonical="/services"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Electrical Services",
          "provider": {
            "@type": "LocalBusiness",
            "name": "Electroo Buddy"
          },
          "areaServed": {
            "@type": "City",
            "name": "Ujjain"
          },
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Electrical Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Electrical Installation",
                  "description": "Professional electrical installation services for homes and businesses"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Electrical Repair",
                  "description": "Fast and reliable electrical repair services"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Maintenance Services",
                  "description": "Regular electrical maintenance to prevent issues"
                }
              }
            ]
          }
        }}
      />
      <style>{`

        .services-page {
          font-family: 'Poppins', sans-serif;
        }

        .services-page h1,
        .services-page h2,
        .services-page h3,
        .services-page h4,
        .services-page h5,
        .services-page h6 {
          font-weight: 700;
        }

        .services-hero {
          position: relative;
          padding: 112px 0 96px;
          overflow: hidden;
          text-align: center;
        }

        /* Service Cards Grid */
        .services-grid-section {
          padding: 80px 0;
          background: #f9fafb;
        }

        .dark .services-grid-section {
          background: #111827;
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

      <section className="hero-gradient text-white services-hero slide-up">
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
              <span className="font-semibold text-sm uppercase tracking-wide">Professional Electrical Solutions</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Our Services
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl max-w-3xl mx-auto opacity-90"
            >
              Professional electrical solutions for residential, commercial, and industrial needs with certified experts
            </motion.p>
          </motion.div>
        </div>
      </section>
      <Section>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : error ? (
          <PublicApiState error={error} onRetry={refreshServices} errorMessage="We could not load services from the API." />
        ) : services.length === 0 ? (
          <PublicApiState empty emptyMessage="No services are currently published." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 fade-in">
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <ServiceCard2 service={s} onBookNow={handleBookService} />
              </motion.div>
            ))}
          </div>
        )}
      </Section>

      {/* Emergency CTA Section */}
      <section className="py-20 bg-blue-600 text-white slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Emergency Service?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">Our 24/7 emergency service is always ready to help you with any electrical issues.</p>
          {settingsError ? (
            <div className="max-w-xl mx-auto"><PublicApiState compact error={settingsError} errorMessage="Emergency contact details could not be loaded." /></div>
          ) : supportPhone ? (
            <a href={`tel:${supportPhone}`} className="inline-flex items-center px-8 py-4 bg-white text-blue-800 font-semibold rounded-lg hover:bg-gray-100 transition duration-300">
              <Zap className="mr-2 h-5 w-5" /> Call Now: {supportPhone}
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Services;
