import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HeroCard = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="eb-card"
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Decorative rings */}
      <div className="eb-ring eb-ring-1" />
      <div className="eb-ring eb-ring-2" />
      <div className="eb-ring eb-ring-3" />

      {/* Dot grid */}
      <div className="eb-dots" />

      {/* Appliance Icons Row */}
      <div className="eb-top">
        {/* AC */}
        <motion.div
          className="eb-appliance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eb-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#85b7eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="10" rx="2" />
              <line x1="2" y1="11" x2="22" y2="11" />
              <line x1="7" y1="16" x2="7" y2="19" />
              <line x1="17" y1="16" x2="17" y2="19" />
            </svg>
          </div>
          <span className="eb-icon-label">AC</span>
        </motion.div>

        {/* TV */}
        <motion.div
          className="eb-appliance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eb-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#85b7eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <span className="eb-icon-label">TV</span>
        </motion.div>

        {/* Washer */}
        <motion.div
          className="eb-appliance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eb-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#85b7eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <circle cx="12" cy="13" r="4" />
              <line x1="6" y1="6" x2="8" y2="6" />
            </svg>
          </div>
          <span className="eb-icon-label">Washer</span>
        </motion.div>

        {/* Wiring */}
        <motion.div
          className="eb-appliance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="eb-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="#85b7eb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="eb-icon-label">Wiring</span>
        </motion.div>
      </div>

      <div className="eb-divider" />

      {/* Main content */}
      <motion.div
        className="eb-content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="eb-badge">
          <span className="eb-badge-dot" />
          24 / 7 Available
        </div>

        <h2 className="eb-headline">
          We'll Be There<br />
          <span>In Minutes</span>
        </h2>

        <p className="eb-sub">
          Certified technicians at your doorstep —<br />
          fast, reliable &amp; guaranteed workmanship.
        </p>

        <div className="eb-bottom">
          <div className="eb-stats">
            <div className="eb-stat">
              <div className="eb-stat-num">45<sup>min</sup></div>
              <div className="eb-stat-label">Response</div>
            </div>
            <div className="eb-stat">
              <div className="eb-stat-num">4.9<sup>★</sup></div>
              <div className="eb-stat-label">Rating</div>
            </div>
            <div className="eb-stat">
              <div className="eb-stat-num">8K<sup>+</sup></div>
              <div className="eb-stat-label">Jobs Done</div>
            </div>
          </div>

          <button
            className="eb-cta"
            onClick={() => navigate("/booking")}
          >
            Book Now
          </button>
        </div>
      </motion.div>

      <style>{`
        500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        :root {
          --eb-navy-deep:   #08132a;
          --eb-navy-mid:    #0d1e40;
          --eb-navy-light:  #152d60;
          --eb-blue-accent: #378add;
          --eb-blue-glow:   rgba(55,138,221,0.18);
          --eb-blue-border: rgba(55,138,221,0.28);
          --eb-white:       #ffffff;
          --eb-white-60:    rgba(255,255,255,0.6);
          --eb-white-40:    rgba(255,255,255,0.4);
          --eb-white-12:    rgba(255,255,255,0.12);
          --eb-white-07:    rgba(255,255,255,0.07);
        }

        .eb-card {
          position: relative;
          width: 100%;
          max-width: 380px;
          border-radius: 20px;
          overflow: hidden;
          background: var(--eb-navy-mid);
          border: 1px solid var(--eb-blue-border);
          box-shadow:
            0 0 0 1px rgba(55,138,221,0.08),
            0 24px 60px rgba(0,0,0,0.6),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* Decorative rings */
        .eb-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid var(--eb-blue-glow);
          pointer-events: none;
          animation: eb-spin 28s linear infinite;
        }
        .eb-ring-1 { width: 220px; height: 220px; top: -60px; right: -60px; }
        .eb-ring-2 { width: 130px; height: 130px; top: -10px; right: -10px; animation-direction: reverse; animation-duration: 18s; }
        .eb-ring-3 { width: 60px;  height: 60px;  top: 28px;  right: 28px; animation-duration: 10s; border-color: rgba(55,138,221,0.35); }

        @keyframes eb-spin { to { transform: rotate(360deg); } }

        /* Dot grid texture */
        .eb-dots {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(55,138,221,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 40%, transparent 100%);
        }

        /* Top section: appliance icons */
        .eb-top {
          padding: 28px 24px 22px;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .eb-appliance {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
        }

        .eb-icon-wrap {
          width: 58px; height: 58px;
          border-radius: 14px;
          background: var(--eb-white-07);
          border: 1px solid rgba(55,138,221,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.25s, border-color 0.25s, transform 0.25s;
          cursor: default;
        }
        .eb-icon-wrap:hover {
          background: rgba(55,138,221,0.14);
          border-color: rgba(55,138,221,0.5);
          transform: translateY(-3px);
        }
        .eb-icon-wrap svg { display: block; }

        .eb-icon-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          color: var(--eb-white-40);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Divider */
        .eb-divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(55,138,221,0.25) 40%, rgba(55,138,221,0.25) 60%, transparent);
          margin: 0 20px;
        }

        /* Content box */
        .eb-content {
          position: relative;
          padding: 20px 24px 22px;
          background: rgba(255,255,255,0.025);
        }

        /* Badge */
        .eb-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: rgba(55,138,221,0.15);
          border: 1px solid rgba(55,138,221,0.32);
          border-radius: 30px;
          padding: 5px 14px 5px 10px;
          font-size: 11px;
          font-weight: 600;
          color: #85b7eb;
          letter-spacing: 0.03em;
          margin-bottom: 14px;
        }
        .eb-badge-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--eb-blue-accent);
          box-shadow: 0 0 0 3px rgba(55,138,221,0.25);
          animation: eb-pulse 2s ease-in-out infinite;
        }
        @keyframes eb-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(55,138,221,0.25); }
          50%       { box-shadow: 0 0 0 5px rgba(55,138,221,0.1); }
        }

        /* Headline */
        .eb-headline {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--eb-white);
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .eb-headline span { color: var(--eb-blue-accent); }

        /* Sub */
        .eb-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: var(--eb-white-40);
          line-height: 1.6;
          margin-bottom: 20px;
        }

        /* Stats + CTA row */
        .eb-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .eb-stats {
          display: flex;
          gap: 18px;
        }
        .eb-stat-num {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--eb-white);
          line-height: 1;
        }
        .eb-stat-num sup {
          font-size: 10px;
          color: var(--eb-blue-accent);
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          vertical-align: top;
          margin-top: 1px;
        }
        .eb-stat-label {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 500;
          margin-top: 2px;
          letter-spacing: 0.03em;
          color: var(--eb-white-40);
        }

        .eb-cta {
          background: var(--eb-blue-accent);
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 11px 20px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(55,138,221,0.35);
          letter-spacing: 0.02em;
        }
        .eb-cta:hover {
          background: #4a96e8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(55,138,221,0.45);
        }
        .eb-cta:active { transform: translateY(0); }

        /* Responsive adjustments */
        @media (max-width: 640px) {
          .eb-card { max-width: 100%; border-radius: 16px; }
          .eb-top { padding: 20px 16px 16px; gap: 6px; }
          .eb-icon-wrap { width: 48px; height: 48px; border-radius: 12px; }
          .eb-icon-wrap svg { width: 22px; height: 22px; }
          .eb-icon-label { font-size: 9px; }
          .eb-divider { margin: 0 16px; }
          .eb-content { padding: 16px; }
          .eb-badge { font-size: 10px; padding: 4px 12px 4px 8px; }
          .eb-headline { font-size: 22px; }
          .eb-sub { font-size: 12px; margin-bottom: 16px; }
          .eb-bottom { flex-direction: column; align-items: flex-start; gap: 14px; }
          .eb-stats { gap: 16px; width: 100%; justify-content: space-between; }
          .eb-stat-num { font-size: 14px; }
          .eb-stat-num sup { font-size: 9px; }
          .eb-stat-label { font-size: 9px; }
          .eb-cta { width: 100%; padding: 12px 16px; font-size: 13px; text-align: center; }
        }

        @media (max-width: 380px) {
          .eb-top { padding: 16px 12px 14px; gap: 4px; }
          .eb-icon-wrap { width: 44px; height: 44px; }
          .eb-icon-wrap svg { width: 20px; height: 20px; }
          .eb-content { padding: 14px 12px; }
          .eb-headline { font-size: 20px; }
          .eb-sub { font-size: 11px; }
          .eb-stats { gap: 12px; }
          .eb-stat-num { font-size: 13px; }
          .eb-cta { padding: 11px 14px; font-size: 12px; }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .eb-card { max-width: 340px; }
          .eb-top { padding: 24px 20px 18px; }
          .eb-icon-wrap { width: 52px; height: 52px; }
          .eb-icon-wrap svg { width: 24px; height: 24px; }
          .eb-content { padding: 18px 20px; }
          .eb-headline { font-size: 24px; }
          .eb-sub { font-size: 12px; }
        }

        @media (min-width: 1024px) {
          .eb-card { max-width: 400px; }
          .eb-top { padding: 32px 28px 24px; }
          .eb-icon-wrap { width: 62px; height: 62px; }
          .eb-icon-wrap svg { width: 30px; height: 30px; }
          .eb-content { padding: 22px 28px 24px; }
          .eb-badge { font-size: 12px; padding: 6px 16px 6px 12px; }
          .eb-headline { font-size: 28px; }
          .eb-sub { font-size: 14px; margin-bottom: 22px; }
          .eb-stats { gap: 20px; }
          .eb-stat-num { font-size: 18px; }
          .eb-stat-num sup { font-size: 11px; }
          .eb-stat-label { font-size: 11px; }
          .eb-cta { padding: 12px 22px; font-size: 14px; }
        }
      `}</style>
    </motion.div>
  );
};

export default HeroCard;
