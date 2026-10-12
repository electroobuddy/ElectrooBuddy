import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getSiteSettingsCached } from "@/lib/siteSettings";
import * as LucideIcons from "lucide-react";
import clsx from "clsx";

interface DbService {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
  whatsapp_enabled?: boolean;
  call_enabled?: boolean;
  book_now_enabled?: boolean;
  service_charge?: number | string | null;
  show_visit_charge?: boolean;
  visit_charge_label?: string;
}

interface ServiceCard2Props {
  service: DbService;
  onBookNow?: (title: string) => void;
}

const ServiceCard2 = ({ service, onBookNow }: ServiceCard2Props) => {
  const [contact, setContact] = useState({ phone: "", whatsapp: "" });

  useEffect(() => {
    let mounted = true;
    getSiteSettingsCached().then((settings) => {
      if (!mounted) return;
      setContact({ phone: settings.phone_number || "", whatsapp: settings.whatsapp_number || settings.phone_number || "" });
    }).catch(() => {
      if (mounted) setContact({ phone: "", whatsapp: "" });
    });
    return () => { mounted = false; };
  }, []);
  const {
    title,
    description,
    icon_name,
    service_charge,
    show_visit_charge,
    visit_charge_label,
  } = service;

  const Icon =
    icon_name && (LucideIcons as any)[icon_name]
      ? (LucideIcons as any)[icon_name]
      : LucideIcons.Zap;

  const showCharge = show_visit_charge && service_charge;
  const chargeAmount = showCharge ? Number(service_charge) : null;

  return (
    <div
      className={clsx(
        "flex flex-col justify-between h-full",
        "bg-white dark:bg-gray-800",
        "rounded-xl border border-gray-200 dark:border-gray-700",
        "p-5 transition hover:shadow-lg"
      )}
    >
      {/* TOP */}
      <div>
        {/* Icon + Title */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Left: Icon + Title */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="bg-blue-100 dark:bg-blue-900 p-2.5 rounded-lg flex-shrink-0">
              <Icon className="text-blue-600 dark:text-blue-400 w-5 h-5" />
            </div>

            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
              {title}
            </h3>
          </div>

          {showCharge && (
  <div className="flex-shrink-0">
    <div className="flex flex-col items-center text-center px-2.5 py-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 whitespace-nowrap">
      
      {/* Label */}
      <span className="text-[10px] sm:text-xs font-medium leading-none opacity-80">
        {visit_charge_label || "Visit"}
      </span>

      {/* Price */}
      <span className="text-xs sm:text-sm font-bold leading-tight">
        ₹{chargeAmount}
      </span>
    </div>
  </div>
)}
        </div>

        {/* Description (fixed height feel) */}
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 min-h-[60px]">
          {description}
        </p>
       
      </div>

      {/* ACTIONS */}
      <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
        {service.book_now_enabled !== false && (
          <button
            onClick={() => onBookNow?.(title)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center"
          >
            Book Now <ChevronRight size={16} />
          </button>
        )}

        {service.whatsapp_enabled !== false && contact.whatsapp && (
          <a
            href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=Hi, I'm interested in ${title}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center"
          >
            WhatsApp <ChevronRight size={16} />
          </a>
        )}

        {service.call_enabled !== false && contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 inline-flex items-center"
          >
            Call <ChevronRight size={16} />
          </a>
        )}
      </div>
    </div>
  );
};

export default ServiceCard2;