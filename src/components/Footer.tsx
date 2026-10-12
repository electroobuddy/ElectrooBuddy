import { sanitizeExternalUrl } from "@/lib/security";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ArrowRight, Instagram, Linkedin, Facebook, Twitter, Youtube } from "lucide-react";
import { motion } from "framer-motion";
import { getSiteSettingsCached } from "@/lib/siteSettings";
import favicon from "/favicon.png";
import PublicApiState from "@/components/PublicApiState";

interface FooterLink {
  label: string;
  to: string;
}

interface FooterSettings {
  phone_number: string;
  email: string;
  address: string;
  instagram: string;
  linkedin: string;
  facebook: string;
  twitter: string;
  youtube: string;
  quick_links: FooterLink[];
  service_links: string[];
  copyright_text: string;
  privacy_policy_url: string;
  terms_url: string;
}

const emptySettings: FooterSettings = {
  phone_number: "",
  email: "",
  address: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  twitter: "",
  youtube: "",
  quick_links: [],
  service_links: [],
  copyright_text: "",
  privacy_policy_url: "",
  terms_url: "",
};

const BlinkingEye = () => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const schedule = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
      setTimeout(() => setBlink(true), 420);
      setTimeout(() => setBlink(false), 540);
      const next = 3000 + Math.random() * 2000;
      setTimeout(schedule, next + 540);
    };
    const initial = setTimeout(schedule, 1500);
    return () => clearTimeout(initial);
  }, []);

  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        width: "0.72em",
        height: "0.72em",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "#3b82f6",
          boxShadow: "0 0 6px rgba(59, 130, 246, 0.6)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: "42%",
            height: "42%",
            borderRadius: "50%",
            background: "#ffffff",
            boxShadow: "inset 0 0 2px rgba(0,0,0,0.4)",
            flexShrink: 0,
            transition: "transform 0.15s ease",
            transform: blink ? "scaleY(0.05)" : "scaleY(1)",
          }}
        />
      </span>
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
          background: "#1e3a8a",
          transformOrigin: "top center",
          transform: blink ? "scaleY(1)" : "scaleY(0)",
          height: "100%",
          transition: blink
            ? "transform 0.07s cubic-bezier(0.4, 0, 1, 1)"
            : "transform 0.14s cubic-bezier(0, 0, 0.2, 1)",
          zIndex: 2,
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderRadius: "0 0 50% 50% / 0 0 60% 60%",
          background: "#1e3a8a",
          transformOrigin: "bottom center",
          transform: blink ? "scaleY(0.55)" : "scaleY(0)",
          height: "50%",
          transition: blink
            ? "transform 0.07s cubic-bezier(0.4, 0, 1, 1)"
            : "transform 0.14s cubic-bezier(0, 0, 0.2, 1)",
          zIndex: 2,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "18%",
          left: "22%",
          width: "20%",
          height: "20%",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      />
    </span>
  );
};

const LogoText = () => (
  <span className="footer-logo-text">
    Electr
    <BlinkingEye />
    <BlinkingEye />
    buddy
  </span>
);

const socialIcons: { key: string; icon: React.ReactNode; label: string }[] = [
  { key: "instagram", icon: <Instagram size={18} />, label: "Instagram" },
  { key: "linkedin", icon: <Linkedin size={18} />, label: "LinkedIn" },
  { key: "facebook", icon: <Facebook size={18} />, label: "Facebook" },
  { key: "twitter", icon: <Twitter size={18} />, label: "Twitter" },
  { key: "youtube", icon: <Youtube size={18} />, label: "YouTube" },
];

const Footer = () => {
  const [settings, setSettings] = useState<FooterSettings>(emptySettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const settingsMap = await getSiteSettingsCached();
      const loaded: FooterSettings = { ...emptySettings };
      Object.entries(settingsMap).forEach(([key, value]) => {
        if (key in loaded) {
          try {
            (loaded as any)[key] = JSON.parse(value);
          } catch {
            (loaded as any)[key] = value;
          }
        }
      });
      setSettings(loaded);
    } catch (caught) {
      setSettings(emptySettings);
      setSettingsError(caught instanceof Error ? caught : new Error("Failed to load site settings"));
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const socialLinks = socialIcons
    .filter((s) => settings[s.key as keyof FooterSettings])
    .map((s) => ({
      ...s,
      url: settings[s.key as keyof FooterSettings] as string,
    }));

  return (
    <>
      <style>{`
        400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        .footer-root {
          position: relative;
          background: hsl(var(--card));
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          border-top: 1px solid hsl(var(--border));
        }

        .footer-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(hsl(var(--foreground) / 0.03) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .footer-glow-tr {
          position: absolute;
          top: -120px; right: -80px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .footer-glow-bl {
          position: absolute;
          bottom: -100px; left: -60px;
          width: 350px; height: 350px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--secondary) / 0.04) 0%, transparent 70%);
          pointer-events: none;
        }

        .footer-inner {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 72px 24px 0;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
        }

        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 1.4fr 1fr 1fr 1.2fr; gap: 40px; }
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          margin-bottom: 20px;
        }

        .footer-logo-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--electric-blue-dark)));
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
          flex-shrink: 0;
        }

        .footer-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: hsl(var(--foreground));
          line-height: 1;
        }

        .footer-logo-text span {
          background: linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--electric-yellow-light)));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-brand-desc {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
          line-height: 1.75;
          margin-bottom: 24px;
          max-width: 280px;
        }

        .footer-cta-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: hsl(var(--primary));
          text-decoration: none;
          letter-spacing: 0.2px;
          transition: all 0.25s;
        }

        .footer-cta-link:hover { opacity: 0.75; gap: 10px; }

        .footer-col-title {
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: hsl(var(--primary));
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .footer-col-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent);
        }

        .footer-link-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .footer-link {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .footer-link-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.3);
          flex-shrink: 0;
          transition: all 0.25s;
        }

        .footer-link:hover {
          color: hsl(var(--primary));
          transform: translateX(4px);
        }

        .footer-link:hover .footer-link-dot {
          background: hsl(var(--primary));
          box-shadow: 0 0 6px hsl(var(--primary) / 0.5);
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
          text-decoration: none;
          transition: all 0.25s;
        }

        .contact-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.07);
          border: 1px solid hsl(var(--border) / 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--primary));
          flex-shrink: 0;
          transition: all 0.25s;
        }

        .contact-item:hover .contact-icon-box {
          background: hsl(var(--primary) / 0.15);
          box-shadow: 0 0 12px hsl(var(--primary) / 0.2);
        }

        .contact-value {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
          line-height: 1.5;
          padding-top: 8px;
          transition: color 0.25s;
        }

        .contact-item:hover .contact-value { color: hsl(var(--foreground)); }

        .social-links {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        .social-link {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.07);
          border: 1px solid hsl(var(--border) / 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--muted-foreground));
          text-decoration: none;
          transition: all 0.25s;
        }

        .social-link:hover {
          background: hsl(var(--primary) / 0.15);
          color: hsl(var(--primary));
          box-shadow: 0 0 12px hsl(var(--primary) / 0.2);
          transform: translateY(-2px);
        }

        .footer-bottom {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px 24px;
          margin-top: 56px;
          border-top: 1px solid hsl(var(--border) / 0.5);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        @media (min-width: 768px) {
          .footer-bottom { flex-direction: row; justify-content: space-between; gap: 0; }
        }

        .footer-copy {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
        }

        .footer-legal-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .footer-legal-link {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: hsl(var(--muted-foreground));
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.25s;
        }

        .footer-legal-link:hover { color: hsl(var(--primary)); }

        .legal-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.25);
          flex-shrink: 0;
          transition: background 0.25s;
        }

        .footer-legal-link:hover .legal-dot { background: hsl(var(--primary)); }

        .footer-bottom-bolt {
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.15), transparent);
          pointer-events: none;
        }
      `}</style>

      <footer className="footer-root">
        <div className="footer-grid-bg" />
        <div className="footer-glow-tr" />
        <div className="footer-glow-bl" />

        <div className="footer-inner">
          {settingsError && (
            <div className="mb-6">
              <PublicApiState compact error={settingsError} onRetry={fetchSettings} errorMessage="Footer settings could not be loaded." />
            </div>
          )}
          {settingsLoading && <div className="mb-6 text-sm text-muted-foreground">Loading site settings…</div>}
          <div className="footer-grid">
            {/* Brand */}
            <div>
              <Link to="/" className="footer-logo">
                <div className="footer-logo-icon">
                  <img src={favicon} alt="Electroo Buddy" className="w-full h-full object-contain rounded-lg" />
                </div>
                <LogoText />
              </Link>
              <p className="footer-brand-desc">
                Your trusted electrical service partner. Professional electricians for all residential and commercial needs with 24/7 support.
              </p>
              <Link to="/booking" className="footer-cta-link">
                Book a Service <ArrowRight size={14} />
              </Link>

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="social-links">
                  {socialLinks.map((social) => (
                    <a
                      key={social.key}
                      href={sanitizeExternalUrl(social.url) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      title={social.label}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <div className="footer-col-title">Quick Links</div>
              <ul className="footer-link-list">
                {settings.quick_links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="footer-link">
                      <span className="footer-link-dot" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <div className="footer-col-title">Services</div>
              <ul className="footer-link-list">
                {settings.service_links.map((s) => (
                  <li key={s}>
                    <Link to="/services" className="footer-link">
                      <span className="footer-link-dot" />
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="footer-col-title">Contact Info</div>

              {settings.address && (
                <div className="contact-item">
                  <div className="contact-icon-box"><MapPin size={16} /></div>
                  <div className="contact-value">{settings.address}</div>
                </div>
              )}
              {settings.phone_number && (
                <a href={`tel:${settings.phone_number}`} className="contact-item" style={{ textDecoration: 'none' }}>
                  <div className="contact-icon-box"><Phone size={16} /></div>
                  <div className="contact-value">{settings.phone_number}</div>
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`} className="contact-item" style={{ textDecoration: 'none' }}>
                  <div className="contact-icon-box"><Mail size={16} /></div>
                  <div className="contact-value">{settings.email}</div>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="footer-copy">
            {settings.copyright_text ? <>⚡ &copy; {new Date().getFullYear()} {settings.copyright_text}</> : null}
          </div>
          <div className="footer-legal-links">
            {settings.privacy_policy_url && (
              <Link to={settings.privacy_policy_url} className="footer-legal-link"><span className="legal-dot" />Privacy Policy</Link>
            )}
            {settings.terms_url && (
              <Link to={settings.terms_url} className="footer-legal-link"><span className="legal-dot" />Terms & Conditions</Link>
            )}
          </div>
          <div className="footer-bottom-bolt" />
        </div>
      </footer>
    </>
  );
};

export default Footer;
