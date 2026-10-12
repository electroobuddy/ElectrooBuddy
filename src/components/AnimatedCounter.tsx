import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
}

const AnimatedCounter = ({ end, suffix = "", prefix = "", duration = 2, label }: AnimatedCounterProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    
    let start = 0;
    const frameRate = 60;
    const totalFrames = duration * frameRate;
    const increment = end / totalFrames;
    let animationFrameId: number;
    
    const animate = () => {
      start += increment;
      if (start >= end) {
        setCount(end);
      } else {
        setCount(Math.floor(start));
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, end, duration]);

  return (
    <>
      <style>{`
        800;900&family=DM+Sans:wght@400;500&display=swap');

        .counter-shell {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 36px 28px 30px;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border) / 0.3);
          border-radius: 20px;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          transition: border-color 0.4s ease, box-shadow 0.4s ease;
        }

        .counter-shell:hover {
          border-color: hsl(var(--primary) / 0.5);
          box-shadow: 0 0 36px hsl(var(--primary) / 0.08), 0 20px 50px hsl(var(--foreground) / 0.1);
        }

        .counter-shell::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--secondary)), transparent);
          opacity: 0;
          transition: opacity 0.4s;
        }

        .counter-shell:hover::before { opacity: 1; }

        .counter-bg-bolt {
          position: absolute;
          bottom: -20px;
          right: -10px;
          width: 90px;
          height: 90px;
          opacity: 0.035;
          pointer-events: none;
        }

        .counter-glow-ring {
          position: absolute;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 1px solid hsl(var(--primary) / 0.08);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: cRing 3s ease-in-out infinite;
        }

        .counter-glow-ring-2 {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: 1px solid hsl(var(--primary) / 0.06);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: cRing 3s ease-in-out infinite reverse;
          animation-delay: 0.5s;
        }

        @keyframes cRing {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          50% { transform: translate(-50%, -50%) scale(1.12); opacity: 0.8; }
        }

        .counter-value {
          position: relative;
          z-index: 2;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: clamp(48px, 6vw, 68px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -1px;
          background: linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--electric-yellow-light)) 50%, hsl(var(--electric-blue-dark)) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 16px hsl(var(--primary) / 0.4));
          margin-bottom: 10px;
        }

        .counter-label {
          position: relative;
          z-index: 2;
          font-size: 13px;
          font-weight: 500;
          color: hsl(var(--muted-foreground) / 0.6);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-align: center;
        }

        .counter-divider {
          position: relative;
          z-index: 2;
          width: 32px;
          height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--secondary)), transparent);
          margin: 12px auto;
          border-radius: 1px;
        }
      `}</style>

      <motion.div
        ref={ref}
        className="counter-shell"
        role="meter"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={end}
        aria-label={label}
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Background rings */}
        <div className="counter-glow-ring" />
        <div className="counter-glow-ring-2" />

        {/* Bolt watermark */}
        <svg className="counter-bg-bolt" viewBox="0 0 100 100" fill="none">
          <path d="M60 5L20 55h30L35 95l45-55H50L60 5z" fill="hsl(var(--secondary))" />
        </svg>

        <motion.div 
          className="counter-value"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {prefix}{count}{suffix}
        </motion.div>

        <div className="counter-divider" />
        <motion.div 
          className="counter-label"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {label}
        </motion.div>
      </motion.div>
    </>
  );
};

export default AnimatedCounter;
