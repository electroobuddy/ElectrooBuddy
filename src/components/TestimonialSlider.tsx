import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  service?: string | null;
}

const TestimonialSlider = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const navigate = (dir: number) => {
    setDirection(dir);
    setCurrent((prev) => (prev + dir + testimonials.length) % testimonials.length);
  };

  if (testimonials.length === 0) return null;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 280 : -280, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -280 : 280, opacity: 0, scale: 0.96 }),
  };

  const t = testimonials[current];

  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`

        .testimonial-outer {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          max-width: 780px;
          margin: 0 auto;
        }

        .testimonial-card {
          position: relative;
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border) / 0.3);
          border-radius: 24px;
          padding: 52px 52px 44px;
          overflow: hidden;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        @media (max-width: 640px) {
          .testimonial-card { padding: 36px 24px 32px; }
        }

        .card-corner-tl {
          position: absolute;
          top: 0; left: 0;
          width: 80px; height: 80px;
          border-top: 2px solid hsl(var(--primary) / 0.4);
          border-left: 2px solid hsl(var(--primary) / 0.4);
          border-radius: 24px 0 0 0;
        }

        .card-corner-br {
          position: absolute;
          bottom: 0; right: 0;
          width: 80px; height: 80px;
          border-bottom: 2px solid hsl(var(--primary) / 0.2);
          border-right: 2px solid hsl(var(--primary) / 0.2);
          border-radius: 0 0 24px 0;
        }

        .quote-symbol {
          position: absolute;
          top: 20px; right: 24px;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 120px;
          font-weight: 800;
          color: hsl(var(--primary) / 0.05);
          line-height: 1;
          user-select: none;
          pointer-events: none;
        }

        .stars-row {
          display: flex;
          gap: 4px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .star-icon {
          width: 18px;
          height: 18px;
          color: hsl(var(--secondary));
          fill: hsl(var(--secondary));
          filter: drop-shadow(0 0 4px hsl(var(--primary) / 0.6));
        }

        .star-empty {
          color: hsl(var(--primary) / 0.2);
          fill: hsl(var(--primary) / 0.2);
          filter: none;
        }

        .testimonial-text {
          font-size: 17px;
          line-height: 1.75;
          color: hsl(var(--foreground) / 0.88);
          font-style: italic;
          margin-bottom: 32px;
          max-width: 580px;
        }

        @media (max-width: 640px) {
          .testimonial-text { font-size: 15px; }
        }

        .author-row {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--electric-blue-dark)) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: hsl(var(--card-foreground));
          flex-shrink: 0;
          box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
        }

        .author-info { text-align: left; }

        .author-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: hsl(var(--foreground));
          text-transform: uppercase;
          letter-spacing: 0.4px;
          line-height: 1;
          margin-bottom: 4px;
        }

        .author-service {
          font-size: 12px;
          color: hsl(var(--secondary));
          font-weight: 500;
          letter-spacing: 0.3px;
        }

        /* Glow aura */
        .card-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* Navigation */
        .nav-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid hsl(var(--border) / 0.3);
          background: hsl(var(--primary) / 0.05);
          color: hsl(var(--primary) / 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
          outline: none;
        }

        .nav-btn:hover {
          background: hsl(var(--primary) / 0.15);
          border-color: hsl(var(--primary) / 0.6);
          color: hsl(var(--secondary));
          box-shadow: 0 0 16px hsl(var(--primary) / 0.2);
          transform: scale(1.05);
        }

        .dots-row {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .dot {
          height: 6px;
          border-radius: 3px;
          background: hsl(var(--primary) / 0.25);
          cursor: pointer;
          transition: all 0.3s ease;
          border: none;
          padding: 0;
          outline: none;
        }

        .dot.active {
          background: hsl(var(--secondary));
          box-shadow: 0 0 8px hsl(var(--primary) / 0.5);
          width: 28px;
        }

        .dot:not(.active) { width: 6px; }
        .dot:not(.active):hover { background: hsl(var(--primary) / 0.5); }
      `}</style>

      <div className="testimonial-outer">
        <div className="testimonial-card">
          <div className="card-corner-tl" />
          <div className="card-corner-br" />
          <div className="card-glow" />
          <div className="quote-symbol">"</div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
              style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <div className="stars-row">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`star-icon ${i >= t.rating ? "star-empty" : ""}`}
                  />
                ))}
              </div>

              <p className="testimonial-text">"{t.text}"</p>

              <div className="author-row">
                <div className="author-avatar">{initials}</div>
                <div className="author-info">
                  <div className="author-name">{t.name}</div>
                  {t.service && <div className="author-service">⚡ {t.service}</div>}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="nav-row">
          <button className="nav-btn" onClick={() => navigate(-1)} aria-label="Previous">
            <ChevronLeft size={18} />
          </button>

          <div className="dots-row">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === current ? "active" : ""}`}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button className="nav-btn" onClick={() => navigate(1)} aria-label="Next">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default TestimonialSlider;