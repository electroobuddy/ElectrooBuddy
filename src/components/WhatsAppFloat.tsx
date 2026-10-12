import { MessageCircle, Phone, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { getSiteSettingsCached } from "@/lib/siteSettings";
import { motion, AnimatePresence } from "framer-motion";

interface WhatsAppFloatProps {
  backToTopVisible?: boolean;
  onBackToTopClick?: () => void;
}

const WhatsAppFloat = ({ backToTopVisible = false, onBackToTopClick }: WhatsAppFloatProps) => {
  const [contact, setContact] = useState({ phone: "", whatsapp: "" });
  const whatsappMsg = encodeURIComponent("Hello Electroobuddy, I need electrical services. Please provide details.");

  useEffect(() => {
    let mounted = true;
    getSiteSettingsCached()
      .then((settings) => {
        if (!mounted) return;
        setContact({
          phone: settings.phone_number || "",
          whatsapp: settings.whatsapp_number || settings.phone_number || "",
        });
      })
      .catch(() => {
        if (mounted) setContact({ phone: "", whatsapp: "" });
      });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {backToTopVisible && (
          <motion.button
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            onClick={onBackToTopClick}
            className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all duration-300"
            aria-label="Back to top"
          >
            <ChevronUp className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      {contact.phone && (
        <motion.a
          href={`tel:${contact.phone}`}
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center shadow-lg shadow-green-600/30 hover:bg-green-700 transition-all duration-300"
          aria-label="Call us"
        >
          <Phone className="w-7 h-7" />
        </motion.a>
      )}

      {contact.whatsapp && (
        <motion.a
          href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}?text=${whatsappMsg}`}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all duration-300 relative"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
        </motion.a>
      )}
    </div>
  );
};

export default WhatsAppFloat;
