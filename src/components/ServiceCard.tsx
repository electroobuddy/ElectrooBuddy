import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Phone, MessageCircle, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import * as LucideIcons from "lucide-react";

interface DbService {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  image_url?: string | null;
  whatsapp_enabled: boolean;
  call_enabled: boolean;
  book_now_enabled: boolean;
}

const ServiceCard = ({ service }: { service: DbService }) => {
  const { data: siteSettings = {} } = useSiteSettings();
  const settings = {
    whatsapp: siteSettings.whatsapp_number || "",
    phone: siteSettings.phone_number || "",
  };

  const Icon = (LucideIcons as any)[service.icon_name] || LucideIcons.Zap;
  const whatsappMsg = encodeURIComponent(
    `Hello Electroobuddy, I would like to book the service: ${service.title}. Please provide details.`
  );

  return (
    <>
      <style>{`
        500;600;700&display=swap');

        .service-card {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 32px 28px 28px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: default;
          font-family: 'Poppins', sans-serif;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }

        .dark .service-card {
          background: #1f2937;
          border-color: #374151;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        }

        .service-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          background: radial-gradient(ellipse at 20% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 100%, rgba(30, 58, 138, 0.06) 0%, transparent 60%);
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .service-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #3b82f6, transparent);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .service-card:hover {
          transform: translateY(-6px);
          border-color: #3b82f6;
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.1),
            0 20px 60px rgba(0, 0, 0, 0.1),
            0 0 40px rgba(59, 130, 246, 0.08);
        }

        .dark .service-card:hover {
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.2),
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 40px rgba(59, 130, 246, 0.15);
        }

        .service-card:hover::before { opacity: 1; }
        .service-card:hover::after { opacity: 1; }

        .card-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          border-radius: 20px;
          pointer-events: none;
          opacity: 0.4;
        }

        .card-bolt-bg {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 120px;
          height: 120px;
          opacity: 0.04;
          transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .service-card:hover .card-bolt-bg {
          opacity: 0.09;
          transform: rotate(10deg) scale(1.1);
        }

        .service-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
          border-radius: 12px;
          margin-bottom: 18px;
          border: 1px solid hsl(var(--border) / 0.2);
        }

        .icon-shell {
          position: relative;
          width: 60px;
          height: 60px;
          margin-bottom: 22px;
          flex-shrink: 0;
        }

        .icon-hex {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 58, 138, 0.05));
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          transition: all 0.5s ease;
          border-radius: 8px;
        }

        .service-card:hover .icon-hex {
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
        }

        .icon-inner {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .service-card:hover .icon-inner {
          transform: scale(1.1);
        }

        .icon-svg {
          width: 26px;
          height: 26px;
          color: #3b82f6;
          transition: color 0.4s ease;
        }

        .service-card:hover .icon-svg {
          color: #ffffff;
          filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.3));
        }

        .service-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #1e3a8a;
          margin-bottom: 10px;
          letter-spacing: 0.3px;
          line-height: 1.2;
        }

        .dark .service-title {
          color: #60a5fa;
        }

        .service-desc {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
          margin-bottom: 24px;
          flex: 1;
        }

        .dark .service-desc {
          color: #9ca3af;
        }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), transparent);
          margin-bottom: 18px;
        }

        .cta-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .cta-row-top {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          letter-spacing: 0.3px;
          text-decoration: none;
          transition: all 0.25s ease;
          border: 1px solid transparent;
          position: relative;
          overflow: hidden;
          flex: 1;
          min-width: 0;
        }

        .cta-wa {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border-color: rgba(34, 197, 94, 0.25);
        }
        .cta-wa:hover {
          background: rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.5);
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.2);
        }

        .cta-call {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.25);
        }
        .cta-call:hover {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
        }

        .cta-book {
          background: rgba(59, 130, 246, 0.12);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.25);
        }
        .cta-book:hover {
          background: rgba(59, 130, 246, 0.22);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.2);
        }
      `}</style>

      <div className="service-card">
        <div className="card-noise" />

        {/* Decorative bolt background */}
        <svg className="card-bolt-bg" viewBox="0 0 100 100" fill="none">
          <path d="M60 5L20 55h30L35 95l45-55H50L60 5z" fill="#ffc800" />
        </svg>

        {service.image_url ? (
          <img src={service.image_url} alt={service.title} className="service-image" />
        ) : (
          <div className="icon-shell">
            <div className="icon-hex" />
            <div className="icon-inner">
              <Icon className="icon-svg" />
            </div>
          </div>
        )}

        <div className="service-title">{service.title}</div>
        <p className="service-desc">{service.description}</p>

        <div className="divider" />

        <div className="cta-row">
          <div className="cta-row-top">
            {service.whatsapp_enabled && settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-btn cta-wa"
              >
                <MessageCircle size={13} /> WhatsApp
              </a>
            )}
            {service.call_enabled && settings.phone && (
              <a href={`tel:${settings.phone}`} className="cta-btn cta-call">
                <Phone size={13} /> Call Now
              </a>
            )}
          </div>
          {service.book_now_enabled && (
            <Link
              to={`/booking?service=${encodeURIComponent(service.title)}`}
              className="cta-btn cta-book"
            >
              <CalendarDays size={13} /> Book Now
            </Link>
          )}
        </div>
      </div>
    </>
  );
};

export default ServiceCard;