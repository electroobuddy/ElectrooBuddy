
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/Section";
import { Zap, ChevronDown } from "lucide-react";
import { useState } from "react";

// const faqs = [
//   { q: "What areas do you serve?", a: "We currently serve all major cities and surrounding areas. Contact us to check if we cover your location." },
//   { q: "Are your electricians licensed?", a: "Yes, all our electricians are fully licensed, insured, and certified with years of professional experience." },
//   { q: "Do you offer emergency services?", a: "Absolutely! We provide 24/7 emergency electrical services. Call us anytime and we'll be there as soon as possible." },
//   { q: "How much do your services cost?", a: "Our pricing varies based on the service type and complexity. We provide transparent quotes before starting any work with no hidden fees." },
//   { q: "Do you provide warranties?", a: "Yes, we offer warranties on all our work. The duration depends on the type of service performed." },
//   { q: "How do I book a service?", a: "You can book through our website using the Book Now button, call us directly, or send us a WhatsApp message." },
// ];

  const faqs = [
  {
    question: 'How quickly can you respond to service requests?',
    answer: 'Our average response time is 45 minutes within Ujjain city. For emergency services, we aim to arrive within 30 minutes.'
  },
  {
    question: 'Do you provide late night or emergency services?',
    answer: 'Yes, we offer both emergency and late night services to handle urgent electrical issues anytime you need.'
  },
  {
    question: 'Are there extra charges for emergency or night services?',
    answer: 'Yes, emergency service charges are ₹350 and late night service charges are ₹500. These are fixed additional fees and will be clearly shown before booking.'
  },
  {
    question: 'What are your service charges?',
    answer: 'We charge a standard diagnostic fee of ₹400 which is waived if you proceed with the repair. Our technicians provide a transparent cost estimate before starting any work.'
  },
  {
    question: 'Do you offer warranties on repairs?',
    answer: 'Yes, we offer a 90-day warranty on all repairs and a 1-year warranty on parts we install.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept cash, UPI payments (PhonePe, Google Pay, Paytm), and credit/debit cards.'
  },
  {
    question: 'Can I schedule a service for a specific time?',
    answer: 'Yes, you can book services in advance and choose a preferred time slot based on availability.'
  },
  {
    question: 'Do you provide same-day service?',
    answer: 'Yes, we offer same-day service for most requests depending on technician availability in your area.'
  },
  {
    question: 'What areas do you currently serve?',
    answer: 'We currently serve Ujjain city and nearby areas. Expansion to more cities is coming soon.'
  },
  {
    question: 'Do you service appliances still under manufacturer warranty?',
    answer: 'We recommend first contacting the manufacturer for appliances under warranty, as unauthorized repairs may void it. However, we can assist with diagnostics.'
  },
  {
    question: 'Is it safe to book services online?',
    answer: 'Yes, our platform is secure and all technicians are verified professionals with proper background checks.'
  },
  {
    question: 'What if I am not satisfied with the service?',
    answer: 'Customer satisfaction is our priority. You can contact our support team and we will resolve your issue or arrange a revisit if needed.'
  }
];

const FAQ = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="faq-page bg-gray-50 dark:bg-gray-900 min-h-screen">
      <style>{`

        .faq-page {
          font-family: 'Poppins', sans-serif;
        }

        .faq-page h1,
        .faq-page h2,
        .faq-page h3,
        .faq-page h4,
        .faq-page h5,
        .faq-page h6 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
        }

        .faq-hero {
          position: relative;
          padding: 112px 0 96px;
          overflow: hidden;
          text-align: center;
        }

        /* FAQ accordion */
        .faq-wrap {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-item {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border) / 0.3);
          border-radius: 16px;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          font-family: 'DM Sans', sans-serif;
        }

        .faq-item.open {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 28px hsl(var(--primary) / 0.05), -3px 0 0 hsl(var(--primary) / 0.5);
        }

        .faq-trigger {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          outline: none;
        }

        .faq-trigger:hover .faq-q {
          color: hsl(var(--secondary));
        }

        .faq-num {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--primary) / 0.4);
          letter-spacing: 0.5px;
          flex-shrink: 0;
          min-width: 28px;
        }

        .faq-item.open .faq-num { color: hsl(var(--secondary)); }

        .faq-q {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: hsl(var(--foreground));
          letter-spacing: 0.2px;
          flex: 1;
          transition: color 0.25s;
          line-height: 1.4;
        }

        .faq-item.open .faq-q { color: hsl(var(--secondary)); }

        .faq-chevron {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid hsl(var(--border) / 0.3);
          background: hsl(var(--primary) / 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary) / 0.5);
          transition: all 0.35s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .faq-item.open .faq-chevron {
          background: hsl(var(--primary) / 0.12);
          border-color: hsl(var(--primary) / 0.4);
          color: hsl(var(--secondary));
          transform: rotate(180deg);
          box-shadow: 0 0 10px hsl(var(--primary) / 0.15);
        }

        .faq-divider {
          height: 1px;
          background: linear-gradient(90deg, hsl(var(--border) / 0.2), transparent);
          margin: 0 24px;
        }

        .faq-answer {
          padding: 18px 24px 22px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: hsl(var(--muted-foreground) / 0.6);
          line-height: 1.75;
        }

        .faq-answer-inner {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .faq-answer-bolt {
          flex-shrink: 0;
          margin-top: 3px;
          color: hsl(var(--primary) / 0.4);
        }
      `}</style>

      {/* Hero */}
      {/* Hero */}
      <section className="hero-gradient text-white faq-hero slide-up">
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
              <span className="font-semibold text-sm uppercase tracking-wide">FAQ</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Frequently Asked Questions
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl max-w-3xl mx-auto opacity-90"
            >
              Answers to the things people ask us most
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Section>
        <div className="faq-wrap">
          {faqs.map((f, i) => (
            <motion.div
              key={i}
              className={`faq-item ${openIdx === i ? "open" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
            >
              <button
                className="faq-trigger"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                aria-expanded={openIdx === i}
              >
                <span className="faq-num">0{i + 1}</span>
                <span className="faq-q">{f.question}</span>
                <span className="faq-chevron">
                  <ChevronDown size={15} />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openIdx === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="faq-divider" />
                    <div className="faq-answer">
                      <div className="faq-answer-inner">
                        <Zap size={14} className="faq-answer-bolt" />
                        <span>{f.answer}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default FAQ;