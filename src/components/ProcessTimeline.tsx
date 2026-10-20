import { motion } from "framer-motion";
import { ClipboardList, UserCheck, Wrench, CreditCard } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Request Service",
    description: "Submit your service request online or via WhatsApp with details of your electrical needs.",
    accent: "hsl(var(--primary))",
    glow: "hsl(var(--primary) / 0.35)",
  },
  {
    icon: UserCheck,
    title: "Technician Assigned",
    description: "We assign a certified electrician matched to your specific requirement and location.",
    accent: "hsl(var(--secondary))",
    glow: "hsl(var(--secondary) / 0.35)",
  },
  {
    icon: Wrench,
    title: "Work Completed",
    description: "Our expert completes the job efficiently with quality materials and safety compliance.",
    accent: "hsl(var(--info))",
    glow: "hsl(var(--info) / 0.35)",
  },
  {
    icon: CreditCard,
    title: "Payment & Feedback",
    description: "Pay securely and share your feedback to help us maintain our service quality.",
    accent: "hsl(var(--success))",
    glow: "hsl(var(--success) / 0.35)",
  },
];

const ProcessTimeline = () => {
  return (
    <>
      <style>{`

        .timeline-wrap {
          position: relative;
          font-family: 'DM Sans', sans-serif;
        }

        .timeline-track {
          position: absolute;
          top: 52px;
          left: 10%;
          right: 10%;
          height: 2px;
          background: linear-gradient(90deg,
            hsl(var(--primary) / 0.6),
            hsl(var(--secondary) / 0.6),
            hsl(var(--info) / 0.6),
            hsl(var(--success) / 0.6)
          );
          display: none;
        }

        @media (min-width: 1024px) {
          .timeline-track { display: block; }
        }

        .track-pulse {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 40px;
          background: hsl(var(--foreground) / 0.6);
          filter: blur(3px);
          animation: trackSlide 3s ease-in-out infinite;
        }

        @keyframes trackSlide {
          0% { left: -10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }

        .step-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .step-node {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 28px;
          flex-shrink: 0;
        }

        .node-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid var(--accent);
          opacity: 0.25;
          animation: ringPulse 2.5s ease-in-out infinite;
          animation-delay: var(--delay);
        }

        .node-ring-2 {
          position: absolute;
          inset: 10px;
          border-radius: 50%;
          border: 1px solid var(--accent);
          opacity: 0.15;
        }

        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(1.08); opacity: 0.5; }
        }

        .node-bg {
          position: absolute;
          inset: 16px;
          border-radius: 50%;
          background: hsl(var(--card) / 0.95);
          border: 1.5px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.4s ease;
          box-shadow: 0 0 20px var(--glow), inset 0 0 20px hsl(var(--foreground) / 0.1);
        }

        .step-col:hover .node-bg {
          background: var(--accent);
          box-shadow: 0 0 40px var(--glow);
        }

        .node-icon {
          width: 26px;
          height: 26px;
          color: var(--accent);
          transition: color 0.4s ease, transform 0.4s ease;
        }

        .step-col:hover .node-icon {
          color: hsl(var(--card-foreground));
          transform: scale(1.15);
        }

        .step-num {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          color: hsl(var(--card-foreground));
          font-size: 11px;
          font-weight: 800;
          font-family: 'Barlow Condensed', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 10px var(--glow);
          z-index: 10;
        }

        .step-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: hsl(var(--foreground));
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .step-desc {
          font-size: 13px;
          color: hsl(var(--muted-foreground) / 0.65);
          line-height: 1.6;
          max-width: 200px;
        }

        .connector-arrow {
          display: none;
          position: absolute;
          top: 42px;
          right: -20px;
          z-index: 5;
        }

        @media (min-width: 1024px) {
          .connector-arrow { display: block; }
        }

        .connector-line {
          stroke-dasharray: 4 4;
          animation: dashFlow 0.8s linear infinite;
        }

        @keyframes dashFlow {
          to { stroke-dashoffset: -8; }
        }
      `}</style>

      <div className="timeline-wrap">
        {/* Animated connector track */}
        <div className="timeline-track">
          <div className="track-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="step-col"
              style={{ "--accent": step.accent, "--glow": step.glow, "--delay": `${i * 0.6}s` } as React.CSSProperties}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="step-node">
                <div className="node-ring" />
                <div className="node-ring-2" />
                <div className="node-bg">
                  <step.icon className="node-icon" />
                </div>
                <div className="step-num">{i + 1}</div>
              </div>

              <div className="step-title">{step.title}</div>
              <p className="step-desc">{step.description}</p>

              {/* Connector arrow */}
              {i < steps.length - 1 && (
                <div className="connector-arrow">
                  <svg width="36" height="20" viewBox="0 0 36 20" fill="none">
                    <path
                      d="M0 10h30M24 3l8 7-8 7"
                      stroke={step.accent}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      className="connector-line"
                      opacity="0.5"
                    />
                  </svg>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ProcessTimeline;