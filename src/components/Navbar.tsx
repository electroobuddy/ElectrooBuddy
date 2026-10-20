import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  User,
  ShoppingCart,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/components/NotificationBell";
import { useCart } from "@/contexts/CartContext";

// Import favicon
import favicon from "/favicon.png";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Products", to: "/products" },
  { label: "Subscriptions", to: "/subscriptions" },
  { label: "Projects", to: "/projects" },
  {
    label: "Pages",
    children: [
      { label: "Track Booking", to: "/track-booking" },
      { label: "FAQs", to: "/faq" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms & Conditions", to: "/terms" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

// ─── Blinking Eye Component ───────────────────────────────────────────────────
const BlinkingEye = memo(() => {
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
});

// ─── Logo Text ────────────────────────────────────────────────────────────────
const LogoText = () => (
  <span className="logo-text">
    Electr
    <BlinkingEye />
    <BlinkingEye />
    buddy
  </span>
);

// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar = memo(() => {
  const [open, setOpen] = useState(false);
  const [pagesOpen, setPagesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();

  const isActive = useCallback((to: string) => location.pathname === to, [location.pathname]);
  const memoizedNavLinks = useMemo(() => navLinks, []);

  useEffect(() => {
    const storedMode = localStorage.getItem("darkMode");
    const isDark = storedMode !== null ? storedMode === "true" : true;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
    setPagesOpen(false);
  }, [location]);

  return (
    <>
      <style>{`

        .navbar-root {
          position: sticky;
          top: 0;
          z-index: 50;
          transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          font-family: 'Poppins', sans-serif;
        }

        .navbar-root.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.08);
        }

        .dark .navbar-root.scrolled {
          background: rgba(31, 41, 55, 0.95);
          border-color: #374151;
          box-shadow: 0 4px 32px rgba(0, 0, 0, 0.3);
        }

        .navbar-root.top {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid transparent;
        }

        .dark .navbar-root.top {
          background: rgba(17, 24, 39, 0.7);
        }

        /* ── Nav Inner ── */
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          padding: 0 12px;
          max-width: 1400px;
          margin: 0 auto;
          gap: 8px;
        }

        @media (min-width: 1024px) {
          .nav-inner {
            height: 68px;
            padding: 0 20px;
            gap: 4px;
          }
        }

        @media (min-width: 1280px) {
          .nav-inner {
            height: 72px;
            padding: 0 32px;
            gap: 8px;
          }
        }

        /* ── Logo ── */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          flex-shrink: 0;
        }

        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.35);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        @media (min-width: 1024px) {
          .logo-icon {
            width: 36px;
            height: 36px;
          }
        }

        @media (min-width: 1280px) {
          .logo-icon {
            width: 40px;
            height: 40px;
            border-radius: 12px;
          }
        }

        .nav-logo:hover .logo-icon {
          box-shadow: 0 0 32px rgba(59, 130, 246, 0.55);
          transform: scale(1.06);
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 17px;
          font-weight: 800;
          color: #1e3a8a;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
        }

        @media (min-width: 1280px) {
          .logo-text {
            font-size: 20px;
          }
        }

        .dark .logo-text { color: #60a5fa; }

        .logo-tagline {
          font-family: 'Poppins', sans-serif;
          font-size: 9px;
          font-weight: 500;
          color: #6b7280;
          letter-spacing: 0.3px;
          white-space: nowrap;
          margin-top: 2px;
          display: none;
        }

        @media (min-width: 1100px) {
          .logo-tagline { display: block; }
        }

        .dark .logo-tagline { color: #9ca3af; }

        /* ── Desktop Nav Links ── */
        /*
          KEY FIX: Desktop nav only shows at 1024px+.
          Nav links use very compact padding at 1024-1279px,
          and comfortable padding at 1280px+.
        */
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 0;
          flex: 1;
          justify-content: center;
          min-width: 0;
        }

        @media (min-width: 1024px) {
          .desktop-nav { display: flex; gap: 0; }
        }

        /* Desktop right controls */
        .desktop-actions {
          display: none;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        @media (min-width: 1024px) {
          .desktop-actions { display: flex; }
        }

        @media (min-width: 1280px) {
          .desktop-actions { gap: 6px; }
        }

        .nav-link {
          position: relative;
          padding: 6px 7px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.25s ease;
          font-family: 'Poppins', sans-serif;
          white-space: nowrap;
        }

        @media (min-width: 1120px) {
          .nav-link {
            padding: 6px 9px;
            font-size: 12.5px;
          }
        }

        @media (min-width: 1280px) {
          .nav-link {
            padding: 7px 12px;
            font-size: 13.5px;
            border-radius: 10px;
          }
        }

        @media (min-width: 1400px) {
          .nav-link {
            padding: 8px 14px;
            font-size: 14px;
          }
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: #3b82f6;
          border-radius: 1px;
          transition: width 0.3s ease;
        }

        .nav-link:hover { color: #1e3a8a; background: rgba(59, 130, 246, 0.05); }
        .nav-link:hover::after { width: 60%; }
        .nav-link.active { color: #1e3a8a; background: rgba(59, 130, 246, 0.1); font-weight: 600; }
        .nav-link.active::after { width: 60%; }

        .dark .nav-link { color: #9ca3af; }
        .dark .nav-link:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }
        .dark .nav-link.active { color: #60a5fa; background: rgba(59, 130, 246, 0.15); }
        .dark .nav-link::after { background: #60a5fa; }

        /* Dropdown trigger */
        .nav-dropdown-trigger {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 6px 7px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          font-family: 'Poppins', sans-serif;
          white-space: nowrap;
        }

        @media (min-width: 1120px) {
          .nav-dropdown-trigger {
            padding: 6px 9px;
            font-size: 12.5px;
          }
        }

        @media (min-width: 1280px) {
          .nav-dropdown-trigger {
            padding: 7px 12px;
            font-size: 13.5px;
            border-radius: 10px;
          }
        }

        @media (min-width: 1400px) {
          .nav-dropdown-trigger {
            padding: 8px 14px;
            font-size: 14px;
          }
        }

        .nav-dropdown-trigger:hover { color: #1e3a8a; background: rgba(59, 130, 246, 0.05); }
        .trigger-chevron { transition: transform 0.3s ease; flex-shrink: 0; }
        .trigger-chevron.open { transform: rotate(180deg); }

        .dark .nav-dropdown-trigger { color: #9ca3af; }
        .dark .nav-dropdown-trigger:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }

        /* Dropdown menu */
        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 210px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          z-index: 100;
        }

        .dark .dropdown-menu {
          background: rgba(31, 41, 55, 0.98);
          border-color: #374151;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.22s ease;
          border-bottom: 1px solid rgba(229, 231, 235, 0.5);
          font-family: 'Poppins', sans-serif;
        }
        .dropdown-item:last-child { border-bottom: none; }
        .dropdown-item:hover { background: rgba(59, 130, 246, 0.05); color: #1e3a8a; padding-left: 22px; }
        .dropdown-arrow { opacity: 0; transform: translateX(-4px); transition: all 0.22s ease; color: #3b82f6; }
        .dropdown-item:hover .dropdown-arrow { opacity: 1; transform: translateX(0); }

        .dark .dropdown-item { color: #9ca3af; border-color: rgba(55, 65, 81, 0.5); }
        .dark .dropdown-item:hover { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .dark .dropdown-arrow { color: #60a5fa; }

        /* Icon-only action buttons (cart, bell, user) */
        .action-icon-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          color: #6b7280;
          text-decoration: none;
          transition: all 0.22s ease;
          flex-shrink: 0;
        }

        @media (min-width: 1280px) {
          .action-icon-btn {
            width: 36px;
            height: 36px;
          }
        }

        .action-icon-btn:hover {
          background: rgba(59, 130, 246, 0.08);
          color: #1e3a8a;
        }

        .dark .action-icon-btn { color: #9ca3af; }
        .dark .action-icon-btn:hover { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

        .cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #3b82f6;
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Login link — icon only at 1024-1199, icon+text at 1200+ */
        .login-link {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 5px 7px;
          font-size: 11.5px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.25s ease;
          font-family: 'Poppins', sans-serif;
          white-space: nowrap;
          flex-shrink: 0;
        }

        @media (min-width: 1280px) {
          .login-link {
            padding: 6px 10px;
            font-size: 13px;
            border-radius: 10px;
          }
        }

        .login-link:hover { color: #1e3a8a; background: rgba(59, 130, 246, 0.05); }
        .dark .login-link { color: #9ca3af; }
        .dark .login-link:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }

        .login-label {
          display: none;
        }

        @media (min-width: 1160px) {
          .login-label { display: inline; }
        }

        /* Book Now CTA */
        .book-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 7px 10px;
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          white-space: nowrap;
          flex-shrink: 0;
        }

        @media (min-width: 1280px) {
          .book-btn {
            padding: 9px 14px;
            font-size: 12.5px;
            border-radius: 9px;
          }
        }

        @media (min-width: 1400px) {
          .book-btn {
            padding: 10px 18px;
            font-size: 13.5px;
            border-radius: 10px;
          }
        }

        .book-btn::before { content: ''; position: absolute; inset: 0; background: rgba(255,255,255,0); transition: background 0.3s; }
        .book-btn:hover {
          box-shadow: 0 0 24px rgba(59, 130, 246, 0.45), 0 6px 18px rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
        }
        .book-btn:hover::before { background: rgba(255,255,255,0.08); }

        /* Divider between theme and actions */
        .nav-divider {
          width: 1px;
          height: 20px;
          background: rgba(107, 114, 128, 0.2);
          margin: 0 2px;
          flex-shrink: 0;
        }

        /* ── Mobile controls ── */
        .mobile-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        @media (min-width: 1024px) {
          .mobile-controls { display: none; }
        }

        .hamburger-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: rgba(59, 130, 246, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .hamburger-btn:hover { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; color: #1e3a8a; }
        .dark .hamburger-btn { border-color: #374151; background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
        .dark .hamburger-btn:hover { background: rgba(59, 130, 246, 0.2); border-color: #60a5fa; }

        .mobile-theme-toggle {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: rgba(59, 130, 246, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .mobile-theme-toggle:hover { background: rgba(59, 130, 246, 0.1); border-color: #3b82f6; }
        .dark .mobile-theme-toggle { border-color: #374151; background: rgba(59, 130, 246, 0.1); }
        .dark .mobile-theme-toggle:hover { background: rgba(59, 130, 246, 0.2); border-color: #60a5fa; }

        /* ── Mobile menu ── */
        .mobile-menu {
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border-top: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .dark .mobile-menu {
          background: rgba(31, 41, 55, 0.98);
          border-color: #374151;
        }

        @media (min-width: 1024px) {
          .mobile-menu { display: none; }
        }

        .mobile-menu-inner {
          padding: 12px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        @media (min-width: 640px) {
          .mobile-menu-inner { padding: 16px 20px 24px; gap: 6px; }
        }

        .mobile-theme-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          margin-bottom: 4px;
          border-radius: 8px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(229, 231, 235, 0.5);
        }

        .dark .mobile-theme-row {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(55, 65, 81, 0.5);
        }

        .mobile-theme-label {
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          font-family: 'Poppins', sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dark .mobile-theme-label { color: #9ca3af; }

        .mobile-link {
          display: block;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.22s ease;
          font-family: 'Poppins', sans-serif;
          border: 1px solid transparent;
        }

        @media (min-width: 640px) {
          .mobile-link { padding: 12px 16px; font-size: 14px; border-radius: 10px; }
        }

        .mobile-link:hover,
        .mobile-link.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
          color: #1e3a8a;
          padding-left: 20px;
        }

        .dark .mobile-link { color: #9ca3af; }
        .dark .mobile-link:hover,
        .dark .mobile-link.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.3);
          color: #60a5fa;
        }

        .mobile-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          border-radius: 8px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          transition: all 0.22s;
        }

        @media (min-width: 640px) {
          .mobile-trigger { padding: 12px 16px; font-size: 14px; border-radius: 10px; }
        }

        .mobile-trigger:hover { background: rgba(59, 130, 246, 0.05); border-color: rgba(229, 231, 235, 0.5); color: #1e3a8a; }
        .dark .mobile-trigger { color: #9ca3af; }
        .dark .mobile-trigger:hover { background: rgba(59, 130, 246, 0.1); border-color: rgba(55, 65, 81, 0.5); color: #60a5fa; }

        .mobile-sub-link {
          display: block;
          padding: 9px 14px 9px 26px;
          font-size: 12px;
          color: #6b7280;
          text-decoration: none;
          border-radius: 7px;
          transition: all 0.22s;
          font-family: 'Poppins', sans-serif;
          position: relative;
        }

        @media (min-width: 640px) {
          .mobile-sub-link { padding: 10px 16px 10px 28px; font-size: 13px; border-radius: 8px; }
        }

        .mobile-sub-link::before {
          content: '⚡';
          position: absolute;
          left: 12px;
          font-size: 9px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
        }

        .mobile-sub-link:hover { color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
        .dark .mobile-sub-link { color: #9ca3af; }
        .dark .mobile-sub-link:hover { color: #60a5fa; background: rgba(59, 130, 246, 0.1); }

        .mobile-divider {
          height: 1px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.3), transparent);
          margin: 2px 0;
        }

        .dark .mobile-divider { background: linear-gradient(90deg, rgba(59, 130, 246, 0.5), transparent); }

        .mobile-book-btn {
          display: block;
          text-align: center;
          margin-top: 6px;
          padding: 12px;
          background: linear-gradient(135deg, #3b82f6, #1e3a8a);
          color: #ffffff;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.25);
        }

        @media (min-width: 640px) {
          .mobile-book-btn { margin-top: 8px; padding: 14px; font-size: 15px; border-radius: 12px; }
        }
      `}</style>

      <nav className={`navbar-root ${scrolled ? "scrolled" : "top"}`}>
        <div className="nav-inner">

          {/* ── Logo ── */}
          <Link to="/" className="nav-logo">
            <div className="logo-icon">
              <img
                src={favicon}
                alt="Electroo Buddy"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <LogoText />
              <span className="logo-tagline">Home Appliance Services</span>
            </div>
          </Link>

          {/* ── Desktop nav links (center) ── */}
          <div className="desktop-nav">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  style={{ position: "relative" }}
                  onMouseEnter={() => setPagesOpen(true)}
                  onMouseLeave={() => setPagesOpen(false)}
                >
                  <button className="nav-dropdown-trigger">
                    {link.label}
                    <ChevronDown
                      size={13}
                      className={`trigger-chevron ${pagesOpen ? "open" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {pagesOpen && (
                      <motion.div
                        className="dropdown-menu"
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="dropdown-item"
                          >
                            {child.label}
                            <ArrowRight size={13} className="dropdown-arrow" />
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.to}
                  to={link.to!}
                  className={`nav-link ${isActive(link.to!) ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>

          {/* ── Desktop right actions ── */}
          <div className="desktop-actions">
            {/* Theme toggle */}
            <ThemeToggle />

            <div className="nav-divider" />

            {/* Notification Bell */}
            <NotificationBell userId={user?.id} />

            {/* Cart */}
            <Link to="/cart" className="action-icon-btn">
              <ShoppingCart size={17} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </Link>

            <div className="nav-divider" />

            {/* Login / Dashboard */}
            <Link
              to={user ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/login"}
              className="login-link"
            >
              <User size={14} />
              <span className="login-label">
                {user ? (isAdmin ? "Admin" : "Dashboard") : "Login"}
              </span>
            </Link>

            {/* Book Now */}
            <Link to="/booking" className="book-btn">
              <Zap size={12} />
              <span>Book Now</span>
            </Link>
          </div>

          {/* ── Mobile controls ── */}
          <div className="mobile-controls">
            <Link to="/cart" className="action-icon-btn" style={{ display: "flex" }}>
              <ShoppingCart size={18} className="dark:text-gray-300" style={{ color: "#6b7280" }} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount}</span>
              )}
            </Link>
            <button
              className="hamburger-btn"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        <AnimatePresence>
          {open && (
            <motion.div
              className="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="mobile-menu-inner">
                {/* Theme Toggle Row */}
                <div className="mobile-theme-row">
                  <span className="mobile-theme-label">
                    {darkMode ? <Moon size={14} /> : <Sun size={14} />}
                    {darkMode ? "Dark Mode" : "Light Mode"}
                  </span>
                  <button
                    className="mobile-theme-toggle"
                    onClick={() => {
                      const newMode = !darkMode;
                      setDarkMode(newMode);
                      document.documentElement.classList.toggle("dark", newMode);
                      localStorage.setItem("darkMode", String(newMode));
                    }}
                    aria-label="Toggle theme"
                  >
                    {darkMode ? (
                      <Sun size={16} className="text-yellow-500" />
                    ) : (
                      <Moon size={16} style={{ color: "#374151" }} />
                    )}
                  </button>
                </div>

                {navLinks.map((link) =>
                  link.children ? (
                    <div key={link.label}>
                      <button
                        className="mobile-trigger"
                        onClick={() => setPagesOpen(!pagesOpen)}
                      >
                        {link.label}
                        <ChevronDown
                          size={14}
                          className={`trigger-chevron ${pagesOpen ? "open" : ""}`}
                        />
                      </button>
                      <AnimatePresence>
                        {pagesOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            style={{ overflow: "hidden" }}
                          >
                            {link.children.map((child) => (
                              <Link
                                key={child.to}
                                to={child.to}
                                className="mobile-sub-link"
                                onClick={() => {
                                  setOpen(false);
                                  setPagesOpen(false);
                                }}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div className="mobile-divider" />
                    </div>
                  ) : (
                    <Link
                      key={link.to}
                      to={link.to!}
                      className={`mobile-link ${isActive(link.to!) ? "active" : ""}`}
                      onClick={() => setOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ),
                )}

                <Link
                  to={user ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/login"}
                  className="mobile-link"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <User size={14} />
                  {user ? (isAdmin ? "Admin Dashboard" : "My Dashboard") : "Login / Sign Up"}
                </Link>

                <Link
                  to="/cart"
                  className="mobile-link"
                  onClick={() => setOpen(false)}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <ShoppingCart size={14} />
                  My Cart {itemCount > 0 && `(${itemCount})`}
                </Link>

                <Link
                  to="/booking"
                  className="mobile-book-btn"
                  onClick={() => setOpen(false)}
                >
                  ⚡ Book Now
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
});

export default Navbar;